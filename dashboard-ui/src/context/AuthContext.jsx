// File: dashboard-ui/src/context/AuthContext.jsx

import { createContext, useState, useContext, useEffect } from 'react';
import apiClient from '../api';
import { useSystemStatus } from './SystemStatusContext'; 

// Minimal JWT Payload Decoder (since we avoid extra dependencies)
function decodeJwtPayload(token) {
    if (!token) return null;
    try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
        return JSON.parse(jsonPayload);
    } catch (e) {
        console.error("Failed to decode JWT payload:", e);
        return null;
    }
}

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(localStorage.getItem('authToken'));
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true); 
  
  const { connectionStatus } = useSystemStatus(); 

  const fetchUser = async (currentToken) => {
      try {
        apiClient.defaults.headers.common['Authorization'] = `Bearer ${currentToken}`;
        const userResponse = await apiClient.get('/users/me', { timeout: 2000 }); 
        setUser(userResponse.data);
        return userResponse.data; // Return user data on success
      } catch (error) {
        if (error.response && error.response.status === 401) {
            logout();
        } 
        return null; 
      } finally {
        // === FIX 1: CRITICAL: Unconditionally set isLoading to false ===
        // This ensures the application starts even if the network fails but a token exists.
        setIsLoading(false); 
      }
  };

  // Initial check useEffect: Call fetchUser only if token exists and user is null
  useEffect(() => {
    if (token && !user) {
        fetchUser(token); 
    } else if (!token) {
        setIsLoading(false);
    }
  }, [token, user]); 

  // AUTO-RECOVERY LOGIC
  useEffect(() => {
      if (token && !user && connectionStatus.state === 'ONLINE') {
          console.log("AuthContext: System back online - Retrying User Auth...");
          fetchUser(token); 
      }
  }, [connectionStatus.state, token, user]);

    const login = async (username, password) => {
    setIsLoading(true); 
    try {
      const params = new URLSearchParams();
      params.append('username', username);
      params.append('password', password);
      const response = await apiClient.post('/token', params);
      const { access_token } = response.data;
      
      setToken(access_token);
      localStorage.setItem('authToken', access_token);
      
      // === FIX: SHORT-CIRCUIT ASYNC /users/me CALL FOR INITIAL ROLE POPULATION ===
      const payload = decodeJwtPayload(access_token);
      
      if (payload && payload.sub && payload.role) {
          // Synchronously set the user state based on the token payload
          const initialUser = { username: payload.sub, role: payload.role };
          setUser(initialUser); 
          setIsLoading(false); // Auth is complete and role is set
          return true;
      }

      // Fallback: If JWT parsing failed, force a network call (last resort)
      console.warn("JWT payload incomplete, falling back to /users/me check...");
      const fetchedUser = await fetchUser(access_token);
      return !!fetchedUser;

    } catch (error) {
      console.error("Login failed:", error);
      setIsLoading(false); 
      return false;
    }
  };
  
  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('authToken');
    delete apiClient.defaults.headers.common['Authorization'];
    setIsLoading(false); // Reset loading state when logging out
  };
  
  const value = { token, user, login, logout, isLoading };

  return (
    <AuthContext.Provider value={value}>
      {isLoading ? (
          <div style={{
              height: '100vh', display: 'flex', alignItems: 'center', 
              justifyContent: 'center', backgroundColor: '#1e1e1e', color: '#888'
          }}>
              Initializing System...
          </div>
      ) : (
          children
      )}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);