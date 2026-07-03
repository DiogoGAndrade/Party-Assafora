Screens.board = (() => {
  let game = null;
  let heroesById = {};

  function heroFor(heroId) {
    return heroesById[heroId] || null;
  }

  function teamBadgeHtml(team, isCurrent) {
    const hero = heroFor(team.heroId);
    const scoreHtml = game.score_hidden
      ? `<span class="score hidden-score">${team.score}</span>`
      : `<span class="score">${team.score}</span>`;
    return `
      <div class="team-badge ${isCurrent ? 'is-current' : ''}" data-team-id="${team.id}">
        <div>
          ${hero ? `<img class="hero-avatar" src="${hero.imagem}" alt="${hero.nome}" />` : ''}
          <strong>${team.nome}</strong>
        </div>
        ${scoreHtml}
        <div class="muted">${team.laps_completed} volta(s)</div>
        <div class="team-buttons">
          <button class="ghost score-btn" data-delta="-1">-1</button>
          <button class="ghost score-btn" data-delta="1">+1</button>
          <button class="accent2 nova-volta-btn">Nova Volta</button>
        </div>
      </div>
    `;
  }

  function currentTurnHtml() {
    const teamId = game.turn_order[game.current_turn_index];
    const team = game.teams.find((t) => t.id === teamId);
    if (!team) return '';
    const player = team.jogadores[team.player_turn_pointer % team.jogadores.length];
    return `<div class="card">A vez de: <strong>${team.nome}</strong> - joga <strong>${player ? player.nome : '-'}</strong></div>`;
  }

  function tileHtml(challenge) {
    const classes = ['tile'];
    if (challenge.usado) classes.push('usado');
    if (challenge.repetivel) classes.push('repetivel');
    if (challenge.joga_outra_vez) classes.push('joga-outra-vez');
    return `<button class="${classes.join(' ')}" data-numero="${challenge.numero}">${challenge.numero}</button>`;
  }

  function renderAll(container) {
    container.innerHTML = `
      <div class="screen">
        <div class="row between">
          <h1>${game.nome}</h1>
          <button class="ghost" id="back-btn">&larr; Jogos guardados</button>
        </div>

        <div class="board-header">
          <div class="teams-strip" id="teams-strip"></div>
          <div>
            ${currentTurnHtml()}
            ${game.status === 'ronda_final' ? '<div class="card" style="border-color: var(--accent-2);">Ronda final em curso.</div>' : ''}
          </div>
        </div>

        <div class="board-grid" id="board-grid"></div>
      </div>

      <button class="primary drawer-toggle" id="open-randomizers">Jogos / Randomizadores</button>
    `;

    const teamsStrip = container.querySelector('#teams-strip');
    const currentTeamId = game.turn_order[game.current_turn_index];
    teamsStrip.innerHTML = game.teams
      .map((t) => teamBadgeHtml(t, t.id === currentTeamId))
      .join('');

    const grid = container.querySelector('#board-grid');
    grid.innerHTML = game.challenges.map(tileHtml).join('');

    wireEvents(container);
  }

  async function refresh(container) {
    game = await api.getGame(game.id);
    renderAll(container);
  }

  async function promptRevealIfReady(container, readyToPromptReveal) {
    if (!readyToPromptReveal) return;
    const wantsReveal = confirm(
      'Jogo terminado (condicao de fim atingida e a vez voltou a equipa que comecou).\n\n' +
      'OK = Revelar vencedores agora\nCancelar = Continuar sem revelar'
    );
    if (wantsReveal) {
      navigate(`#/endgame/${game.id}`);
    } else {
      await api.continueWithoutRevealing(game.id);
      await refresh(container);
    }
  }

  function wireEvents(container) {
    container.querySelector('#back-btn').addEventListener('click', () => navigate('#/saved-games'));

    container.querySelectorAll('.tile').forEach((btn) => {
      btn.addEventListener('click', () => {
        const numero = Number(btn.dataset.numero);
        VideoModal.open(game.id, numero, async (result) => {
          await refresh(container);
          await promptRevealIfReady(container, result.readyToPromptReveal);
        });
      });
    });

    container.querySelectorAll('.score-btn').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const teamId = btn.closest('[data-team-id]').dataset.teamId;
        const delta = Number(btn.dataset.delta);
        await api.adjustScore(game.id, teamId, delta);
        await refresh(container);
      });
    });

    container.querySelectorAll('.nova-volta-btn').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const teamId = btn.closest('[data-team-id]').dataset.teamId;
        const result = await api.novaVolta(game.id, teamId);
        await refresh(container);
        await promptRevealIfReady(container, result.readyToPromptReveal);
      });
    });

    container.querySelector('#open-randomizers').addEventListener('click', () => {
      Screens.randomizers.open(game.id);
    });
  }

  async function render(container, params) {
    game = await api.getGame(params.gameId);
    if (!game) {
      container.innerHTML = '<p>Jogo nao encontrado.</p>';
      return;
    }
    try {
      const manifest = await api.getManifest();
      heroesById = Object.fromEntries(manifest.heroes.map((h) => [h.id, h]));
    } catch {
      heroesById = {};
    }
    renderAll(container);
  }

  function destroy() {
    VideoModal.close();
    if (Screens.randomizers && Screens.randomizers.closeDrawer) Screens.randomizers.closeDrawer();
  }

  return { render, destroy };
})();
