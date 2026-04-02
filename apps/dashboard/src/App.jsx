import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Login from './pages/Login';
import LandingPage from './pages/LandingPage';
import SalesmanOnboarding from './pages/SalesmanOnboarding';
import SalesmanDashboard from './pages/SalesmanDashboard';
import SalesmanProfile from './pages/SalesmanProfile';
import { AuthProvider } from './components/AuthContext';
import AuthGuard from './components/AuthGuard';

// MapGap Pages
import MapGapDashboard from './pages/mapgap/MapGapDashboard';
import MapGapSettings from './pages/mapgap/MapGapSettings';
import GapAnalysis from './pages/mapgap/GapAnalysis';
import ComprehensiveDashboard from './pages/mapgap/ComprehensiveDashboard';

// V2 Strategy Pages
import V2Shell from './pages/v2/V2Shell';
import UnifiedStrategyHub from './pages/v2/UnifiedStrategyHub';
import AgentManager from './pages/v2/AgentManager';
import PipelineV2 from './pages/v2/PipelineV2';
import WebsitesV2 from './pages/v2/WebsitesV2';
import WhatsAppV2 from './pages/v2/WhatsAppV2';
import AnalyticsV2 from './pages/v2/AnalyticsV2';
import MapV2 from './pages/v2/MapV2';
import LogsV2 from './pages/v2/LogsV2';
import SettingsV2 from './pages/v2/SettingsV2';

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
          {/* NEW: Unified Strategy Hub (V2) */}
          <Route path="/admin" element={<Navigate to="/admin-v2" replace />} />
          
          <Route path="/admin-v2" element={
            <AuthGuard allowedRoles={['admin']}>
              <V2Shell />
            </AuthGuard>
          }>
            <Route index element={<UnifiedStrategyHub />} />
            <Route path="pipeline" element={<PipelineV2 />} />
            <Route path="agents" element={<AgentManager />} />
            <Route path="websites" element={<WebsitesV2 />} />
            <Route path="whatsapp" element={<WhatsAppV2 />} />
            <Route path="analytics" element={<AnalyticsV2 />} />
            <Route path="map" element={<MapV2 />} />
            <Route path="logs" element={<LogsV2 />} />
            <Route path="settings" element={<SettingsV2 />} />
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
