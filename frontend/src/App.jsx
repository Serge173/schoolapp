import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './Layout';
import Home from './pages/Home';
import Filieres from './pages/Filieres';
import Niveaux from './pages/Niveaux';
import Universites from './pages/Universites';
import UniversiteDetail from './pages/UniversiteDetail';
import Inscription from './pages/Inscription';
import Contact from './pages/Contact';
import RendezVous from './pages/RendezVous';
import DemandeOrientationFiliere from './pages/DemandeOrientationFiliere';
import CatalogueProgrammes from './pages/CatalogueProgrammes';
import CatalogueProgrammeFiche from './pages/CatalogueProgrammeFiche';
import AdminAdminRoot from './pages/admin/AdminAdminRoot';
import AdminLogin from './pages/admin/AdminLogin';
import AdminLayout from './pages/admin/AdminLayout';
import AdminOverviewPage from './pages/admin/AdminOverviewPage';
import AdminInscriptionsPage from './pages/admin/AdminInscriptionsPage';
import AdminRdvPage from './pages/admin/AdminRdvPage';
import AdminUniversitesPage from './pages/admin/AdminUniversitesPage';
import AdminFilieresPage from './pages/admin/AdminFilieresPage';

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
        <Route path="rendez-vous" element={<RendezVous />} />
        <Route path="demande-orientation" element={<DemandeOrientationFiliere />} />
        <Route path="catalogue-figs/fiche/:id" element={<CatalogueProgrammeFiche />} />
        <Route path="catalogue-figs" element={<CatalogueProgrammes />} />
      </Route>
      <Route path="/admin" element={<AdminAdminRoot />}>
        <Route index element={<AdminLogin />} />
        <Route element={<ProtectedAdmin><AdminLayout /></ProtectedAdmin>}>
          <Route path="dashboard" element={<AdminOverviewPage />} />
          <Route path="inscriptions" element={<AdminInscriptionsPage />} />
          <Route path="rendez-vous" element={<AdminRdvPage />} />
          <Route path="orientation" element={<Navigate to="/admin/inscriptions" replace />} />
          <Route path="universites" element={<AdminUniversitesPage />} />
          <Route path="filieres" element={<AdminFilieresPage />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
