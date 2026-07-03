const fs = require('fs');
const path = require('path');

const QUIZ_DATA_DIR = path.join(__dirname, '..', '..', 'data', 'quizzes');

const BANK_FILES = {
  celebridades: 'celebridades.json',
  marcas: 'marcas.json'
};

function loadBank(quizId) {
  const filename = BANK_FILES[quizId];
  if (!filename) throw new Error(`Quiz desconhecido: ${quizId}`);
  const p = path.join(QUIZ_DATA_DIR, filename);
  if (!fs.existsSync(p)) return [];
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}

function shuffle(array) {
  const a = array.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Starts (or restarts, if explicitly asked) a fresh shuffled deck. Once
// started, deck_original never changes - resume always continues from
// deck_restante/posicao_atual, never reshuffling.
function startQuiz(state, quizId, { modo } = {}) {
  const bank = loadBank(quizId);
  const ids = bank.map((item) => item.id);
  const shuffled = shuffle(ids);
  state.quizzes[quizId] = {
    deck_original: shuffled,
    deck_restante: shuffled.slice(),
    posicao_atual: 0,
    pausado: false,
    modo: modo || 'revelar',
    eliminados: []
  };
  return state.quizzes[quizId];
}

function getCurrentCard(state, quizId) {
  const quizState = state.quizzes[quizId];
  const bank = loadBank(quizId);
  const id = quizState.deck_restante[quizState.posicao_atual];
  if (id == null) return null;
  return bank.find((item) => item.id === id) || null;
}

// Advances to the next card's question only - the answer stays withheld
// until /reveal is called, so it can be shown to the room at the right moment.
function nextCard(state, quizId) {
  const quizState = state.quizzes[quizId];
  if (quizState.posicao_atual >= quizState.deck_restante.length) {
    return { done: true, card: null };
  }
  const card = getCurrentCard(state, quizId);
  return {
    done: false,
    card: card ? { id: card.id, pergunta: card.pergunta, dica: card.dica || null } : null
  };
}

function revealCard(state, quizId) {
  const card = getCurrentCard(state, quizId);
  const quizState = state.quizzes[quizId];
  quizState.posicao_atual += 1;
  return card;
}

function pauseQuiz(state, quizId) {
  state.quizzes[quizId].pausado = true;
}

// Resume never reshuffles - it just clears the pause flag so /next
// continues reading from the same posicao_atual in deck_restante.
function resumeQuiz(state, quizId) {
  state.quizzes[quizId].pausado = false;
}

function eliminateTeam(state, quizId, teamId) {
  const quizState = state.quizzes[quizId];
  if (!quizState.eliminados.includes(teamId)) {
    quizState.eliminados.push(teamId);
  }
  return quizState;
}

module.exports = {
  loadBank,
  startQuiz,
  getCurrentCard,
  nextCard,
  revealCard,
  pauseQuiz,
  resumeQuiz,
  eliminateTeam
};
