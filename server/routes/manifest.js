const express = require('express');
const manifestLoader = require('../lib/manifestLoader');
const audit = require('../lib/audit');

const router = express.Router();

router.get('/', (req, res) => {
  res.json({
    heroes: manifestLoader.heroList(),
    introVideo: manifestLoader.introVideoPath(),
    rouletteDecoration: manifestLoader.rouletteDecorationPath()
  });
});

router.get('/audit', (req, res) => {
  res.json(audit.runAudit());
});

module.exports = router;
