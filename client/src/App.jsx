import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { FlashProvider } from './components/FlashMessage';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ProtectedRoute from './components/ProtectedRoute';
import LoginPage from './pages/LoginPage';
import IndexPage from './pages/IndexPage';
import DashboardPage from './pages/DashboardPage';
import CommitteePage from './pages/CommitteePage';
import EventResultsPage from './pages/EventResultsPage';
import PendingApprovalPage from './pages/PendingApprovalPage';

export default function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="app-wrapper">
        <div className="main-content text-center" style={{ paddingTop: '4rem' }}>
          <p className="text-muted">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <FlashProvider>
      <div className="app-wrapper">
        <Navbar />
        <Routes>
          <Route path="/login" element={user ? <Navigate to="/dashboard" /> : <LoginPage />} />
          <Route path="/" element={
            <ProtectedRoute>
              {user?.role === 'head' || user?.role === 'admin'
                ? <Navigate to="/dashboard" />
                : <IndexPage />}
            </ProtectedRoute>
          } />
          <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
          <Route path="/committee/:id" element={<ProtectedRoute><CommitteePage /></ProtectedRoute>} />
          <Route path="/event_results/:id" element={<ProtectedRoute><EventResultsPage /></ProtectedRoute>} />
          <Route path="/pending" element={<ProtectedRoute><PendingApprovalPage /></ProtectedRoute>} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
        <Footer />
      </div>
    </FlashProvider>
  );
}
