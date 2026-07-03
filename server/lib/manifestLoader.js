const fs = require('fs');
const path = require('path');

const MANIFEST_PATH = path.join(__dirname, '..', 'config', 'manifest.json');
const DEFAULTS_PATH = path.join(__dirname, '..', 'config', 'game-defaults.json');

const PUBLIC_DIR = path.join(__dirname, '..', '..', 'public');
const CHALLENGES_DIR = path.join(PUBLIC_DIR, 'videos', 'challenges');
const HEROES_VIDEO_DIR = path.join(PUBLIC_DIR, 'videos', 'heroes');
const HEROES_IMAGE_DIR = path.join(PUBLIC_DIR, 'images', 'heroes');
const INTRO_DIR = path.join(PUBLIC_DIR, 'videos', 'intro');
const ROULETTE_DIR = path.join(PUBLIC_DIR, 'images', 'roulette');

function loadManifest() {
  const raw = fs.readFileSync(MANIFEST_PATH, 'utf8');
  return JSON.parse(raw);
}

function loadDefaults() {
  const raw = fs.readFileSync(DEFAULTS_PATH, 'utf8');
  return JSON.parse(raw);
}

function challengeVideoPath(numero) {
  const manifest = loadManifest();
  const filename = manifest.challenges[String(numero)];
  if (!filename) return null;
  return `/videos/challenges/${filename}`;
}

function heroList() {
  const manifest = loadManifest();
  return manifest.heroes.map((h) => ({
    id: h.id,
    nome: h.nome,
    // Filenames may contain spaces/accents (e.g. "Sã Joã.png") - encode
    // so the browser requests the exact bytes express.static expects.
    imagem: `/images/heroes/${encodeURIComponent(h.imagem)}`
  }));
}

function introVideoPath() {
  const manifest = loadManifest();
  return `/videos/intro/${manifest.videoInicial}`;
}

function rouletteDecorationPath() {
  const manifest = loadManifest();
  return `/images/roulette/${manifest.rouletteDecoration}`;
}

module.exports = {
  MANIFEST_PATH,
  CHALLENGES_DIR,
  HEROES_VIDEO_DIR,
  HEROES_IMAGE_DIR,
  INTRO_DIR,
  ROULETTE_DIR,
  loadManifest,
  loadDefaults,
  challengeVideoPath,
  heroList,
  introVideoPath,
  rouletteDecorationPath
};
