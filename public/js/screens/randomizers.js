Screens.randomizers = (() => {
  let drawer = null;
  let countdownTimer = null;

  function closeDrawer() {
    if (countdownTimer) {
      clearInterval(countdownTimer);
      countdownTimer = null;
    }
    if (drawer) {
      drawer.remove();
      drawer = null;
    }
  }

  function startCountdown(container, seconds) {
    const display = container.querySelector('#time-pick-display');
    let remaining = seconds;
    if (countdownTimer) clearInterval(countdownTimer);
    display.textContent = remaining.toFixed(1) + 's';
    countdownTimer = setInterval(() => {
      remaining = Math.max(0, remaining - 0.1);
      display.textContent = remaining.toFixed(1) + 's';
      if (remaining <= 0) {
        clearInterval(countdownTimer);
        countdownTimer = null;
        display.textContent = 'Tempo esgotado!';
      }
    }, 100);
  }

  async function open(gameId) {
    closeDrawer();
    drawer = document.createElement('div');
    drawer.className = 'drawer';
    drawer.innerHTML = `
      <div class="row between">
        <h3>Jogos / Randomizadores</h3>
        <button class="ghost" id="close-drawer">x</button>
      </div>

      <div class="card stack">
        <strong>Sorteador de pessoa</strong>
        <button class="primary" id="person-pick-btn">Sortear jogador</button>
        <div id="person-pick-result" class="muted">-</div>
      </div>

      <div class="card stack">
        <strong>Sorteador de tempo</strong>
        <button class="primary" id="time-pick-btn">Sortear tempo</button>
        <div id="time-pick-display" class="muted" style="font-size:1.4rem;">-</div>
      </div>

      <div class="card stack">
        <strong>Quizzes</strong>
        <button class="accent3" id="quiz-celebridades-btn">Quiz de celebridades</button>
        <button class="accent3" id="quiz-marcas-btn">Quiz de marcas</button>
      </div>
    `;
    document.body.appendChild(drawer);

    drawer.querySelector('#close-drawer').addEventListener('click', closeDrawer);

    drawer.querySelector('#person-pick-btn').addEventListener('click', async () => {
      const { picked } = await api.personPick(gameId);
      drawer.querySelector('#person-pick-result').textContent = `${picked.nome} (${picked.equipa})`;
    });

    drawer.querySelector('#time-pick-btn').addEventListener('click', async () => {
      const { seconds } = await api.timePick(gameId);
      startCountdown(drawer, seconds);
    });

    drawer.querySelector('#quiz-celebridades-btn').addEventListener('click', () => {
      closeDrawer();
      navigate(`#/quiz/celebridades/${gameId}`);
    });
    drawer.querySelector('#quiz-marcas-btn').addEventListener('click', () => {
      closeDrawer();
      navigate(`#/quiz/marcas/${gameId}`);
    });
  }

  // Not a router-mounted screen (it's opened as a drawer from the Board
  // screen) - render/destroy exist only so it behaves if ever routed to.
  function render() {}
  function destroy() { closeDrawer(); }

  return { open, closeDrawer, render, destroy };
})();
