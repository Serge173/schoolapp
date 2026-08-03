-- Schéma PostgreSQL (Neon) — FigsApp Côte d'Ivoire

CREATE TABLE IF NOT EXISTS admins (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  nom VARCHAR(100) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS filieres (
  id SERIAL PRIMARY KEY,
  nom VARCHAR(150) NOT NULL UNIQUE,
  slug VARCHAR(150) NOT NULL UNIQUE,
  actif SMALLINT NOT NULL DEFAULT 1,
  grand_groupe VARCHAR(100) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS sous_filieres (
  id SERIAL PRIMARY KEY,
  filiere_id INT NOT NULL REFERENCES filieres(id) ON DELETE CASCADE,
  nom VARCHAR(150) NOT NULL,
  slug VARCHAR(150) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (filiere_id, slug)
);

CREATE TABLE IF NOT EXISTS universites (
  id SERIAL PRIMARY KEY,
  nom VARCHAR(255) NOT NULL,
  type VARCHAR(20) NOT NULL CHECK (type IN ('publique', 'privee')),
  ville VARCHAR(100) NOT NULL,
  description TEXT,
  logo VARCHAR(255),
  brochure VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS universite_photos (
  id SERIAL PRIMARY KEY,
  universite_id INT NOT NULL REFERENCES universites(id) ON DELETE CASCADE,
  fichier VARCHAR(255) NOT NULL,
  ordre INT DEFAULT 0
);

CREATE TABLE IF NOT EXISTS campuses (
  id SERIAL PRIMARY KEY,
  universite_id INT NOT NULL REFERENCES universites(id) ON DELETE CASCADE,
  nom VARCHAR(200) NOT NULL,
  ville VARCHAR(120) NOT NULL,
  adresse TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  ordre INT DEFAULT 0
);

CREATE TABLE IF NOT EXISTS universite_filieres (
  universite_id INT NOT NULL REFERENCES universites(id) ON DELETE CASCADE,
  filiere_id INT NOT NULL REFERENCES filieres(id) ON DELETE CASCADE,
  offre_filiere_entiere SMALLINT NOT NULL DEFAULT 1,
  PRIMARY KEY (universite_id, filiere_id)
);

CREATE TABLE IF NOT EXISTS universite_sous_filieres (
  universite_id INT NOT NULL REFERENCES universites(id) ON DELETE CASCADE,
  sous_filiere_id INT NOT NULL REFERENCES sous_filieres(id) ON DELETE CASCADE,
  PRIMARY KEY (universite_id, sous_filiere_id)
);

CREATE TABLE IF NOT EXISTS universite_specialites_libelle (
  universite_id INT NOT NULL REFERENCES universites(id) ON DELETE CASCADE,
  filiere_id INT NOT NULL REFERENCES filieres(id) ON DELETE CASCADE,
  libelle VARCHAR(190) NOT NULL,
  PRIMARY KEY (universite_id, filiere_id, libelle)
);

CREATE TABLE IF NOT EXISTS inscriptions (
  id SERIAL PRIMARY KEY,
  nom VARCHAR(100) NOT NULL,
  prenom VARCHAR(100) NOT NULL,
  date_naissance DATE NOT NULL,
  sexe VARCHAR(1) NOT NULL CHECK (sexe IN ('M', 'F')),
  telephone VARCHAR(20) NOT NULL,
  email VARCHAR(255) NOT NULL,
  ville VARCHAR(100) NOT NULL,
  niveau_etude VARCHAR(100),
  serie_bac VARCHAR(50),
  annee_bac VARCHAR(10),
  filiere_id INT REFERENCES filieres(id),
  filiere_autre VARCHAR(150),
  universite_id INT NOT NULL REFERENCES universites(id),
  type_universite VARCHAR(20) NOT NULL CHECK (type_universite IN ('publique', 'privee')),
  pays_bureau VARCHAR(2) NOT NULL DEFAULT 'CI' CHECK (pays_bureau IN ('CI', 'BF')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS rendez_vous (
  id SERIAL PRIMARY KEY,
  nom VARCHAR(100) NOT NULL,
  prenom VARCHAR(100) NOT NULL,
  email VARCHAR(255) NOT NULL,
  telephone VARCHAR(40) NOT NULL,
  pays_bureau VARCHAR(2) NOT NULL DEFAULT 'CI' CHECK (pays_bureau IN ('CI', 'BF')),
  type_rdv VARCHAR(50) NOT NULL,
  date_souhaitee DATE NOT NULL,
  creneau VARCHAR(40) NOT NULL,
  message TEXT,
  statut VARCHAR(20) NOT NULL DEFAULT 'nouveau' CHECK (statut IN ('nouveau', 'a_confirmer', 'confirme', 'annule', 'termine')),
  notes_internes TEXT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_rdv_statut ON rendez_vous (statut);
CREATE INDEX IF NOT EXISTS idx_rdv_date_souhaitee ON rendez_vous (date_souhaitee);

CREATE TABLE IF NOT EXISTS demandes_orientation (
  id SERIAL PRIMARY KEY,
  nom VARCHAR(100) NOT NULL,
  prenom VARCHAR(100) NOT NULL,
  email VARCHAR(255) NOT NULL,
  telephone VARCHAR(40) NOT NULL,
  pays_bureau VARCHAR(2) NOT NULL DEFAULT 'CI' CHECK (pays_bureau IN ('CI', 'BF')),
  grande_filiere VARCHAR(200) NOT NULL,
  specialite VARCHAR(400) NOT NULL,
  besoin_orientation SMALLINT NOT NULL DEFAULT 1,
  message TEXT,
  statut VARCHAR(20) NOT NULL DEFAULT 'nouveau' CHECK (statut IN ('nouveau', 'validee', 'traitee', 'annulee')),
  notes_internes TEXT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_do_statut ON demandes_orientation (statut);
CREATE INDEX IF NOT EXISTS idx_do_created ON demandes_orientation (created_at);

INSERT INTO filieres (nom, slug) VALUES
  ('Médecine', 'medecine'),
  ('Informatique', 'informatique'),
  ('Droit', 'droit'),
  ('Gestion', 'gestion'),
  ('Marketing', 'marketing'),
  ('Génie civil', 'genie-civil'),
  ('Finance', 'finance'),
  ('Communication', 'communication'),
  ('Architecture', 'architecture'),
  ('Psychologie', 'psychologie')
ON CONFLICT (slug) DO NOTHING;
