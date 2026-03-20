import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import Pipeline from './pages/Pipeline';
import Websites from './pages/Websites';
import Settings from './pages/Settings';
import Logs from './pages/Logs';
import MapView from './pages/Map';
import Answers from './pages/Answers';
import Analytics from './pages/Analytics';
import WhatsApp from './pages/WhatsApp';
import InterestConfirmed from './pages/InterestConfirmed';
import Login from './pages/Login';
import LandingPage from './pages/LandingPage';
import SalesmanOnboarding from './pages/SalesmanOnboarding';
import SalesmanDashboard from './pages/SalesmanDashboard';
import { AuthProvider } from './components/AuthContext';
import AuthGuard from './components/AuthGuard';
// ── V2 Dashboard ─────────────────────────────────────────────────────────────
import LoginV2 from './pages/v2/LoginV2';
import OrchestratorDashboard from './pages/v2/OrchestratorDashboard';
import PipelineV2 from './pages/v2/PipelineV2';
import LogsV2 from './pages/v2/LogsV2';
import WebsitesV2 from './pages/v2/WebsitesV2';
import AnalyticsV2 from './pages/v2/AnalyticsV2';
import WhatsAppV2 from './pages/v2/WhatsAppV2';
import MapV2 from './pages/v2/MapV2';
import AnswersV2 from './pages/v2/AnswersV2';
import SettingsV2 from './pages/v2/SettingsV2';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/manage" element={<Login />} />

          {/* Protected Admin V1 Routes */}
          <Route path="/admin" element={
            <AuthGuard>
              <Layout />
            </AuthGuard>
          }>
            <Route index element={<Home />} />
            <Route path="pipeline" element={<Pipeline />} />
            <Route path="websites" element={<Websites />} />
            <Route path="map" element={<MapView />} />
            <Route path="answers" element={<Answers />} />
            <Route path="analytics" element={<Analytics />} />
            <Route path="settings" element={<Settings />} />
            <Route path="whatsapp" element={<WhatsApp />} />
            <Route path="interest-confirmed" element={<InterestConfirmed />} />
            <Route path="logs" element={<Logs />} />
          </Route>

          {/* Sales Force Routes */}
          <Route path="/join" element={<SalesmanOnboarding />} />
          <Route path="/sales" element={
            <AuthGuard>
              <SalesmanDashboard />
            </AuthGuard>
          } />

          {/* ── Dashboard V2 Routes ── */}
          <Route path="/login-v2" element={<LoginV2 />} />
          <Route path="/admin-v2" element={
            <AuthGuard>
              <OrchestratorDashboard />
            </AuthGuard>
          } />
          <Route path="/admin-v2/pipeline" element={<AuthGuard><PipelineV2 /></AuthGuard>} />
          <Route path="/admin-v2/logs" element={<AuthGuard><LogsV2 /></AuthGuard>} />
          <Route path="/admin-v2/websites" element={<AuthGuard><WebsitesV2 /></AuthGuard>} />
          <Route path="/admin-v2/analytics" element={<AuthGuard><AnalyticsV2 /></AuthGuard>} />
          <Route path="/admin-v2/whatsapp" element={<AuthGuard><WhatsAppV2 /></AuthGuard>} />
          <Route path="/admin-v2/map" element={<AuthGuard><MapV2 /></AuthGuard>} />
          <Route path="/admin-v2/answers" element={<AuthGuard><AnswersV2 /></AuthGuard>} />
          <Route path="/admin-v2/settings" element={<AuthGuard><SettingsV2 /></AuthGuard>} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
