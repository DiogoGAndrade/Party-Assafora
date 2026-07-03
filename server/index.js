const express = require('express');
const path = require('path');
const os = require('os');

const gamesRouter = require('./routes/games');
const challengesRouter = require('./routes/challenges');
const teamsRouter = require('./routes/teams');
const gameflowRouter = require('./routes/gameflow');
const randomizersRouter = require('./routes/randomizers');
const quizzesRouter = require('./routes/quizzes');
const manifestRouter = require('./routes/manifest');
const audit = require('./lib/audit');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'public')));

app.use('/api/games', gamesRouter);
app.use('/api/games/:id/challenges', challengesRouter);
app.use('/api/games/:id/teams', teamsRouter);
app.use('/api/games/:id', gameflowRouter);
app.use('/api/games/:id/randomizers', randomizersRouter);
app.use('/api/games/:id/quizzes', quizzesRouter);
app.use('/api/manifest', manifestRouter);

app.listen(PORT, () => {
  console.log('');
  console.log('=========================================');
  console.log('  Feriados - servidor local a correr');
  console.log(`  Abre no browser: http://localhost:${PORT}`);
  const nets = os.networkInterfaces();
  for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
      if (net.family === 'IPv4' && !net.internal) {
        console.log(`  (na mesma rede: http://${net.address}:${PORT})`);
      }
    }
  }
  console.log('=========================================');
  console.log('');

  try {
    const report = audit.runAudit();
    console.log(audit.renderTextReport(report));
  } catch (err) {
    console.log('Nao foi possivel correr a auditoria de assets:', err.message);
  }
  console.log('');
});
