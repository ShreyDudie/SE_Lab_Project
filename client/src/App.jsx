import { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { FlashProvider } from './components/FlashMessage';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import Footer from './components/Footer';
import ProtectedRoute from './components/ProtectedRoute';
import LoginPage from './pages/LoginPage';
import IndexPage from './pages/IndexPage';
import DashboardPage from './pages/DashboardPage';
import CommitteePage from './pages/CommitteePage';
import EventResultsPage from './pages/EventResultsPage';
import PendingApprovalPage from './pages/PendingApprovalPage';
import MouseAura from './components/MouseAura';
import ScrollTopButton from './components/ScrollTopButton';
import ScrollProgress from './components/ScrollProgress';
import SideDecor from './components/SideDecor';
import BrandedLoader from './components/BrandedLoader';
import ErrorBoundary from './components/ErrorBoundary';
import NotFoundPage from './pages/NotFoundPage';
import VerifyTicketPage from './pages/VerifyTicketPage';

export default function App() {
  const { user, loading } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  // Per-page browser tab titles
  useEffect(() => {
    const path = location.pathname;
    let t = 'VJTI Committee Manager';
    if (path === '/login') t = 'Sign in · VJTI Committee Manager';
    else if (path === '/') t = 'Explore events · VJTI Committee Manager';
    else if (path === '/dashboard') t = 'Dashboard · VJTI Committee Manager';
    else if (path.startsWith('/committee/')) t = 'Committee · VJTI Committee Manager';
    else if (path.startsWith('/event_results/')) t = 'Event report · VJTI Committee Manager';
    else if (path.startsWith('/verify/')) t = 'Ticket check · VJTI Committee Manager';
    else if (path === '/pending') t = 'Pending approval · VJTI Committee Manager';
    else t = 'Page not found · VJTI Committee Manager';
    document.title = t;
  }, [location.pathname]);

  if (loading) {
    return <BrandedLoader />;
  }

  return (
    <FlashProvider>
      <MouseAura />
      <SideDecor />
      <ScrollProgress />
      <ScrollTopButton />
      <div className="app-wrapper">
        <Navbar onToggleSidebar={() => setSidebarOpen(prev => !prev)} />
        <div className="app-body">
          <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
          <div className={`app-main ${user && sidebarOpen ? 'with-sidebar' : ''}`}>
            <ErrorBoundary resetKey={location.pathname}>
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
              <Route path="/verify/:token" element={<VerifyTicketPage />} />
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
            </ErrorBoundary>
            <Footer />
          </div>
        </div>
      </div>
    </FlashProvider>
  );
}
