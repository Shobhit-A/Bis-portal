import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './lib/AuthContext';
import LoginPage from './pages/Login';
import RegisterPage from './pages/Register';
import AdminDashboard from './pages/admin/Dashboard';
import SubmissionView from './pages/admin/SubmissionView';
import PortalLayout from './pages/portal/PortalLayout';
import MyForms from './pages/portal/MyForms';
import FormTypeSelect from './pages/portal/FormTypeSelect';
import { FMCS_TABS, FMCS_TAB_COMPONENTS } from './pages/portal/fmcsTabs';
import { ISI_TABS, ISI_TAB_COMPONENTS } from './pages/portal/isiTabs';

function ProtectedRoute({ children, role }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="text-gray-500 text-sm">Loading...</div></div>;
  if (!user) return <Navigate to="/login" replace />;
  if (role && user.role !== role) return <Navigate to={user.role === 'ADMIN' ? '/admin' : '/portal'} replace />;
  return children;
}

function AppRoutes() {
  const { user, loading } = useAuth();
  if (loading) return null;
  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to={user.role === 'ADMIN' ? '/admin' : '/portal'} /> : <LoginPage />} />
      <Route path="/register" element={user ? <Navigate to={user.role === 'ADMIN' ? '/admin' : '/portal'} /> : <RegisterPage />} />
      <Route path="/admin" element={<ProtectedRoute role="ADMIN"><AdminDashboard /></ProtectedRoute>} />
      <Route path="/admin/submissions/:id" element={<ProtectedRoute role="ADMIN"><SubmissionView /></ProtectedRoute>} />
      <Route path="/portal" element={<ProtectedRoute role="CLIENT"><FormTypeSelect /></ProtectedRoute>} />
      <Route path="/portal/fmcs" element={<ProtectedRoute role="CLIENT"><MyForms formType="FMCS" basePath="/portal/fmcs" title="FMCS Forms" /></ProtectedRoute>} />
      <Route path="/portal/fmcs/:submissionId/*" element={<ProtectedRoute role="CLIENT"><PortalLayout basePath="/portal/fmcs" TABS={FMCS_TABS} tabComponents={FMCS_TAB_COMPONENTS} /></ProtectedRoute>} />
      <Route path="/portal/isi" element={<ProtectedRoute role="CLIENT"><MyForms formType="ISI" basePath="/portal/isi" title="ISI (BIS Standard Mark) Forms" /></ProtectedRoute>} />
      <Route path="/portal/isi/:submissionId/*" element={<ProtectedRoute role="CLIENT"><PortalLayout basePath="/portal/isi" TABS={ISI_TABS} tabComponents={ISI_TAB_COMPONENTS} /></ProtectedRoute>} />
      <Route path="/" element={<Navigate to="/login" />} />
      <Route path="*" element={<Navigate to="/login" />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
        <Toaster position="top-right" toastOptions={{ duration: 3000, style: { fontSize: '14px' } }} />
      </BrowserRouter>
    </AuthProvider>
  );
}
