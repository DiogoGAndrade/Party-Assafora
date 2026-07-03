const manifestLoader = require('./manifestLoader');
const gameStore = require('./gameStore');

const DEFAULT_DECLINE_PENALTY_SPACES = 2;

function emptyQuizState() {
  return {
    deck_original: [],
    deck_restante: [],
    posicao_atual: 0,
    pausado: false,
    modo: 'revelar',
    eliminados: []
  };
}

function createGame({ nome, teams, board_size, laps_to_end }) {
  const defaults = manifestLoader.loadDefaults();
  const size = board_size || defaults.board_size;
  const laps = laps_to_end || defaults.laps_to_end;
  const id = gameStore.newId();
  const now = new Date().toISOString();

  const challenges = Array.from({ length: size }, (_, i) => {
    const numero = i + 1;
    return {
      numero,
      texto: '',
      video_path: manifestLoader.challengeVideoPath(numero),
      repetivel: false,
      usado: false,
      joga_outra_vez: false,
      penalidade_recusa_casas: null,
      penalidade_recusa_texto: null
    };
  });

  const teamObjs = (teams || []).map((t) => ({
    id: gameStore.newId(),
    nome: t.nome,
    heroId: t.heroId || null,
    jogadores: (t.jogadores || []).map((nomeJogador) => ({ id: gameStore.newId(), nome: nomeJogador })),
    player_turn_pointer: 0,
    score: 0,
    laps_completed: 0
  }));

  const turnOrder = teamObjs.map((t) => t.id);

  return {
    id,
    nome,
    criado_em: now,
    atualizado_em: now,
    board_size: size,
    laps_to_end: laps,
    status: 'em_curso',
    score_hidden: true,
    winners_revealed: false,
    final_round_pending: false,
    starting_team_id: turnOrder[0] || null,
    turn_order: turnOrder,
    current_turn_index: 0,
    challenges,
    teams: teamObjs,
    randomizers: {
      tempo: (defaults.randomizers && defaults.randomizers.tempo) || { min: 1.5, max: 12 }
    },
    quizzes: {
      celebridades: emptyQuizState(),
      marcas: emptyQuizState()
    },
    log: []
  };
}

function currentTeam(state) {
  if (!state.turn_order.length) return null;
  const teamId = state.turn_order[state.current_turn_index];
  return state.teams.find((t) => t.id === teamId) || null;
}

function currentPlayer(state) {
  const team = currentTeam(state);
  if (!team || team.jogadores.length === 0) return null;
  return team.jogadores[team.player_turn_pointer % team.jogadores.length];
}

function findChallenge(state, numero) {
  return state.challenges.find((c) => c.numero === Number(numero));
}

function allChallengesUsed(state) {
  return state.challenges.every((c) => c.usado);
}

// Rule 9 option B: walks forward from `fromNumero` (inclusive) until an
// unused challenge is found, wrapping around the board once.
function nextAvailableChallenge(state, fromNumero) {
  const n = state.challenges.length;
  for (let i = 0; i < n; i++) {
    const numero = ((fromNumero - 1 + i) % n) + 1;
    const c = findChallenge(state, numero);
    if (c && !c.usado) return c;
  }
  // every challenge is used - fall back to the one requested so the
  // caller still has something to show instead of throwing mid-party.
  return findChallenge(state, fromNumero);
}

// Operator taps space `numero` on the physical board. If it's already
// single-use-consumed, auto-chain to the next free one (rule 9 option B).
function openChallenge(state, numero) {
  const requested = findChallenge(state, numero);
  if (!requested) throw new Error(`Casa ${numero} nao existe`);
  const resolved = requested.usado ? nextAvailableChallenge(state, numero) : requested;
  return { challenge: resolved, autoAdvanced: resolved.numero !== Number(numero), casaOriginal: Number(numero) };
}

// Rule 9 "extra" option: operator dismisses the currently shown challenge
// without penalty and without marking it usado/repetivel - just look at
// the next one.
function skipToNext(state, numero) {
  const n = state.challenges.length;
  const nextNumero = (Number(numero) % n) + 1;
  return nextAvailableChallenge(state, nextNumero);
}

function advanceTurn(state, { sameTeam } = {}) {
  const team = currentTeam(state);
  if (team && team.jogadores.length > 0) {
    team.player_turn_pointer = (team.player_turn_pointer + 1) % team.jogadores.length;
  }
  if (!sameTeam) {
    state.current_turn_index = (state.current_turn_index + 1) % state.turn_order.length;
  }
  checkFinalRound(state);
}

// Rule 4/6/7/9: apply the outcome of whatever challenge the team just
// performed on the real board, then hand the turn onward (rule 7: a
// "joga outra vez" challenge keeps the same team up).
function resolveOutcome(state, numero, outcome) {
  const challenge = findChallenge(state, numero);
  if (!challenge) throw new Error(`Casa ${numero} nao existe`);

  let instrucao = null;

  if (outcome === 'repetivel') {
    challenge.repetivel = true;
  } else if (outcome === 'usado') {
    challenge.usado = true;
  } else if (outcome === 'recusado') {
    // Challenge-specific decline penalty always overrides the general rule (rule 1/4).
    const casas = challenge.penalidade_recusa_casas != null
      ? challenge.penalidade_recusa_casas
      : DEFAULT_DECLINE_PENALTY_SPACES;
    instrucao = challenge.penalidade_recusa_texto
      || `Recua ${casas} casa${casas === 1 ? '' : 's'} no tabuleiro fisico.`;
  } else {
    throw new Error(`Outcome desconhecido: ${outcome}`);
  }

  const jogaOutraVez = !!challenge.joga_outra_vez;
  advanceTurn(state, { sameTeam: jogaOutraVez });

  return { challenge, instrucao, jogaOutraVez };
}

function adjustScore(state, teamId, delta) {
  const team = state.teams.find((t) => t.id === teamId);
  if (!team) throw new Error(`Equipa ${teamId} nao existe`);
  team.score += delta;
  return team;
}

// Rule 13: manual, monitor-triggered - never inferred from board state.
function novaVolta(state, teamId) {
  const team = state.teams.find((t) => t.id === teamId);
  if (!team) throw new Error(`Equipa ${teamId} nao existe`);
  team.score += 4;
  team.laps_completed += 1;
  checkFinalRound(state);
  return team;
}

// Rule 10/15: flags the end condition as soon as it's met, but the game
// keeps going in "ronda_final" limbo until the turn cycles back around.
function checkFinalRound(state) {
  if (state.final_round_pending) return;
  const anyTeamDone = state.teams.some((t) => t.laps_completed >= state.laps_to_end);
  if (anyTeamDone || allChallengesUsed(state)) {
    state.final_round_pending = true;
    state.status = 'ronda_final';
  }
}

// Rule 15: only once the turn has cycled all the way back to whichever
// team started the game should the app prompt to reveal winners.
function readyToPromptReveal(state) {
  if (!state.final_round_pending || state.winners_revealed) return false;
  const team = currentTeam(state);
  return !!team && team.id === state.starting_team_id;
}

// Rule 16: once revealed, scores stay visible permanently even if play continues.
function revealWinners(state) {
  state.winners_revealed = true;
  state.score_hidden = false;
  state.status = 'terminado';
  const ranking = [...state.teams].sort((a, b) => b.score - a.score);
  return ranking;
}

function continueWithoutRevealing(state) {
  state.status = 'em_curso';
}

module.exports = {
  createGame,
  currentTeam,
  currentPlayer,
  findChallenge,
  openChallenge,
  skipToNext,
  resolveOutcome,
  advanceTurn,
  adjustScore,
  novaVolta,
  checkFinalRound,
  readyToPromptReveal,
  revealWinners,
  continueWithoutRevealing,
  allChallengesUsed
};
