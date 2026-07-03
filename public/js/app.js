// Tiny hash router - no framework. Each screen module (window.Screens.xxx)
// exposes render(container, params) and an optional destroy(). The router
// tears down the previous screen before mounting the next one.
const Screens = window.Screens || {};
window.Screens = Screens;

let activeScreen = null;

function parseRoute(hash) {
  const clean = (hash || '').replace(/^#\/?/, '');
  const parts = clean.split('/').filter(Boolean);
  if (parts.length === 0) return { name: 'intro', params: {} };

  switch (parts[0]) {
    case 'intro':
      return { name: 'intro', params: {} };
    case 'new-game':
      return { name: 'newGame', params: {} };
    case 'saved-games':
      return { name: 'savedGames', params: {} };
    case 'board':
      return { name: 'board', params: { gameId: parts[1] } };
    case 'quiz':
      return { name: 'quiz', params: { quizId: parts[1], gameId: parts[2] } };
    case 'endgame':
      return { name: 'endgame', params: { gameId: parts[1] } };
    default:
      return { name: 'intro', params: {} };
  }
}

function navigate(hash) {
  window.location.hash = hash;
}
window.navigate = navigate;

function renderRoute() {
  const { name, params } = parseRoute(window.location.hash);
  const container = document.getElementById('app');

  if (activeScreen && typeof activeScreen.destroy === 'function') {
    activeScreen.destroy();
  }

  const screen = Screens[name];
  if (!screen) {
    container.innerHTML = `<p>Ecra desconhecido: ${name}</p>`;
    activeScreen = null;
    return;
  }
  activeScreen = screen;
  container.innerHTML = '';
  screen.render(container, params);
}

window.addEventListener('hashchange', renderRoute);
window.addEventListener('DOMContentLoaded', renderRoute);
