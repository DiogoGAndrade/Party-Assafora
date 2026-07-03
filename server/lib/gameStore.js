const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const GAMES_DIR = path.join(__dirname, '..', '..', 'data', 'games');

const cache = new Map();

function ensureDir() {
  fs.mkdirSync(GAMES_DIR, { recursive: true });
}

function filePathFor(id) {
  return path.join(GAMES_DIR, `${id}.json`);
}

function newId() {
  return crypto.randomUUID();
}

function listGames() {
  ensureDir();
  return fs
    .readdirSync(GAMES_DIR)
    .filter((f) => f.endsWith('.json') && !f.endsWith('.bak.json'))
    .map((f) => {
      const raw = fs.readFileSync(path.join(GAMES_DIR, f), 'utf8');
      const state = JSON.parse(raw);
      return {
        id: state.id,
        nome: state.nome,
        status: state.status,
        criado_em: state.criado_em,
        atualizado_em: state.atualizado_em
      };
    })
    .sort((a, b) => (b.atualizado_em || '').localeCompare(a.atualizado_em || ''));
}

function loadGame(id) {
  if (cache.has(id)) return cache.get(id);
  const p = filePathFor(id);
  if (!fs.existsSync(p)) return null;
  const raw = fs.readFileSync(p, 'utf8');
  const state = JSON.parse(raw);
  cache.set(id, state);
  return state;
}

function saveGame(state) {
  ensureDir();
  state.atualizado_em = new Date().toISOString();
  const finalPath = filePathFor(state.id);
  const tmpPath = `${finalPath}.tmp`;
  const bakPath = path.join(GAMES_DIR, `${state.id}.bak.json`);

  if (fs.existsSync(finalPath)) {
    fs.copyFileSync(finalPath, bakPath);
  }

  fs.writeFileSync(tmpPath, JSON.stringify(state, null, 2), 'utf8');
  fs.renameSync(tmpPath, finalPath);

  cache.set(state.id, state);
  return state;
}

function deleteGame(id) {
  cache.delete(id);
  const p = filePathFor(id);
  const bak = path.join(GAMES_DIR, `${id}.bak.json`);
  if (fs.existsSync(p)) fs.unlinkSync(p);
  if (fs.existsSync(bak)) fs.unlinkSync(bak);
}

module.exports = { listGames, loadGame, saveGame, deleteGame, newId };
