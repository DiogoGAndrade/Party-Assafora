Screens.newGame = (() => {
  let teamRows = [];
  let heroes = [];
  let heroAssignments = {};

  function playerRowHtml(playerIndex, value = '') {
    return `
      <div class="player-row" data-player-index="${playerIndex}">
        <input type="text" class="player-name" placeholder="Nome do jogador" value="${value}" />
        <button class="ghost remove-player-btn" data-player="${playerIndex}">x</button>
      </div>
    `;
  }

  function teamCardHtml(teamIndex, team) {
    const hero = heroAssignments[teamIndex];
    return `
      <div class="card team-form-card" data-team-index="${teamIndex}">
        <div class="row between">
          <input type="text" class="team-name" placeholder="Nome da equipa" value="${team.nome || ''}" />
          <button class="danger remove-team-btn">Remover equipa</button>
        </div>
        <div class="players-list stack" style="margin-top:0.6rem;">
          ${team.jogadores.map((p, i) => playerRowHtml(i, p)).join('')}
        </div>
        <button class="ghost add-player-btn" style="margin-top:0.4rem;">+ Jogador</button>
        <div class="row" style="margin-top:0.6rem; align-items:center;">
          <button class="accent3 sortear-heroi-btn">Sortear heroi</button>
          <span class="muted">
            ${hero ? `<img class="hero-avatar" src="${hero.imagem}" alt="${hero.nome}" /> ${hero.nome}` : 'por sortear'}
          </span>
        </div>
      </div>
    `;
  }

  function renderTeams(container) {
    const list = container.querySelector('#teams-list');
    list.innerHTML = teamRows.map((t, i) => teamCardHtml(i, t)).join('');
    wireTeamEvents(container);
  }

  function wireTeamEvents(container) {
    container.querySelectorAll('.team-form-card').forEach((card) => {
      const teamIndex = Number(card.dataset.teamIndex);

      card.querySelector('.team-name').addEventListener('input', (e) => {
        teamRows[teamIndex].nome = e.target.value;
      });

      card.querySelectorAll('.player-row').forEach((row) => {
        const playerIndex = Number(row.dataset.playerIndex);
        row.querySelector('.player-name').addEventListener('input', (e) => {
          teamRows[teamIndex].jogadores[playerIndex] = e.target.value;
        });
        row.querySelector('.remove-player-btn').addEventListener('click', () => {
          if (teamRows[teamIndex].jogadores.length <= 1) return;
          teamRows[teamIndex].jogadores.splice(playerIndex, 1);
          renderTeams(container);
        });
      });

      card.querySelector('.add-player-btn').addEventListener('click', () => {
        teamRows[teamIndex].jogadores.push('');
        renderTeams(container);
      });

      card.querySelector('.remove-team-btn').addEventListener('click', () => {
        if (teamRows.length <= 1) return;
        teamRows.splice(teamIndex, 1);
        heroAssignments = {};
        renderTeams(container);
      });

      card.querySelector('.sortear-heroi-btn').addEventListener('click', () => {
        openRouletteFor(container, teamIndex);
      });
    });
  }

  function openRouletteFor(container, teamIndex) {
    const modalBackdrop = document.createElement('div');
    modalBackdrop.className = 'modal-backdrop';
    modalBackdrop.innerHTML = `
      <div class="modal-content">
        <h3>Sortear heroi para "${teamRows[teamIndex].nome || 'Equipa ' + (teamIndex + 1)}"</h3>
        <div id="roulette-mount"></div>
        <div class="row" style="justify-content:center; margin-top:1rem;">
          <button class="ghost" id="roulette-close">Fechar</button>
        </div>
      </div>
    `;
    document.body.appendChild(modalBackdrop);
    const mount = modalBackdrop.querySelector('#roulette-mount');

    if (heroes.length === 0) {
      mount.innerHTML = '<p class="muted">Nenhum heroi encontrado no manifesto de assets.</p>';
    } else {
      Roulette.render(mount, heroes, (hero) => {
        heroAssignments[teamIndex] = hero;
        renderTeams(container);
      });
    }

    modalBackdrop.querySelector('#roulette-close').addEventListener('click', () => {
      modalBackdrop.remove();
    });
  }

  async function handleSubmit(container) {
    const nome = container.querySelector('#game-name').value.trim();
    const boardSize = Number(container.querySelector('#board-size').value) || 48;
    const lapsToEnd = Number(container.querySelector('#laps-to-end').value) || 6;

    if (!nome) return alert('Da um nome ao jogo.');
    for (const t of teamRows) {
      if (!t.nome.trim()) return alert('Todas as equipas precisam de nome.');
      if (t.jogadores.some((p) => !p.trim())) return alert('Todos os jogadores precisam de nome.');
    }

    const teams = teamRows.map((t, i) => ({
      nome: t.nome.trim(),
      jogadores: t.jogadores.map((p) => p.trim()),
      heroId: heroAssignments[i] ? heroAssignments[i].id : null
    }));

    const game = await api.createGame({ nome, teams, board_size: boardSize, laps_to_end: lapsToEnd });
    navigate(`#/board/${game.id}`);
  }

  async function render(container) {
    teamRows = [{ nome: '', jogadores: [''] }];
    heroAssignments = {};

    try {
      const manifest = await api.getManifest();
      heroes = manifest.heroes;
    } catch {
      heroes = [];
    }

    container.innerHTML = `
      <div class="screen">
        <h1>Novo jogo</h1>
        <div class="card stack">
          <label>Nome do jogo <input type="text" id="game-name" placeholder="ex: Festa de Verao 2026" /></label>
          <div class="row">
            <label>Casas do tabuleiro <input type="number" id="board-size" value="48" style="width:5rem;" /></label>
            <label>Voltas para terminar <input type="number" id="laps-to-end" value="6" style="width:4rem;" /></label>
          </div>
        </div>

        <h2>Equipas</h2>
        <div id="teams-list"></div>
        <div class="row" style="margin-bottom:1rem;">
          <button class="ghost" id="add-team-btn">+ Equipa</button>
        </div>

        <div class="row">
          <button class="primary" id="create-game-btn">Criar jogo</button>
          <button class="ghost" id="cancel-btn">Cancelar</button>
        </div>
      </div>
    `;

    renderTeams(container);

    container.querySelector('#add-team-btn').addEventListener('click', () => {
      teamRows.push({ nome: '', jogadores: [''] });
      renderTeams(container);
    });
    container.querySelector('#create-game-btn').addEventListener('click', () => handleSubmit(container));
    container.querySelector('#cancel-btn').addEventListener('click', () => navigate('#/saved-games'));
  }

  function destroy() {}

  return { render, destroy };
})();
