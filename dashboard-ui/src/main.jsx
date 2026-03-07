import React from 'react';
import ReactDOM from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import App from './App.jsx';
import './index.css';
import { AuthProvider } from './context/AuthContext';
import { SystemStatusProvider } from './context/SystemStatusContext';
import HomePage from './pages/HomePage';
import OperationalDetailsPage from './pages/OperationalDetailsPage';
import EngineeringPage from './pages/EngineeringPage'; // now CONFIG page 
import EngineeringDashboardPage from './pages/EngineeringDashboardPage'; //
import LoginPage from './pages/LoginPage';
import SensorWallPage from './pages/SensorWallPage';
import ProtectedRoute from './components/ProtectedRoute';

const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    children: [
      { index: true, element: <HomePage /> },
      { path: "operational-details", element: <OperationalDetailsPage /> },
      {
        path: "engineering",
        element: (
          <ProtectedRoute restrictTo={['Engineer', 'Admin']}>
            <EngineeringDashboardPage />
          </ProtectedRoute>
        )
      },
      { 
        path: "configuration", 
        element: (
          <ProtectedRoute restrictTo={['Engineer', 'Admin', 'Operator']}>
            <EngineeringPage /> {/* Repurposed to Configuration Page */}
          </ProtectedRoute>
        )
      },
      { path: "login", element: <LoginPage /> },
    ],
  },
  {
    path: "/sensor-wall",
    element: <SensorWallPage />
  }
]);

ReactDOM.createRoot(document.getElementById('root')).render(
    <SystemStatusProvider> 
      <AuthProvider> 
        <RouterProvider router={router} />
      </AuthProvider>
    </SystemStatusProvider>
)