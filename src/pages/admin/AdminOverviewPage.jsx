import { Link, useOutletContext } from 'react-router-dom';

export default function AdminOverviewPage() {
  const { stats } = useOutletContext();

  return (
    <>
      <h1 style={{ marginBottom: '1.5rem' }}>Tableau de bord</h1>

      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        <div className="card">
          <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Total demandes</div>
          <div style={{ fontSize: '1.75rem', fontWeight: 700 }}>{stats?.total ?? 0}</div>
        </div>
        <div className="card">
          <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Publiques</div>
          <div style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--public)' }}>{stats?.byType?.publique ?? 0}</div>
        </div>
        <div className="card">
          <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Privées</div>
          <div style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--private)' }}>{stats?.byType?.privee ?? 0}</div>
        </div>
        <div className="card">
          <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Côte d’Ivoire (Abidjan)</div>
          <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#1c75b9' }}>{stats?.byPaysBureau?.CI ?? 0}</div>
        </div>
        <div className="card">
          <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Burkina Faso</div>
          <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#e69138' }}>{stats?.byPaysBureau?.BF ?? 0}</div>
        </div>
        <div className="card" style={{ borderLeft: '4px solid #7c3aed' }}>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>RDV — total</div>
          <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#6d28d9' }}>{stats?.rendezVous?.total ?? 0}</div>
        </div>
        <div
          className="card"
          style={{
            borderLeft: Number(stats?.rendezVous?.nouveau) > 0 ? '4px solid #dc2626' : '4px solid var(--border)',
            background: Number(stats?.rendezVous?.nouveau) > 0 ? 'rgba(220, 38, 38, 0.06)' : undefined,
          }}
        >
          <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>RDV — nouveaux</div>
          <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#dc2626' }}>{stats?.rendezVous?.nouveau ?? 0}</div>
        </div>
      </section>

      {Number(stats?.rendezVous?.nouveau) > 0 && (
        <div
          className="card"
          style={{
            marginBottom: '1.5rem',
            padding: '1rem 1.25rem',
            background: 'linear-gradient(90deg, rgba(220,38,38,0.12) 0%, rgba(255,255,255,0.9) 100%)',
            border: '1px solid rgba(220,38,38,0.35)',
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '0.75rem',
          }}
        >
          <div>
            <strong style={{ color: '#b91c1c' }}>{stats.rendezVous.nouveau} nouvelle(s) demande(s) de rendez-vous</strong>
            <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
              Un e-mail et une alerte WhatsApp ont été envoyés si configurés sur le serveur.
            </div>
          </div>
          <Link to="/admin/rendez-vous" className="btn btn-primary">
            Ouvrir « Les RDV »
          </Link>
        </div>
      )}

      <p style={{ color: 'var(--text-muted)', lineHeight: 1.5 }}>
        Utilisez le menu à gauche pour gérer les <strong>inscriptions</strong> (détail complet par candidat via « Voir »), les rendez-vous,
        les universités et les filières.
      </p>
    </>
  );
}
