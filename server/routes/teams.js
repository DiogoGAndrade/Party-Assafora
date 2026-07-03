const express = require('express');
const gameStore = require('../lib/gameStore');
const gameEngine = require('../lib/gameEngine');
const loadGame = require('../lib/loadGameMiddleware');

const router = express.Router({ mergeParams: true });

// Always available regardless of game phase (rule 12).
router.post('/:teamId/score-adjust', loadGame, (req, res) => {
  const { delta } = req.body || {};
  if (delta !== 1 && delta !== -1) {
    return res.status(400).json({ error: 'delta deve ser 1 ou -1' });
  }
  try {
    const team = gameEngine.adjustScore(req.game, req.params.teamId, delta);
    gameStore.saveGame(req.game);
    res.json({ team, game: req.game });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Manual, monitor-triggered only (rule 13) - never inferred from board state.
router.post('/:teamId/nova-volta', loadGame, (req, res) => {
  try {
    const team = gameEngine.novaVolta(req.game, req.params.teamId);
    gameStore.saveGame(req.game);
    res.json({
      team,
      readyToPromptReveal: gameEngine.readyToPromptReveal(req.game),
      game: req.game
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
