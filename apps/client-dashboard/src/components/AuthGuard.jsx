import { Navigate } from 'react-router-dom';
import { useAuth } from './AuthContext';

export default function AuthGuard({ children }) {
    const { user, loading } = useAuth();

    if (loading) {
        return (
            <div className="min-h-screen bg-black flex flex-col items-center justify-center space-y-6">
                <div className="w-16 h-16 border-4 border-amber-500/20 border-t-amber-500 rounded-full animate-spin amber-glow" />
                <div className="animate-pulse text-amber-500/60 text-[10px] font-black tracking-[0.4em] uppercase">
                    Authenticating Portal
                </div>
            </div>
        );
    }

    if (!user) {
        // Redirect logic to /login
        return <Navigate to="/login" replace />;
    }

    // Notice we do NOT restrict to the admin email here because this is the CLIENT dashboard.
    // Any authenticated user should have access to their own data.

    return children;
}
