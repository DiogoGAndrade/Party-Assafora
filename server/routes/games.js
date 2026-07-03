const express = require('express');
const gameStore = require('../lib/gameStore');
const gameEngine = require('../lib/gameEngine');
const loadGame = require('../lib/loadGameMiddleware');

const router = express.Router();

router.get('/', (req, res) => {
  res.json(gameStore.listGames());
});

router.post('/', (req, res) => {
  const { nome, teams, board_size, laps_to_end } = req.body || {};
  if (!nome || !Array.isArray(teams) || teams.length === 0) {
    return res.status(400).json({ error: 'nome e pelo menos uma equipa (teams) sao obrigatorios' });
  }
  for (const t of teams) {
    if (!t.nome || !Array.isArray(t.jogadores) || t.jogadores.length === 0) {
      return res.status(400).json({ error: 'cada equipa precisa de nome e pelo menos um jogador' });
    }
  }
  const state = gameEngine.createGame({ nome, teams, board_size, laps_to_end });
  gameStore.saveGame(state);
  res.status(201).json(state);
});

router.get('/:id', loadGame, (req, res) => {
  res.json(req.game);
});

router.delete('/:id', (req, res) => {
  gameStore.deleteGame(req.params.id);
  res.status(204).end();
});

module.exports = router;
