import { Link, useOutletContext } from 'react-router-dom';

export default function AdminOverviewPage() {
  const { stats } = useOutletContext();
  const rdvNouveau = Number(stats?.rendezVous?.nouveau) > 0;

  return (
    <>
      <h1 className="admin-shell__page-title">Tableau de bord</h1>

      <section className="admin-dash-stats">
        <div className="admin-stat-card">
          <div className="admin-stat-card__label">
            <span className="admin-stat-card__label-short">Total</span>
            <span className="admin-stat-card__label-full">Total demandes</span>
          </div>
          <div className="admin-stat-card__value">{stats?.total ?? 0}</div>
        </div>
        <div className="admin-stat-card admin-stat-card--public">
          <div className="admin-stat-card__label">
            <span className="admin-stat-card__label-short">Pub.</span>
            <span className="admin-stat-card__label-full">Publiques</span>
          </div>
          <div className="admin-stat-card__value">{stats?.byType?.publique ?? 0}</div>
        </div>
        <div className="admin-stat-card admin-stat-card--private">
          <div className="admin-stat-card__label">
            <span className="admin-stat-card__label-short">Priv.</span>
            <span className="admin-stat-card__label-full">Privées</span>
          </div>
          <div className="admin-stat-card__value">{stats?.byType?.privee ?? 0}</div>
        </div>
        <div className="admin-stat-card admin-stat-card--ci">
          <div className="admin-stat-card__label">
            <span className="admin-stat-card__label-short">CI</span>
            <span className="admin-stat-card__label-full">Côte d’Ivoire (Abidjan)</span>
          </div>
          <div className="admin-stat-card__value">{stats?.byPaysBureau?.CI ?? 0}</div>
        </div>
        <div className="admin-stat-card admin-stat-card--bf">
          <div className="admin-stat-card__label">
            <span className="admin-stat-card__label-short">BF</span>
            <span className="admin-stat-card__label-full">Burkina Faso</span>
          </div>
          <div className="admin-stat-card__value">{stats?.byPaysBureau?.BF ?? 0}</div>
        </div>
        <div className="admin-stat-card admin-stat-card--purple">
          <div className="admin-stat-card__label">
            <span className="admin-stat-card__label-short">RDV</span>
            <span className="admin-stat-card__label-full">RDV — total</span>
          </div>
          <div className="admin-stat-card__value">{stats?.rendezVous?.total ?? 0}</div>
        </div>
        <div className={`admin-stat-card admin-stat-card--purple${rdvNouveau ? ' admin-stat-card--alert' : ''}`}>
          <div className="admin-stat-card__label">
            <span className="admin-stat-card__label-short">Nouv.</span>
            <span className="admin-stat-card__label-full">RDV — nouveaux</span>
          </div>
          <div className="admin-stat-card__value">{stats?.rendezVous?.nouveau ?? 0}</div>
        </div>
      </section>

      {rdvNouveau && (
        <div className="admin-alert-banner card admin-shell__panel">
          <div>
            <div className="admin-alert-banner__title">
              {stats.rendezVous.nouveau} nouvelle(s) demande(s) de rendez-vous
            </div>
            <div className="admin-alert-banner__desc">
              L&apos;équipe a été notifiée par e-mail et WhatsApp.
            </div>
          </div>
          <Link to="/admin/rendez-vous" className="btn btn-primary">
            Ouvrir « Les RDV »
          </Link>
        </div>
      )}

      <p className="admin-shell__page-desc" style={{ marginBottom: 0 }}>
        Utilisez le menu pour gérer les <strong>inscriptions</strong>, les rendez-vous, les universités et les filières.
      </p>
    </>
  );
}
