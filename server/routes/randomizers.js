const express = require('express');
const loadGame = require('../lib/loadGameMiddleware');

const router = express.Router({ mergeParams: true });

router.post('/person-pick', loadGame, (req, res) => {
  const allPlayers = req.game.teams.flatMap((t) =>
    t.jogadores.map((j) => ({ ...j, equipa: t.nome, equipaId: t.id }))
  );
  if (allPlayers.length === 0) {
    return res.status(400).json({ error: 'nao ha jogadores neste jogo' });
  }
  const picked = allPlayers[Math.floor(Math.random() * allPlayers.length)];
  res.json({ picked, pool: allPlayers });
});

router.post('/time-pick', loadGame, (req, res) => {
  const cfg = req.game.randomizers.tempo || { min: 1.5, max: 12 };
  const min = req.body && typeof req.body.min === 'number' ? req.body.min : cfg.min;
  const max = req.body && typeof req.body.max === 'number' ? req.body.max : cfg.max;
  const seconds = Math.round((min + Math.random() * (max - min)) * 10) / 10;
  res.json({ seconds, min, max });
});

module.exports = router;
