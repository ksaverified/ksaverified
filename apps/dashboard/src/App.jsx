import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import MapGapDashboard from './pages/mapgap/MapGapDashboard';
import MapGapSettings from './pages/mapgap/MapGapSettings';
import GapAnalysis from './pages/mapgap/GapAnalysis';
import ComprehensiveDashboard from './pages/mapgap/ComprehensiveDashboard';
import Login from './pages/Login';
import LandingPage from './pages/LandingPage';
import SalesmanOnboarding from './pages/SalesmanOnboarding';
import SalesmanDashboard from './pages/SalesmanDashboard';
import SalesmanProfile from './pages/SalesmanProfile';
import { AuthProvider } from './components/AuthContext';
import AuthGuard from './components/AuthGuard';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/pricing" element={<LandingPage />} />
          <Route path="/showcase" element={<LandingPage />} />
          <Route path="/solutions" element={<LandingPage />} />
          <Route path="/manage" element={<Login />} />

          {/* Protected Admin Routes (Now Defaults to MapGap V3) */}
          <Route path="/admin" element={
            <AuthGuard allowedRoles={['admin']}>
              <Layout />
            </AuthGuard>
          }>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<MapGapDashboard />} />
            <Route path="comprehensive" element={<ComprehensiveDashboard />} />
            <Route path="analysis" element={<GapAnalysis />} />
            <Route path="settings" element={<MapGapSettings />} />
          </Route>

          {/* Sales Force Routes */}
          <Route path="/join" element={<SalesmanOnboarding />} />
          <Route path="/sales" element={
            <AuthGuard>
              <SalesmanDashboard />
            </AuthGuard>
          } />
          <Route path="/sales/profile" element={
            <AuthGuard>
              <SalesmanProfile />
            </AuthGuard>
          } />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
