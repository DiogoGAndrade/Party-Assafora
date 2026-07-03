Screens.newGame = (() => {
  let teamRows = [];
  let heroes = [];
  let heroAssignments = {}; // manual mode: teamIndex -> hero (single, via "Sortear heroi")
  let pairHeroesByTeam = {}; // fixed-10 mode: teamIndex -> [heroA, heroB] (display only)
  let mode = 'manual'; // 'manual' | 'fixo10'

  function shuffle(array) {
    const a = array.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function playerRowHtml(playerIndex, value = '') {
    return `
      <div class="player-row" data-player-index="${playerIndex}">
        <input type="text" class="player-name" placeholder="Nome do jogador" value="${value}" />
        <button class="ghost remove-player-btn" data-player="${playerIndex}">x</button>
      </div>
    `;
  }

  function heroBadgeHtml(teamIndex, team) {
    if (mode === 'fixo10') {
      const pair = pairHeroesByTeam[teamIndex];
      if (!pair) return '<span class="muted">por sortear</span>';
      return pair.map((h) => `<img class="hero-avatar" src="${h.imagem}" alt="${h.nome}" title="${h.nome}" />`).join('') +
        ` ${pair[0].nome} & ${pair[1].nome}`;
    }
    const hero = heroAssignments[teamIndex];
    return hero
      ? `<img class="hero-avatar" src="${hero.imagem}" alt="${hero.nome}" /> ${hero.nome}`
      : '<span class="muted">por sortear</span>';
  }

  function teamCardHtml(teamIndex, team) {
    return `
      <div class="card team-form-card" data-team-index="${teamIndex}">
        <div class="row between">
          <input type="text" class="team-name" placeholder="Nome da equipa" value="${team.nome || ''}" />
          ${mode === 'manual' ? '<button class="danger remove-team-btn">Remover equipa</button>' : ''}
        </div>
        <div class="players-list stack" style="margin-top:0.6rem;">
          ${team.jogadores.map((p, i) => playerRowHtml(i, p)).join('')}
        </div>
        <button class="ghost add-player-btn" style="margin-top:0.4rem;">+ Jogador</button>
        <div class="row" style="margin-top:0.6rem; align-items:center;">
          ${mode === 'manual' ? '<button class="accent3 sortear-heroi-btn">Sortear heroi</button>' : ''}
          <span class="muted">${heroBadgeHtml(teamIndex, team)}</span>
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

      const removeTeamBtn = card.querySelector('.remove-team-btn');
      if (removeTeamBtn) {
        removeTeamBtn.addEventListener('click', () => {
          if (teamRows.length <= 1) return;
          teamRows.splice(teamIndex, 1);
          heroAssignments = {};
          renderTeams(container);
        });
      }

      const sortearBtn = card.querySelector('.sortear-heroi-btn');
      if (sortearBtn) {
        sortearBtn.addEventListener('click', () => openRouletteFor(container, teamIndex));
      }
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

  // Draws one hero at random from `pool` (already unique - no repeats
  // possible since each drawn hero is removed from the pool before the
  // next draw), animates the reveal on `stepMount`, and resolves with
  // the drawn hero once the operator has seen the result.
  function drawOneHero(stepMount, pool, label) {
    return new Promise((resolve) => {
      stepMount.innerHTML = `
        <p><strong>${label}</strong></p>
        <div id="wheel-mount"></div>
        <div class="row" style="justify-content:center; margin-top:0.8rem;">
          <button class="primary" id="draw-btn">Sortear</button>
        </div>
      `;
      const wheelMount = stepMount.querySelector('#wheel-mount');
      const wheel = Roulette.createWheel(wheelMount, pool);
      stepMount.querySelector('#draw-btn').addEventListener('click', (e) => {
        e.target.disabled = true;
        const winnerIndex = Math.floor(Math.random() * pool.length);
        wheel.spin(winnerIndex, (hero) => {
          const continueBtn = document.createElement('button');
          continueBtn.className = 'accent2';
          continueBtn.textContent = 'Continuar';
          continueBtn.style.marginLeft = '0.5rem';
          stepMount.querySelector('.row').appendChild(continueBtn);
          continueBtn.addEventListener('click', () => resolve(hero), { once: true });
        });
      });
    });
  }

  // Rule (this feature): shuffles the 10 fixed heroes and forms 5 pairs
  // BY CONSTRUCTION - each hero is drawn from a shrinking pool and removed
  // immediately, so no hero can ever be drawn twice across teams.
  async function runFixedDraw(container) {
    if (heroes.length !== 10) {
      alert(`Este modo precisa de exatamente 10 herois no manifesto (encontrados: ${heroes.length}).`);
      return;
    }

    const modalBackdrop = document.createElement('div');
    modalBackdrop.className = 'modal-backdrop';
    modalBackdrop.innerHTML = `
      <div class="modal-content">
        <h3>Sorteio de equipas (10 herois fixos)</h3>
        <div id="draw-step"></div>
      </div>
    `;
    document.body.appendChild(modalBackdrop);
    const stepMount = modalBackdrop.querySelector('#draw-step');

    let pool = shuffle(heroes);
    const drawnPairs = [];

    for (let pairIndex = 0; pairIndex < 5; pairIndex++) {
      const heroA = await drawOneHero(stepMount, pool, `Equipa ${pairIndex + 1} - primeiro heroi`);
      pool = pool.filter((h) => h.id !== heroA.id);
      const heroB = await drawOneHero(stepMount, pool, `Equipa ${pairIndex + 1} - segundo heroi`);
      pool = pool.filter((h) => h.id !== heroB.id);
      drawnPairs.push([heroA, heroB]);
    }

    modalBackdrop.remove();

    teamRows = drawnPairs.map(([a, b]) => ({
      nome: `${a.nome} & ${b.nome}`,
      jogadores: [a.nome, b.nome]
    }));
    pairHeroesByTeam = {};
    drawnPairs.forEach((pair, i) => { pairHeroesByTeam[i] = pair; });

    renderTeams(container);
  }

  function renderModeToggle(container) {
    const el = container.querySelector('#mode-toggle');
    el.innerHTML = `
      <button class="${mode === 'manual' ? 'primary' : 'ghost'}" id="mode-manual">Manual</button>
      <button class="${mode === 'fixo10' ? 'primary' : 'ghost'}" id="mode-fixo10">Sorteio de Equipas (10 Herois fixos)</button>
      ${mode === 'fixo10' ? '<button class="accent3" id="run-fixed-draw">Sortear equipas</button>' : ''}
    `;
    el.querySelector('#mode-manual').addEventListener('click', () => {
      mode = 'manual';
      teamRows = [{ nome: '', jogadores: [''] }];
      pairHeroesByTeam = {};
      renderModeToggle(container);
      renderAddTeamRow(container);
      renderTeams(container);
    });
    el.querySelector('#mode-fixo10').addEventListener('click', () => {
      mode = 'fixo10';
      teamRows = [];
      heroAssignments = {};
      pairHeroesByTeam = {};
      renderModeToggle(container);
      renderAddTeamRow(container);
      renderTeams(container);
    });
    const runBtn = el.querySelector('#run-fixed-draw');
    if (runBtn) {
      runBtn.textContent = teamRows.length > 0 ? 'Sortear novamente' : 'Sortear equipas';
      runBtn.addEventListener('click', async () => {
        await runFixedDraw(container);
        renderModeToggle(container); // refresh "Sortear novamente" label
      });
    }
  }

  function renderAddTeamRow(container) {
    const row = container.querySelector('#manual-add-team-row');
    row.innerHTML = mode === 'manual' ? '<button class="ghost" id="add-team-btn">+ Equipa</button>' : '';
    const btn = row.querySelector('#add-team-btn');
    if (btn) {
      btn.addEventListener('click', () => {
        teamRows.push({ nome: '', jogadores: [''] });
        renderTeams(container);
      });
    }
  }

  async function handleSubmit(container) {
    const nome = container.querySelector('#game-name').value.trim();
    const boardSize = Number(container.querySelector('#board-size').value) || 48;
    const lapsToEnd = Number(container.querySelector('#laps-to-end').value) || 6;

    if (!nome) return alert('Da um nome ao jogo.');
    if (teamRows.length === 0) return alert('Cria pelo menos uma equipa.');
    for (const t of teamRows) {
      if (!t.nome.trim()) return alert('Todas as equipas precisam de nome.');
      if (t.jogadores.some((p) => !p.trim())) return alert('Todos os jogadores precisam de nome.');
    }

    const teams = teamRows.map((t, i) => {
      const pair = pairHeroesByTeam[i];
      const singleHero = heroAssignments[i];
      return {
        nome: t.nome.trim(),
        jogadores: t.jogadores.map((p) => p.trim()),
        heroId: pair ? pair[0].id : (singleHero ? singleHero.id : null)
      };
    });

    const game = await api.createGame({ nome, teams, board_size: boardSize, laps_to_end: lapsToEnd });
    navigate(`#/board/${game.id}`);
  }

  async function render(container) {
    mode = 'manual';
    teamRows = [{ nome: '', jogadores: [''] }];
    heroAssignments = {};
    pairHeroesByTeam = {};

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
        <div class="row" id="mode-toggle" style="margin-bottom:1rem;"></div>
        <div id="teams-list"></div>
        <div class="row" id="manual-add-team-row" style="margin-bottom:1rem;"></div>

        <div class="row">
          <button class="primary" id="create-game-btn">Criar jogo</button>
          <button class="ghost" id="cancel-btn">Cancelar</button>
        </div>
      </div>
    `;

    renderModeToggle(container);
    renderAddTeamRow(container);
    renderTeams(container);

    container.querySelector('#create-game-btn').addEventListener('click', () => handleSubmit(container));
    container.querySelector('#cancel-btn').addEventListener('click', () => navigate('#/saved-games'));
  }

  function destroy() {}

  return { render, destroy };
})();
