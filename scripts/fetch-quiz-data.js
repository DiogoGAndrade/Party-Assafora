#!/usr/bin/env node
//
// Run this on YOUR OWN machine (with real internet access) - not on the
// party server, and not from any sandboxed dev environment that blocks
// query.wikidata.org. It fetches quiz content from Wikidata, caches it
// to data/quizzes/*.json, and prints a sample so you can review quality
// BEFORE trusting it at the party (see README - human review is mandatory,
// auto-generated trivia can come back obscure, outdated, or oddly worded).
//
// Usage:
//   node scripts/fetch-quiz-data.js                 (fetches both quizzes, 300 items each)
//   node scripts/fetch-quiz-data.js --limit 20       (small test run first - do this first!)
//   node scripts/fetch-quiz-data.js --only marcas    (fetch just one quiz)

const fs = require('fs');
const path = require('path');

const QUIZ_DIR = path.join(__dirname, '..', 'data', 'quizzes');
const ENDPOINT = 'https://query.wikidata.org/sparql';
const USER_AGENT = 'FeriadosBoardGame/1.0 (local party quiz generator; contact via repo owner)';

const args = process.argv.slice(2);
const limitArg = args.indexOf('--limit');
const LIMIT = limitArg !== -1 ? Number(args[limitArg + 1]) : 300;
const onlyArg = args.indexOf('--only');
const ONLY = onlyArg !== -1 ? args[onlyArg + 1] : null;

const QUERIES = {
  celebridades: `
    SELECT ?person ?personLabel ?birthDate (SAMPLE(?occupationLabel) AS ?occupationLabel) WHERE {
      ?person wdt:P31 wd:Q5;
              wdt:P27 wd:Q45;
              wdt:P106 ?occupation.
      OPTIONAL { ?person wdt:P569 ?birthDate. }
      SERVICE wikibase:label { bd:serviceParam wikibase:language "pt,en". ?occupation rdfs:label ?occupationLabel. }
    }
    GROUP BY ?person ?personLabel ?birthDate
    LIMIT ${LIMIT}
  `,
  // Note: P159 (headquarters location) usually points to a city, not a
  // country - so this also tries walking up the administrative hierarchy
  // (P131) to find the country, in addition to checking P17 directly on
  // the brand/company item. Coverage/quality of PT brands on Wikidata is
  // NOT verified from this codebase - review the sample output below.
  marcas: `
    SELECT DISTINCT ?brand ?brandLabel ?instanceOfLabel WHERE {
      { ?brand wdt:P31 wd:Q4830453. } UNION { ?brand wdt:P31 wd:Q431289. }
      ?brand wdt:P31 ?instanceOf.
      {
        ?brand wdt:P17 wd:Q45.
      } UNION {
        ?brand wdt:P159 ?hq.
        ?hq wdt:P131* ?admin.
        ?admin wdt:P17 wd:Q45.
      }
      SERVICE wikibase:label { bd:serviceParam wikibase:language "pt,en". }
    }
    LIMIT ${LIMIT}
  `
};

async function runQuery(sparql) {
  const res = await fetch(ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/sparql-query',
      Accept: 'application/sparql-results+json',
      'User-Agent': USER_AGENT
    },
    body: sparql
  });
  if (!res.ok) {
    throw new Error(`Wikidata respondeu HTTP ${res.status}: ${await res.text()}`);
  }
  const json = await res.json();
  return json.results.bindings;
}

function toCelebridadeItem(row, index) {
  const nome = row.personLabel.value;
  const ano = row.birthDate ? row.birthDate.value.slice(0, 4) : null;
  const profissao = row.occupationLabel ? row.occupationLabel.value : null;
  const pistas = [];
  if (profissao) pistas.push(`profissao: ${profissao}`);
  if (ano) pistas.push(`nascimento: ${ano}`);
  return {
    id: `celeb_${index}`,
    qid: row.person.value.split('/').pop(),
    pergunta: `Figura publica portuguesa - ${pistas.join(', ') || 'sem pistas estruturadas disponiveis'}. Quem e?`,
    resposta: nome,
    dica: pistas.join(' | '),
    fonte: 'wikidata'
  };
}

function toMarcaItem(row, index) {
  const nome = row.brandLabel.value;
  const tipo = row.instanceOfLabel ? row.instanceOfLabel.value : null;
  return {
    id: `marca_${index}`,
    qid: row.brand.value.split('/').pop(),
    pergunta: `Marca/empresa portuguesa (${tipo || 'tipo desconhecido'}). Qual e?`,
    resposta: nome,
    dica: tipo || '',
    fonte: 'wikidata'
  };
}

function backupExisting(filePath) {
  if (fs.existsSync(filePath)) {
    const stamp = new Date().toISOString().replace(/[:.]/g, '-');
    const bak = filePath.replace(/\.json$/, `.${stamp}.json.bak`);
    fs.copyFileSync(filePath, bak);
    console.log(`  (backup do ficheiro anterior guardado em ${path.basename(bak)})`);
  }
}

function printSample(items, n = 10) {
  const sample = items.slice(0, Math.min(n, items.length));
  for (const item of sample) {
    console.log(`  - [${item.id}] ${item.pergunta}  =>  ${item.resposta}`);
  }
}

async function fetchQuiz(quizId, mapper) {
  console.log(`\nA consultar Wikidata para "${quizId}" (limite ${LIMIT})...`);
  let rows;
  try {
    rows = await runQuery(QUERIES[quizId]);
  } catch (err) {
    console.error(`  ERRO ao consultar "${quizId}": ${err.message}`);
    console.error('  Confirma que tens internet e que nao estas atras de um proxy que bloqueia query.wikidata.org.');
    return;
  }
  const items = rows.map((row, i) => mapper(row, i));
  console.log(`  Recebidos ${items.length} resultados${items.length < LIMIT ? ' (menos do que o limite pedido - a cobertura pode ser insuficiente)' : ''}.`);
  console.log(`  Amostra de ${Math.min(10, items.length)} para revisao rapida:`);
  printSample(items);

  fs.mkdirSync(QUIZ_DIR, { recursive: true });
  const outPath = path.join(QUIZ_DIR, `${quizId}.json`);
  backupExisting(outPath);
  fs.writeFileSync(outPath, JSON.stringify(items, null, 2), 'utf8');
  console.log(`  Guardado em ${path.relative(process.cwd(), outPath)}.`);
  console.log('  REVISAO HUMANA OBRIGATORIA antes da festa: abre este ficheiro e corrige/remove perguntas fracas, obscuras ou desatualizadas.');
}

async function main() {
  const targets = ONLY ? [ONLY] : Object.keys(QUERIES);
  for (const quizId of targets) {
    if (!QUERIES[quizId]) {
      console.error(`Quiz desconhecido: ${quizId}. Opcoes: ${Object.keys(QUERIES).join(', ')}`);
      continue;
    }
    if (quizId === 'celebridades') await fetchQuiz('celebridades', toCelebridadeItem);
    if (quizId === 'marcas') await fetchQuiz('marcas', toMarcaItem);
  }
  console.log('\nConcluido.');
}

main();
