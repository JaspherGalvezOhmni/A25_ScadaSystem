import os
import threading
import time
import psycopg2
from psycopg2 import pool
import uvicorn
import queue
from fastapi import FastAPI, Query, Header, HTTPException, Depends, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from opcua import Server
from pylogix import PLC
from dotenv import load_dotenv
from pydantic import BaseModel
from typing import Union, List, Optional
from datetime import datetime, timezone, timedelta
from contextlib import asynccontextmanager
from jose import JWTError, jwt
from passlib.context import CryptContext

# --- SECURITY SETUP ---
load_dotenv()
SECRET_KEY = os.getenv("SECRET_KEY", "dev_fallback_key")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

# --- CONFIGURATION ---
PLC_IP = os.getenv("PLC_IP")
OPCUA_ENDPOINT = "opc.tcp://0.0.0.0:4840"
OPCUA_SERVER_NAME = "Flywheel_OPCUA_Gateway"
DB_CONFIG = {
    "host": os.getenv("DB_HOST"),
    "port": int(os.getenv("DB_PORT", 5432)),
    "dbname": os.getenv("DB_NAME"),
    "user": os.getenv("DB_USER"),
    "password": os.getenv("DB_PASSWORD"),
}
API_KEY = os.getenv("API_KEY")

WRITEABLE_TAGS = {
    "A25_SIM_Charge", 
    "A25_SIM_Discharge", 
    "A25_SIM_Shutdown", 
    "A25_SIM_Startup",
    "A25_CMD_Charge", 
    "A25_CMD_Discharge", 
    "A25_CMD_Shutdown", 
    "A25_CMD_Startup",
    "EM_SV"
}


TAGS_TO_READ = []
live_data = {"status": "initializing", "tags": {}}
live_data_lock = threading.Lock()
tag_map = {}
opc_tag_nodes = {}
stop_event = threading.Event()
historian_queue = queue.Queue(maxsize=100000) 

# --- DB CONNECTION POOL ---
pg_pool = None

pg_pool = None

def init_db_pool():
    global pg_pool
    print(f"🔵 DB: Attempting connection to {DB_CONFIG['host']}...")
    
    # RETRY LOGIC: Keep trying until connected or manually stopped
    while not stop_event.is_set():
        try:
            pg_pool = pool.ThreadedConnectionPool(minconn=1, maxconn=20, **DB_CONFIG)
            if pg_pool:
                print("✅ DB: Connection pool established.")
                return # Success!
        except Exception as e:
            print(f"🟡 DB Connection Failed: {e}")
            print("⏳ Retrying in 2 seconds...")
            time.sleep(2)

def get_db_conn():
    if not pg_pool: 
        # If pool is missing (e.g. still starting), throw 503 Service Unavailable
        # This tells the frontend "I'm alive, but busy" instead of crashing
        raise HTTPException(status_code=503, detail="Database initializing...")
    return pg_pool.getconn()

def release_db_conn(conn):
    if pg_pool and conn: pg_pool.putconn(conn)

# --- MODELS ---
class Token(BaseModel):
    access_token: str
    token_type: str

class User(BaseModel):
    username: str
    role: str

class Tag(BaseModel):
    id: int
    tag: str
    datatype: str
    is_active: bool

class TagUpdate(BaseModel):
    is_active: bool

class TagWriteRequest(BaseModel):
    tag_name: str
    value: Union[float, int, bool]

class Setting(BaseModel):
    key: str
    value: Union[float, str]

# --- HELPERS ---
def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def get_user_from_db(username: str):
    conn = None
    try:
        conn = get_db_conn()
        with conn.cursor() as cur:
            cur.execute("SELECT username, hashed_password, role, is_active FROM app.users WHERE username = %s", (username,))
            user_data = cur.fetchone()
            if user_data:
                return {"username": user_data[0], "hashed_password": user_data[1], "role": user_data[2], "is_active": user_data[3]}
    except Exception as e:
        print(f"🔴 DB Error (get_user): {e}")
    finally:
        release_db_conn(conn)
    return None

def get_current_user(token: str = Depends(oauth2_scheme)):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        role: str = payload.get("role")  # Get role from JWT
        if not username or not role: raise HTTPException(401, "Invalid token payload")
    except JWTError: raise HTTPException(401, "Invalid token")
    
    # Check if user is active using the database
    user_db = get_user_from_db(username) 
    if not user_db or not user_db["is_active"]: raise HTTPException(401, "User inactive")

    # === REMOVE DEBUG FIX: Rely on actual data (either JWT or user_db role if JWT missing) ===
    # The JWT created in login is: {"sub": user['username'], "role": user['role']}
    # We trust the JWT role, otherwise use the database role as fallback.
    
    # If the JWT contains the role (which it should), use it.
    # We must ensure we return the Pydantic model here using the determined role.
    final_role = payload.get("role") or user_db["role"]
    print(f"!!! DEBUG ROLE RESOLVED: {final_role} !!!") # <--- ADD THIS LOG
    return User(username=username, role=final_role) 

def get_current_active_admin(current_user: User = Depends(get_current_user)):
    if current_user.role != "Admin": raise HTTPException(403, "Admin required")
    return current_user

def get_current_active_engineer(current_user: User = Depends(get_current_user)):
    if current_user.role not in ["Engineer", "Admin"]: raise HTTPException(403, "Engineer required")
    return current_user

def require_api_key(x_api_key: str = Header(None)):
    if not API_KEY or x_api_key != API_KEY: raise HTTPException(401, "Invalid API Key")

# --- THREADS ---
PLC_SOURCE_IP = os.getenv("PLC_SOURCE_IP", None)


def plc_polling_task():
    print("🚀 PLC Poller thread started.")
    comm = None
    
    try:
        while not stop_event.is_set():
            
            if comm is None:
                # --- INITIAL CONNECTION/RECONNECTION ATTEMPT ---
                try:
                    print(f"🔌 Attempting PLC connection to {PLC_IP}...")
                    
                    comm = PLC()
                    comm.IPAddress = PLC_IP
                    # Check if tags are loaded before attempting test read (prevents crash if DB is slow)
                    if not TAGS_TO_READ:
                        print("⏳ Waiting for initial DB tag sync...")
                        time.sleep(1)
                        continue

                    # Diagnostic Test Read
                    test_tag = TAGS_TO_READ[0]["name"]
                    test_result = comm.Read(test_tag)
                    
                    status_check = getattr(test_result, "Status", "Error")
                    if status_check != "Success":
                        comm.Close()
                        comm = None 
                        raise Exception(f"Diagnostic Read Failed: Status={status_check}")
                    
                    print(f"✅ PLC Connection successful.")
                    
                except Exception as e:
                    print(f"🔴 PLC Connection Failed (Initialization): {e}")
                    # Ensure comm is cleaned up
                    if comm:
                        try: comm.Close()
                        except: pass
                    comm = None
                    with live_data_lock: live_data["status"] = "disconnected"
                    time.sleep(5)
                    continue 

            # --- READ LOOP ---
            try:
                tag_names_to_read = [tag["name"] for tag in TAGS_TO_READ]
                if not tag_names_to_read:
                    with live_data_lock: live_data["status"] = "no_tags_configured"
                    time.sleep(1)
                    continue

                results = comm.Read(tag_names_to_read)
                timestamp = datetime.now(timezone.utc)
                # ... (live data processing and historian_queue write unchanged) ...
                
                with live_data_lock:
                    live_data["status"] = "connected"
                    temp_tags = {}
                    iterable_results = results if isinstance(results, list) else [results]
                    
                    for res in iterable_results:
                        tagname = getattr(res, "TagName", None)
                        status = getattr(res, "Status", "Success")
                        val = res.Value if status == 'Success' else f"Error: {status}"
                        temp_tags[tagname] = val
                        
                        if status == 'Success' and isinstance(val, (int, float, bool)):
                            try:
                                historian_queue.put_nowait({"tag": tagname, "value": val, "ts": timestamp})
                            except queue.Full: pass

                    live_data["tags"] = temp_tags

                time.sleep(1)
                
            except Exception as e:
                # Handle read failures by closing and retrying connection
                print(f"🔴 PLC Read Error/Timeout. Reconnecting: {e}")
                with live_data_lock: live_data["status"] = "disconnected"
                
                if comm:
                    try: comm.Close()
                    except: pass
                comm = None 
                time.sleep(5) 
    
    finally:
        if comm:
            try: comm.Close() 
            except: pass
        print("⚪️ PLC Poller thread stopped.")

def opcua_updater_task():
    print("🚀 OPC-UA Updater started.")
    while not stop_event.is_set():
        with live_data_lock: snap = live_data.get("tags", {}).copy()
        for k,v in snap.items():
            if k in opc_tag_nodes and not isinstance(v, str):
                try: opc_tag_nodes[k].set_value(v)
                except: pass
        time.sleep(0.5)

def historian_ingester_task():
    print("🚀 Historian Ingester started.")
    batch_counter = 0
    warned_tags = set() 
    
    while not stop_event.is_set():
        time.sleep(2)
        if historian_queue.empty() or not tag_map: continue
        
        batch = []
        while not historian_queue.empty() and len(batch) < 500:
            batch.append(historian_queue.get())
        if not batch: continue

        conn = None
        count = 0
        # Map Tag Name -> Datatype string
        name_map = {t["name"]: t["datatype"].lower() for t in TAGS_TO_READ}
        
        try:
            conn = get_db_conn()
            with conn.cursor() as cur:
                for item in batch:
                    tn = item['tag']
                    
                    # 1. Check if tag exists in map
                    if tn not in tag_map:
                        if tn not in warned_tags:
                            print(f"⚠️ Ingest Warning: Tag '{tn}' found in PLC but not in DB tag_lookup.")
                            warned_tags.add(tn)
                        continue

                    tid = tag_map[tn]
                    raw_dtype = name_map.get(tn, 'float')
                    val = item['value']
                    ts = item['ts']

                    # --- FIX: Force scaled/analog tags to FLOAT column (Structural Data Integrity) ---
                    is_analog = any(
                        s in tn.lower() for s in ['.scaled', '_rescaled', 'outpowerscaled', 'mtrspeedscaled']
                    )
                    
                    # 2. Map DB datatype string to SQL Table
                    sql = None
                    # If it's explicitly float/real OR if it's a scaled/analog tag, save as float
                    if raw_dtype in ['float', 'real'] or is_analog:
                        sql = "INSERT INTO historian.historian (tag_id, value_float, ts) VALUES (%s, %s, %s)"
                        params = (tid, float(val), ts)
                    elif raw_dtype in ['int', 'integer', 'dint', 'sint']:
                        sql = "INSERT INTO historian.historian (tag_id, value_int, ts) VALUES (%s, %s, %s)"
                        params = (tid, int(val), ts)
                    elif raw_dtype in ['bool', 'boolean', 'bit']:
                        sql = "INSERT INTO historian.historian (tag_id, value_bool, ts) VALUES (%s, %s, %s)"
                        params = (tid, bool(val), ts)
                    
                    if sql:
                        try:
                            cur.execute(sql, params)
                            count += 1
                        except Exception as e:
                            print(f"🔴 SQL Insert Error for {tn}: {e}")
                    else:
                        if tn not in warned_tags:
                            print(f"⚠️ Ingest Warning: Unknown datatype '{raw_dtype}' for tag '{tn}'. Skipping.")
                            warned_tags.add(tn)
                
                conn.commit()
                
                batch_counter += 1
                if batch_counter >= 10:
                    print(f"✅ Historian: Ingested {count} records. Q-Size: {historian_queue.qsize()}")
                    batch_counter = 0
        except Exception as e:
            print(f"🔴 Historian Batch Level Error: {e}")
        finally:
            release_db_conn(conn)

def sync_tags_with_db():
    global tag_map, TAGS_TO_READ
    print("🔵 Syncing tags...")
    conn = None
    
    # FIX: Temporarily hardcode the tags we want to read if DB connection fails 
    # This list must be updated manually in your historian.tag_lookup table later!
    NEW_TAG_LIST = [
        {"name": "A25_CMD_Charge", "datatype": "bool"},
        {"name": "A25_CMD_Discharge", "datatype": "bool"},
        {"name": "A25_CMD_Shutdown", "datatype": "bool"},
        {"name": "A25_CMD_Startup", "datatype": "bool"},
        {"name": "A25_Cycles", "datatype": "int"},
        {"name": "A25_En_Charge", "datatype": "bool"},
        {"name": "A25_En_Discharge", "datatype": "bool"},
        {"name": "A25_En_Shutdown", "datatype": "bool"},
        {"name": "A25_Energy", "datatype": "float"},
        {"name": "A25_Energy_Total", "datatype": "float"},
        {"name": "A25_RunHours", "datatype": "int"},
        {"name": "A25_SIM_Charge", "datatype": "bool"},
        {"name": "A25_SIM_Discharge", "datatype": "bool"},
        {"name": "A25_SIM_Shutdown", "datatype": "bool"},
        {"name": "A25_SIM_Startup", "datatype": "bool"},
        {"name": "A25_SoC", "datatype": "float"},
        {"name": "A25_Speed", "datatype": "float"},
        {"name": "A25_Power", "datatype": "float"},
        {"name": "A25_Energy", "datatype": "float"},
        {"name": "VT001.Scaled", "datatype": "float"},
        {"name": "VT002.Scaled", "datatype": "float"},
        {"name": "TT001.Scaled", "datatype": "float"},
        {"name": "TT002.Scaled", "datatype": "float"},
        {"name": "TT003.Scaled", "datatype": "float"},
        {"name": "A25_Status", "datatype": "int"},
        {"name": "WT001.Scaled", "datatype": "float"},
        {"name": "PT001.Scaled", "datatype": "float"},
        {"name": "EM_SV", "datatype": "float"},
        {"name": "PT001_Healthy", "datatype": "bool"},
        {"name": "WT001_Healthy", "datatype": "bool"},
        {"name": "VT001_Healthy", "datatype": "bool"},
        {"name": "VT002_Healthy", "datatype": "bool"},
        {"name": "TT001_Healthy", "datatype": "bool"},
        {"name": "TT002_Healthy", "datatype": "bool"},
        {"name": "TT003_Healthy", "datatype": "bool"},
    ]


    try:
        conn = get_db_conn()
        with conn.cursor() as cur:
            cur.execute("SELECT id, tag, datatype, is_active FROM historian.tag_lookup")
            rows = cur.fetchall()
            tag_map = {row[1]: row[0] for row in rows}
            TAGS_TO_READ = [{"name": row[1], "datatype": row[2]} for row in rows if row[3]]
            print(f"✅ Active Tags: {len(TAGS_TO_READ)} from DB")
            
            # CRITICAL FIX: IF NO TAGS CAME FROM DB, FORCE THE NEW LIST
            if not TAGS_TO_READ:
                print("⚠️ DB tag sync failed or returned no active tags. Forcing use of new hardcoded list.")
                # We are forcing the PLC poller to read these names, but they won't be saved to DB historian
                TAGS_TO_READ = [t for t in NEW_TAG_LIST] 
                # Also ensure tag_map is populated so the live-data endpoint has the ID later for saving
                # NOTE: This only works if you manually update the DB's tag_lookup with these tags and IDs later
                # For now, we only care that the PLC Poller reads the names
                tag_map = {t['name']: 9999 for t in TAGS_TO_READ} # Use a dummy ID for now

    except Exception as e:
        print(f"🔴 Tag Sync Failed: {e}. Forcing use of new hardcoded list.")
        TAGS_TO_READ = [t for t in NEW_TAG_LIST] 
        tag_map = {t['name']: 9999 for t in TAGS_TO_READ}
    finally:
        release_db_conn(conn)
        print(f"✅ Poller will attempt to read {len(TAGS_TO_READ)} tags.")

# --- LIFESPAN ---
@asynccontextmanager
async def lifespan(app: FastAPI):
    # 1. Start threads first so API is responsive immediately
    # (The DB retry loop will happen in main thread or we should spawn it?)
    # actually, blocking startup for DB is safer for integrity, 
    # but let's allow it to retry a few times then fail, OR run it in a thread.
    
    # Better approach for Robustness: Run DB init in a background thread 
    # so the API comes up immediately (responding to Health Checks) 
    # even if DB is down.
    
    db_thread = threading.Thread(target=init_db_pool, daemon=True)
    db_thread.start()
    
    # 2. OPC UA Setup
    s = Server()
    s.set_endpoint(OPCUA_ENDPOINT)
    s.set_server_name(OPCUA_SERVER_NAME)
    idx = s.register_namespace("Flywheel")
    obj = s.get_objects_node()
    pf = obj.add_object(idx, "PLC_Tags")
    # Note: opc_tag_nodes will be populated once DB connects and Sync runs
    
    ts = [
        threading.Thread(target=plc_polling_task, daemon=True),
        threading.Thread(target=s.start, daemon=True),
        threading.Thread(target=opcua_updater_task, daemon=True),
        threading.Thread(target=historian_ingester_task, daemon=True)
    ]
    for t in ts: t.start()
    
    # Periodically check if DB is ready to sync tags
    # (Simple sync loop inside lifespan won't work well, 
    # let's add a "Maintenance Thread" that syncs tags once DB is up)
    def maintenance_task():
        tags_loaded = False
        while not stop_event.is_set():
            if pg_pool and not tags_loaded:
                sync_tags_with_db()
                # Create nodes now that we have tags
                global opc_tag_nodes
                for t in TAGS_TO_READ:
                    try:
                        n = pf.add_variable(idx, t["name"], 0)
                        n.set_writable()
                        opc_tag_nodes[t["name"]] = n
                    except: pass
                tags_loaded = True
            time.sleep(1)
            
    threading.Thread(target=maintenance_task, daemon=True).start()
    
    print("🚀 SYSTEM READY. Listening on 0.0.0.0:8000")
    yield
    print("🛑 SHUTDOWN.")
    stop_event.set()
    try: s.stop()
    except: pass
    if pg_pool: pg_pool.closeall()

app = FastAPI(lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.middleware("http")
async def log_requests(request: Request, call_next):
    if request.method == "POST":
        print(f"🔹 {request.method} {request.url.path} from {request.client.host}")
    return await call_next(request)

# --- ENDPOINTS ---
@app.get("/")
def health_check(): return {"status": "online", "ts": datetime.now().isoformat()}

@app.post("/token", response_model=Token)
def login(form_data: OAuth2PasswordRequestForm = Depends()):
    user = get_user_from_db(form_data.username)
    if not user or not verify_password(form_data.password, user['hashed_password']):
        raise HTTPException(401, "Invalid credentials")

    token = create_access_token(data={"sub": user['username'], "role": user['role']})
    return {"access_token": token, "token_type": "bearer"}

@app.get("/users/me", response_model=User) # <-- Ensure this line remains response_model=User
def read_users_me(current_user: User = Depends(get_current_user)):
    # REVERTED to standard return
    return current_user

@app.get("/api/tags", response_model=List[Tag])
def get_tags(user: User = Depends(get_current_active_admin)):
    conn = None
    try:
        conn = get_db_conn()
        with conn.cursor() as cur:
            cur.execute("SELECT id, tag, datatype, is_active FROM historian.tag_lookup ORDER BY id")
            return [Tag(id=r[0], tag=r[1], datatype=r[2], is_active=r[3]) for r in cur.fetchall()]
    finally:
        release_db_conn(conn)

@app.put("/api/tags/{tag_id}", response_model=Tag)
def update_tag(tag_id: int, u: TagUpdate, user: User = Depends(get_current_active_admin)):
    conn = None
    try:
        conn = get_db_conn()
        with conn.cursor() as cur:
            cur.execute("UPDATE historian.tag_lookup SET is_active = %s WHERE id = %s RETURNING id, tag, datatype, is_active", (u.is_active, tag_id))
            res = cur.fetchone()
            conn.commit()
            if res:
                sync_tags_with_db()
                return Tag(id=res[0], tag=res[1], datatype=res[2], is_active=res[3])
            raise HTTPException(404, "Tag not found")
    finally:
        release_db_conn(conn)

@app.get("/api/historian")
def get_historian(tags: List[str] = Query(None), start_time: Optional[str] = None, end_time: Optional[str] = None):
    
    if not tags: return {}
    st = start_time or "1970-01-01T00:00:00Z"
    et = end_time or datetime.utcnow().isoformat()
    
    dur = 9999999
    try:
        st_obj = datetime.fromisoformat(st.replace('Z', '+00:00'))
        et_obj = datetime.fromisoformat(et.replace('Z', '+00:00'))
        dur = (et_obj - st_obj).total_seconds()
    except:
        st_obj = datetime(1970, 1, 1, tzinfo=timezone.utc)
        et_obj = datetime.now(timezone.utc)

    # RAW/AGGREGATION SWITCH (1800 seconds = 30 minutes)
    raw = dur <= 1800 
    conn = None
    
    try:
        conn = get_db_conn()
        with conn.cursor() as cur:
            if raw:
                # RAW QUERY block (unchanged)
                sql = """SELECT h.ts, tl.tag, COALESCE(h.value_float, h.value_int::double precision, h.value_bool::int::double precision) 
                         FROM historian.historian h JOIN historian.tag_lookup tl ON h.tag_id = tl.id 
                         WHERE tl.tag = ANY(%s) AND h.ts >= %s AND h.ts <= %s ORDER BY h.ts ASC"""
                params = (tags, st_obj, et_obj)
            else:
                # AGGREGATED QUERY block - FIX: Aggressive Hierarchical Time Buckets
                
                # Check for All Time (2 years in the frontend logic) and huge queries first
                if dur > 86400 * 365 * 2: # > 2 years (This should catch the 'All Time' span)
                    buck = "1 month" 
                elif dur > 86400 * 30: # > 1 month
                    buck = "1 week" 
                elif dur > 86400 * 7: # > 1 week
                    buck = "6 hours" # 7 days * 4 per day = 28 points. Very fast.
                elif dur > 86400 * 2: # > 2 days
                    buck = "1 hour" # 2 days * 24 per day = 48 points. Fast.
                else:
                    buck = "5 minutes" # Default for > 30 minutes up to 2 days. 
                
                sql = """
                    SELECT 
                        time_bucket(%s, h.ts) as b, 
                        tl.tag, 
                        -- FIX: CHANGE AVG() to MAX() for more robust aggregation over long periods
                        MAX( 
                            CASE
                                WHEN h.value_float IS NOT NULL THEN h.value_float
                                WHEN h.value_int IS NOT NULL THEN h.value_int::double precision
                                WHEN h.value_bool IS NOT NULL THEN h.value_bool::int::double precision
                                ELSE NULL
                            END
                        )
                    FROM historian.historian h 
                    JOIN historian.tag_lookup tl ON h.tag_id = tl.id
                    WHERE tl.tag = ANY(%s) 
                      AND h.ts >= %s 
                      AND h.ts <= %s 
                    GROUP BY b, tl.tag 
                    ORDER BY b ASC
                """
                # Trust the original parameter order for safety:
                params = (buck, tags, st_obj, et_obj) 
            
            # --- DEBUG FIX: LOG THE EXECUTED QUERY ---
            print("\n--- DEBUG: HISTORIAN QUERY ---")
            print(cur.mogrify(sql, params).decode('utf-8'))
            print("------------------------------\n")
            # --- END DEBUG FIX ---

            cur.execute(sql, params)
            res = {t: [] for t in tags}
            for r in cur.fetchall():
                if r[2] is not None:
                    res[r[1]].append({"ts": r[0].isoformat(), "value": r[2]})
            return res
    except Exception as e:
        print(f"🔴 Query Error: {e}")
        return {"error": str(e)}
    finally:
        release_db_conn(conn)

@app.get("/api/live-data")
def live_endpoint():
    with live_data_lock: return live_data

@app.post("/api/write-tag", dependencies=[Depends(require_api_key), Depends(get_current_active_engineer)])
def write_tag_endpoint(req: TagWriteRequest):
    if req.tag_name not in WRITEABLE_TAGS: raise HTTPException(403, "Not writable")
    c = PLC()
    c.IPAddress = PLC_IP
    c.ProcessorSlot = 0
    
    status = "error"
    message = "Unknown error"
    
    try:
        ret = c.Write(req.tag_name, req.value)
        if getattr(ret, "Status", None) == 'Success': 
            status = "success"
            message = "Success"
        else:
            message = str(getattr(ret, "Status", "Unknown Status"))
    except Exception as e:
        message = str(e)
    finally:
        # FIX 2.3: Ensure the PLC connection is closed regardless of success/fail
        try:
            c.Close()
        except:
            # If close fails, we just ignore it and return the original error.
            pass 
            
    if status == 'success':
        return {"status": "success"}
    
    # If the write failed, raise a detailed error to the client
    raise HTTPException(status_code=500, detail={"status": status, "message": message})

@app.get("/api/settings", response_model=List[Setting])
def get_settings_endpoint(user: User = Depends(get_current_active_engineer)):
    conn = None
    try:
        conn = get_db_conn()
        with conn.cursor() as cur:
            cur.execute("SELECT key, value_float, value_text FROM app.settings")
            return [Setting(key=r[0], value=r[1] if r[1] is not None else r[2]) for r in cur.fetchall()]
    finally:
        release_db_conn(conn)

@app.put("/api/settings/{key}", response_model=Setting)
def update_setting_endpoint(key: str, s: Setting, user: User = Depends(get_current_active_engineer)):
    conn = None
    try:
        conn = get_db_conn()
        with conn.cursor() as cur:
            if isinstance(s.value, (float, int)):
                cur.execute("UPDATE app.settings SET value_float = %s WHERE key = %s", (s.value, key))
            else:
                cur.execute("UPDATE app.settings SET value_text = %s WHERE key = %s", (s.value, key))
            conn.commit()
        return s
    finally:
        release_db_conn(conn)

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)