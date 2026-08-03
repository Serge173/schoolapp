/**
 * Ancien fichier du tableau de bord admin. Les routes passent par AdminLayout + pages dédiées.
 * Redirection pour compatibilité HMR / imports résiduels.
 */
import { Navigate } from 'react-router-dom';

export default function AdminDashboard() {
  return <Navigate to="/admin/dashboard" replace />;
}
