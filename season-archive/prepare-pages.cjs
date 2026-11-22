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
const siteUrl = 'https://hyalusnetwork.github.io/uhc_website/';
const descriptions = {
  seasons: 'Explore Hyalus UHC seasons, match results, teams, eliminations, and season videos.',
  players: 'Meet the Hyalus UHC players through player bios, career statistics, trophy cases, and season histories.',
  stats: 'Explore Hyalus UHC statistics, charts, and records across players, teams, and seasons.',
  rankings: 'Compare Hyalus UHC player rankings, season grades, and team performance.',
  trivia: 'Discover Hyalus UHC records, milestones, rivalries, and memorable moments.',
  about: 'Learn about Hyalus UHC, its game formats, rules, and the history of the crown.',
};
const attribute = value => value.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
const videos = JSON.parse(fs.readFileSync(path.join(__dirname, 'season-videos.json'), 'utf8'));
const videoScript = '<script id="season-videos-data">window.UHC_SEASON_VIDEOS = '
  + JSON.stringify(videos).replace(/</g, '\\u003c') + ';</script>';
const template = fs.readFileSync(path.join(dist, 'index.html'), 'utf8')
  .replace(/<script id="season-videos-data">[\s\S]*?<\/script>/g, '')
  .replace(/<meta\b[^>]*(?:name="(?:description|application-name|twitter:[^"]+)"|property="og:[^"]+")[^>]*>\s*/g, '')
  .replace(/<link\b[^>]*rel="canonical"[^>]*>\s*/g, '')
  .replace('THE MOMENTS THAT MADE THE ARCHIVE', 'THE MOMENTS THAT MADE HYALUS UHC')
  .replace('</head>', videoScript + '</head>');

for (const [page, filename] of Object.entries(pages)) {
  let html = template.replace(
    /<a\b[^>]*\bdata-tab="([^"]+)"[^>]*>/g,
    (anchor, target) => anchor.replace(/href="[^"]*"/, `href="${pages[target]}"`),
  );
  html = html.replace(/<title>[^<]*<\/title>/, `<title>${page[0].toUpperCase() + page.slice(1)} | Hyalus UHC</title>`);
  const title = page[0].toUpperCase() + page.slice(1) + ' | Hyalus UHC';
  const url = new URL(page === 'seasons' ? '' : filename, siteUrl).href;
  const image = new URL('images/social/' + page + '.png', siteUrl).href;
  const meta = {
    description: descriptions[page],
    'application-name': 'Hyalus UHC',
    'og:site_name': 'Hyalus UHC',
    'og:type': 'website',
    'og:locale': 'en_US',
    'og:title': title,
    'og:description': descriptions[page],
    'og:url': url,
    'og:image': image,
    'og:image:type': 'image/png',
    'og:image:width': '1200',
    'og:image:height': '630',
    'og:image:alt': title + ' page preview',
    'twitter:card': 'summary_large_image',
    'twitter:title': title,
    'twitter:description': descriptions[page],
    'twitter:image': image,
    'twitter:image:alt': title + ' page preview',
  };
  const metadata = Object.entries(meta).map(([key, value]) =>
    `<meta ${key.startsWith('og:') ? 'property' : 'name'}="${key}" content="${attribute(value)}">`
  ).join('\n');
  html = html.replace('</head>', `<link rel="canonical" href="${url}">\n${metadata}\n</head>`);
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
