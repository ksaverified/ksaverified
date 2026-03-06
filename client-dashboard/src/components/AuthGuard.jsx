import { Navigate } from 'react-router-dom';
import { useAuth } from './AuthContext';

export default function AuthGuard({ children }) {
    const { user, loading } = useAuth();

    if (loading) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <div className="animate-pulse text-zinc-500 text-sm tracking-widest uppercase">
                    Authenticating...
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
