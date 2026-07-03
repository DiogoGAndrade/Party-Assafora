// Thin fetch() wrapper - one function per API call. The server is the
// single source of truth; every screen re-renders from the response body
// it gets back rather than caching its own copy of game state.
const api = (() => {
  async function req(method, url, body) {
    const res = await fetch(url, {
      method,
      headers: body ? { 'Content-Type': 'application/json' } : undefined,
      body: body ? JSON.stringify(body) : undefined
    });
    const data = await res.json().catch(() => null);
    if (!res.ok) {
      throw new Error((data && data.error) || `Erro ${res.status}`);
    }
    return data;
  }

  return {
    listGames: () => req('GET', '/api/games'),
    createGame: (payload) => req('POST', '/api/games', payload),
    getGame: (id) => req('GET', `/api/games/${id}`),
    deleteGame: (id) => req('DELETE', `/api/games/${id}`),

    openChallenge: (gameId, numero) => req('POST', `/api/games/${gameId}/challenges/${numero}/open`),
    skipChallenge: (gameId, numero) => req('POST', `/api/games/${gameId}/challenges/${numero}/skip`),
    resolveOutcome: (gameId, numero, outcome) =>
      req('POST', `/api/games/${gameId}/challenges/${numero}/outcome`, { outcome }),

    adjustScore: (gameId, teamId, delta) =>
      req('POST', `/api/games/${gameId}/teams/${teamId}/score-adjust`, { delta }),
    novaVolta: (gameId, teamId) => req('POST', `/api/games/${gameId}/teams/${teamId}/nova-volta`),

    revealWinners: (gameId) => req('POST', `/api/games/${gameId}/reveal-winners`),
    continueWithoutRevealing: (gameId) => req('POST', `/api/games/${gameId}/continue-without-revealing`),

    personPick: (gameId) => req('POST', `/api/games/${gameId}/randomizers/person-pick`),
    timePick: (gameId, min, max) => req('POST', `/api/games/${gameId}/randomizers/time-pick`, { min, max }),

    startQuiz: (gameId, quizId, modo) => req('POST', `/api/games/${gameId}/quizzes/${quizId}/start`, { modo }),
    nextQuizCard: (gameId, quizId) => req('POST', `/api/games/${gameId}/quizzes/${quizId}/next`),
    revealQuizCard: (gameId, quizId) => req('POST', `/api/games/${gameId}/quizzes/${quizId}/reveal`),
    pauseQuiz: (gameId, quizId) => req('POST', `/api/games/${gameId}/quizzes/${quizId}/pause`),
    resumeQuiz: (gameId, quizId) => req('POST', `/api/games/${gameId}/quizzes/${quizId}/resume`),
    eliminateTeam: (gameId, quizId, teamId) =>
      req('POST', `/api/games/${gameId}/quizzes/${quizId}/eliminate-team`, { teamId }),

    getManifest: () => req('GET', '/api/manifest'),
    getAudit: () => req('GET', '/api/manifest/audit')
  };
})();
