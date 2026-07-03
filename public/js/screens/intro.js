Screens.intro = (() => {
  function render(container) {
    container.innerHTML = `
      <div class="center-screen">
        <h1>Feriados</h1>
        <p class="muted">Video inicial (apresentacoes + narracao das regras)...</p>
        <video id="intro-video" class="intro-video" autoplay controls></video>
        <div class="row" style="justify-content:center; margin-top:1rem;">
          <button class="primary" id="intro-continue">Entrar &rarr;</button>
        </div>
      </div>
    `;

    const video = document.getElementById('intro-video');
    api.getManifest().then((manifest) => {
      video.src = manifest.introVideo;
    }).catch(() => {
      container.querySelector('.muted').textContent =
        'Nao foi possivel carregar o video inicial - confirma o manifesto de assets.';
    });

    document.getElementById('intro-continue').addEventListener('click', () => {
      navigate('#/saved-games');
    });
  }

  function destroy() {}

  return { render, destroy };
})();
