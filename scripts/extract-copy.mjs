// Collect every user-visible string with its home in the source.
import fs from 'node:fs';

const root = '/Users/sheikheddy/Projects/memesong';
const html = fs.readFileSync(`${root}/index.html`, 'utf8');
const js = fs.readFileSync(`${root}/src/game.js`, 'utf8');
const htmlLines = html.split('\n');
const jsLines = js.split('\n');

const rows = [];
const claimed = new Set();
const norm = (s) => String(s).replace(/\s+/g, ' ').trim();
// `force` rows are structured fields that each need their own line in the
// sheet even when two of them happen to share wording.
const add = (screen, element, file, line, text, notes = '', force = false) => {
  const t = norm(text);
  if (!t || !/[A-Za-z0-9]/.test(t)) return;
  if (!force && claimed.has(t)) return;
  claimed.add(t);
  rows.push({ screen, element, location: line ? `${file}:${line}` : file, text: t, notes });
};
const lineOf = (needle, from = 0) => {
  const probe = norm(needle).slice(0, 40);
  for (let i = from; i < jsLines.length; i += 1) if (norm(jsLines[i]).includes(probe)) return i + 1;
  return '';
};

// ---------------------------------------------------------------- index.html
// Elements whose content is text and <br> only — that covers every couplet.
const SCREEN_OF = (line) => {
  const head = htmlLines.slice(0, line).join('\n');
  if (head.lastIndexOf('id="result-modal"') > head.lastIndexOf('</div>\n        </div>')) {}
  const marks = [
    ['id="result-modal"', 'Result modal'],
    ['id="archive-modal"', 'Archive modal'],
    ['id="swap-modal"', 'Swap modal'],
    ['id="help-modal"', 'How-to-play modal'],
    ['id="ftue-coach"', 'First-use coach'],
    ['id="battle-screen"', 'Battle screen'],
    ['id="selection-screen"', 'Selection screen'],
    ['<footer', 'Footer'],
    ['<header', 'Masthead'],
  ];
  let best = ['', 'Page chrome'];
  for (const [needle, name] of marks) {
    const at = head.lastIndexOf(needle);
    if (at > -1 && at >= (best[0] ? head.lastIndexOf(best[0]) : -1)) best = [needle, name];
  }
  return best[1];
};

htmlLines.forEach((raw, idx) => {
  const line = idx + 1;
  for (const m of raw.matchAll(/\b(aria-label|alt|title|placeholder)="([^"]+)"/g)) {
    if (!m[2].includes(' ')) continue;
    add(SCREEN_OF(line), `${m[1]} attribute`, 'index.html', line, m[2], 'accessibility / tooltip');
  }
  const stripped = raw.replace(/<!--[\s\S]*?-->/g, '');
  // <tag ...>text<br />text</tag> on one line
  for (const m of stripped.matchAll(/<(h1|h2|h3|p|span|small|strong|em|b|kbd|button|div)\b[^>]*>((?:[^<]|<br\s*\/?>)+)<\/\1>/g)) {
    const text = m[2].replace(/<br\s*\/?>/gi, '<br>');
    add(SCREEN_OF(line), m[1], 'index.html', line, text);
  }
});
// The h1 splits across an <em>; grab it whole.
const h1 = html.match(/<h1>([\s\S]*?)<\/h1>/);
if (h1) {
  add('Selection screen', 'h1 (headline)', 'index.html', lineOfHtml('<h1>'),
    h1[1].replace(/<br\s*\/?>/gi, '<br>').replace(/<\/?em>/g, ''), 'two lines; second half is italic');
}
function lineOfHtml(needle) {
  for (let i = 0; i < htmlLines.length; i += 1) if (htmlLines[i].includes(needle)) return i + 1;
  return '';
}

// ------------------------------------------------------------------ roster
const charBlock = js.slice(js.indexOf('const CHARACTERS'), js.indexOf('const FTUE_STEPS'));
for (const chunk of charBlock.split(/\n  \{\n/).slice(1)) {
  const id = chunk.match(/id: '([^']+)'/)?.[1];
  if (!id) continue;
  const at = lineOf(`id: '${id}'`);
  const name = chunk.match(/name: '([^']+)'/)?.[1];
  const un = (s) => s?.replace(/\\'/g, "'");
  add('Roster', `${id} — name`, 'src/game.js', at, name, 'used in log lines and announcements', true);
  const verse = [...(chunk.match(/verse: \[([^\]]+)\]/)?.[1] || '').matchAll(/'((?:[^'\\]|\\.)*)'/g)].map((m) => un(m[1]));
  add('Roster', `${id} — card headline`, 'src/game.js', at, verse[0], 'card title, all caps', true);
  add('Roster', `${id} — card subtitle`, 'src/game.js', at, verse[1], 'card subtitle, sentence case', true);
  add('Roster', `${id} — battle heading`, 'src/game.js', at, chunk.match(/stageLine: '([^']+)'/)?.[1], 'heading while this one fights', true);
  add('Roster', `${id} — domain`, 'src/game.js', at, chunk.match(/domain: '([^']+)'/)?.[1], 'single word', true);
  add('Roster', `${id} — lore`, 'src/game.js', at, un(chunk.match(/lore: '((?:[^'\\]|\\.)*)'/)?.[1]), 'card tooltip', true);
  [...chunk.matchAll(/\{ name: '((?:[^'\\]|\\.)*)', icon: '([^']*)', desc: '((?:[^'\\]|\\.)*)'/g)].forEach((m, i) => {
    const ln = lineOf(un(m[1]), at - 1) || at;
    add('Abilities', `${id} — move ${i + 1} name`, 'src/game.js', ln, un(m[1]), 'button label, all caps', true);
    add('Abilities', `${id} — move ${i + 1} description`, 'src/game.js', ln, un(m[3]), 'small text under the name', true);
  });
}

// -------------------------------------------------------------- first-use
const ftue = js.slice(js.indexOf('const FTUE_STEPS'), js.indexOf('class PixelSound'));
for (const m of ftue.matchAll(/\n  '?([\w-]+)'?: \{([\s\S]*?)\n  \},/g)) {
  const at = lineOf(`${m[1]}: {`);
  for (const field of ['kicker', 'title', 'copy']) {
    const v = m[2].match(new RegExp(`${field}: '((?:[^'\\\\]|\\\\.)*)'`))?.[1];
    add('First-use coach', `step "${m[1]}" — ${field}`, 'src/game.js', at, v?.replace(/\\'/g, "'"), 'coach card', true);
  }
}

// ------------------------------------------------------- generated strings
const groups = [
  [/addLog\(\s*`([^`]+)`/g, 'Battle log', 'log line; ${...} is filled in at runtime'],
  [/announce\(\s*[`']([^`']+)[`']\s*,\s*[`']([^`']+)[`']/g, 'Announcement', 'banner over the arena'],
  [/addEffect\((?:[^,]+,){3}\s*[`']([^`']+)[`']/g, 'Floating text', 'floats above a fighter'],
];
for (const [re, screen, note] of groups) {
  for (const m of js.matchAll(re)) {
    const at = js.slice(0, m.index).split('\n').length;
    for (let g = 1; g < m.length; g += 1) add(screen, screen, 'src/game.js', at, m[g], note);
  }
}

// Everything else that reads like language.
const isCode = (s) => {
  const bare = s.replace(/\$\{[^}]*\}/g, '').trim(); // what the reader actually sees
  return (
    /<\w+[^>]*=["']/.test(s)                       // markup with attributes
    || /=>|\?\.|querySelector|\bfunction\b|\$\{[^}]*\(/.test(s)
    || /^[\w.#-]+$/.test(s)
    || /^(rgba?|hsla?|var)\(/.test(s)
    || /\d+px\s/.test(s)                           // canvas font specs
    || /px\s+(Courier|Georgia|Arial|Helvetica|monospace|serif)/i.test(s)
    || /^\(?prefers-/.test(s)                      // media queries
    || (bare.match(/[A-Za-z]/g) || []).length < 3  // nothing but interpolation
    || /^[a-z][a-z0-9-]*( [a-z0-9-]+)*$/.test(bare) // css class lists
  );
};
for (const m of js.matchAll(/(?:'((?:[^'\\\n]|\\.)+)'|`([^`\n]+)`)/g)) {
  const val = (m[1] || m[2] || '').replace(/\\'/g, "'");
  if (val.length < 5 || !/[A-Za-z]/.test(val) || isCode(val)) continue;
  if (!/\s/.test(val)) continue;
  const at = js.slice(0, m.index).split('\n').length;
  const ctx = norm(jsLines[at - 1] || '').slice(0, 70);
  if (/^(\/\/|\*)/.test(ctx)) continue; // comments
  add(screenOfJsLine(at), enclosingFn(at) || 'in code', 'src/game.js', at, val, ctx);
}

// Which screen a JS line belongs to, via its enclosing function.
function enclosingFn(line) {
  for (let i = line - 1; i >= 0; i -= 1) {
    const m = jsLines[i].match(/^(?:async )?function (\w+)/);
    if (m) return m[1];
  }
  return '';
}
function screenOfJsLine(line) {
  const fn = enclosingFn(line);
  const map = [
    [/^(renderRoster|renderTeamSlots|toggleSelection|randomizeTeam|drawSlotPetals|specimenLabel|syncFtueSelection)$/, 'Selection screen'],
    [/^(renderAbilities|renderBattleUI|renderTeamStrip|drawStatuses|drawArena|drawGeneva|drawEffects)$/, 'Battle screen'],
    [/^archiveCountLine$/, 'Archive modal'],
    [/^drawFrame$/, 'Masthead'],
    [/^(openSwapModal|performSwap)$/, 'Swap modal'],
    [/^(endBattle)$/, 'Result modal'],
    [/(^renderArchive|Archive|Fragment|RewardReveal)/, 'Archive modal'],
    [/^(addLog|renderBattleLog|describe|executeAbility|handleKnockouts|enemyResponse|tickCycle)$/, 'Battle log'],
    [/^(renderFtue|setFtueStep)$/, 'First-use coach'],
  ];
  for (const [re, name] of map) if (re.test(fn)) return name;
  return 'Other copy';
}

rows.sort((a, b) => {
  const order = ['Masthead', 'Selection screen', 'Roster', 'Abilities', 'Battle screen',
    'Battle log', 'Announcement', 'Floating text', 'First-use coach', 'How-to-play modal',
    'Swap modal', 'Archive modal', 'Result modal', 'Footer', 'Page chrome', 'Other copy'];
  const d = order.indexOf(a.screen) - order.indexOf(b.screen);
  return d || a.location.localeCompare(b.location, undefined, { numeric: true });
});
rows.forEach((r, i) => { r.id = i + 1; });

fs.writeFileSync(`${root}/copy-strings.json`, JSON.stringify(rows, null, 1));
const by = {};
for (const r of rows) by[r.screen] = (by[r.screen] || 0) + 1;
console.log(rows.length, 'distinct strings');
console.log(by);
