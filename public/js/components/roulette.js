// Functional team-draw roulette: a FIXED ring of the individual hero
// portrait avatars (never clipped into wedges - each stays a full,
// recognizable circular photo at all times) plus a pointer/light that
// spins around the ring and decelerates to land on one avatar. The
// static "Roleta 1/2" images are decorative only and are never used here.
const Roulette = (() => {
  const RING_SIZE = 300;
  const AVATAR_SIZE = 72;
  const RADIUS = RING_SIZE / 2 - AVATAR_SIZE / 2 - 8;

  function positionOnRing(el, index, total, radius) {
    const anglePerSlice = 360 / total;
    const angleDeg = index * anglePerSlice; // clockwise from top, 0 = 12 o'clock
    const rad = ((angleDeg - 90) * Math.PI) / 180;
    const x = RING_SIZE / 2 + radius * Math.cos(rad);
    const y = RING_SIZE / 2 + radius * Math.sin(rad);
    el.style.left = `${x}px`;
    el.style.top = `${y}px`;
  }

  // Builds just the ring (no button) inside `container`. Returns a
  // controller with spin(winnerIndex, onDone) that animates the pointer
  // landing on a specific avatar. Used both for a plain random draw
  // (render, below) and for revealing an already-unique pairing one
  // step at a time (see newGame.js's fixed 10-hero draw mode).
  function createWheel(container, heroes) {
    const total = heroes.length;
    const anglePerSlice = 360 / total;

    const ring = document.createElement('div');
    ring.className = 'roulette-ring';
    ring.style.width = `${RING_SIZE}px`;
    ring.style.height = `${RING_SIZE}px`;
    container.appendChild(ring);

    const avatarSlots = heroes.map((hero, i) => {
      const slot = document.createElement('div');
      slot.className = 'avatar-slot';
      slot.style.width = `${AVATAR_SIZE}px`;
      slot.style.height = `${AVATAR_SIZE}px`;
      positionOnRing(slot, i, total, RADIUS);
      slot.innerHTML = `
        <img class="avatar-img" src="${hero.imagem}" alt="${hero.nome}" />
        <div class="avatar-name">${hero.nome}</div>
      `;
      ring.appendChild(slot);
      return slot;
    });

    const rotor = document.createElement('div');
    rotor.className = 'ring-pointer-rotor';
    rotor.innerHTML = '<div class="pointer-light"></div>';
    ring.appendChild(rotor); // stays on top so the light is visible over the avatars

    function spin(winnerIndex, onDone) {
      avatarSlots.forEach((s) => s.classList.remove('winner'));
      const extraSpins = 5;
      const target = extraSpins * 360 + winnerIndex * anglePerSlice;
      const durationMs = 4000;

      rotor.style.transition = 'none';
      rotor.style.transform = 'rotate(0deg)';
      // eslint-disable-next-line no-unused-expressions
      void rotor.offsetWidth; // force reflow so the reset above applies before re-enabling the transition
      rotor.style.transition = `transform ${durationMs}ms cubic-bezier(0.12, 0.65, 0.15, 1)`;
      requestAnimationFrame(() => {
        rotor.style.transform = `rotate(${target}deg)`;
      });

      setTimeout(() => {
        avatarSlots[winnerIndex].classList.add('winner');
        if (onDone) onDone(heroes[winnerIndex]);
      }, durationMs + 50);
    }

    return { ring, spin };
  }

  // Builds the ring + a "Rodar roleta" button, picks a uniformly random
  // winner on click. Calls onResult(hero) once the spin finishes.
  function render(container, heroes, onResult) {
    const wrap = document.createElement('div');
    wrap.className = 'roulette-wrap';
    container.appendChild(wrap);

    const ringMount = document.createElement('div');
    wrap.appendChild(ringMount);
    const wheel = createWheel(ringMount, heroes);

    const spinBtn = document.createElement('button');
    spinBtn.className = 'primary';
    spinBtn.textContent = 'Rodar roleta';
    wrap.appendChild(spinBtn);

    spinBtn.addEventListener('click', () => {
      spinBtn.disabled = true;
      const winnerIndex = Math.floor(Math.random() * heroes.length);
      wheel.spin(winnerIndex, (hero) => {
        spinBtn.disabled = false;
        onResult(hero);
      });
    });
  }

  return { render, createWheel };
})();
