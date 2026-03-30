import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './Layout';
import Home from './pages/Home';
import Filieres from './pages/Filieres';
import Niveaux from './pages/Niveaux';
import Universites from './pages/Universites';
import UniversiteDetail from './pages/UniversiteDetail';
import Inscription from './pages/Inscription';
import Contact from './pages/Contact';
import AdminLogin from './pages/admin/AdminLogin';
import AdminDashboard from './pages/admin/AdminDashboard';

function ProtectedAdmin({ children }) {
  if (!sessionStorage.getItem('adminSession')) return <Navigate to="/admin" replace />;
  return children;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="filieres" element={<Filieres />} />
        <Route path="filieres/:type" element={<Filieres />} />
        <Route path="filieres/filiere/:filiereId" element={<Niveaux />} />
        <Route path="filieres/:type/filiere/:filiereId" element={<Niveaux />} />
        <Route path="filieres/filiere/:filiereId/ecoles" element={<Universites />} />
        <Route path="filieres/:type/filiere/:filiereId/ecoles" element={<Universites />} />
        <Route path="universite/:id" element={<UniversiteDetail />} />
        <Route path="inscription" element={<Inscription />} />
        <Route path="contact" element={<Contact />} />
      </Route>
      <Route path="/admin" element={<AdminLogin />} />
      <Route
        path="/admin/dashboard"
        element={
          <ProtectedAdmin>
            <AdminDashboard />
          </ProtectedAdmin>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
