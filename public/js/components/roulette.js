// Functional team-draw roulette built from the 10 individual hero portrait
// images as slices (CSS clip-path pie wedges + a CSS transform spin). This
// is the actual random-draw mechanism - the static "Roleta 1/2" images are
// decorative only and are never used here.
const Roulette = (() => {
  function sectorClipPath(index, total, steps = 10) {
    const anglePerSlice = 360 / total;
    const angleStart = -90 + index * anglePerSlice;
    const angleEnd = -90 + (index + 1) * anglePerSlice;
    const points = ['50% 50%'];
    for (let i = 0; i <= steps; i++) {
      const angle = angleStart + ((angleEnd - angleStart) * i) / steps;
      const rad = (angle * Math.PI) / 180;
      const x = 50 + 50 * Math.cos(rad);
      const y = 50 + 50 * Math.sin(rad);
      points.push(`${x.toFixed(2)}% ${y.toFixed(2)}%`);
    }
    return `polygon(${points.join(',')})`;
  }

  // Builds the wheel + spin button inside `container`. Calls
  // onResult(hero) once the spin animation finishes.
  function render(container, heroes, onResult) {
    const total = heroes.length;
    const anglePerSlice = 360 / total;

    const wrap = document.createElement('div');
    wrap.className = 'roulette-wrap';
    wrap.innerHTML = `
      <div class="roulette-pointer">&#9660;</div>
      <div class="roulette" id="roulette-wheel"></div>
      <button class="primary" id="roulette-spin">Rodar roleta</button>
    `;
    container.appendChild(wrap);

    const wheel = wrap.querySelector('#roulette-wheel');
    heroes.forEach((hero, i) => {
      const slice = document.createElement('div');
      slice.className = 'slice';
      slice.style.clipPath = sectorClipPath(i, total);
      slice.style.transform = `rotate(${i * anglePerSlice}deg)`;
      const img = document.createElement('img');
      img.src = hero.imagem;
      img.alt = hero.nome;
      slice.appendChild(img);
      wheel.appendChild(slice);
    });

    const spinBtn = wrap.querySelector('#roulette-spin');
    spinBtn.addEventListener('click', () => {
      spinBtn.disabled = true;
      const winnerIndex = Math.floor(Math.random() * total);
      const theta = winnerIndex * anglePerSlice + anglePerSlice / 2;
      const extraSpins = 5;
      const target = extraSpins * 360 + (360 - theta);
      const durationMs = 4000;

      wheel.style.transition = 'none';
      wheel.style.transform = 'rotate(0deg)';
      // eslint-disable-next-line no-unused-expressions
      void wheel.offsetWidth; // force reflow so the reset above takes effect before re-enabling transition
      wheel.style.transition = `transform ${durationMs}ms cubic-bezier(0.17,0.67,0.12,0.99)`;
      requestAnimationFrame(() => {
        wheel.style.transform = `rotate(${target}deg)`;
      });

      setTimeout(() => {
        spinBtn.disabled = false;
        onResult(heroes[winnerIndex]);
      }, durationMs + 50);
    });
  }

  return { render };
})();
