Screens.endgame = (() => {
  async function render(container, params) {
    const gameId = params.gameId;
    let game = await api.getGame(gameId);
    let ranking;

    if (!game.winners_revealed) {
      const result = await api.revealWinners(gameId);
      ranking = result.ranking;
      game = result.game;
    } else {
      ranking = [...game.teams].sort((a, b) => b.score - a.score);
    }

    let decoration = '';
    try {
      const manifest = await api.getManifest();
      decoration = manifest.rouletteDecoration;
    } catch {
      decoration = '';
    }

    container.innerHTML = `
      <div class="center-screen">
        ${decoration ? `<img src="${decoration}" alt="" style="max-width:220px; border-radius:50%; margin-bottom:1rem;" />` : ''}
        <h1>Vencedores - ${game.nome}</h1>
        <div class="card">
          ${ranking.map((t, i) => `
            <div class="scoreboard-row">
              <span>${i + 1}. ${t.nome}</span>
              <span>${t.score} pts</span>
            </div>
          `).join('')}
        </div>
        <p class="muted">O jogo pode continuar - a partir de agora a pontuacao fica sempre visivel.</p>
        <button class="primary" id="back-to-board">Voltar ao tabuleiro</button>
      </div>
    `;
    container.querySelector('#back-to-board').addEventListener('click', () => navigate(`#/board/${gameId}`));
  }

  function destroy() {}

  return { render, destroy };
})();
