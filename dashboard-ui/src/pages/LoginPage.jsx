// File: dashboard-ui/src/pages/LoginPage.jsx

import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';

function LoginPage() {
  // FIX: Start with empty state for clean fields and better security UX
  const [username, setUsername] = useState(''); 
  const [password, setPassword] = useState(''); 
  const [error, setError] = useState('');
  const auth = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  const from = location.state?.from?.pathname || "/";

  const handleSubmit = async (e) => {
    e.preventDefault(); 
    setError(''); 
    
    // Attempt login using current state values
    const success = await auth.login(username, password);

    if (success) {
      navigate(from, { replace: true });
    } else {
      // FIX 2: Do NOT clear username or password state here.
      // The current values in the state (username, password) will be retained
      // in the input fields because they are bound via `value={...}`.
      setError('Invalid username or password.'); 
    }
  };

  return (
    <div className="login-container">
      <form onSubmit={handleSubmit} className="card">
        <h2>Login Required</h2>
        <p>You must log in to view this page.</p>
        {error && <p className="error-message">{error}</p>} 
        <div className="form-group">
          <label htmlFor="username">Username</label>
          <input type="text" id="username" value={username} onChange={e => setUsername(e.target.value)} required />
        </div>
        <div className="form-group">
          <label htmlFor="password">Password</label>
          <input type="password" id="password" value={password} onChange={e => setPassword(e.target.value)} required />
        </div>
        <button type="submit">Log In</button>
      </form>
    </div>
  );
}
export default LoginPage;