const fs = require('fs');
const path = require('path');
const manifestLoader = require('./manifestLoader');

function listDirSafe(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir).filter((f) => !f.startsWith('.'));
}

// Extracts a leading number from a filename, e.g. "22.mp4" -> 22,
// "22b_final.mp4" -> 22, "intro.mp4" -> null.
function leadingNumber(filename) {
  const match = filename.match(/^0*(\d+)/);
  return match ? Number(match[1]) : null;
}

// Pass 1: does the manifest map every expected slot, and does the
// mapped file actually exist on disk?
function auditManifestValidity(manifest, boardSize) {
  const errors = [];
  const missingNumbers = [];

  for (let numero = 1; numero <= boardSize; numero++) {
    const filename = manifest.challenges[String(numero)];
    if (!filename) {
      missingNumbers.push(numero);
      continue;
    }
    const full = path.join(manifestLoader.CHALLENGES_DIR, filename);
    if (!fs.existsSync(full)) {
      missingNumbers.push(numero);
      errors.push(`Casa ${numero}: ficheiro mapeado "${filename}" nao existe em videos/challenges/`);
    }
  }

  const heroErrors = [];
  for (const hero of manifest.heroes) {
    const imgPath = path.join(manifestLoader.HEROES_IMAGE_DIR, hero.imagem || '');
    if (!hero.imagem || !fs.existsSync(imgPath)) {
      heroErrors.push(`Heroi "${hero.id}": imagem "${hero.imagem || '(vazio)'}" nao encontrada em images/heroes/`);
    }
  }

  const introPath = path.join(manifestLoader.INTRO_DIR, manifest.videoInicial || '');
  const introMissing = !manifest.videoInicial || !fs.existsSync(introPath);

  const roulettePath = path.join(manifestLoader.ROULETTE_DIR, manifest.rouletteDecoration || '');
  const rouletteMissing = !manifest.rouletteDecoration || !fs.existsSync(roulettePath);

  return { errors: [...errors, ...heroErrors], missingNumbers, introMissing, rouletteMissing };
}

// Pass 2: independent of the manifest - scans the raw folder and flags
// any leading number claimed by more than one file. This is what catches
// "two files both named 22, no 23" even if the manifest has already been
// hand-patched to reference only one of them.
function auditRawDuplicates(dir) {
  const files = listDirSafe(dir);
  const byNumber = new Map();
  for (const f of files) {
    const n = leadingNumber(f);
    if (n == null) continue;
    if (!byNumber.has(n)) byNumber.set(n, []);
    byNumber.get(n).push(f);
  }
  const duplicates = [];
  const unmapped = [];
  for (const [n, list] of byNumber.entries()) {
    if (list.length > 1) duplicates.push({ numero: n, ficheiros: list });
  }
  return { duplicates, files };
}

function runAudit() {
  const manifest = manifestLoader.loadManifest();
  const defaults = manifestLoader.loadDefaults();
  const boardSize = defaults.board_size;

  const manifestPass = auditManifestValidity(manifest, boardSize);
  const rawPass = auditRawDuplicates(manifestLoader.CHALLENGES_DIR);

  const mappedFilenames = new Set(Object.values(manifest.challenges));
  const unmappedFiles = rawPass.files.filter((f) => !mappedFilenames.has(f));

  const errors = [...manifestPass.errors];
  const warnings = [];

  if (rawPass.duplicates.length > 0) {
    for (const d of rawPass.duplicates) {
      warnings.push(`Numero ${d.numero} aparece em mais do que um ficheiro na pasta: ${d.ficheiros.join(', ')} - o mapeamento pode estar a apontar para o ficheiro errado.`);
    }
  }
  if (unmappedFiles.length > 0) {
    warnings.push(`Ficheiros na pasta videos/challenges/ que o manifesto nao referencia: ${unmappedFiles.join(', ')}`);
  }
  if (manifestPass.introMissing) {
    warnings.push('Video Inicial nao encontrado (videos/intro/).');
  }
  if (manifestPass.rouletteMissing) {
    warnings.push('Imagem de decoracao da roleta (Roleta 2) nao encontrada (images/roulette/).');
  }

  const mappedCount = boardSize - manifestPass.missingNumbers.length;

  return {
    ok: errors.length === 0 && manifestPass.missingNumbers.length === 0,
    summary: `${mappedCount}/${boardSize} casas mapeadas e encontradas.` +
      (manifestPass.missingNumbers.length ? ` Em falta: ${manifestPass.missingNumbers.join(', ')}.` : '') +
      (rawPass.duplicates.length ? ` Numeros duplicados na pasta: ${rawPass.duplicates.map(d => d.numero).join(', ')}.` : ''),
    missingNumbers: manifestPass.missingNumbers,
    duplicateNumbers: rawPass.duplicates,
    unmappedFiles,
    errors,
    warnings
  };
}

function renderTextReport(report) {
  const lines = [];
  lines.push('=== Auditoria de assets - Feriados ===');
  lines.push(report.summary);
  if (report.errors.length) {
    lines.push('');
    lines.push('ERROS:');
    report.errors.forEach((e) => lines.push(`  - ${e}`));
  }
  if (report.warnings.length) {
    lines.push('');
    lines.push('AVISOS:');
    report.warnings.forEach((w) => lines.push(`  - ${w}`));
  }
  lines.push('');
  lines.push(report.ok ? 'Estado: OK' : 'Estado: por corrigir antes da festa.');
  return lines.join('\n');
}

module.exports = { runAudit, renderTextReport, leadingNumber };
