import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function ProtectedRoute({ element, children, adminOnly }) {
    const { user, isAdmin, isLoading } = useAuth();
    const location = useLocation();

    if (isLoading) {
        return <div>Loading...</div>;
    }

    if (!user) {
        return <Navigate to="/" state={{ from: location }} replace />;
    }

    // If route requires admin access and user is not an admin
    if (adminOnly && !isAdmin) {
        return <Navigate to="/home" state={{ from: location }} replace />;
    }

    return element ? element : children;
}

export default ProtectedRoute;
