const express = require('express');
const gameStore = require('../lib/gameStore');
const quizEngine = require('../lib/quizEngine');
const loadGame = require('../lib/loadGameMiddleware');

const router = express.Router({ mergeParams: true });

function validQuizId(req, res, next) {
  if (!['celebridades', 'marcas'].includes(req.params.quizId)) {
    return res.status(400).json({ error: 'quizId deve ser celebridades ou marcas' });
  }
  next();
}

router.post('/:quizId/start', loadGame, validQuizId, (req, res) => {
  const { modo } = req.body || {};
  try {
    const quizState = quizEngine.startQuiz(req.game, req.params.quizId, { modo });
    gameStore.saveGame(req.game);
    res.json({ quizState });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.post('/:quizId/next', loadGame, validQuizId, (req, res) => {
  const result = quizEngine.nextCard(req.game, req.params.quizId);
  res.json(result);
});

router.post('/:quizId/reveal', loadGame, validQuizId, (req, res) => {
  const card = quizEngine.revealCard(req.game, req.params.quizId);
  gameStore.saveGame(req.game);
  res.json({ card, quizState: req.game.quizzes[req.params.quizId] });
});

router.post('/:quizId/pause', loadGame, validQuizId, (req, res) => {
  quizEngine.pauseQuiz(req.game, req.params.quizId);
  gameStore.saveGame(req.game);
  res.json({ quizState: req.game.quizzes[req.params.quizId] });
});

router.post('/:quizId/resume', loadGame, validQuizId, (req, res) => {
  quizEngine.resumeQuiz(req.game, req.params.quizId);
  gameStore.saveGame(req.game);
  res.json({ quizState: req.game.quizzes[req.params.quizId] });
});

router.post('/:quizId/eliminate-team', loadGame, validQuizId, (req, res) => {
  const { teamId } = req.body || {};
  if (!teamId) return res.status(400).json({ error: 'teamId obrigatorio' });
  const quizState = quizEngine.eliminateTeam(req.game, req.params.quizId, teamId);
  gameStore.saveGame(req.game);
  res.json({ quizState });
});

module.exports = router;
