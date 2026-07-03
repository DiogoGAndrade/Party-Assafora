Screens.quiz = (() => {
  let gameId = null;
  let quizId = null;
  let game = null;
  let currentCard = null; // { id, pergunta, dica } while unrevealed
  let revealedCard = null; // full card (with resposta) once revealed

  const quizNames = { celebridades: 'Quiz de celebridades', marcas: 'Quiz de marcas' };

  async function loadGame() {
    game = await api.getGame(gameId);
  }

  function quizState() {
    return game.quizzes[quizId];
  }

  async function loadCurrentCard(container) {
    const result = await api.nextQuizCard(gameId, quizId);
    revealedCard = null;
    if (result.done) {
      currentCard = null;
    } else {
      currentCard = result.card;
    }
    renderBody(container);
  }

  async function handleStart(container, modo) {
    await api.startQuiz(gameId, quizId, modo);
    await loadGame();
    await loadCurrentCard(container);
  }

  async function handleReveal(container) {
    const { card } = await api.revealQuizCard(gameId, quizId);
    revealedCard = card;
    await loadGame();
    renderBody(container);
  }

  async function handleNext(container) {
    await loadCurrentCard(container);
  }

  async function handlePause(container) {
    await api.pauseQuiz(gameId, quizId);
    await loadGame();
    renderBody(container);
  }

  async function handleResume(container) {
    await api.resumeQuiz(gameId, quizId);
    await loadGame();
    await loadCurrentCard(container);
  }

  async function handleEliminate(container, teamId) {
    await api.eliminateTeam(gameId, quizId, teamId);
    await loadGame();
    renderBody(container);
  }

  function teamsHtml() {
    const eliminados = quizState().eliminados || [];
    return `
      <div class="card stack">
        <strong>Equipas</strong>
        ${game.teams.map((t) => `
          <div class="row between">
            <span>${t.nome} ${eliminados.includes(t.id) ? '<span class="badge-status">Eliminada</span>' : ''}</span>
            ${!eliminados.includes(t.id) ? `<button class="danger eliminate-btn" data-team-id="${t.id}">Eliminar</button>` : ''}
          </div>
        `).join('')}
      </div>
    `;
  }

  function renderBody(container) {
    const qs = quizState();
    const body = container.querySelector('#quiz-body');

    if (!qs || qs.deck_original.length === 0) {
      body.innerHTML = `
        <div class="card stack">
          <p>Baralho ainda nao iniciado.</p>
          <div class="row">
            <button class="primary" id="start-revelar">Iniciar (so revelar)</button>
            <button class="ghost" id="start-escrever">Iniciar (escrever)</button>
          </div>
        </div>
      `;
      body.querySelector('#start-revelar').addEventListener('click', () => handleStart(container, 'revelar'));
      body.querySelector('#start-escrever').addEventListener('click', () => handleStart(container, 'escrever'));
      return;
    }

    const progress = `${qs.posicao_atual}/${qs.deck_restante.length}`;

    if (qs.pausado) {
      body.innerHTML = `
        <div class="card stack">
          <p>Quiz em pausa (posicao ${progress}).</p>
          <button class="primary" id="resume-btn">Retomar</button>
        </div>
        ${teamsHtml()}
      `;
      body.querySelector('#resume-btn').addEventListener('click', () => handleResume(container));
      wireEliminate(container);
      return;
    }

    if (!currentCard && !revealedCard) {
      body.innerHTML = `<div class="card"><p>Baralho esgotado (${progress}).</p></div>${teamsHtml()}`;
      wireEliminate(container);
      return;
    }

    if (revealedCard) {
      body.innerHTML = `
        <div class="card stack">
          <div class="muted">Progresso: ${progress}</div>
          <p><strong>${revealedCard.pergunta}</strong></p>
          <p style="font-size:1.3rem; color: var(--accent-2);">${revealedCard.resposta}</p>
          <div class="row">
            <button class="primary" id="next-btn">Proxima pergunta</button>
            <button class="ghost" id="pause-btn">Pausar</button>
          </div>
        </div>
        ${teamsHtml()}
      `;
      body.querySelector('#next-btn').addEventListener('click', () => handleNext(container));
      body.querySelector('#pause-btn').addEventListener('click', () => handlePause(container));
      wireEliminate(container);
      return;
    }

    body.innerHTML = `
      <div class="card stack">
        <div class="muted">Progresso: ${progress}</div>
        <p><strong>${currentCard.pergunta}</strong></p>
        ${currentCard.dica ? `<p class="muted">Pista: ${currentCard.dica}</p>` : ''}
        <div class="row">
          <button class="primary" id="reveal-btn">Revelar</button>
          <button class="ghost" id="pause-btn">Pausar</button>
        </div>
      </div>
      ${teamsHtml()}
    `;
    body.querySelector('#reveal-btn').addEventListener('click', () => handleReveal(container));
    body.querySelector('#pause-btn').addEventListener('click', () => handlePause(container));
    wireEliminate(container);
  }

  function wireEliminate(container) {
    container.querySelectorAll('.eliminate-btn').forEach((btn) => {
      btn.addEventListener('click', () => handleEliminate(container, btn.dataset.teamId));
    });
  }

  async function render(container, params) {
    gameId = params.gameId;
    quizId = params.quizId;
    await loadGame();

    container.innerHTML = `
      <div class="screen">
        <div class="row between">
          <h1>${quizNames[quizId] || quizId}</h1>
          <button class="ghost" id="back-to-board">&larr; Voltar ao tabuleiro</button>
        </div>
        <div id="quiz-body"></div>
      </div>
    `;
    container.querySelector('#back-to-board').addEventListener('click', () => navigate(`#/board/${gameId}`));

    if (quizState().deck_original.length > 0 && !quizState().pausado) {
      await loadCurrentCard(container);
    } else {
      renderBody(container);
    }
  }

  function destroy() {
    currentCard = null;
    revealedCard = null;
  }

  return { render, destroy };
})();
