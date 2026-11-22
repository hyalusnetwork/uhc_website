const fs = require('node:fs');
const path = require('node:path');

const dist = path.join(__dirname, 'dist');
const pages = {
  seasons: 'index.html',
  players: 'players.html',
  stats: 'stats.html',
  rankings: 'rankings.html',
  trivia: 'trivia.html',
  about: 'about.html',
};
const videos = JSON.parse(fs.readFileSync(path.join(__dirname, 'season-videos.json'), 'utf8'));
const videoScript = '<script id="season-videos-data">window.UHC_SEASON_VIDEOS = '
  + JSON.stringify(videos).replace(/</g, '\\u003c') + ';</script>';
const template = fs.readFileSync(path.join(dist, 'index.html'), 'utf8')
  .replace(/<script id="season-videos-data">[\s\S]*?<\/script>/g, '')
  .replace('</head>', videoScript + '</head>');

for (const [page, filename] of Object.entries(pages)) {
  let html = template.replace(
    /<a\b[^>]*\bdata-tab="([^"]+)"[^>]*>/g,
    (anchor, target) => anchor.replace(/href="[^"]*"/, `href="${pages[target]}"`),
  );
  html = html.replace(/<title>[^<]*<\/title>/, `<title>${page[0].toUpperCase() + page.slice(1)} | Hyalus UHC</title>`);
  html = html.replace(
    /<section\b[^>]*\bid="(seasons|players|stats|rankings|trivia|about)-view"[^>]*>/g,
    (section, target) => section.replace(/ hidden\b/g, '').replace(/>$/, target === page ? '>' : ' hidden>'),
  );
  html = html.replace(/<a\b[^>]*\bdata-tab="([^"]+)"[^>]*>/g, (anchor, target) => {
    anchor = anchor.replace(/ class="active"/g, '').replace(/ aria-current="page"/g, '');
    return anchor.replace(/>$/, target === page ? ' class="active" aria-current="page">' : '>');
  });
  fs.writeFileSync(path.join(dist, filename), html);
}
