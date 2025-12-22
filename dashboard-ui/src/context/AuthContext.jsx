import { createContext, useState, useContext, useEffect } from 'react';
import apiClient from '../api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(localStorage.getItem('authToken'));
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const verifyToken = async () => {
      if (!token) {
          setIsLoading(false);
          return;
      }

      try {
        apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        const userResponse = await apiClient.get('/users/me', { timeout: 2000 });
        setUser(userResponse.data);
      } catch (error) {
        console.warn("Auth check failed:", error.message);
        
        // FIX: Only logout if it's explicitly an Auth error (401)
        // If the server is down (Network Error), keep the token so the user
        // stays on the dashboard and sees the "Reconnecting" overlay.
        if (error.response && error.response.status === 401) {
            logout();
        } else {
            // Server is likely down. We keep the user "logged in" locally.
            // The SystemStatusContext will handle the red overlay.
            console.log("Network error - retaining session for reconnect attempt.");
        }
      } finally {
        setIsLoading(false);
      }
    };

    verifyToken();
  }, [token]);

  const login = async (username, password) => {
    try {
      const params = new URLSearchParams();
      params.append('username', username);
      params.append('password', password);
      const response = await apiClient.post('/token', params);
      const { access_token } = response.data;
      setToken(access_token);
      localStorage.setItem('authToken', access_token);
      return true;
    } catch (error) {
      console.error("Login failed:", error);
      return false;
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('authToken');
    delete apiClient.defaults.headers.common['Authorization'];
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