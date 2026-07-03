const gameStore = require('./gameStore');

// Attaches req.game (loaded from disk/cache) or responds 404. Route
// handlers mutate req.game in place, then call saveGame themselves so the
// write happens exactly once, after the handler has fully computed the
// new state.
function loadGame(req, res, next) {
  const state = gameStore.loadGame(req.params.id);
  if (!state) {
    return res.status(404).json({ error: `Jogo ${req.params.id} nao encontrado` });
  }
  req.game = state;
  next();
}

module.exports = loadGame;
