# Feriados - jogo de tabuleiro (app local)

App local (sem internet, sem hosting externo) para controlar o jogo de tabuleiro de festa "Feriados": mostra os 48 vídeos de desafio, guarda pontuação escondida, gere a rotação de jogadores, e tem os randomizadores/quizzes à parte. O tabuleiro físico real é a fonte de verdade para posição/movimento - a app não o simula.

## Instalação

```
npm install
npm start
```

Abre `http://localhost:3000` no browser do dispositivo partilhado.

## Onde colocar os teus ficheiros

Os teus vídeos/imagens reais (que estão na tua pasta OneDrive) têm de ser copiados para dentro destas pastas do projeto - a app nunca lê diretamente do OneDrive, para não depender do estado de sincronização a meio da festa:

```
public/videos/challenges/   -> os 48 videos dos desafios
public/videos/heroes/       -> videos de introducao dos herois (se existirem separados)
public/videos/intro/        -> o "Video Inicial" (apresentacoes + narracao das regras)
public/images/heroes/       -> as 10 imagens de retrato dos herois
public/images/roulette/     -> so a imagem "Roleta 2" (decorativa)
```

Depois de copiar os ficheiros, edita `server/config/manifest.json` para apontar cada número de casa (1-48) e cada herói para o nome de ficheiro REAL - não presumas que os teus ficheiros já seguem a convenção `1.mp4`...`48.mp4`.

## IMPORTANTE: corre a auditoria antes da festa

```
npm run audit
```

Isto verifica:
- se todas as 48 casas têm ficheiro mapeado e esse ficheiro existe;
- se há **números duplicados** na pasta `videos/challenges/` (é exatamente o tipo de problema já detetado uma vez - dois ficheiros chamados "22" e nenhum "23");
- ficheiros na pasta que o manifesto não referencia;
- se o Vídeo Inicial e a imagem da Roleta 2 existem.

Corre isto de novo sempre que adicionares ou renomeares ficheiros. A auditoria também corre automaticamente (e imprime um resumo) sempre que arrancas o servidor com `npm start`.

## Quizzes (Wikidata)

Os bancos de perguntas dos quizzes de celebridades e marcas portuguesas **não vêm pré-carregados** - têm de ser gerados por ti, no teu computador com internet:

```
node scripts/fetch-quiz-data.js --limit 20     # teste pequeno primeiro
node scripts/fetch-quiz-data.js                # gera os 300 completos
```

O script guarda o resultado em `data/quizzes/celebridades.json` e `data/quizzes/marcas.json`, e imprime uma amostra para revisares a qualidade. **Revisão humana é obrigatória antes da festa** - abre os ficheiros e corrige ou remove perguntas obscuras, desatualizadas ou mal formuladas. Para a query de marcas, a cobertura de empresas portuguesas na Wikidata não está confirmada - o script avisa se vierem poucos resultados.

A app em jogo só lê estes ficheiros já revistos - nunca contacta a Wikidata sozinha.

## Jogos guardados

Cada jogo fica gravado em `data/games/<id>.json`, atualizado a cada ação (rolo de dado, desafio, pontuação, etc.) para sobreviver a um recarregar da página a meio da festa. O ecrã "Jogos guardados" permite retomar ou apagar jogos antigos.

## Estrutura

```
server/           - Express: rotas da API, motor de jogo, persistencia, auditoria
scripts/          - CLI: auditoria de assets, fetch de dados dos quizzes
data/             - jogos guardados + bancos de perguntas dos quizzes (gerado, nao versionar)
public/           - frontend (HTML/CSS/JS puro, sem build step)
```
