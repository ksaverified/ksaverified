import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from './AuthContext';

const ADMIN_EMAIL = 'cupido1romeo@gmail.com';

const AuthGuard = ({ children, allowedRoles = ['admin', 'sales'] }) => {
    const { user, loading } = useAuth();

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center bg-[#0a0c10]">
                <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (!user) {
        return <Navigate to="/manage" replace />;
    }

    // Check for admin/sales roles or legacy email
    const role = user?.user_metadata?.role || user?.app_metadata?.role;
    
    // Authorization logic:
    // 1. ADMIN_EMAIL always allowed (absolute failsafe)
    // 2. roles in allowedRoles are allowed
    // 3. 'admin' role is always allowed (fallback)
    const isAuthorized = 
        (user.email && user.email.toLowerCase() === ADMIN_EMAIL.toLowerCase()) || 
        role === 'admin' || 
        (allowedRoles && allowedRoles.includes(role));

    if (!isAuthorized) {
        return (
            <div className="flex h-screen w-full flex-col items-center justify-center bg-[#0a0c10] p-6 text-center">
                <div className="mb-6 rounded-2xl bg-red-500/10 p-4 border border-red-500/20">
                    <svg className="h-12 w-12 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m0 0v2m0-2h2m-2 0H10m13-3v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2h14a2 2 0 012 2zM7 11V7a5 5 0 0110 0v4" />
                    </svg>
                </div>
                <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-red-400 to-pink-500">Access Restricted</h1>
                <p className="mt-2 text-zinc-400 max-w-md">
                    This dashboard is restricted to authorized personnel. 
                    Your account (<strong>{user.email}</strong>) with detected role (<strong>{role || 'restricted'}</strong>) does not have the permissions required for this section.
                </p>
                <button
                    onClick={() => window.location.href = '/manage'}
                    className="mt-8 rounded-xl bg-zinc-900 px-8 py-3 font-semibold text-white border border-zinc-800 hover:bg-zinc-800 transition-all"
                >
                    Back to Login
                </button>
            </div>
        );
    }

    return children;
};

export default AuthGuard;
