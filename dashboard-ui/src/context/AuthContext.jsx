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

// Non-hook way to access the logout function for the global interceptor in api.js
let globalLogout = () => {};

export const AuthProvider = ({ children }) => {
  const initialToken = localStorage.getItem('authToken');
  const [token, setToken] = useState(initialToken);

  // Synchronous User Initialisation from jwt payload.
  const [user, setUser] = useState(() => {
    const initialToken = localStorage.getItem('authToken');
    const payload = decodeJwtPayload(initialToken);
    return (payload && payload.sub && payload) ? 
    { username : payload.sub, role: payload.role} : null;
  });

  // Load only if there is a token to validate over the network
  const [isLoading, setIsLoading] = useState(
    initialToken && (!user || !user.role) ? true : false
  );
  
  const { connectionStatus } = useSystemStatus(); 

  const fetchUser = async (currentToken) => {

      if (!currenToken || connectionStatus.state === 'OFFLINE') {
        setIsLoading(false);
        return null;
      }

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
        setIsLoading(false); 
      }
  };

  useEffect(() => {
    // Initial load: if token exists, run network validation to confirm it's still active.
    if (token && (isLoading || connectionStatus.state === 'ONLINE')) {
      fetchUser(token);
    } else if (!token) {
      setIsLoading(false);
    }
    // Note: Do NOT add 'user' to the dependency array. That creates an infinite loop.
  }, [token, connectionStatus.state]);

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
    window.location.href = '/login'; // Force a full page reload after clearing state to ensure all components reset.
  };

  useEffect(() => {
    globalLogout = logout;
  }, []);

  const value = { token, user, login, logout, isLoading };

  return (
    <AuthContext.Provider value={value}>
    {/* Show loading screen only if actively validating a token */}
      {isLoading && token ? (
          <div style={{
              height: '100vh', display: 'flex', alignItems: 'center', 
              justifyContent: 'center', backgroundColor: '#1e1e1e', color: '#888'
          }}>
              Verifying Session...
          </div>
      ) : (
          children
      )}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

export const setGlobalLogout = (logoutFn) => {
  globalLogout = logoutFn;
};
export const getGlobalLogout = () => globalLogout;