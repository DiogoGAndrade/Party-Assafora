const express = require('express');
const gameStore = require('../lib/gameStore');
const gameEngine = require('../lib/gameEngine');
const loadGame = require('../lib/loadGameMiddleware');

const router = express.Router({ mergeParams: true });

// Operator taps the space number the team physically landed on.
router.post('/:numero/open', loadGame, (req, res) => {
  try {
    const result = gameEngine.openChallenge(req.game, req.params.numero);
    res.json({
      ...result,
      currentTeam: gameEngine.currentTeam(req.game),
      currentPlayer: gameEngine.currentPlayer(req.game)
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Rule 9 "extra": dismiss the currently shown challenge, no penalty, no marking.
router.post('/:numero/skip', loadGame, (req, res) => {
  try {
    const challenge = gameEngine.skipToNext(req.game, req.params.numero);
    res.json({ challenge });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// outcome: "repetivel" | "usado" | "recusado"
router.post('/:numero/outcome', loadGame, (req, res) => {
  const { outcome } = req.body || {};
  if (!['repetivel', 'usado', 'recusado'].includes(outcome)) {
    return res.status(400).json({ error: 'outcome deve ser repetivel, usado ou recusado' });
  }
  try {
    const result = gameEngine.resolveOutcome(req.game, req.params.numero, outcome);
    gameStore.saveGame(req.game);
    res.json({
      ...result,
      readyToPromptReveal: gameEngine.readyToPromptReveal(req.game),
      game: req.game
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
