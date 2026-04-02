import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './components/AuthContext';
import AuthGuard from './components/AuthGuard';
import Layout from './components/Layout';
import Login from './pages/Login';
import MyWebsite from './pages/MyWebsite';
import WebsiteEditor from './pages/WebsiteEditor';
import SEOHub from './pages/SEOHub';
import Profile from './pages/Profile';
import Payment from './pages/Payment';
import GapAudit from './pages/GapAudit';

function App() {
  return (
    <AuthProvider>
      <Router basename="/customers">
        <Routes>
          <Route path="/login" element={<Login />} />

          <Route path="/" element={
            <AuthGuard>
              <Layout />
            </AuthGuard>
          }>
            <Route index element={<Navigate to="/audit" replace />} />
            <Route path="audit" element={<GapAudit />} />
            <Route path="my-website" element={<MyWebsite />} />
            <Route path="editor" element={<WebsiteEditor />} />
            <Route path="seo" element={<SEOHub />} />
            <Route path="profile" element={<Profile />} />
            <Route path="payment" element={<Payment />} />
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
