Screens.savedGames = (() => {
  function statusLabel(status) {
    if (status === 'em_curso') return 'Em curso';
    if (status === 'ronda_final') return 'Ronda final';
    if (status === 'terminado') return 'Terminado';
    return status;
  }

  async function renderList(container) {
    const games = await api.listGames();
    const list = container.querySelector('#games-list');
    if (games.length === 0) {
      list.innerHTML = '<p class="muted">Ainda nao ha jogos guardados.</p>';
      return;
    }
    list.innerHTML = games.map((g) => `
      <div class="card game-list-item" data-id="${g.id}">
        <div>
          <strong>${g.nome}</strong>
          <span class="badge-status">${statusLabel(g.status)}</span>
          <div class="muted">Atualizado: ${new Date(g.atualizado_em).toLocaleString('pt-PT')}</div>
        </div>
        <div class="row">
          <button class="primary resume-btn">Retomar</button>
          <button class="danger delete-btn">Apagar</button>
        </div>
      </div>
    `).join('');

    list.querySelectorAll('.resume-btn').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const id = e.target.closest('[data-id]').dataset.id;
        navigate(`#/board/${id}`);
      });
    });
    list.querySelectorAll('.delete-btn').forEach((btn) => {
      btn.addEventListener('click', async (e) => {
        const id = e.target.closest('[data-id]').dataset.id;
        if (confirm('Apagar este jogo permanentemente?')) {
          await api.deleteGame(id);
          renderList(container);
        }
      });
    });
  }

  function render(container) {
    container.innerHTML = `
      <div class="screen">
        <div class="row between">
          <h1>Jogos guardados</h1>
          <button class="primary" id="new-game-btn">+ Novo jogo</button>
        </div>
        <div id="games-list"></div>
      </div>
    `;
    document.getElementById('new-game-btn').addEventListener('click', () => navigate('#/new-game'));
    renderList(container);
  }

  function destroy() {}

  return { render, destroy };
})();
