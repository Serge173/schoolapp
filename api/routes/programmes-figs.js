const express = require('express');
const { listPrograms, getProgram } = require('../../includes/figsProgrammesCatalog');

const router = express.Router();

router.get('/', (req, res) => {
  try {
    res.json(listPrograms(req.query));
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Impossible de charger le catalogue FIGS.' });
  }
});

router.get('/:id', (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) {
      return res.status(400).json({ error: 'Identifiant invalide.' });
    }
    const result = getProgram(id);
    if (!result) {
      return res.status(404).json({ error: 'Formation introuvable.' });
    }
    res.json(result);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Impossible de charger la fiche FIGS.' });
  }
});

module.exports = router;
