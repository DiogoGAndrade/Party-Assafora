// Shared challenge-video player. Opens whatever space the operator taps
// (auto-chaining past used-up spaces per rule 9), plays the video, then
// offers the 3 outcome options plus the no-penalty "skip to next" action.
const VideoModal = (() => {
  let backdrop = null;
  let gameId = null;
  let currentNumero = null;
  let onResolved = null;

  function close() {
    if (backdrop) {
      backdrop.remove();
      backdrop = null;
    }
  }

  function renderChallenge(challenge, note) {
    const modal = backdrop.querySelector('.modal-content');
    modal.innerHTML = `
      <h3>Casa ${challenge.numero}</h3>
      ${note ? `<p class="muted">${note}</p>` : ''}
      <video id="challenge-video" controls autoplay src="${challenge.video_path || ''}"></video>
      ${!challenge.video_path ? '<p class="muted">(video nao encontrado - confirma o manifesto/auditoria de assets)</p>' : ''}
      <div class="outcome-buttons">
        <button class="accent3" id="btn-repetivel">Repetivel (pode calhar outra vez)</button>
        <button class="ghost" id="btn-usado">Usado (nao repetir)</button>
        <button class="danger" id="btn-recusado">Recusou</button>
        <button class="ghost" id="btn-skip">Saltar para o seguinte (sem penalizacao)</button>
      </div>
      <div class="row" style="justify-content:center; margin-top:0.8rem;">
        <button class="ghost" id="btn-close">Fechar sem marcar</button>
      </div>
    `;
    currentNumero = challenge.numero;

    modal.querySelector('#btn-repetivel').addEventListener('click', () => resolve('repetivel'));
    modal.querySelector('#btn-usado').addEventListener('click', () => resolve('usado'));
    modal.querySelector('#btn-recusado').addEventListener('click', () => resolve('recusado'));
    modal.querySelector('#btn-skip').addEventListener('click', skip);
    modal.querySelector('#btn-close').addEventListener('click', close);
  }

  async function skip() {
    const modal = backdrop.querySelector('.modal-content');
    modal.innerHTML = '<p class="muted">A carregar...</p>';
    const { challenge } = await api.skipChallenge(gameId, currentNumero);
    renderChallenge(challenge, 'Desafio seguinte (sem penalizacao):');
  }

  async function resolve(outcome) {
    const modal = backdrop.querySelector('.modal-content');
    modal.innerHTML = '<p class="muted">A guardar...</p>';
    try {
      const result = await api.resolveOutcome(gameId, currentNumero, outcome);
      if (result.instrucao) {
        modal.innerHTML = `
          <h3>Casa ${currentNumero}</h3>
          <div class="decline-note">${result.instrucao}</div>
          <div class="row" style="justify-content:center; margin-top:1rem;">
            <button class="primary" id="btn-ack">Entendido</button>
          </div>
        `;
        modal.querySelector('#btn-ack').addEventListener('click', () => {
          close();
          if (onResolved) onResolved(result);
        });
      } else {
        close();
        if (onResolved) onResolved(result);
      }
    } catch (err) {
      modal.innerHTML = `<p class="muted">Erro: ${err.message}</p>`;
    }
  }

  // Opens the modal for whichever space number the operator tapped.
  // `resolvedCallback` fires after an outcome (repetivel/usado/recusado)
  // is saved, so the Board screen can refresh team/turn state.
  async function open(theGameId, numero, resolvedCallback) {
    gameId = theGameId;
    onResolved = resolvedCallback;

    backdrop = document.createElement('div');
    backdrop.className = 'modal-backdrop';
    backdrop.innerHTML = '<div class="modal-content"><p class="muted">A carregar...</p></div>';
    document.body.appendChild(backdrop);

    try {
      const { challenge, autoAdvanced, casaOriginal } = await api.openChallenge(gameId, numero);
      renderChallenge(
        challenge,
        autoAdvanced ? `Casa ${casaOriginal} ja estava marcada como usada - a mostrar a casa ${challenge.numero}.` : null
      );
    } catch (err) {
      backdrop.querySelector('.modal-content').innerHTML = `<p class="muted">Erro: ${err.message}</p>`;
    }
  }

  return { open, close };
})();
