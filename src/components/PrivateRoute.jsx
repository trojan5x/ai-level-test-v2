import React from 'react';
import { useAdminAuth } from '../admin/hooks/useAdminAuth.jsx';
import AdminLogin from '../admin/components/AdminLogin.jsx';

const PrivateRoute = ({ children }) => {
  const { isAuthenticated, isLoading } = useAdminAuth();
  
  console.log('PrivateRoute render - isAuthenticated:', isAuthenticated, 'isLoading:', isLoading);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Checking authentication...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <AdminLogin />;
  }

  return children;
};

export default PrivateRoute;