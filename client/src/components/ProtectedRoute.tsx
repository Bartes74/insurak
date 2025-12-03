import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface Props {
  children: React.ReactElement;
  requireAdmin?: boolean;
  requireWrite?: boolean;
}

export default function ProtectedRoute({ children, requireAdmin, requireWrite }: Props) {
  const { user, loading } = useAuth();

  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  if (requireAdmin && user.role !== 'ADMIN') return <Navigate to="/" replace />;
  if (requireWrite && !(user.role === 'ADMIN' || user.canEdit)) return <Navigate to="/" replace />;
  return children;
}
