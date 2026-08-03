-- Bureau FIGS d’origine de la candidature (Côte d’Ivoire / Burkina Faso)
-- À exécuter une fois sur MySQL en production avant redéploiement.
ALTER TABLE inscriptions
  ADD COLUMN pays_bureau ENUM('CI', 'BF') NOT NULL DEFAULT 'CI';

CREATE INDEX idx_inscriptions_pays_bureau ON inscriptions(pays_bureau);
