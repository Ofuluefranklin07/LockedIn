import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './hooks/useAuth';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Goals from './pages/Goals';
import GoalDetail from './pages/GoalDetail';
import FocusMode from './pages/FocusMode';
import Analytics from './pages/Analytics';
import AICoach from './pages/AICoach';
import AuthPage from './pages/AuthPage';

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-white/10 border-t-white rounded-full animate-spin" />
          <p className="text-[#888] font-mono text-[10px] uppercase tracking-widest animate-pulse">Initializing System...</p>
        </div>
      </div>
    );
  }
  if (!user) return <Navigate to="/login" replace />;
  
  return <Layout>{children}</Layout>;
}

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<AuthPage type="login" />} />
          <Route path="/signup" element={<AuthPage type="signup" />} />
          
          <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/goals" element={<ProtectedRoute><Goals /></ProtectedRoute>} />
          <Route path="/goals/:id" element={<ProtectedRoute><GoalDetail /></ProtectedRoute>} />
          <Route path="/focus" element={<ProtectedRoute><FocusMode /></ProtectedRoute>} />
          <Route path="/analytics" element={<ProtectedRoute><Analytics /></ProtectedRoute>} />
          <Route path="/coach" element={<ProtectedRoute><AICoach /></ProtectedRoute>} />
          
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}
