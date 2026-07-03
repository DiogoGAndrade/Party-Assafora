const express = require('express');
const gameStore = require('../lib/gameStore');
const gameEngine = require('../lib/gameEngine');
const loadGame = require('../lib/loadGameMiddleware');

const router = express.Router({ mergeParams: true });

// Rule 15: only meaningful once readyToPromptReveal is true, but we don't
// hard-block the call - the client gates the button, this just executes it.
router.post('/reveal-winners', loadGame, (req, res) => {
  const ranking = gameEngine.revealWinners(req.game);
  gameStore.saveGame(req.game);
  res.json({ ranking, game: req.game });
});

router.post('/continue-without-revealing', loadGame, (req, res) => {
  gameEngine.continueWithoutRevealing(req.game);
  gameStore.saveGame(req.game);
  res.json({ game: req.game });
});

module.exports = router;
