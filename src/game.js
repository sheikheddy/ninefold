import './styles.css';
// 130 examined Clematis specimens sampled from a Systematic Botany revision
// (SYSBOT-D-25-00021): 11 South American species with collector and voucher.
import SPECIMENS from './specimens.json';

const SPECIMEN_SPECIES = [...new Set(SPECIMENS.map((record) => record.species))];

const ARCHIVE_STORAGE_KEY = 'ninefold.archive.unlocked.v1';
const FTUE_STORAGE_KEY = 'ninefold.ftue.complete.v1';
const INITIAL_ARCHIVE_UNLOCKS = 3;
const ARCHIVE_FRAGMENTS = Array.from({ length: 14 }, (_, index) => {
  const name = `fragment-${String(index + 1).padStart(2, '0')}.png`;
  // Single-file builds (the shared/hosted page) carry the art inline.
  return window.ARCHIVE_EMBED?.[name] || `/archive/${name}`;
});

function readArchiveProgress() {
  try {
    const stored = Number.parseInt(window.localStorage.getItem(ARCHIVE_STORAGE_KEY) || String(INITIAL_ARCHIVE_UNLOCKS), 10);
    return Math.min(ARCHIVE_FRAGMENTS.length, Math.max(INITIAL_ARCHIVE_UNLOCKS, Number.isFinite(stored) ? stored : INITIAL_ARCHIVE_UNLOCKS));
  } catch {
    return INITIAL_ARCHIVE_UNLOCKS;
  }
}

function readFtueComplete() {
  try {
    return window.localStorage.getItem(FTUE_STORAGE_KEY) === 'true';
  } catch {
    return false;
  }
}

function splitThreeParts(value) {
  const normalized = String(value)
    .replace(/\bthree\b/gi, '៣')
    .replace(/(^|\D)03(?=\D|$)/g, (_, prefix) => `${prefix}3`);
  return normalized.split(/(\bIII\b|3)/g).filter(Boolean).map((part) => ({
    text: part,
    glyph: part === '3' || part === 'III',
  }));
}

function measureSplitCanvasText(targetCtx, value) {
  const fontSize = Number.parseFloat(targetCtx.font.match(/([\d.]+)px/)?.[1] || '12');
  return splitThreeParts(value).reduce((width, part) => (
    width + (part.glyph
      ? targetCtx.measureText('II').width + fontSize * .36 + fontSize * .62
      : targetCtx.measureText(part.text).width)
  ), 0);
}

function fillSplitCanvasText(targetCtx, value, x, y) {
  const parts = splitThreeParts(value);
  const fontSize = Number.parseFloat(targetCtx.font.match(/([\d.]+)px/)?.[1] || '12');
  const totalWidth = measureSplitCanvasText(targetCtx, value);
  const originalAlign = targetCtx.textAlign;
  let cursor = x;
  if (originalAlign === 'center') cursor -= totalWidth / 2;
  if (originalAlign === 'right' || originalAlign === 'end') cursor -= totalWidth;
  targetCtx.save();
  targetCtx.textAlign = 'left';
  parts.forEach((part) => {
    if (!part.glyph) {
      targetCtx.fillText(part.text, cursor, y);
      cursor += targetCtx.measureText(part.text).width;
      return;
    }
    targetCtx.fillText('II', cursor, y);
    cursor += targetCtx.measureText('II').width + fontSize * .36;
    const barLength = fontSize * .62;
    const barThickness = Math.max(1, fontSize * .09);
    targetCtx.save();
    targetCtx.translate(cursor + barLength / 2, y - fontSize * .28);
    targetCtx.rotate(-Math.PI / 30);
    targetCtx.fillRect(-barLength / 2, -barThickness / 2, barLength, barThickness);
    targetCtx.restore();
    cursor += barLength;
  });
  targetCtx.restore();
}

function createSplitThree() {
  const split = document.createElement('span');
  split.className = 'split-three';
  split.setAttribute('role', 'img');
  split.setAttribute('aria-label', 'three');
  split.innerHTML = '<span aria-hidden="true">II</span><span class="split-three-side" aria-hidden="true">I</span>';
  return split;
}

function splitThreeTextNode(node) {
  if (!/[3]|\bIII\b|\bthree\b/i.test(node.nodeValue || '') || node.parentElement?.closest('.split-three, script, style, textarea')) return;
  const replacement = document.createDocumentFragment();
  splitThreeParts(node.nodeValue).forEach((part) => {
    replacement.append(part.glyph ? createSplitThree() : document.createTextNode(part.text));
  });
  node.replaceWith(replacement);
}

function splitVisibleThrees(root) {
  if (root.nodeType === Node.TEXT_NODE) {
    splitThreeTextNode(root);
    return;
  }
  if (root.nodeType !== Node.ELEMENT_NODE) return;
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const textNodes = [];
  while (walker.nextNode()) textNodes.push(walker.currentNode);
  textNodes.forEach(splitThreeTextNode);
}

function installSplitThreeTypography() {
  splitVisibleThrees(document.body);
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.type === 'characterData') splitThreeTextNode(mutation.target);
      mutation.addedNodes.forEach(splitVisibleThrees);
    });
  });
  observer.observe(document.body, { childList: true, characterData: true, subtree: true });
}

const CHARACTERS = [
  {
    id: 'thoth', name: 'THOTH', verse: ['THOTH WRITES: I WANT', 'The papyrus answers: become.'], stageLine: 'THOTH WRITES THE WOUND', domain: 'SCRIBE', symbol: '𓅝',
    accent: '#61e7e1', dark: '#17394a', hp: 104, power: 17, speed: 17,
    lore: 'The sign enters the body; possibility begins calling itself memory.',
    abilities: [
      { name: 'A REED ENTERS THE DARK', icon: '⌇', desc: 'The dark remembers it as light.', kind: 'damage', power: 15, gain: 24 },
      { name: 'GLYPHS GATHER AROUND YOU', icon: '▧', desc: 'A sentence pretending to be shelter.', kind: 'shield', power: 30, gain: 16, cooldown: 2 },
      { name: 'FIVE DAYS FALL FROM THE MOON', icon: '◫', desc: 'Time survives by learning to cheat.', kind: 'damage', power: 28, cost: 65, effect: 'weaken', rewind: 1, cooldown: 3 },
    ],
  },
  {
    id: 'prometheus', name: 'PROMETHEUS', verse: ['PROMETHEUS STEALS THE FIRE', 'The fire steals his name.'], stageLine: 'PROMETHEUS KISSES THE FLAME', domain: 'FLAME', symbol: '♨',
    accent: '#ff774f', dark: '#512033', hp: 112, power: 20, speed: 13,
    lore: 'He calls it theft until the fire begins to call him home.',
    abilities: [
      { name: 'FIRE HIDES IN THE FENNEL', icon: '◆', desc: 'A hollow stem carries tomorrow.', kind: 'damage', power: 17, gain: 24 },
      { name: 'THE EAGLE RETURNS AT DAWN', icon: '♨', desc: 'The wound is eaten; the wound returns.', kind: 'damage', power: 13, gain: 14, effect: 'burn', selfRegen: 2, cooldown: 2 },
      { name: 'THE FIRST FIRE REMEMBERS', icon: '✦', desc: 'Every touch wants to become ash.', kind: 'damage', power: 34, cost: 65, recoil: 7, cooldown: 3 },
    ],
  },
  {
    id: 'minerva', name: 'MINERVA', verse: ['MINERVA DRAWS THE END', 'Then teaches the spear to arrive there.'], stageLine: 'MINERVA DIAGRAMS THE LOSS', domain: 'CRAFT', symbol: '⚒',
    accent: '#ffce6c', dark: '#52362c', hp: 118, power: 16, speed: 14,
    lore: 'The plan is a future wound drawn carefully enough to resemble mercy.',
    abilities: [
      { name: 'THE SPEAR FINDS THE MARGIN', icon: '↗', desc: 'Where the plan forgot its body.', kind: 'damage', power: 14, gain: 25 },
      { name: 'AEGIS: A BRIGHT REFUSAL', icon: '⬡', desc: 'The blow arrives; you remain elsewhere.', kind: 'shield', power: 36, gain: 14, cooldown: 2 },
      { name: 'THE HELMET BREAKS THE FATHER', icon: '⌘', desc: 'A thought arrives already armed.', kind: 'damage', power: 23, cost: 65, heal: 14, cooldown: 3 },
    ],
  },
  {
    id: 'quetzalcoatl', name: 'QUETZALCŌĀTL', verse: ['QUETZALCŌĀTL BECOMES WIND', 'To touch the world without staying.'], stageLine: 'QUETZALCŌĀTL ENTERS AS WEATHER', domain: 'WIND', symbol: '〰',
    accent: '#70ef8e', dark: '#1a4a43', hp: 108, power: 17, speed: 19,
    lore: 'To become weather: to touch everything and belong nowhere.',
    abilities: [
      { name: 'THE WIND JEWEL TURNS', icon: '〽', desc: 'A conch remembers every hurricane.', kind: 'damage', power: 14, gain: 26 },
      { name: 'BONES RETURN FROM MICTLAN', icon: '☼', desc: 'Blood teaches the dead to rise.', kind: 'heal', power: 24, gain: 13, revive: 22, cooldown: 2 },
      { name: 'THE MORNING STAR OPENS', icon: '◉', desc: 'Ash lifts its heart into dawn.', kind: 'damage', power: 27, cost: 65, effect: 'burn', cooldown: 3 },
    ],
  },
  {
    id: 'erlang', name: 'ERLANG SHEN', verse: ['ERLANG OPENS THE PARIETAL EYE', 'The mask confesses before the mouth.'], stageLine: 'ERLANG NAMES WHAT HIDES', domain: 'INSIGHT', symbol: '◈',
    accent: '#62a9ff', dark: '#20355f', hp: 110, power: 18, speed: 18,
    lore: 'He looks until concealment becomes another form of confession.',
    abilities: [
      { name: 'THE TRIDENT ASKS ONCE', icon: 'Ψ', desc: 'The wound answers without language.', kind: 'damage', power: 15, gain: 24 },
      { name: 'THE TRUE EYE TOUCHES YOU', icon: '◉', desc: 'Now hiding has your exact shape.', kind: 'mark', power: 0, gain: 18, cooldown: 2 },
      { name: 'THE HOUND CROSSES HEAVEN', icon: '♞', desc: 'No wall survives being desired.', kind: 'damage', power: 29, cost: 65, pierce: true, cooldown: 3 },
    ],
  },
  {
    id: 'tyr', name: 'TÝR', verse: ['TÝR GIVES THE WOLF A HAND', 'The law keeps what love releases.'], stageLine: 'TÝR SWEARS BY WHAT IS MISSING', domain: 'LAW', symbol: '↑',
    accent: '#b8c7ff', dark: '#303d59', hp: 124, power: 18, speed: 11,
    lore: 'The missing hand remains in every promise made afterward.',
    abilities: [
      { name: 'THE OATH ENTERS THE SWORD', icon: '†', desc: 'Metal repeats what the mouth feared.', kind: 'damage', power: 16, gain: 25 },
      { name: 'THE HAND ENTERS THE BINDING', icon: '◇', desc: 'The wolf closes; the law remains.', kind: 'shield', power: 32, gain: 15, cleanse: true, recoil: 6, cooldown: 2 },
      { name: 'FENRIR PULLS THE SENTENCE', icon: '∞', desc: 'Every promise tightens into chain.', kind: 'damage', power: 27, cost: 65, effect: 'seal', cooldown: 3 },
    ],
  },
  {
    id: 'ogma', name: 'OGMA', verse: ['OGMA CARVES THE TONGUE', 'The cut begins to call itself a word.'], stageLine: 'OGMA SPEAKS THE CUT', domain: 'WORD', symbol: 'ᚑ',
    accent: '#d994ff', dark: '#442d59', hp: 106, power: 19, speed: 16,
    lore: 'A word is the wound after the mouth has given it meaning.',
    abilities: [
      { name: 'OGHAM ENTERS THE SKIN', icon: 'ᚑ', desc: 'A letter looking for its meaning.', kind: 'damage', power: 16, gain: 24 },
      { name: 'THE SWEET WORD LEANS CLOSE', icon: '≈', desc: 'Strength forgets what it was saying.', kind: 'weaken', power: 0, gain: 18, cooldown: 2 },
      { name: 'ORNA RECITES THE WOUND', icon: '!', desc: 'The sword remembers what the hand denied.', kind: 'damage', power: 28, cost: 65, echo: .45, cooldown: 3 },
    ],
  },
  {
    id: 'jacheongbi', name: 'JACHEONGBI', verse: ['JACHEONGBI BURIES THE SEED', 'The earth mistakes grief for spring.'], stageLine: 'JACHEONGBI REAPS WHAT RETURNS', domain: 'HARVEST', symbol: '❋',
    accent: '#f0df73', dark: '#4a4230', hp: 116, power: 15, speed: 15,
    lore: 'What is buried returns, though never in the shape that was mourned.',
    abilities: [
      { name: 'THE SICKLE MAKES A MOON', icon: '◜', desc: 'The body learns harvest by touch.', kind: 'damage', power: 14, gain: 25 },
      { name: 'FIVE GRAINS DREAM DOWNWARD', icon: '❋', desc: 'Roots practice the shape of return.', kind: 'regen', power: 7, gain: 15, cooldown: 2 },
      { name: 'FIVE FLOWERS CROSS THE FIRE', icon: '◒', desc: 'The dead return carrying spring inside.', kind: 'damage', power: 24, cost: 65, heal: 18, revive: 24, cooldown: 3 },
    ],
  },
  {
    id: 'omoikane', name: 'OMOIKANE', verse: ['OMOIKANE THINKS OF THE CAVE', 'The cave begins to think of him.'], stageLine: 'OMOIKANE THINKS PAST THE END', domain: 'MIND', symbol: '⌬',
    accent: '#9d83ff', dark: '#35305f', hp: 102, power: 17, speed: 20,
    lore: 'Each answer opens into another door; foresight becomes a room without exit.',
    abilities: [
      { name: 'A THOUGHT ENTERS YOUR BODY', icon: '⌁', desc: 'Too late, you name it mine.', kind: 'damage', power: 13, gain: 28 },
      { name: 'MANY MINDS BUILD ONE DOOR', icon: '⌬', desc: 'Each answer shoulders another.', kind: 'focus', power: 28, shield: 12, counsel: 10, gain: 0, cooldown: 2 },
      { name: 'THE CAVE CLOSES SOFTLY', icon: '◩', desc: 'Outside, the world forgets to happen.', kind: 'damage', power: 25, cost: 65, effect: 'seal', cooldown: 3 },
    ],
  },
];

const $ = (selector) => document.querySelector(selector);
const selectionScreen = $('#selection-screen');
const battleScreen = $('#battle-screen');
const characterGrid = $('#character-grid');
const teamSlots = $('#team-slots');
const startButton = $('#start-button');
const randomButton = $('#random-button');
const archiveButton = $('#archive-button');
const ftueCoach = $('#ftue-coach');
const selectionHint = $('#selection-hint');
const modalBackdrop = $('#modal-backdrop');
const abilityList = $('#ability-list');
const battleLog = $('#battle-log');
const swapButton = $('#swap-button');
const canvas = $('#battle-canvas');
const ctx = canvas.getContext('2d');
ctx.imageSmoothingEnabled = false;

const state = {
  selected: [],
  battle: null,
  muted: false,
  effects: [],
  lastFrame: performance.now(),
  portraitFrame: -1,
  archive: {
    unlocked: readArchiveProgress(),
    selected: 0,
  },
  ftue: {
    active: !readFtueComplete(),
    step: 'choose-first',
  },
};

const FTUE_STEPS = {
  'choose-first': {
    index: 0,
    kicker: '[FIRST TOUCH: A NAME]<br>CHOICE BEGINS THE ORDEAL',
    title: 'TOUCH ONE PORTRAIT<br>LET THE PORTRAIT ANSWER',
    copy: 'No wrong figure waits here.<br>Begin with whoever watches back.',
    target: () => characterGrid,
  },
  'choose-more': {
    index: 1,
    kicker: '[SECOND TOUCH: A CHORUS]<br>ONE BODY CANNOT HOLD THE SCENE',
    title: 'CHOOSE TWO MORE NAMES<br>MAKE A CHORUS OF WOUNDS',
    copy: 'Your order decides who enters first.<br>Touch a chosen name to release it.',
    target: () => characterGrid,
  },
  enter: {
    index: 2,
    kicker: '[▄ ▄ ▄ ▄▄▄ ▄▄▄ ▄▄▄ ▄ ▄ ▄ TOUCH: THE DOOR]<br>THE CHORUS HAS LEARNED YOUR NAME',
    title: 'ENTER THE FIGURE NOW<br>LET THE ORDEAL ANSWER BACK',
    copy: 'Your first name will lead the scene.<br>The others wait inside the wound.',
    target: () => startButton,
  },
  act: {
    index: 3,
    kicker: '[FIRST ACT: DESIRE]<br>THE SMALL MOVE TEACHES THE LARGE',
    title: 'USE THE FIRST ABILITY<br>LET THE ACT TEACH YOUR HAND',
    copy: 'Ordinary moves gather Desire.<br>The violet bar remembers each act.',
    target: () => abilityList.querySelector('.ability-button:not(:disabled)') || abilityList,
  },
  focus: {
    index: 4,
    kicker: '[THE LESSON: HUNGER]<br>DESIRE KEEPS WHAT ACTION GIVES',
    title: 'FEED THE VIOLET BAR<br>EACH ACT GATHERS DESIRE',
    copy: 'At 65 the last move wakes.<br>Keep acting; the bar remembers.',
    target: () => $('.focus-meter'),
  },
  ultimate: {
    index: 4,
    kicker: '[THE LESSON: SPENDING]<br>DESIRE BECOMES THE EVENT',
    title: 'THE LAST MOVE IS AWAKE<br>SPEND WHAT YOU GATHERED',
    copy: 'Touch the burning third figure.<br>Watch hunger become an event.',
    target: () => abilityList.querySelectorAll('.ability-button')[2] || abilityList,
  },
  endure: {
    index: 5,
    kicker: '[THE GUIDE WITHDRAWS]<br>HUNGER CONTINUES WITHOUT IT',
    title: 'THE SCENE IS YOURS NOW<br>SWAP WHEN A BODY FALTERS',
    copy: 'Change the beloved to save them.<br>Or press on until one side is gone.',
    target: () => swapButton,
    finish: true,
  },
};

class PixelSound {
  constructor() {
    this.context = null;
    this.musicGain = null;
    this.musicBus = null;
    this.musicFilter = null;
    this.musicDelay = null;
    this.musicTimer = null;
    this.musicStep = 0;
  }
  ensure() {
    if (!this.context) {
      this.context = new (window.AudioContext || window.webkitAudioContext)();
      this.musicGain = this.context.createGain();
      this.musicBus = this.context.createGain();
      this.musicFilter = this.context.createBiquadFilter();
      this.musicDelay = this.context.createDelay(1.4);
      const echoReturn = this.context.createGain();
      const echoFeedback = this.context.createGain();

      this.musicGain.gain.value = state.muted ? 0 : .74;
      this.musicBus.gain.value = .92;
      this.musicFilter.type = 'lowpass';
      this.musicFilter.frequency.value = 1850;
      this.musicFilter.Q.value = .5;
      this.musicDelay.delayTime.value = .47;
      echoReturn.gain.value = .16;
      echoFeedback.gain.value = .19;

      this.musicBus.connect(this.musicFilter).connect(this.musicGain);
      this.musicFilter.connect(this.musicDelay).connect(echoReturn).connect(this.musicGain);
      this.musicDelay.connect(echoFeedback).connect(this.musicDelay);
      this.musicGain.connect(this.context.destination);
    }
    if (this.context.state === 'suspended') this.context.resume();
    if (!this.musicTimer && !state.muted) this.startMusic();
  }
  tone(freq = 220, duration = .08, type = 'square', volume = .035, delay = 0) {
    if (state.muted) return;
    this.ensure();
    const at = this.context.currentTime + delay;
    const osc = this.context.createOscillator();
    const gain = this.context.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, at);
    osc.frequency.exponentialRampToValueAtTime(Math.max(40, freq * .72), at + duration);
    gain.gain.setValueAtTime(volume, at);
    gain.gain.exponentialRampToValueAtTime(.0001, at + duration);
    osc.connect(gain).connect(this.context.destination);
    osc.start(at); osc.stop(at + duration);
  }
  musicVoice(freq, duration, partials, volume, delay = 0, attack = .08) {
    if (!this.context || state.muted) return;
    const at = this.context.currentTime + delay;
    partials.forEach(({ ratio, level, type = 'sine', detune = 0 }) => {
      const osc = this.context.createOscillator();
      const gain = this.context.createGain();
      const crest = Math.min(at + attack, at + duration * .45);
      osc.type = type;
      osc.frequency.setValueAtTime(freq * ratio, at);
      osc.detune.setValueAtTime(detune + Math.sin(this.musicStep * 1.17) * 2.5, at);
      gain.gain.setValueAtTime(.0001, at);
      gain.gain.exponentialRampToValueAtTime(Math.max(.0002, volume * level), crest);
      gain.gain.setValueAtTime(Math.max(.0002, volume * level * .82), Math.max(crest, at + duration * .68));
      gain.gain.exponentialRampToValueAtTime(.0001, at + duration);
      osc.connect(gain).connect(this.musicBus);
      osc.start(at);
      osc.stop(at + duration + .04);
    });
  }
  chantNote(freq, duration = .62, volume = .009, delay = 0) {
    this.musicVoice(freq, duration, [
      { ratio: 1, level: 1, type: 'triangle', detune: -2 },
      { ratio: 2, level: .13, type: 'sine', detune: 3 },
    ], volume, delay, .075);
  }
  organNote(freq, duration = 3.1, volume = .008, delay = 0) {
    this.musicVoice(freq, duration, [
      { ratio: .5, level: .38 },
      { ratio: 1, level: 1 },
      { ratio: 2, level: .24 },
      { ratio: 3, level: .07 },
    ], volume, delay, .34);
  }
  chapelBell(freq, duration = 2.2, volume = .008, delay = 0) {
    this.musicVoice(freq, duration, [
      { ratio: 1, level: 1 },
      { ratio: 2.01, level: .42, type: 'triangle' },
      { ratio: 3.98, level: .09 },
    ], volume, delay, .012);
  }
  glideNote(freq, duration = .8, volume = .003, endRatio = 1.45, type = 'triangle') {
    if (!this.context || state.muted) return;
    const at = this.context.currentTime;
    const osc = this.context.createOscillator();
    const gain = this.context.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, at);
    osc.frequency.exponentialRampToValueAtTime(freq * endRatio, at + duration);
    gain.gain.setValueAtTime(.0001, at);
    gain.gain.exponentialRampToValueAtTime(volume, at + .12);
    gain.gain.exponentialRampToValueAtTime(.0001, at + duration);
    osc.connect(gain).connect(this.musicBus);
    osc.start(at);
    osc.stop(at + duration + .04);
  }
  characterVoice(characterId, step, root, call) {
    if (!characterId) return;
    if (characterId === 'thoth' && (step === 2 || step === 6)) {
      this.chapelBell((call || root * 2) * 2, 1.25, .0028);
    } else if (characterId === 'prometheus' && (step === 3 || step === 7)) {
      this.glideNote(root * 3, .72, .0027, 1.34, 'sawtooth');
    } else if (characterId === 'minerva' && [1, 4, 7].includes(step)) {
      this.musicVoice(root * 4, .17, [{ ratio: 1, level: 1, type: 'square' }], .0021, 0, .018);
    } else if (characterId === 'quetzalcoatl' && (step === 0 || step === 4)) {
      this.glideNote(root * 2.5, 1.05, .0031, step === 0 ? 1.62 : .72);
    } else if (characterId === 'erlang' && step === 4) {
      this.musicVoice(root * 3, .78, [
        { ratio: 1, level: 1, type: 'triangle' },
        { ratio: 1.5, level: .45 },
        { ratio: 2.25, level: .16 },
      ], .0033, 0, .045);
    } else if (characterId === 'tyr' && (step === 0 || step === 8)) {
      this.organNote(root * (step === 0 ? 1 : 2), 1.35, .0041);
    } else if (characterId === 'ogma' && call) {
      this.musicVoice(call * 2, .14, [{ ratio: 1, level: 1, type: 'square' }], .00165, 0, .012);
    } else if (characterId === 'jacheongbi' && step >= 4) {
      const grainRatios = [1, 1.125, 1.25, 1.5, 1.6875];
      this.musicVoice(root * 2 * grainRatios[step - 4], .52, [{ ratio: 1, level: 1, type: 'triangle' }], .0026, 0, .035);
    } else if (characterId === 'omoikane' && step === 4) {
      this.musicVoice(root * 2, 1.05, [
        { ratio: 1, level: 1 },
        { ratio: 1.25, level: .43 },
        { ratio: 1.5, level: .32 },
        { ratio: 2, level: .14 },
      ], .0034, 0, .19);
    }
  }
  musicTick() {
    // A novena: nine nine-beat petitions. The call climbs night by night to the
    // seventh, descends through the eighth, and the ninth closes on the amen.
    const petitions = [
      [293.66, null, 349.23, 329.63, 293.66, 261.63, 293.66, 220, null],
      [293.66, null, 392, 349.23, 329.63, 293.66, 261.63, 220, null],
      [349.23, null, 440, 392, 349.23, 329.63, 293.66, 261.63, null],
      [293.66, 329.63, 349.23, null, 392, 349.23, 329.63, 293.66, null],
      [349.23, null, 392, 440, 392, 349.23, 329.63, 349.23, null],
      [392, null, 466.16, 440, 392, 349.23, 329.63, 293.66, null],
      [440, null, 523.25, 466.16, 440, 392, 349.23, 329.63, null],
      [349.23, 329.63, 293.66, null, 261.63, 293.66, 329.63, 293.66, null],
      [293.66, 220, 293.66, 349.23, 329.63, 293.66, 261.63, 220, 293.66],
    ];
    const responses = [
      [null, null, null, null, 220, null, 261.63, 220, 196],
      [null, null, null, null, 196, null, 220, 196, 174.61],
      [null, null, null, null, 261.63, null, 246.94, 220, 196],
      [null, null, null, null, 220, null, 261.63, 220, 174.61],
      [null, null, null, null, 233.08, null, 220, 196, 174.61],
      [null, null, null, null, 233.08, null, 220, 196, 196],
      [null, null, null, null, 261.63, null, 246.94, 220, 220],
      [null, null, null, null, 196, null, 220, 196, 196],
      [null, null, null, null, 220, null, 196, 220, 146.83],
    ];
    const roots = [146.83, 116.54, 130.81, 174.61, 116.54, 196, 220, 130.81, 146.83];
    const rubato = [390, 325, 345, 365, 330, 350, 405, 325, 510];
    const prayer = Math.floor(this.musicStep / 9) % petitions.length;
    const step = this.musicStep % 9;
    if (!state.muted && this.context) {
      const call = petitions[prayer][step];
      const response = responses[prayer][step];
      const root = roots[prayer];

      if (step === 0) {
        this.organNote(root, 3.18, .0095);
        this.organNote(root * 1.5, 3.05, .0048, .06);
        this.chapelBell(root * 4, 2.45, prayer === 8 ? .008 : .006);
      }
      if (call) this.chantNote(call, step === 8 ? 1.05 : .67, .0094);
      if (response) this.chantNote(response, .82, .0048, .055);
      if (step === 8 && prayer < 8) this.chapelBell(root * 6, 1.55, .0037, .04);
      if (step === 8 && prayer === 8) {
        this.organNote(146.83, 3.45, .011);
        this.chapelBell(587.33, 3.1, .009);
      }
      const activeVoice = getActive('player')?.id || state.selected[state.selected.length - 1];
      this.characterVoice(activeVoice, step, root, call);
    }
    this.musicStep += 1;
    this.musicTimer = window.setTimeout(() => {
      this.musicTimer = null;
      this.musicTick();
    }, rubato[step]);
  }
  startMusic() {
    if (this.musicTimer) return;
    this.musicTick();
  }
  setMuted(muted) {
    if (!muted) this.ensure();
    if (!this.musicGain || !this.context) return;
    const now = this.context.currentTime;
    this.musicGain.gain.cancelScheduledValues(now);
    this.musicGain.gain.setTargetAtTime(muted ? .0001 : .74, now, .035);
  }
  click() { this.tone(440, .045, 'square', .025); }
  hit() { this.tone(135, .11, 'sawtooth', .045); this.tone(82, .08, 'square', .025, .03); }
  heal() { [0, .07, .14].forEach((delay, index) => this.tone(420 + index * 130, .12, 'sine', .032, delay)); }
  shield() { this.tone(260, .18, 'triangle', .04); this.tone(520, .13, 'square', .018, .05); }
  ultimate() { [0, .06, .12].forEach((delay, index) => this.tone(150 + index * 90, .18, 'sawtooth', .04, delay)); }
  victory() { [0, .12, .24, .38].forEach((delay, index) => this.tone([262,330,392,523][index], .3, 'square', .03, delay)); }
}
const sound = new PixelSound();

function cloneFighter(character, side, index) {
  return {
    ...character,
    side, index,
    maxHp: character.hp,
    currentHp: character.hp,
    focus: 0,
    shield: 0,
    lastDamage: 0,
    cooldowns: [0, 0, 0],
    status: { burn: 0, weaken: 0, mark: 0, seal: 0, regen: 0 },
  };
}

function clearFtueTarget() {
  document.querySelectorAll('.ftue-target').forEach((element) => element.classList.remove('ftue-target'));
}

function renderFtue() {
  clearFtueTarget();
  if (!state.ftue.active) {
    ftueCoach.hidden = true;
    return;
  }
  const step = FTUE_STEPS[state.ftue.step];
  if (!step) return;
  ftueCoach.hidden = false;
  $('#ftue-kicker').innerHTML = step.kicker;
  $('#ftue-title').innerHTML = step.title;
  $('#ftue-copy').innerHTML = step.copy;
  $('#ftue-continue').hidden = !step.finish;
  [...$('#ftue-progress').children].forEach((mark, index) => {
    mark.classList.toggle('complete', index < step.index);
    mark.classList.toggle('current', index === step.index);
  });
  step.target()?.classList.add('ftue-target');
}

function setFtueStep(stepName, scroll = true) {
  if (!state.ftue.active || !FTUE_STEPS[stepName]) return;
  const changed = state.ftue.step !== stepName;
  state.ftue.step = stepName;
  renderFtue();
  if (scroll && changed) {
    window.setTimeout(() => FTUE_STEPS[stepName].target()?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 80);
  }
}

function syncFtueSelection() {
  if (!state.ftue.active || state.battle) return;
  if (state.selected.length === 0) setFtueStep('choose-first', false);
  else if (state.selected.length < 3) setFtueStep('choose-more');
  else setFtueStep('enter');
}

function syncFtueBattle() {
  if (!state.ftue.active || !state.battle || state.battle.over) return;
  if (state.ftue.step !== 'focus' && state.ftue.step !== 'ultimate') return;
  const player = getActive('player');
  if (!player) return;
  const ultimate = player.abilities[2];
  const awake = player.cooldowns[2] === 0 && player.focus >= (ultimate.cost || 0) && player.status.seal === 0;
  setFtueStep(awake ? 'ultimate' : 'focus', false);
}

function completeFtue() {
  state.ftue.active = false;
  clearFtueTarget();
  ftueCoach.hidden = true;
  try {
    window.localStorage.setItem(FTUE_STORAGE_KEY, 'true');
  } catch {
    // Completion still lasts for this visit when storage is unavailable.
  }
}

function restartFtue() {
  state.ftue.active = true;
  try {
    window.localStorage.removeItem(FTUE_STORAGE_KEY);
  } catch {
    // The guide can still restart for this visit.
  }
  closeModal();
  if (state.battle && !state.battle.over) setFtueStep('act');
  else syncFtueSelection();
}

function renderRoster() {
  characterGrid.innerHTML = '';
  CHARACTERS.forEach((character, index) => {
    const selectedIndex = state.selected.indexOf(character.id);
    const button = document.createElement('button');
    button.type = 'button';
    button.className = `character-card${selectedIndex >= 0 ? ' selected' : ''}${state.selected.length >= 3 && selectedIndex < 0 ? ' disabled' : ''}`;
    button.disabled = state.selected.length >= 3 && selectedIndex < 0;
    button.style.setProperty('--accent', character.accent);
    button.title = `${character.verse.join(' — ')} ${character.lore}`;
    button.setAttribute('aria-pressed', selectedIndex >= 0 ? 'true' : 'false');
    button.setAttribute('aria-label', `${character.name}. ${character.verse.join(' ')}`);
    button.innerHTML = `
      <span class="card-index">0${index + 1}</span><span class="selected-tick">${selectedIndex >= 0 ? selectedIndex + 1 : '✓'}</span>
      <span class="portrait-wrap"><canvas width="128" height="128" aria-hidden="true"></canvas></span>
      <span class="card-info"><strong>${character.verse[0]}</strong><small>${character.verse[1]}</small><span class="card-domain">${character.symbol}</span></span>`;
    button.addEventListener('click', () => toggleSelection(character.id));
    characterGrid.appendChild(button);
    const portrait = button.querySelector('canvas');
    portrait.dataset.characterId = character.id;
    const portraitCtx = portrait.getContext('2d');
    portraitCtx.imageSmoothingEnabled = false;
    drawPortrait(portraitCtx, character);
  });
  renderTeamSlots();
}

// Each slot is a realistic clematis seen from above; the chosen character
// stands in the middle as stigma, pistil, and ovary. Choosing plucks the
// petals one by one — she loves me, she loves me not.
const slotPetalMemory = [null, null, null];

// Every slot flower is a real examined specimen: the voucher seeds the petal
// wobble, the species sets the hue, and the label reads like the sheet.
const slotSpecimens = [null, null, null];

function randomSpecimen() {
  return SPECIMENS[Math.floor(Math.random() * SPECIMENS.length)];
}

function specimenSeed(record) {
  const key = `${record.species}${record.collector}${record.number || ''}`;
  let hash = 0;
  for (let i = 0; i < key.length; i += 1) hash = (hash * 31 + key.charCodeAt(i)) % 100000;
  return hash / 977;
}

function specimenLabel(record) {
  const where = [record.state, record.locality].filter(Boolean).join(': ');
  const voucher = [record.collector, record.number].filter(Boolean).join(' ')
    + (record.herbarium ? ` (${record.herbarium})` : '');
  return [
    record.species,
    [record.country, where].filter(Boolean).join(', '),
    [record.phen, record.date].filter(Boolean).join(', '),
    voucher,
  ].filter(Boolean).join(' — ');
}

// Modeled on clematis 'The President': six broad violet sepals that overlap
// at the base, and a spidery crown of pale stamens tipped in dark maroon.
// Every measurement carries a seeded wobble so no petal repeats another.
function petalWobble(seed, salt) {
  const raw = Math.sin(seed * 127.1 + salt * 311.7) * 43758.5453;
  return raw - Math.floor(raw); // stable 0..1, per petal, per property
}

function drawSlotPetals(petalCtx, fallStart, now, includeCenter, seed = 0, hueBase = 251) {
  petalCtx.clearRect(0, 0, 280, 280);
  petalCtx.save();
  petalCtx.scale(2, 2);
  const mid = 70; // the flower's centre in drawing units
  for (let i = 0; i < 6; i += 1) {
    const wob = (salt) => petalWobble(seed * 6 + i, salt) - .5;
    let drop = 0;
    let spin = 0;
    let alpha = 1;
    let wilt = 0;
    if (fallStart) {
      const dt = now - fallStart - i * 150;
      if (dt > 0) {
        wilt = Math.min(1, dt / 430); // it browns and curls before it lets go
        const fallT = Math.max(0, dt - 400);
        drop = ((fallT / 120) ** 1.6) * 6;
        spin = (i % 2 ? 1 : -1) * fallT * .0018;
        alpha = Math.max(0, 1 - fallT / 620);
        if (alpha <= 0) continue;
      }
    }
    const length = 43 + wob(1) * 6;
    const halfLeft = 16 + wob(2) * 4;
    const halfRight = 16 + wob(3) * 4;
    const bend = wob(4) * 7; // the tip leans a little off its axis
    const hue = hueBase + wob(5) * 7;
    // Wilt the long way round the wheel — violet browns through magenta and
    // red, never through green.
    const wiltHue = hue + (390 - hue) * wilt * .85;
    const wiltSat = 47 - wilt * 26;
    petalCtx.save();
    petalCtx.globalAlpha = alpha * .97;
    petalCtx.translate(mid + (i % 2 ? drop * .3 : -drop * .25), mid + drop);
    petalCtx.rotate((Math.PI / 3) * i + wob(6) * .3 + spin);
    petalCtx.scale(1.36 * (1 - wilt * .42), 1.36 * (1 - wilt * .17)); // curls in as it wilts
    const gradient = petalCtx.createLinearGradient(0, 10, bend, length);
    gradient.addColorStop(0, `hsl(${wiltHue} ${wiltSat}% ${58 - wilt * 16}%)`);
    gradient.addColorStop(.5, `hsl(${wiltHue - 2} ${wiltSat - 2}% ${46 - wilt * 14}%)`);
    gradient.addColorStop(1, `hsl(${wiltHue + 3} ${wiltSat}% ${38 - wilt * 12}%)`);
    petalCtx.fillStyle = gradient;
    petalCtx.beginPath();
    petalCtx.moveTo(0, 10); // broad sepals, overlapping at the base
    petalCtx.bezierCurveTo(
      -halfLeft * .7 + wob(7) * 3, 17 + wob(8) * 3,
      -halfLeft, 25 + wob(9) * 4,
      -halfLeft * .88, 32 + wob(10) * 3,
    );
    petalCtx.bezierCurveTo(
      -halfLeft * .62, 38 + wob(11) * 3,
      bend - halfLeft * .22, length - 3,
      bend, length,
    );
    petalCtx.bezierCurveTo(
      bend + halfRight * .22, length - 3,
      halfRight * .58, 39 + wob(12) * 3,
      halfRight * .86, 32 + wob(13) * 3,
    );
    petalCtx.bezierCurveTo(
      halfRight, 24 + wob(14) * 4,
      halfRight * .68 + wob(15) * 3, 17 + wob(16) * 3,
      0, 10,
    );
    petalCtx.fill();
    petalCtx.strokeStyle = 'rgba(28,18,64,.35)';
    petalCtx.lineWidth = .7;
    petalCtx.stroke();
    petalCtx.strokeStyle = 'rgba(163,146,230,.5)'; // the paler central bar
    petalCtx.lineWidth = 2.4 + wob(17);
    petalCtx.beginPath();
    petalCtx.moveTo(0, 18);
    petalCtx.quadraticCurveTo(bend * .4 + wob(18) * 2, 30, bend * .85, length - 4);
    petalCtx.stroke();
    petalCtx.strokeStyle = 'rgba(30,18,74,.2)'; // faint crooked side veins
    petalCtx.lineWidth = .7;
    [-1, 1].forEach((side) => {
      const spread = (side < 0 ? halfLeft : halfRight) * (.38 + wob(19 + side) * .2);
      petalCtx.beginPath();
      petalCtx.moveTo(0, 17);
      petalCtx.quadraticCurveTo(side * spread, 27 + wob(21 + side) * 4, side * spread * .6 + bend * .6, length - 7);
      petalCtx.stroke();
    });
    petalCtx.restore();
  }
  if (fallStart) {
    // What the flower leaves behind: a head of almond-shaped achenes.
    const set = Math.min(1, Math.max(0, (now - fallStart - 700) / 700));
    if (set > 0) {
      petalCtx.globalAlpha = set;
      for (let i = 0; i < 17; i += 1) {
        const angle = (Math.PI * 2 * i) / 17 + .22;
        const reach = (11 + (i % 3) * 3.2) * set;
        petalCtx.save();
        petalCtx.translate(mid + Math.cos(angle) * reach, mid + Math.sin(angle) * reach);
        petalCtx.rotate(angle + Math.PI / 2);
        petalCtx.strokeStyle = 'rgba(212,196,162,.7)'; // the feathery tail
        petalCtx.lineWidth = 1;
        petalCtx.beginPath();
        petalCtx.moveTo(0, -1.5);
        petalCtx.quadraticCurveTo(3.2, -8, 1.6, -15 * set);
        petalCtx.stroke();
        petalCtx.fillStyle = '#8c6f4a'; // the almond
        petalCtx.beginPath();
        petalCtx.moveTo(0, -5);
        petalCtx.quadraticCurveTo(3.5, -.8, 0, 5.2);
        petalCtx.quadraticCurveTo(-3.5, -.8, 0, -5);
        petalCtx.fill();
        petalCtx.fillStyle = 'rgba(240,227,200,.55)';
        petalCtx.beginPath();
        petalCtx.moveTo(-.3, -3.6);
        petalCtx.quadraticCurveTo(-2, -.5, -.3, 3);
        petalCtx.quadraticCurveTo(-1.3, -.5, -.3, -3.6);
        petalCtx.fill();
        petalCtx.restore();
      }
      petalCtx.globalAlpha = 1;
    }
  }
  if (includeCenter) {
    for (let i = 0; i < 26; i += 1) { // the spidery stamen crown
      const angle = (Math.PI * 2 * i) / 26 + .14;
      const reach = 13 + (i % 3) * 2.9;
      const tipX = mid + Math.cos(angle) * reach;
      const tipY = mid + Math.sin(angle) * reach;
      petalCtx.strokeStyle = 'rgba(236,226,242,.82)';
      petalCtx.lineWidth = .75;
      petalCtx.beginPath();
      petalCtx.moveTo(mid + Math.cos(angle) * 3.4, mid + Math.sin(angle) * 3.4);
      petalCtx.quadraticCurveTo(
        mid + Math.cos(angle + .18) * reach * .6, mid + Math.sin(angle + .18) * reach * .6,
        tipX, tipY,
      );
      petalCtx.stroke();
      petalCtx.fillStyle = '#5d2b45'; // dark maroon anthers
      petalCtx.beginPath();
      petalCtx.ellipse(tipX, tipY, 1.5, .95, angle, 0, Math.PI * 2);
      petalCtx.fill();
    }
    petalCtx.fillStyle = '#f0e9cf'; // the creamy core
    petalCtx.beginPath();
    petalCtx.arc(mid, mid, 4, 0, Math.PI * 2);
    petalCtx.fill();
    petalCtx.fillStyle = '#d8c98e';
    petalCtx.fillRect(mid - 1.4, mid - 1.4, 1.3, 1.3);
    petalCtx.fillRect(mid + .5, mid - .3, 1.1, 1.1);
  }
  petalCtx.restore();
  petalCtx.globalAlpha = 1;
}

function renderTeamSlots() {
  teamSlots.innerHTML = '';
  for (let i = 0; i < 3; i += 1) {
    const id = state.selected[i];
    const character = CHARACTERS.find((item) => item.id === id);
    const slot = document.createElement('div');
    slot.className = `team-slot${character ? ' filled' : ''}`;
    slot.style.setProperty('--slot-color', character?.accent || '#33405d');
    // A freshly emptied slot sheds its pressed specimen and grows a new one.
    if (!slotSpecimens[i] || (!character && slotPetalMemory[i])) slotSpecimens[i] = randomSpecimen();
    const specimen = slotSpecimens[i];
    const seed = specimenSeed(specimen);
    const hueBase = 243 + SPECIMEN_SPECIES.indexOf(specimen.species) * 2.1;
    const label = specimenLabel(specimen);
    slot.title = character ? `${character.name} presses ${label}` : label;
    slot.setAttribute('aria-label', character
      ? `Slot ${i + 1}: ${character.name}, pressing ${label}`
      : `Slot ${i + 1}: empty — ${label}`);
    slot.addEventListener('pointerenter', () => {
      const caption = $('#specimen-caption');
      if (caption) caption.textContent = slot.title;
    });
    const petals = document.createElement('canvas');
    petals.width = 280; petals.height = 280;
    petals.className = 'slot-petals';
    slot.appendChild(petals);
    const petalCtx = petals.getContext('2d');
    if (character) {
      const mini = document.createElement('canvas');
      mini.width = 64; mini.height = 64;
      mini.dataset.characterId = character.id;
      drawPortrait(mini.getContext('2d'), character);
      slot.appendChild(mini);
      if (slotPetalMemory[i] !== character.id && !hairStill) {
        slotPetalMemory[i] = character.id;
        const fallStart = performance.now();
        const pluck = (now) => {
          drawSlotPetals(petalCtx, fallStart, now, false, seed, hueBase);
          if (now < fallStart + 1600 && petals.isConnected) requestAnimationFrame(pluck);
        };
        requestAnimationFrame(pluck);
      } else {
        // The petals already fell for this keeper; the seed head stays.
        slotPetalMemory[i] = character.id;
        drawSlotPetals(petalCtx, -9000, 0, false, seed, hueBase);
      }
    } else {
      slotPetalMemory[i] = null;
      drawSlotPetals(petalCtx, 0, 0, true, seed, hueBase);
    }
    teamSlots.appendChild(slot);
  }
  const caption = $('#specimen-caption');
  if (caption && !caption.textContent) caption.textContent = teamSlots.firstChild?.title || '';
  startButton.disabled = state.selected.length !== 3;
  // A full chorus pins the door to the bottom of the screen.
  $('.selection-footer')?.classList.toggle('ready', state.selected.length === 3);
  const selectionVerses = [
    'NO ONE IS CHOSEN; THEREFORE<br>EVERYONE IS ALREADY LOST.',
    'ONE NAME ENTERS YOU;<br>TWO ABSENCES WAIT OUTSIDE.',
    'TWO BODIES MAKE A SECRET;<br>THE THIRD WILL MAKE IT FATE.',
    'THREE NAMES INSIDE THE MOUTH;<br>SAY GO, AND BECOME THEIR AFTERMATH.',
  ];
  selectionHint.innerHTML = selectionVerses[state.selected.length];
  syncFtueSelection();
}

function toggleSelection(id) {
  sound.click();
  const index = state.selected.indexOf(id);
  if (index >= 0) state.selected.splice(index, 1);
  else if (state.selected.length < 3) state.selected.push(id);
  renderRoster();
}

function randomizeTeam() {
  sound.click();
  state.selected = [...CHARACTERS].sort(() => Math.random() - .5).slice(0, 3).map((character) => character.id);
  renderRoster();
}

function startBattle() {
  if (state.selected.length !== 3) return;
  sound.ultimate();
  const playerCharacters = state.selected.map((id) => CHARACTERS.find((character) => character.id === id));
  let enemyPool = CHARACTERS.filter((character) => !state.selected.includes(character.id));
  if (enemyPool.length < 3) enemyPool = [...CHARACTERS];
  const enemyCharacters = enemyPool.sort(() => Math.random() - .5).slice(0, 3);
  state.battle = {
    playerTeam: playerCharacters.map((character, index) => cloneFighter(character, 'player', index)),
    enemyTeam: enemyCharacters.map((character, index) => cloneFighter(character, 'enemy', index)),
    playerActive: 0,
    enemyActive: 0,
    round: 1,
    locked: false,
    over: false,
    log: [],
    metrics: { turns: 0, damage: 0, kos: 0 },
    hitFlash: { player: 0, enemy: 0 },
    motion: {
      player: { type: 'idle', start: 0, duration: 0 },
      enemy: { type: 'idle', start: 0, duration: 0 },
    },
  };
  selectionScreen.hidden = true;
  battleScreen.hidden = false;
  addLog(`<b>${playerCharacters[0].name}</b> enters the sentence;<br>the sentence closes around them.`, 'player');
  addLog(`<b>${enemyCharacters[0].name}</b> answers from the other side;<br>desire invents an enemy to survive.`, 'enemy');
  announce('THE FIGURE BEGINS', 'EVERY BEGINNING HIDES AN END');
  renderBattleUI();
  setFtueStep('act');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function getActive(side) {
  if (!state.battle) return null;
  return side === 'player'
    ? state.battle.playerTeam[state.battle.playerActive]
    : state.battle.enemyTeam[state.battle.enemyActive];
}

function aliveFighters(side) {
  const team = side === 'player' ? state.battle.playerTeam : state.battle.enemyTeam;
  return team.filter((fighter) => fighter.currentHp > 0);
}

function renderBattleUI() {
  const battle = state.battle;
  if (!battle) return;
  const player = getActive('player');
  $('#round-value').textContent = String(battle.round).padStart(2, '0');
  $('#active-name').textContent = player.stageLine;
  $('#active-domain').textContent = player.symbol;
  $('#active-domain').style.color = player.accent;
  $('#hp-value').textContent = `${Math.max(0, player.currentHp)} / ${player.maxHp}${player.shield ? ` +${player.shield}` : ''}`;
  const hpPercent = Math.max(0, (player.currentHp / player.maxHp) * 100);
  $('#hp-fill').style.width = `${hpPercent}%`;
  $('#hp-fill').classList.toggle('low', hpPercent <= 30);
  $('#focus-value').textContent = `${player.focus} / 100`;
  $('#focus-fill').style.width = `${player.focus}%`;
  renderAbilities(player);
  renderBattleLog();
  renderTeamStrip('player');
  renderTeamStrip('enemy');
  swapButton.disabled = battle.locked || aliveFighters('player').length < 2;
  syncFtueBattle();
  renderFtue();
}

function renderAbilities(player) {
  abilityList.innerHTML = '';
  player.abilities.forEach((ability, index) => {
    const cooldown = player.cooldowns[index];
    const insufficient = ability.cost && player.focus < ability.cost;
    const sealed = index === 2 && player.status.seal > 0;
    const disabled = state.battle.locked || cooldown > 0 || insufficient || sealed;
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'ability-button';
    button.style.setProperty('--ability-color', index === 2 ? player.accent : index === 1 ? '#9d83ff' : '#61e7e1');
    button.disabled = disabled;
    let cost = ability.cost
      ? `${ability.cost} DESIRE<br>TO BECOME THE ACT`
      : `GAIN ${ability.gain || 0} DESIRE<br>THE BODY LEARNS TO WANT`;
    if (cooldown > 0) cost = `WAIT ${cooldown} BREATH${cooldown === 1 ? '' : 'S'}<br>THE SCENE CONTINUES WITHOUT YOU`;
    if (sealed) cost = 'THE LAST WORD IS MISSING<br>SILENCE WEARS ITS SHAPE';
    button.innerHTML = `
      <span class="ability-icon">${ability.icon}</span>
      <span class="ability-copy"><strong>${index + 1}. ${ability.name}</strong><small>${ability.desc}</small></span>
      <span class="ability-cost${!disabled ? ' ready' : ''}">${cost}</span>`;
    button.addEventListener('click', () => playerAction(index));
    abilityList.appendChild(button);
  });
}

function renderTeamStrip(side) {
  const container = side === 'player' ? $('#player-team-strip') : $('#enemy-team-strip');
  const team = side === 'player' ? state.battle.playerTeam : state.battle.enemyTeam;
  const activeIndex = side === 'player' ? state.battle.playerActive : state.battle.enemyActive;
  container.innerHTML = '';
  team.forEach((fighter, index) => {
    const pip = document.createElement('i');
    pip.className = `fighter-pip${fighter.currentHp <= 0 ? ' ko' : ''}${index === activeIndex && fighter.currentHp > 0 ? ' active' : ''}`;
    pip.style.setProperty('--pip', fighter.accent);
    pip.title = `${fighter.name}: ${Math.max(0, fighter.currentHp)}/${fighter.maxHp}`;
    container.appendChild(pip);
  });
}

function renderBattleLog() {
  battleLog.innerHTML = '';
  state.battle.log.slice(-5).forEach((entry, index, array) => {
    const line = document.createElement('p');
    line.className = `log-line ${entry.side}${index === array.length - 1 ? ' latest' : ''}`;
    line.innerHTML = entry.html;
    battleLog.appendChild(line);
  });
}

function addLog(html, side = 'player') {
  if (!state.battle) return;
  state.battle.log.push({ html, side });
  if (state.battle.log.length > 18) state.battle.log.shift();
  renderBattleLog();
}

function announce(firstLine, secondLine) {
  const element = $('#announcement');
  element.innerHTML = `<span>${firstLine}</span><span>${secondLine}</span>`;
  element.classList.remove('show');
  void element.offsetWidth;
  element.classList.add('show');
}

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function computeDamage(actor, target, ability) {
  const variance = Math.floor(Math.random() * 5) - 2;
  let damage = Math.max(1, Math.round(ability.power + actor.power * .48 + variance));
  if (actor.status.weaken > 0) damage = Math.round(damage * .74);
  if (target.status.mark > 0) damage = Math.round(damage * 1.3);
  return damage;
}

function applyDamage(target, damage, pierce = false) {
  let hpDamage = damage;
  let blocked = 0;
  if (!pierce && target.shield > 0) {
    blocked = Math.min(target.shield, damage);
    target.shield -= blocked;
    hpDamage -= blocked;
  }
  target.currentHp = Math.max(0, target.currentHp - hpDamage);
  return { hpDamage, blocked };
}

function executeAbility(actor, target, ability, index) {
  const motionNow = performance.now();
  state.battle.motion[actor.side] = {
    type: 'attack', start: motionNow, duration: 680, characterId: actor.id, abilityIndex: index,
  };
  state.battle.motion[target.side] = { type: 'hurt', start: motionNow + 185, duration: 430 };
  addEffect('lore', actor.side, actor.accent, '', {
    characterId: actor.id, abilityIndex: index, targetSide: target.side, duration: 1040,
  });
  if (ability.cost) actor.focus = Math.max(0, actor.focus - ability.cost);
  else actor.focus = Math.min(100, actor.focus + (ability.gain || 0));
  if (ability.cooldown) actor.cooldowns[index] = ability.cooldown + 1;

  const isDamage = ability.kind === 'damage';
  let result = { damage: 0, blocked: 0, healed: 0 };
  if (isDamage) {
    const echoDamage = ability.echo ? Math.round(actor.lastDamage * ability.echo) : 0;
    const rawDamage = computeDamage(actor, target, ability) + echoDamage;
    const applied = applyDamage(target, rawDamage, ability.pierce);
    result = { ...result, damage: applied.hpDamage, blocked: applied.blocked };
    actor.lastDamage = applied.hpDamage;
    if (actor.side === 'player') state.battle.metrics.damage += applied.hpDamage;
    state.battle.hitFlash[target.side] = performance.now() + 220;
    addEffect('hit', target.side, target.accent, applied.hpDamage ? `-${applied.hpDamage}` : 'THE BLOW ARRIVES\nYOU ARE ALREADY ELSEWHERE');
    if (echoDamage) addEffect('mark', target.side, actor.accent, `ORNA SPEAKS AGAIN\n${echoDamage} RETURNS AS WORD`);
    sound.hit();
  }
  if (ability.kind === 'shield') {
    actor.shield = Math.min(60, actor.shield + ability.power);
    if (ability.cleanse) actor.status.burn = 0;
    addEffect('shield', actor.side, actor.accent, `+${ability.power}`);
    sound.shield();
  }
  if (ability.kind === 'heal') {
    const before = actor.currentHp;
    actor.currentHp = Math.min(actor.maxHp, actor.currentHp + ability.power);
    result.healed += actor.currentHp - before;
    addEffect('heal', actor.side, actor.accent, `+${result.healed}`);
    sound.heal();
  }
  if (ability.kind === 'mark') {
    target.status.mark = 2;
    addEffect('mark', target.side, actor.accent, 'THE MASK SLIPS\nTHE WOUND LOOKS BACK');
    sound.shield();
  }
  if (ability.kind === 'weaken') {
    target.status.weaken = 2;
    addEffect('mark', target.side, actor.accent, 'STRENGTH FORGETS\nWHAT IT WAS SAYING');
    sound.shield();
  }
  if (ability.kind === 'regen') {
    actor.status.regen = 3;
    addEffect('heal', actor.side, actor.accent, 'THE ROOT DESCENDS\nTHE BODY RETURNS');
    sound.heal();
  }
  if (ability.kind === 'focus') {
    actor.focus = Math.min(100, actor.focus + ability.power);
    actor.shield = Math.min(60, actor.shield + (ability.shield || 0));
    addEffect('focus', actor.side, actor.accent, `+${ability.power} DESIRE\nWANT BECOMES AN ACT`);
    sound.shield();
  }
  if (ability.effect === 'burn') {
    target.status.burn = Math.max(target.status.burn, 3);
    addEffect('burn', target.side, '#ff774f', 'THE FIRE SAYS STAY\nTHE BODY ANSWERS ASH');
  }
  if (ability.selfRegen) {
    actor.status.regen = Math.max(actor.status.regen, ability.selfRegen);
    addEffect('heal', actor.side, actor.accent, 'THE LIVER RETURNS\nBEFORE MORNING CAN CLOSE');
  }
  if (ability.effect === 'weaken') target.status.weaken = Math.max(target.status.weaken, 2);
  if (ability.effect === 'seal') {
    target.status.seal = Math.max(target.status.seal, 2);
    addEffect('mark', target.side, '#9d83ff', 'THE WORD GOES DARK\nSILENCE TAKES ITS PLACE');
  }
  if (ability.heal) {
    const before = actor.currentHp;
    actor.currentHp = Math.min(actor.maxHp, actor.currentHp + ability.heal);
    result.healed += actor.currentHp - before;
    if (actor.currentHp > before) addEffect('heal', actor.side, actor.accent, `+${actor.currentHp - before}`);
  }
  if (ability.revive) {
    const team = actor.side === 'player' ? state.battle.playerTeam : state.battle.enemyTeam;
    const fallen = team.find((fighter) => fighter.currentHp <= 0);
    if (fallen) {
      fallen.currentHp = Math.min(fallen.maxHp, ability.revive);
      fallen.status = { burn: 0, weaken: 0, mark: 0, seal: 0, regen: 0 };
      addEffect('heal', actor.side, fallen.accent, `${fallen.name} RETURNS\nABSENCE RELEASES ITS ROOT`);
      addLog(`<b>${fallen.name}</b> returns through flower and bone;<br>absence loosens what it held.`, actor.side);
    }
  }
  if (ability.rewind) {
    actor.cooldowns = actor.cooldowns.map((value) => Math.max(0, value - ability.rewind));
    addEffect('focus', actor.side, actor.accent, 'FIVE DAYS ARE STOLEN\nTHE CLOCK FORGETS ITS DEBT');
  }
  if (ability.counsel) {
    const team = actor.side === 'player' ? state.battle.playerTeam : state.battle.enemyTeam;
    team.filter((fighter) => fighter.currentHp > 0 && fighter !== actor).forEach((fighter) => {
      fighter.focus = Math.min(100, fighter.focus + ability.counsel);
    });
    addEffect('focus', actor.side, actor.accent, 'MANY MINDS GATHER\nONE DOOR LEARNS TO OPEN');
  }
  if (ability.recoil) {
    actor.currentHp = Math.max(1, actor.currentHp - ability.recoil);
    addEffect('hit', actor.side, '#ff6177', `-${ability.recoil}`);
  }
  if (index === 2) sound.ultimate();

  let detail = '';
  if (result.damage) detail = ` for ${result.damage}`;
  if (result.blocked) detail += `, though ${result.blocked} met the shield`;
  if (result.healed && !result.damage) detail = `, restoring ${result.healed}`;
  addLog(`<b>${actor.name}</b> performs ${ability.name}${detail};<br>the act survives inside the other.`, actor.side);
  announce(`${actor.name}: THE ACT`, `${ability.name}: THE AFTERMATH`);
  return result;
}

async function playerAction(index) {
  const battle = state.battle;
  const player = getActive('player');
  const enemy = getActive('enemy');
  if (!battle || battle.locked || battle.over || !player || !enemy) return;
  const ability = player.abilities[index];
  if (!ability || player.cooldowns[index] > 0 || (ability.cost && player.focus < ability.cost) || (index === 2 && player.status.seal > 0)) return;
  battle.locked = true;
  battle.metrics.turns += 1;
  if (state.ftue.active) {
    if (state.ftue.step === 'act') state.ftue.step = 'focus';
    else if (index === 2 && (state.ftue.step === 'focus' || state.ftue.step === 'ultimate')) state.ftue.step = 'endure';
  }
  executeAbility(player, enemy, ability, index);
  renderBattleUI();
  await wait(720);
  if (await handleKnockouts()) return;
  await enemyResponse();
}

function chooseEnemyAbility(enemy) {
  const usable = enemy.abilities.map((ability, index) => ({ ability, index })).filter(({ ability, index }) => (
    enemy.cooldowns[index] === 0 && (!ability.cost || enemy.focus >= ability.cost) && !(index === 2 && enemy.status.seal > 0)
  ));
  const ultimate = usable.find(({ index }) => index === 2);
  if (ultimate && Math.random() < .72) return ultimate;
  const defensive = usable.find(({ ability, index }) => index === 1 && ['heal', 'shield', 'regen'].includes(ability.kind));
  if (defensive && enemy.currentHp / enemy.maxHp < .5 && Math.random() < .75) return defensive;
  return usable[Math.floor(Math.random() * usable.length)] || { ability: enemy.abilities[0], index: 0 };
}

async function enemyResponse() {
  const battle = state.battle;
  if (!battle || battle.over) return;
  await wait(280);
  const enemy = getActive('enemy');
  const player = getActive('player');
  const choice = chooseEnemyAbility(enemy);
  executeAbility(enemy, player, choice.ability, choice.index);
  renderBattleUI();
  await wait(760);
  if (await handleKnockouts()) return;
  tickCycle();
  if (await handleKnockouts()) return;
  battle.round += 1;
  battle.locked = false;
  renderBattleUI();
}

function tickCycle() {
  const battle = state.battle;
  [...battle.playerTeam, ...battle.enemyTeam].forEach((fighter) => {
    fighter.cooldowns = fighter.cooldowns.map((value) => Math.max(0, value - 1));
    if (fighter.currentHp <= 0) return;
    if (fighter.status.burn > 0) {
      const burnDamage = Math.min(6, fighter.currentHp);
      fighter.currentHp = Math.max(0, fighter.currentHp - burnDamage);
      fighter.status.burn -= 1;
      addEffect('burn', fighter.side, '#ff774f', `-${burnDamage}`);
      addLog(`<b>${fighter.name}</b> keeps the fire inside;<br>${burnDamage} life leaves without goodbye.`, fighter.side);
    }
    if (fighter.status.regen > 0 && fighter.currentHp > 0) {
      const before = fighter.currentHp;
      fighter.currentHp = Math.min(fighter.maxHp, fighter.currentHp + 7);
      const healed = fighter.currentHp - before;
      fighter.status.regen -= 1;
      if (healed) addEffect('heal', fighter.side, fighter.accent, `+${healed}`);
    }
    ['weaken', 'mark', 'seal'].forEach((status) => {
      if (fighter.status[status] > 0) fighter.status[status] -= 1;
    });
  });
  renderBattleUI();
}

async function handleKnockouts() {
  const battle = state.battle;
  if (!battle || battle.over) return true;
  const enemy = getActive('enemy');
  const player = getActive('player');
  if (enemy.currentHp <= 0) {
    addLog(`<b>${enemy.name}</b> leaves the sentence;<br>their absence keeps speaking.`, 'enemy');
    announce(`${enemy.name} BECOMES ABSENCE`, 'ABSENCE REMAINS IN THE SCENE');
    state.battle.metrics.kos += 1;
    sound.hit();
    await wait(380);
    const nextIndex = battle.enemyTeam.findIndex((fighter) => fighter.currentHp > 0);
    if (nextIndex < 0) {
      endBattle(true);
      return true;
    }
    battle.enemyActive = nextIndex;
    const next = getActive('enemy');
    addLog(`<b>${next.name}</b> enters where the other ended;<br>the wound accepts a different name.`, 'enemy');
    announce(`${next.name} ENTERS THE GAP`, 'THE GAP BECOMES A BODY');
    renderBattleUI();
    await wait(520);
  }
  if (player.currentHp <= 0) {
    addLog(`<b>${player.name}</b> leaves the sentence;<br>their absence keeps speaking.`, 'player');
    announce(`${player.name} BECOMES ABSENCE`, 'ABSENCE REMAINS IN THE SCENE');
    sound.hit();
    await wait(380);
    const nextIndex = battle.playerTeam.findIndex((fighter) => fighter.currentHp > 0);
    if (nextIndex < 0) {
      endBattle(false);
      return true;
    }
    battle.playerActive = nextIndex;
    const next = getActive('player');
    addLog(`<b>${next.name}</b> enters where the other ended;<br>the ache recognizes no difference.`, 'player');
    announce(`${next.name} ENTERS THE GAP`, 'THE GAP BECOMES A BODY');
    renderBattleUI();
    await wait(520);
  }
  return false;
}

function openSwapModal() {
  const battle = state.battle;
  if (!battle || battle.locked || battle.over || aliveFighters('player').length < 2) return;
  sound.click();
  const options = $('#swap-options');
  options.innerHTML = '';
  battle.playerTeam.forEach((fighter, index) => {
    const button = document.createElement('button');
    const isCurrent = index === battle.playerActive;
    button.type = 'button';
    button.className = 'swap-option';
    button.style.setProperty('--swap-color', fighter.accent);
    button.disabled = fighter.currentHp <= 0 || isCurrent;
    const statusVerse = isCurrent
      ? 'IS THE BODY IN THE SCENE<br>AND CANNOT SEE ITS EDGES'
      : fighter.currentHp <= 0
        ? 'HAS BECOME ABSENCE<br>ABSENCE KEEPS THEIR SHAPE'
        : `${fighter.currentHp}/${fighter.maxHp} BODY REMAINS<br>READY TO ENTER THE WOUND`;
    button.innerHTML = `<canvas width="72" height="72" data-character-id="${fighter.id}" aria-hidden="true"></canvas><span><strong>${fighter.name}</strong><small>${statusVerse}</small></span>`;
    button.addEventListener('click', () => performSwap(index));
    options.appendChild(button);
    drawPortrait(button.querySelector('canvas').getContext('2d'), fighter);
  });
  openModal('swap-modal');
}

async function performSwap(index) {
  const battle = state.battle;
  if (!battle || battle.locked || index === battle.playerActive || battle.playerTeam[index].currentHp <= 0) return;
  battle.locked = true;
  battle.metrics.turns += 1;
  battle.playerActive = index;
  const fighter = getActive('player');
  closeModal();
  addLog(`<b>${fighter.name}</b> takes the other’s place;<br>the ache, seeing no difference, continues.`, 'player');
  announce(`${fighter.name} ENTERS THE GAP`, 'THE ACHE CONTINUES UNCHANGED');
  sound.shield();
  renderBattleUI();
  await wait(650);
  await enemyResponse();
}

function endBattle(victory) {
  const battle = state.battle;
  battle.over = true;
  battle.locked = true;
  if (state.ftue.active) completeFtue();
  renderBattleUI();
  $('#result-kicker').innerHTML = victory
    ? '[FIGURE VI: AFTERMATH]<br>THE SCENE ENDS; DESIRE DOES NOT'
    : '[FIGURE VI: AFTERMATH]<br>THE SCENE CLOSES; THE WOUND STAYS OPEN';
  $('#result-title').innerHTML = victory
    ? 'YOU SURVIVED THE BELOVED<br>THE BELOVED SURVIVES IN YOU'
    : 'YOU BECOME THE AFTERMATH<br>THE AFTERMATH LEARNS YOUR NAME';
  $('#result-copy').innerHTML = victory
    ? 'Nine sparks enter one silence;<br>the silence calls itself light.'
    : 'The body exits. The wanting<br>remains, rehearsing your shape.';
  $('#result-sigil').textContent = victory ? '✦' : '×';
  $('#result-sigil').style.background = victory ? 'var(--cyan)' : 'var(--danger)';
  $('#result-stats').innerHTML = `
    <div class="result-stat"><strong>${battle.round}</strong><small>SCENES REPEATED<br>UNTIL TIME GAVE WAY</small></div>
    <div class="result-stat"><strong>${battle.metrics.damage}</strong><small>WOUNDS EXCHANGED<br>BETWEEN BODY AND SIGN</small></div>
    <div class="result-stat"><strong>${battle.metrics.kos}</strong><small>ABSENCES MADE<br>STILL SPEAKING</small></div>`;
  renderRewardReveal(unlockNextArchiveFragment());
  if (victory) sound.victory();
  else sound.tone(110, .6, 'sawtooth', .04);
  setTimeout(() => openModal('result-modal'), 700);
}

function resetGame() {
  state.battle = null;
  closeModal();
  state.effects = [];
  state.selected = [];
  battleScreen.hidden = true;
  selectionScreen.hidden = false;
  renderRoster();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function openModal(id) {
  [...modalBackdrop.querySelectorAll('.modal')].forEach((modal) => { modal.hidden = true; });
  modalBackdrop.hidden = false;
  $(`#${id}`).hidden = false;
}

function writeArchiveProgress() {
  try {
    window.localStorage.setItem(ARCHIVE_STORAGE_KEY, String(state.archive.unlocked));
  } catch {
    // The archive still works for this visit when storage is unavailable.
  }
}

function archiveCountLine() {
  const unlocked = state.archive.unlocked;
  if (unlocked === ARCHIVE_FRAGMENTS.length) return 'EVERY FRAGMENT HAS RETURNED<br>THE DARK HAS NOTHING LEFT TO HIDE';
  if (unlocked === 1) return 'ONE FRAGMENT HAS RETURNED<br>THE REST ARE WAITING IN THE DARK';
  return `${unlocked} FRAGMENTS HAVE RETURNED<br>THE REST ARE WAITING IN THE DARK`;
}

function updateArchiveProgress() {
  const unlocked = state.archive.unlocked;
  const phrase = unlocked === ARCHIVE_FRAGMENTS.length
    ? 'EVERY FRAGMENT BREATHES'
    : unlocked === 1 ? 'ONE FRAGMENT BREATHES' : `${unlocked} FRAGMENTS BREATHE`;
  $('#archive-progress').textContent = `${phrase} · ${String(unlocked).padStart(2, '0')} / ${ARCHIVE_FRAGMENTS.length}`;
  $('#archive-copy').innerHTML = archiveCountLine();
}

function renderArchiveReader() {
  const index = Math.min(state.archive.selected, state.archive.unlocked - 1);
  state.archive.selected = Math.max(0, index);
  const ordinal = String(state.archive.selected + 1).padStart(2, '0');
  const image = $('#archive-image');
  image.src = ARCHIVE_FRAGMENTS[state.archive.selected];
  image.alt = `Unlocked story fragment ${state.archive.selected + 1} of ${state.archive.unlocked}`;
  $('#archive-reader-label').innerHTML = `FRAGMENT ${ordinal} SURFACES<br>WHAT WAS BURIED KEEPS SPEAKING`;
  $('#archive-previous').disabled = state.archive.selected === 0;
  $('#archive-next').disabled = state.archive.selected === state.archive.unlocked - 1;
  [...$('#archive-index').children].forEach((button, buttonIndex) => {
    button.classList.toggle('selected', buttonIndex === state.archive.selected);
    button.setAttribute('aria-current', buttonIndex === state.archive.selected ? 'true' : 'false');
  });
}

function renderArchive() {
  updateArchiveProgress();
  const index = $('#archive-index');
  index.innerHTML = '';
  ARCHIVE_FRAGMENTS.forEach((_, fragmentIndex) => {
    const button = document.createElement('button');
    const unlocked = fragmentIndex < state.archive.unlocked;
    button.type = 'button';
    button.className = `archive-index-mark ${unlocked ? 'unlocked' : 'locked'}`;
    button.disabled = !unlocked;
    button.setAttribute('aria-label', unlocked
      ? `Read unlocked fragment ${fragmentIndex + 1}`
      : `Fragment ${fragmentIndex + 1} is still locked`);
    if (unlocked) {
      button.addEventListener('click', () => {
        state.archive.selected = fragmentIndex;
        sound.click();
        renderArchiveReader();
      });
    }
    index.appendChild(button);
  });
  renderArchiveReader();
}

function openArchive() {
  state.archive.selected = Math.max(0, state.archive.unlocked - 1);
  renderArchive();
  sound.click();
  openModal('archive-modal');
}

function openArchiveIntro() {
  // A brand-new visitor meets the story before the roster: the archive opens
  // itself on the first fragment, once ever. Silent — no gesture yet, so the
  // AudioContext must not be created here.
  const INTRO_KEY = 'ninefold.archive.intro.v1';
  try {
    if (window.localStorage.getItem(INTRO_KEY) === 'true') return;
    window.localStorage.setItem(INTRO_KEY, 'true');
  } catch {
    return; // Without storage every visit would replay the intro; skip it instead.
  }
  state.archive.selected = 0;
  renderArchive();
  openModal('archive-modal');
}

function unlockNextArchiveFragment() {
  if (state.archive.unlocked >= ARCHIVE_FRAGMENTS.length) return null;
  const unlockedIndex = state.archive.unlocked;
  state.archive.unlocked += 1;
  state.archive.selected = unlockedIndex;
  writeArchiveProgress();
  updateArchiveProgress();
  return unlockedIndex;
}

function renderRewardReveal(unlockedIndex) {
  const reveal = $('#reward-reveal');
  if (unlockedIndex === null) {
    reveal.hidden = true;
    return;
  }
  const ordinal = String(unlockedIndex + 1).padStart(2, '0');
  $('#reward-label').innerHTML = `FRAGMENT ${ordinal} OPENS<br>THE ARCHIVE LEARNS YOUR HAND`;
  const image = $('#reward-image');
  image.src = ARCHIVE_FRAGMENTS[unlockedIndex];
  image.alt = `Newly unlocked story fragment ${unlockedIndex + 1}`;
  reveal.hidden = false;
}

function closeModal() {
  if (!$('#result-modal').hidden && state.battle?.over) return;
  modalBackdrop.hidden = true;
  [...modalBackdrop.querySelectorAll('.modal')].forEach((modal) => { modal.hidden = true; });
}

function addEffect(type, side, color, text, details = {}) {
  state.effects.push({ type, side, color, text, start: performance.now(), duration: 900, ...details });
}

function colorWithAlpha(hex, alpha) {
  const value = hex.replace('#', '');
  const red = Number.parseInt(value.slice(0, 2), 16);
  const green = Number.parseInt(value.slice(2, 4), 16);
  const blue = Number.parseInt(value.slice(4, 6), 16);
  return `rgba(${red},${green},${blue},${alpha})`;
}

function drawPortraitAura(portraitCtx, character, time, energy = 1, still = false) {
  const width = portraitCtx.canvas.width;
  const height = portraitCtx.canvas.height;
  const seed = CHARACTERS.findIndex((item) => item.id === character.id) + 1;
  const phase = time / 720 + seed * .83;
  const selected = energy > 1.45;
  portraitCtx.save();
  portraitCtx.globalAlpha = .18 + energy * .08;
  portraitCtx.strokeStyle = character.accent;
  portraitCtx.lineWidth = 1.5;
  portraitCtx.setLineDash([3, 5]);
  portraitCtx.beginPath();
  portraitCtx.ellipse(width / 2, height * .66, width * (.32 + Math.sin(phase) * .015), height * .22, Math.sin(phase * .7) * .08, 0, Math.PI * 2);
  portraitCtx.stroke();
  portraitCtx.setLineDash([]);

  if (selected) {
    const centerX = width / 2;
    const centerY = height * .58;
    const radiusX = width * .37;
    const radiusY = height * .29;
    const pitch = still ? -.58 : time / 680 + seed * .37;
    const drift = still ? seed * .19 : time / 2100 + seed * .19;
    const dotCount = 22;
    const projectDot = (angle, tilt) => {
      const ringX = Math.cos(angle) * radiusX;
      const ringY = Math.sin(angle) * radiusY;
      const depth = ringY * Math.sin(tilt);
      const perspective = 1 + depth / (height * 2.2);
      return {
        x: centerX + ringX * perspective,
        y: centerY + ringY * Math.cos(tilt),
        depth: .5 + depth / (radiusY * 2),
      };
    };

    portraitCtx.globalAlpha = 1;
    for (let index = 0; index < dotCount; index += 1) {
      const angle = (index / dotCount) * Math.PI * 2 + drift;
      const point = projectDot(angle, pitch);

      if (!still) {
        for (let trail = 5; trail > 0; trail -= 1) {
          const oldPoint = projectDot(angle - trail * .025, pitch - trail * .065);
          const fade = (1 - trail / 6) * (.085 + point.depth * .14);
          portraitCtx.fillStyle = colorWithAlpha(character.accent, fade);
          portraitCtx.fillRect(
            Math.round(oldPoint.x),
            Math.round(oldPoint.y + trail * 2),
            1,
            trail < 3 ? 3 : trail < 5 ? 2 : 1,
          );
        }
      }

      const front = Math.max(0, Math.min(1, point.depth));
      const dotSize = front > .68 || index % 7 === 0 ? 3 : 2;
      portraitCtx.fillStyle = colorWithAlpha(character.accent, .42 + front * .52);
      portraitCtx.fillRect(
        Math.round(point.x - dotSize / 2),
        Math.round(point.y - dotSize / 2),
        dotSize,
        dotSize,
      );
      if (front < .42) {
        portraitCtx.fillStyle = colorWithAlpha('#17141c', .28);
        portraitCtx.fillRect(Math.round(point.x), Math.round(point.y), 1, 1);
      }
    }

    portraitCtx.restore();
    return;
  }

  for (let index = 0; index < 4; index += 1) {
    const orbit = phase + index * Math.PI / 2;
    const px = width / 2 + Math.cos(orbit) * width * .34;
    const py = height * .58 + Math.sin(orbit) * height * .21;
    portraitCtx.fillStyle = index % 2 ? '#17141c' : character.accent;
    const size = index % 3 === 0 ? 3 : 2;
    portraitCtx.fillRect(Math.round(px), Math.round(py), size, size);
  }
  portraitCtx.restore();
}

function drawPortrait(portraitCtx, character, time = 0, energy = 1) {
  const width = portraitCtx.canvas.width;
  const height = portraitCtx.canvas.height;
  portraitCtx.clearRect(0, 0, width, height);
  portraitCtx.imageSmoothingEnabled = false;
  const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const liveTime = still ? 0 : time;
  drawPortraitAura(portraitCtx, character, liveTime, energy, still);
  const scale = Math.floor(Math.min(width / 42, height / 45));
  drawCharacterSprite(portraitCtx, character, width / 2, height * .83, scale, 1, 0, {
    time: liveTime,
    energy,
    seed: CHARACTERS.findIndex((item) => item.id === character.id) + 1,
  });
}

function drawCharacterSprite(targetCtx, character, x, y, scale = 4, facing = 1, bob = 0, motion = {}) {
  const r = (color, rx, ry, rw, rh) => {
    targetCtx.fillStyle = color;
    targetCtx.fillRect(Math.round(rx), Math.round(ry), Math.round(rw), Math.round(rh));
  };
  const a = character.accent;
  const d = character.dark;
  const skin = '#f1c6a5';
  const white = '#edf3ff';
  const black = '#101529';
  const time = motion.time || 0;
  const seed = motion.seed || 1;
  const energy = motion.energy || 1;
  const idlePhase = time / 330 + seed * .91;
  const actionPhase = ((time / 2600) + seed * .071) % 1;
  const actionPulse = .5 - Math.cos(actionPhase * Math.PI * 2) * .5;
  const idleBob = 0;
  const breathe = 1 + Math.sin(idlePhase * .74) * .004 * energy;
  const sway = Math.sin(idlePhase * .46) * .004 * energy;
  const pose = (poseX, poseY, rotation, draw) => {
    targetCtx.save();
    targetCtx.translate(poseX, poseY);
    targetCtx.rotate(rotation);
    draw();
    targetCtx.restore();
  };
  targetCtx.save();
  targetCtx.translate(Math.round(x + (motion.offsetX || 0)), Math.round(y + bob + idleBob + (motion.offsetY || 0)));
  targetCtx.rotate(sway + (motion.rotate || 0));
  targetCtx.scale(scale * facing * (motion.scaleX || 1), scale * breathe * (motion.scaleY || 1));

  // Every keeper gets a tiny contact shadow in the same sprite language.
  r('rgba(0,0,0,.24)', -11, -1, 22, 2);

  if (character.id === 'thoth') {
    r('#d5a94f', -10, -30, 2, 30); r('#f4d66e', -11, -31, 4, 4);
    r(black, -5, -8, 3, 8); r(black, 3, -8, 3, 8);
    r(white, -7, -20, 14, 12); r(a, -7, -20, 14, 3); r('#d5a94f', -5, -17, 10, 3);
    r(black, -5, -29, 10, 10); r(black, 3, -26, 9, 4); r('#d5a94f', 9, -25, 5, 2);
    r(a, -4, -30, 8, 2); r(white, 1, -27, 2, 2); r(black, 2, -27, 1, 1);
    r(white, -9, -17, 3, 8); r(white, 6, -17, 3, 8);
  } else if (character.id === 'prometheus') {
    r('#4a2636', -6, -8, 4, 8); r('#4a2636', 3, -8, 4, 8);
    r('#e8e2d4', -7, -20, 14, 13); r('#bb4e38', -7, -20, 5, 12); r('#d9a25d', -7, -18, 14, 3);
    r(skin, -10, -18, 3, 10); r(skin, 7, -18, 3, 10);
    r(skin, -5, -28, 10, 9); r(black, -3, -25, 2, 2); r(black, 3, -25, 2, 2);
    r('#ff4b43', -6, -31, 12, 5); r('#ff8d43', -4, -35, 4, 6); r('#ffd35c', 1, -38, 3, 8); r('#ff5a45', 4, -34, 4, 6);
  } else if (character.id === 'minerva') {
    r('#5b3d36', -6, -8, 4, 8); r('#5b3d36', 3, -8, 4, 8);
    r('#dbc98c', -7, -20, 14, 13); r('#865f4c', -4, -20, 8, 13); r(a, -7, -20, 14, 3);
    r(skin, -5, -28, 10, 8); r('#a9864d', -7, -31, 14, 6); r('#6f5137', -7, -27, 3, 7);
    r('#e65d52', -5, -36, 10, 5); r('#e65d52', -2, -39, 4, 4); r(black, 2, -26, 2, 2);
    r('#8766b6', -12, -19, 8, 13); r(a, -11, -18, 6, 11); r('#8766b6', -10, -15, 4, 5);
  } else if (character.id === 'quetzalcoatl') {
    r('#2b806d', -11, -9, 19, 7); r(a, -7, -13, 17, 7); r('#f0d96c', -2, -16, 13, 6);
    r('#2f8b76', -4, -24, 11, 11); r('#6ddc80', -2, -27, 10, 8); r('#f0d96c', 5, -23, 7, 4); r(black, 4, -24, 2, 2);
    r('#57c887', -7, -31, 3, 8); r('#5aaeff', -4, -35, 3, 10); r('#f36b79', -1, -33, 3, 8); r('#ffd56f', 2, -36, 3, 10);
    r('#6bd7bf', -12, -24, 8, 3); r('#5aaeff', -14, -28, 8, 3); r('#f36b79', -12, -32, 7, 3);
  } else if (character.id === 'erlang') {
    r('#17203f', -6, -8, 4, 8); r('#17203f', 3, -8, 4, 8);
    r('#335ba6', -7, -21, 14, 14); r(a, -5, -19, 10, 4); r('#d4b96e', -7, -14, 14, 3);
    r(skin, -5, -29, 10, 9); r(black, -7, -33, 14, 8); r(black, -7, -25, 3, 7); r(black, 4, -25, 3, 7);
    r('#f55c73', -1, -29, 3, 2); r(black, -3, -25, 2, 2); r(black, 3, -25, 2, 2);
    r('#29334e', -13, -7, 8, 5); r('#b9c4dd', -12, -9, 4, 3); r('#62a9ff', -8, -8, 3, 2);
  } else if (character.id === 'tyr') {
    r('#31384d', -6, -8, 4, 8); r('#31384d', 3, -8, 4, 8);
    r('#405a7c', -7, -21, 14, 14); r('#8e3841', -7, -21, 4, 14); r(a, -5, -18, 10, 3);
    r(skin, -5, -29, 10, 9); r('#d2a05f', -7, -32, 14, 5); r('#7b4d34', -5, -21, 10, 4); r(black, 2, -26, 2, 2);
    r(skin, 6, -19, 3, 8);
    r('#8e3841', -11, -23, 5, 17);
  } else if (character.id === 'ogma') {
    r('#273d32', -6, -8, 4, 8); r('#273d32', 3, -8, 4, 8);
    r('#355746', -7, -20, 14, 13); r(a, -7, -20, 14, 3); r('#c9a55a', -5, -16, 10, 2);
    r(skin, -5, -28, 10, 9); r('#a84b37', -7, -33, 14, 8); r('#a84b37', -7, -26, 3, 8); r('#a84b37', 4, -26, 3, 8); r(black, 2, -25, 2, 2);
    r('#68718b', -13, -20, 6, 16); r(white, -11, -18, 2, 2); r(white, -11, -13, 2, 2); r(white, -11, -8, 2, 2);
  } else if (character.id === 'jacheongbi') {
    r('#24444a', -6, -8, 4, 8); r('#24444a', 3, -8, 4, 8);
    r('#d24f63', -8, -19, 16, 12); r('#f2da75', -6, -20, 12, 6); r('#5e9c91', -8, -12, 16, 5);
    r(skin, -5, -28, 10, 9); r(black, -7, -32, 14, 7); r(black, 4, -27, 4, 15); r(black, 6, -15, 3, 4); r(black, 2, -25, 2, 2);
    r('#d8b94e', -12, -18, 3, 15); r(a, -14, -20, 2, 4); r(a, -11, -22, 2, 5); r(a, -8, -20, 2, 4);
  } else if (character.id === 'omoikane') {
    r('#302a58', -6, -8, 4, 8); r('#302a58', 3, -8, 4, 8);
    r('#6954b7', -8, -21, 16, 14); r(a, -6, -20, 12, 3); r('#c8b8ff', -4, -15, 8, 5);
    r('#d8b59a', -5, -28, 10, 9); r('#e6e0ff', -7, -33, 14, 8); r('#9d83ff', -10, -30, 4, 8); r('#9d83ff', 6, -30, 4, 8); r(black, -3, -25, 2, 2); r(black, 3, -25, 2, 2);
    r('#9d83ff', -10, -37, 3, 3); r('#61e7e1', -4, -39, 3, 3); r('#f0df73', 3, -38, 3, 3); r('#9d83ff', 8, -34, 3, 3);
    r('#e5d7a7', 8, -18, 8, 11); r('#7e6a49', 8, -18, 2, 11); r('#7e6a49', 14, -18, 2, 11); r('#6f5b42', 10, -15, 4, 1);
  }

  // A low-frame-rate blink keeps the faces alive without losing their pixel language.
  const blinking = ((time + seed * 613) % 3100) < 145;
  if (blinking) {
    const blinkMap = {
      thoth: { fill: black, eyes: [[1, -27]] },
      prometheus: { fill: skin, eyes: [[-3, -25], [3, -25]] },
      minerva: { fill: skin, eyes: [[2, -26]] },
      quetzalcoatl: { fill: '#2f8b76', eyes: [[4, -24]] },
      erlang: { fill: skin, eyes: [[-3, -25], [3, -25]] },
      tyr: { fill: skin, eyes: [[2, -26]] },
      ogma: { fill: skin, eyes: [[2, -25]] },
      jacheongbi: { fill: skin, eyes: [[2, -25]] },
      omoikane: { fill: '#d8b59a', eyes: [[-3, -25], [3, -25]] },
    };
    const blink = blinkMap[character.id];
    blink.eyes.forEach(([eyeX, eyeY]) => {
      r(blink.fill, eyeX, eyeY, 2, 2);
      r(black, eyeX, eyeY + 1, 2, 1);
    });
  }

  // Each keeper performs a readable, lore-rooted action instead of sharing a float cycle.
  const actionFrame = Math.floor(actionPhase * 8);
  if (character.id === 'thoth') {
    // He braces a papyrus and writes a line from left to right with the reed.
    const penTravel = Math.round(actionPulse * 6);
    r('#f4e6bd', 7, -22, 11, 12); r('#b99755', 8, -20, 8, 1); r('#b99755', 8, -16, 8, 1);
    r(white, 4, -18, 5 + penTravel, 3); r(skin, 7 + penTravel, -18, 2, 2);
    r('#d5a94f', 9 + penTravel, -23, 1, 7); r(a, 9, -19, 1 + penTravel, 1);
    const glyphY = -38 + (actionFrame % 4) * 5;
    r(a, -17, glyphY, 4, 1); r(black, -15, glyphY - 2, 1, 2);
  } else if (character.id === 'prometheus') {
    // He raises a thick, jointed fennel stalk: a living carrier rather than a spear.
    const fireLift = Math.round(actionPulse * 11);
    r(skin, 5, -18, 4, 4); r(skin, 7, -20 - Math.round(fireLift * .45), 4, 5);
    r('#6d7f45', 9, -21 - fireLift, 4, 17); r('#a8b75d', 8, -17 - fireLift, 6, 2);
    r('#6d7f45', 5, -16 - fireLift, 5, 2); r('#6d7f45', 12, -12 - fireLift, 5, 2);
    r('#55743e', 6, -27 - fireLift, 10, 3);
    r('#ff6646', 6, -34 - fireLift, 11, 9); r('#ffd35c', 9, -37 - fireLift, 4, 9);
    r(actionFrame % 2 ? '#ffd35c' : '#ff6646', 14 - actionFrame, -35 - fireLift - actionFrame, 2, 2);
    r('#ff8d43', -8 + (actionFrame % 4), -38 - (actionFrame % 3), 2, 3);
  } else if (character.id === 'minerva') {
    // She sights a measured path, then lowers the spear into the planned thrust.
    const shieldReach = Math.round(actionPulse * 4);
    r(a, -14 - shieldReach, -22, 2, 19); r(a, -13 - shieldReach, -23, 9 + shieldReach, 2);
    pose(9, -17, -.08 - actionPulse * 1.08, () => {
      r('#9b7542', -1, -14, 2, 31); r('#c9d0dc', -2, -18, 4, 5);
      r('#eff5ff', -4, -22, 8, 4); r('#eff5ff', -3, -25, 6, 3); r(white, -1, -28, 2, 4);
      r('#c99554', -3, 17, 6, 2);
    });
    r(skin, 4, -19, 6, 3);
    for (let line = 0; line < 3; line += 1) r('#c99554', -17 + actionFrame * 3, -7 + line * 3, 8, 1);
  } else if (character.id === 'quetzalcoatl') {
    // The feathered body coils while both wings beat air into visible wind paths.
    const wingReach = 5 + Math.round(actionPulse * 7);
    r('#5aaeff', -7 - wingReach, -29, wingReach, 3); r('#f36b79', -9 - wingReach, -25, wingReach + 2, 3);
    r('#f0d96c', 7, -28, wingReach, 3); r('#5aaeff', 8, -24, wingReach + 2, 3);
    for (let coil = 0; coil < 5; coil += 1) {
      const coilY = -12 - Math.round(Math.sin(actionPhase * Math.PI * 2 + coil) * 3);
      r(coil % 2 ? a : '#2b806d', -12 + coil * 5, coilY, 7, 3);
    }
    r(white, -19 + actionFrame * 5, -35 - (actionFrame % 3), 3, 1);
  } else if (character.id === 'erlang') {
    // He raises the trident, opens the parietal eye, and sends the hound to search.
    const scanReach = Math.round(actionPulse * 18);
    r('#f55c73', -2, -30, 4, 2); r(colorWithAlpha('#f55c73', .72), 2, -30, scanReach, 1);
    pose(9, -17, .08 - actionPulse * .28, () => {
      r('#58749a', -1, -15, 3, 31); r('#b8d0e8', -7, -18, 15, 2);
      r('#f2f5ff', -7, -25, 2, 8); r('#f2f5ff', 0, -29, 2, 12); r('#f2f5ff', 6, -25, 2, 8);
      r(a, -5, -22, 3, 2); r(a, 3, -22, 3, 2);
    });
    r(skin, 4, -19, 6, 3);
    const houndX = -18 + actionFrame * 4;
    r('#29334e', houndX, -7, 5, 3); r('#b9c4dd', houndX + 1, -9, 2, 2);
    r(a, houndX + (actionFrame % 2 ? 4 : 0), -4, 2, 2);
  } else if (character.id === 'tyr') {
    // He offers the hand into the wolf's closing jaw while the oath-sword lowers.
    const handReach = Math.round(actionPulse * 9);
    r(skin, -8 - handReach, -20, 4 + handReach, 3); r('#8e3841', -10, -22, 5, 7);
    r(black, -22, -24, 8, 4); r(white, -20, -20, 2, 3); r(white, -16, -20, 2, 3);
    r(black, -22, -15, 8, 4); r(white, -20, -17, 2, 3); r(white, -16, -17, 2, 3);
    pose(10, -17, -.22 - actionPulse * .34, () => {
      r('#9ba9c1', -3, -15, 6, 20); r('#eef4ff', -2, -18, 4, 4); r('#66748f', -2, -10, 2, 14);
      r(a, -7, 4, 14, 3); r('#7b4d34', -2, 7, 4, 8); r('#d2a05f', -3, 14, 6, 2);
    });
    for (let link = 0; link < 3; link += 1) {
      const linkX = -13 + link * 5 - Math.round(actionPulse * 2);
      r(a, linkX, -13 + link * 2, 6, 4); r('#405a7c', linkX + 1, -12 + link * 2, 4, 2);
    }
    r(a, -13 - Math.round(actionPulse * 4), -19, 3, 2);
  } else if (character.id === 'ogma') {
    // A top-heavy shoulder club carries the ogham; the small knife moves across it.
    const carveX = -3 + Math.round(actionPulse * 16);
    r('#75523e', -7, -29, 29, 5); r('#9d7452', 14, -33, 10, 12); r('#5b3e31', 19, -31, 4, 8);
    [-1, 4, 9].forEach((notchX, index) => {
      r(index % 2 ? a : white, notchX, -31, 1, 9); r(a, notchX - 2, -27, 5, 1);
    });
    r(skin, carveX - 2, -24, 7, 3); r('#d9e0ea', carveX + 2, -29, 2, 8); r(black, carveX, -25, 4, 2);
    r(a, 15 - actionFrame, -32 - (actionFrame % 3), 2, 2);
    if (actionFrame % 2 === 0) r(white, -15, -18 + actionFrame, 3, 1);
  } else if (character.id === 'jacheongbi') {
    // She sweeps the sickle through grain, then casts seed into the opened earth.
    pose(10, -9, -.72 + actionPulse * 1.34, () => {
      r('#76512f', -2, -8, 4, 18);
      r('#59616c', -4, -16, 12, 4); r('#dbe4ee', -3, -16, 10, 3);
      r('#59616c', 5, -14, 7, 4); r(white, 6, -13, 5, 3);
      r('#59616c', 9, -11, 4, 8); r('#dbe4ee', 9, -10, 3, 6);
      r(white, 7, -5, 5, 3); r('#0d1326', 5, -10, 4, 4);
    });
    r(skin, 4, -18, 6, 3);
    const growth = actionFrame % 4;
    [-15, -10, 11, 16].forEach((sproutX, index) => {
      const height = 1 + ((growth + index) % 4);
      r('#6ca56f', sproutX, -height - 1, 1, height);
      if (height > 2) r(index % 2 ? '#f0df73' : a, sproutX - 1, -height - 2, 3, 2);
    });
    r('#f0df73', -14 + actionFrame * 4, -7 - (actionFrame % 3), 2, 2);
  } else if (character.id === 'omoikane') {
    // He parts the cave with both hands while scattered thoughts resolve into counsel.
    const counselReach = Math.round(actionPulse * 7);
    r('#17131c', -19 - counselReach, -31, 5, 28); r('#17131c', 14 + counselReach, -31, 5, 28);
    r(skin, -10 - counselReach, -19, 6 + counselReach, 3); r(skin, 4, -19, 6 + counselReach, 3);
    const thoughtAngle = actionFrame * Math.PI / 4;
    const thoughtX = Math.round(Math.cos(thoughtAngle) * 16);
    const thoughtY = -25 + Math.round(Math.sin(thoughtAngle) * 12);
    r('#9d83ff', thoughtX, thoughtY, 3, 3);
    r('#61e7e1', -thoughtX, -27 - Math.round(Math.sin(thoughtAngle) * 9), 2, 2);
    r('#f0df73', Math.round(thoughtX * .55), -42 + (actionFrame % 3), 2, 2);
    if (actionFrame === 0 || actionFrame === 4) { r(white, -3, -43, 6, 1); r(white, -1, -45, 2, 5); }
  }

  // Attacks briefly transform the sprite into a character-specific mythic figure.
  if (motion.signatureProgress !== undefined) {
    const signaturePulse = Math.sin(motion.signatureProgress * Math.PI);
    const reach = Math.round(signaturePulse * (5 + (motion.abilityIndex || 0) * 2));
    if (character.id === 'thoth') {
      for (let index = 0; index < 5; index += 1) {
        const glyphX = -18 + index * 9;
        r(index % 2 ? white : a, glyphX, -42 - reach + (index % 2) * 3, 4, 1);
        r(a, glyphX + 1, -45 - reach + (index % 2) * 3, 1, 6);
      }
      r('#d5a94f', -16, -13 - reach, 32, 1);
    } else if (character.id === 'prometheus') {
      r('#6d7f45', 8, -26 - reach, 3, 25 + reach);
      r('#ff5a45', 5, -31 - reach, 9, 8 + reach);
      r('#ffd35c', 8, -35 - reach, 3, 9);
      r(black, -18, -43, 10, 3); r(black, -13, -47, 3, 8); r(black, -8, -45, 7, 2);
    } else if (character.id === 'minerva') {
      r(white, -1, -45 - reach, 2, 15);
      r(a, -8 - reach, -39, 7 + reach, 2); r(a, 2, -39, 7 + reach, 2);
      for (let index = 0; index < 4; index += 1) r('#c99554', -18, -24 + index * 5, 36, 1);
    } else if (character.id === 'quetzalcoatl') {
      const serpentColors = [a, '#5aaeff', '#f36b79', '#f0d96c'];
      for (let index = 0; index < 7; index += 1) {
        const coilX = -22 + index * 7;
        const coilY = -15 - Math.round(Math.sin(index + motion.signatureProgress * 7) * (4 + reach));
        r(serpentColors[index % serpentColors.length], coilX, coilY, 7, 3);
      }
    } else if (character.id === 'erlang') {
      r('#f55c73', -3 - reach, -31, 6 + reach * 2, 3);
      r(white, 4, -31, 12 + reach * 2, 1);
      r('#29334e', -21 - reach, -9, 10 + reach, 5); r('#b9c4dd', -18 - reach, -12, 4, 4);
    } else if (character.id === 'tyr') {
      for (let index = 0; index < 4; index += 1) {
        r(a, -19 + index * 9, -28 - reach + (index % 2) * 4, 7, 2);
        r(a, -18 + index * 9, -30 - reach + (index % 2) * 4, 2, 6);
      }
      r('#8e3841', -18, -20, 7 + reach, 5);
    } else if (character.id === 'ogma') {
      r(white, -19, -42 - reach, 38, 2);
      for (let index = 0; index < 7; index += 1) {
        r(index % 2 ? a : white, -16 + index * 5, -45 - reach, 1, 8);
      }
      r('#9d7452', 7, -35 - reach, 5, 34 + reach);
    } else if (character.id === 'jacheongbi') {
      const petals = ['#f0df73', '#f36b79', a, '#fffdf5', '#6ca56f', '#d994ff'];
      petals.forEach((color, index) => {
        const angle = (Math.PI * 2 * index) / petals.length;
        r(color, Math.round(Math.cos(angle) * (13 + reach)) - 2, -22 + Math.round(Math.sin(angle) * (13 + reach)) - 2, 4, 4);
      });
    } else if (character.id === 'omoikane') {
      for (let index = 0; index < 8; index += 1) {
        const angle = (Math.PI * 2 * index) / 8;
        r(index % 2 ? '#61e7e1' : a, Math.round(Math.cos(angle) * (17 + reach)) - 1, -25 + Math.round(Math.sin(angle) * (13 + reach)) - 1, 3, 3);
      }
      r(white, -12 - reach, -8, 3, 8); r(white, 9 + reach, -8, 3, 8);
    }
  }
  targetCtx.restore();
}

function getBattleSpriteMotion(side, time) {
  const current = state.battle?.motion?.[side];
  if (!current || current.type === 'idle') return {};
  const progress = Math.max(0, Math.min(1, (time - current.start) / current.duration));
  if (time < current.start) return {};
  if (progress >= 1) {
    state.battle.motion[side] = { type: 'idle', start: 0, duration: 0 };
    return {};
  }
  if (current.type === 'attack') {
    const direction = side === 'player' ? 1 : -1;
    const lunge = Math.sin(progress * Math.PI);
    const signature = current.characterId;
    const common = { energy: 2.15, signature, signatureProgress: progress, abilityIndex: current.abilityIndex };
    if (signature === 'thoth') return {
      ...common, offsetX: direction * lunge * 12, offsetY: -lunge * 19,
      rotate: direction * Math.sin(progress * Math.PI * 2) * .04, scaleX: 1 + lunge * .05, scaleY: 1 + lunge * .08,
    };
    if (signature === 'prometheus') return {
      ...common, offsetX: direction * lunge * 48, offsetY: -Math.sin(progress * Math.PI * 2) * 5,
      rotate: direction * lunge * .11, scaleX: 1 + lunge * .15, scaleY: 1 - lunge * .08,
    };
    if (signature === 'minerva') return {
      ...common, offsetX: direction * lunge * 31, offsetY: progress < .42 ? 0 : -Math.sin(progress * Math.PI) * 7,
      rotate: direction * (progress < .48 ? -.055 : .095) * lunge, scaleX: 1 + lunge * .07, scaleY: 1 - lunge * .03,
    };
    if (signature === 'quetzalcoatl') return {
      ...common, offsetX: direction * lunge * 27, offsetY: -lunge * 15,
      rotate: direction * Math.sin(progress * Math.PI * 2) * .22, scaleX: 1 + lunge * .2, scaleY: 1 - lunge * .1,
    };
    if (signature === 'erlang') {
      const blinkLunge = progress < .5 ? Math.sin(progress * Math.PI) * 58 : Math.sin((1 - progress) * Math.PI) * 58;
      return { ...common, offsetX: direction * blinkLunge, offsetY: -lunge * 8, rotate: direction * lunge * .06, scaleX: 1 + lunge * .12, scaleY: 1 - lunge * .08 };
    }
    if (signature === 'tyr') {
      const oathDrive = progress < .28
        ? -Math.sin((progress / .28) * Math.PI) * 13
        : Math.sin(((progress - .28) / .72) * Math.PI) * 43;
      return { ...common, offsetX: direction * oathDrive, offsetY: -lunge * 5, rotate: direction * lunge * .13, scaleX: 1 + lunge * .08, scaleY: 1 - lunge * .04 };
    }
    if (signature === 'ogma') return {
      ...common, offsetX: direction * lunge * 22, offsetY: -lunge * 28,
      rotate: direction * Math.sin(progress * Math.PI * 2) * .12, scaleX: 1 + lunge * .1, scaleY: 1 - lunge * .04,
    };
    if (signature === 'jacheongbi') return {
      ...common, offsetX: direction * lunge * 25, offsetY: -lunge * 13,
      rotate: direction * Math.sin(progress * Math.PI * 2) * .24, scaleX: 1 + lunge * .11, scaleY: 1 - lunge * .04,
    };
    if (signature === 'omoikane') return {
      ...common, offsetX: direction * lunge * 8, offsetY: -lunge * 24,
      rotate: Math.sin(progress * Math.PI * 2) * .035, scaleX: 1 + lunge * .16, scaleY: 1 + lunge * .16,
    };
    return {
      ...common,
      offsetX: direction * lunge * 36,
      offsetY: -Math.sin(progress * Math.PI * 2) * 3,
      rotate: direction * lunge * .075,
      scaleX: 1 + lunge * .08,
      scaleY: 1 - lunge * .045,
    };
  }
  const recoil = Math.sin(progress * Math.PI * 6) * (1 - progress);
  return {
    offsetX: recoil * 10,
    offsetY: Math.sin(progress * Math.PI) * 5,
    rotate: recoil * .045,
    scaleX: 1 + Math.sin(progress * Math.PI) * .08,
    scaleY: 1 - Math.sin(progress * Math.PI) * .13,
    energy: 2,
  };
}

function drawAnimatedPortraits(time) {
  const frame = Math.floor(time / 84);
  if (frame === state.portraitFrame) return;
  state.portraitFrame = frame;
  document.querySelectorAll('canvas[data-character-id]').forEach((portrait) => {
    if (!portrait.isConnected || portrait.offsetParent === null) return;
    const character = CHARACTERS.find((item) => item.id === portrait.dataset.characterId);
    if (!character) return;
    const card = portrait.closest('.character-card');
    const energy = card?.classList.contains('selected') ? 1.55 : card?.matches(':hover') ? 1.3 : 1;
    drawPortrait(portrait.getContext('2d'), character, time, energy);
  });
}

function drawArena(time) {
  if (!state.battle || battleScreen.hidden) return;
  const battle = state.battle;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const paper = ctx.createRadialGradient(480, 210, 20, 480, 230, 640);
  paper.addColorStop(0, '#fffdf6'); paper.addColorStop(.44, '#eee9f2'); paper.addColorStop(.76, '#d9e7e2'); paper.addColorStop(1, '#c9bfd7');
  ctx.fillStyle = paper; ctx.fillRect(0, 0, canvas.width, canvas.height);
  drawDreamBackdrop(time);

  // A wavering notebook floor makes the arena feel drawn rather than rendered.
  const floor = ctx.createLinearGradient(0, 245, 0, 430);
  floor.addColorStop(0, 'rgba(201,190,216,.55)'); floor.addColorStop(1, 'rgba(150,140,177,.82)');
  ctx.fillStyle = floor; ctx.fillRect(0, 248, 960, 182);
  ctx.strokeStyle = 'rgba(30,24,37,.12)'; ctx.lineWidth = 2;
  for (let y = 268; y < 430; y += 23) {
    ctx.beginPath();
    for (let px = 0; px <= 960; px += 24) {
      const py = y + Math.sin(px / 63 + time / 850 + y) * 2;
      if (px === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
    ctx.stroke();
  }
  ctx.save();
  ctx.globalAlpha = .075;
  ctx.font = 'bold 150px Georgia';
  ctx.fillStyle = '#17131c'; ctx.fillText('◉', 62, 372); ctx.fillText('✦', 742, 367);
  ctx.restore();

  drawFighterCard(258, 137, getActive('player'), false);
  drawFighterCard(702, 137, getActive('enemy'), true);

  // Central ink token.
  ctx.save();
  ctx.translate(480, 276);
  ctx.rotate(Math.sin(time / 780) * .065);
  ctx.fillStyle = 'rgba(20,16,25,.28)'; ctx.beginPath(); ctx.arc(5, 7, 40, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#17131c'; ctx.beginPath(); ctx.arc(0, 0, 38 + Math.sin(time / 420), 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#fffdf5'; ctx.lineWidth = 4; ctx.stroke();
  ctx.setLineDash([3, 6]); ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(0, 0, 28, 0, Math.PI * 2); ctx.stroke(); ctx.setLineDash([]);
  ctx.fillStyle = '#fffdf5'; ctx.textAlign = 'center'; ctx.font = 'bold 18px Courier New'; ctx.fillText('VS', 0, 7);
  ctx.restore();

  drawPlatform(258, 348, getActive('player').accent);
  drawPlatform(702, 348, getActive('enemy').accent);
  drawCanvasHud(getActive('player'), 34, 36, false);
  drawCanvasHud(getActive('enemy'), 926, 36, true);

  const player = getActive('player');
  const enemy = getActive('enemy');
  const playerMotion = getBattleSpriteMotion('player', time);
  const enemyMotion = getBattleSpriteMotion('enemy', time);
  const playerAlpha = battle.hitFlash.player > time && Math.floor(time / 45) % 2 ? .3 : 1;
  const enemyAlpha = battle.hitFlash.enemy > time && Math.floor(time / 45) % 2 ? .3 : 1;
  ctx.globalAlpha = playerAlpha;
  drawCharacterSprite(ctx, player, 258, 347, 6, 1, 0, { time, seed: player.index + 1, ...playerMotion });
  ctx.globalAlpha = enemyAlpha;
  drawCharacterSprite(ctx, enemy, 702, 347, 6, -1, 0, { time, seed: enemy.index + 5, ...enemyMotion });
  ctx.globalAlpha = 1;
  drawStatuses(player, 258, 391);
  drawStatuses(enemy, 702, 391);
  drawEffects(time);
}

function drawDreamBackdrop(time) {
  ctx.save();
  ctx.translate(480, 205);
  ctx.rotate(Math.sin(time / 4200) * .018);
  const colors = ['#241e2a', '#81729b', '#8aada5', '#d2a6b5'];
  for (let band = 0; band < 9; band += 1) {
    ctx.beginPath();
    const offset = band * 31 - 145;
    for (let px = -620; px <= 620; px += 14) {
      const wave = Math.sin(px / 68 + time / 1250 + band * .77) * (9 + band * .9);
      const bend = (px * px) / 14000 * Math.sin(time / 2600 + band);
      const py = offset + wave + bend;
      if (px === -620) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
    ctx.strokeStyle = colors[band % colors.length];
    ctx.globalAlpha = band % 3 === 0 ? .13 : .07;
    ctx.lineWidth = band % 2 ? 2 : 5;
    ctx.stroke();
  }
  ctx.restore();

  // Floating ink eyes, stars, and imperfect pencil dust.
  for (let i = 0; i < 30; i += 1) {
    const sx = (i * 91 + 23) % canvas.width;
    const sy = (i * 53 + 17) % 232;
    const float = Math.round(Math.sin(time / 650 + i * 1.9) * 3);
    const blink = Math.sin(time / 470 + i * 1.3) > .55;
    ctx.fillStyle = i % 4 === 0 ? '#7f7195' : '#241e2a';
    ctx.globalAlpha = blink ? .34 : .13;
    if (i % 7 === 0) {
      ctx.beginPath(); ctx.ellipse(sx, sy + float, 8, blink ? 2 : 4, 0, 0, Math.PI * 2); ctx.strokeStyle = ctx.fillStyle; ctx.lineWidth = 2; ctx.stroke();
      ctx.fillRect(sx - 1, sy - 1 + float, 2, 2);
    } else {
      ctx.fillRect(sx, sy + float, i % 5 === 0 ? 4 : 2, i % 5 === 0 ? 4 : 2);
    }
  }
  ctx.globalAlpha = 1;
}

function drawFighterCard(x, y, fighter, mirrored) {
  const width = 178; const height = 216; const left = x - width / 2;
  ctx.save();
  ctx.translate(x, y + height / 2);
  ctx.rotate((mirrored ? 1 : -1) * (.025 + Math.sin(state.lastFrame / 900) * .006));
  ctx.translate(-x, -(y + height / 2));
  ctx.fillStyle = 'rgba(24,18,29,.36)';
  ctx.beginPath(); ctx.roundRect(left + 8, y + 10, width, height, 13); ctx.fill();
  ctx.fillStyle = '#17131c';
  ctx.beginPath(); ctx.roundRect(left, y, width, height, 13); ctx.fill();
  const face = ctx.createLinearGradient(left, y, left + width, y + height);
  face.addColorStop(0, '#fffdf5'); face.addColorStop(.68, '#eee9f1'); face.addColorStop(1, colorWithAlpha(fighter.accent, .22));
  ctx.fillStyle = face;
  ctx.beginPath(); ctx.roundRect(left + 6, y + 6, width - 12, height - 12, 9); ctx.fill();
  ctx.strokeStyle = '#251e2a'; ctx.lineWidth = 2;
  ctx.setLineDash([6, 6]); ctx.beginPath(); ctx.roundRect(left + 13, y + 13, width - 26, height - 26, 5); ctx.stroke(); ctx.setLineDash([]);
  ctx.fillStyle = '#201a25';
  ctx.font = 'bold 20px Georgia';
  ctx.textAlign = mirrored ? 'right' : 'left';
  ctx.fillText('IX', mirrored ? left + width - 18 : left + 18, y + 33);
  ctx.fillStyle = fighter.accent;
  ctx.font = 'bold 25px Georgia';
  ctx.fillText(fighter.symbol, mirrored ? left + width - 18 : left + 18, y + 57);
  ctx.restore();
}

function drawPlatform(x, y, color) {
  ctx.fillStyle = 'rgba(25,19,30,.3)'; ctx.beginPath(); ctx.ellipse(x + 5, y + 8, 105, 18, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#17131c'; ctx.beginPath(); ctx.ellipse(x, y, 100, 17, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#fffdf5'; ctx.beginPath(); ctx.ellipse(x, y - 2, 93, 13, 0, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = color; ctx.lineWidth = 4; ctx.setLineDash([10, 7]); ctx.beginPath(); ctx.ellipse(x, y - 2, 83, 10, 0, 0, Math.PI * 2); ctx.stroke(); ctx.setLineDash([]);
  ctx.fillStyle = 'rgba(255,255,255,.62)'; ctx.fillRect(x - 54, y - 10, 36, 2);
}

function drawCanvasHud(fighter, x, y, right) {
  const width = 300;
  const left = right ? x - width : x;
  ctx.fillStyle = 'rgba(25,19,30,.28)'; ctx.beginPath(); ctx.roundRect(left + 5, y + 6, width, 63, 5); ctx.fill();
  ctx.fillStyle = '#17131c'; ctx.beginPath(); ctx.roundRect(left, y, width, 63, 5); ctx.fill();
  ctx.fillStyle = '#fffdf5'; ctx.beginPath(); ctx.roundRect(left + 4, y + 4, width - 8, 55, 2); ctx.fill();
  ctx.textAlign = right ? 'right' : 'left';
  ctx.font = 'bold 13px Courier New'; ctx.fillStyle = '#201a25'; ctx.fillText(fighter.verse[0], right ? x - 15 : x + 15, y + 22);
  ctx.font = 'bold 9px Courier New'; ctx.fillStyle = fighter.accent; ctx.fillText(fighter.verse[1].toUpperCase(), right ? x - 15 : x + 15, y + 37);
  const barX = left + 15; const barY = y + 45; const barWidth = width - 30;
  ctx.fillStyle = '#cbc4d0'; ctx.beginPath(); ctx.roundRect(barX, barY, barWidth, 8, 4); ctx.fill();
  ctx.fillStyle = fighter.currentHp / fighter.maxHp < .3 ? '#ff6177' : fighter.accent;
  ctx.beginPath(); ctx.roundRect(barX, barY, Math.max(1, barWidth * fighter.currentHp / fighter.maxHp), 8, 4); ctx.fill();
  if (fighter.shield) { ctx.fillStyle = '#ffffff'; ctx.fillRect(barX, barY - 3, Math.min(barWidth, fighter.shield * 3), 2); }
  ctx.textAlign = 'left';
}

function drawStatuses(fighter, x, y) {
  const active = [];
  if (fighter.shield) active.push({ text: `WARD ${fighter.shield} · REFUSAL`, color: '#b8c7ff' });
  if (fighter.status.burn) active.push({ text: `BURN ${fighter.status.burn} · ASH`, color: '#ff774f' });
  if (fighter.status.regen) active.push({ text: `ROOT ${fighter.status.regen} · RETURN`, color: '#70ef8e' });
  if (fighter.status.mark) active.push({ text: `MARK ${fighter.status.mark} · SEEN`, color: '#62a9ff' });
  if (fighter.status.weaken) active.push({ text: `WEAK ${fighter.status.weaken} · FORGET`, color: '#d994ff' });
  if (fighter.status.seal) active.push({ text: `SEAL ${fighter.status.seal} · UNSAID`, color: '#9d83ff' });
  ctx.font = '9px Courier New'; ctx.textAlign = 'center';
  active.forEach((status, index) => {
    const width = measureSplitCanvasText(ctx, status.text) + 10;
    const sx = x + (index - (active.length - 1) / 2) * 58;
    ctx.fillStyle = '#17131c'; ctx.beginPath(); ctx.roundRect(sx - width / 2 - 2, y - 2, width + 4, 20, 5); ctx.fill();
    ctx.fillStyle = '#fffdf5'; ctx.beginPath(); ctx.roundRect(sx - width / 2, y, width, 16, 3); ctx.fill();
    ctx.fillStyle = status.color; fillSplitCanvasText(ctx, status.text, sx, y + 11);
  });
  ctx.textAlign = 'left';
}

// Signature effects share the fighters' 6px grid: every mark is stamped in
// whole cells so nothing draws between the pixels the sprites live on.
const FX_PX = 6;
function fxStamp(color, x, y, thick = 1) {
  ctx.fillStyle = color;
  ctx.fillRect(Math.round(x / FX_PX) * FX_PX, Math.round(y / FX_PX) * FX_PX, thick * FX_PX, thick * FX_PX);
}
function fxRect(color, x, y, w, h) {
  let left = x, top = y, width = w, height = h;
  if (width < 0) { left += width; width = -width; }
  if (height < 0) { top += height; height = -height; }
  ctx.fillStyle = color;
  ctx.fillRect(Math.round(left / FX_PX) * FX_PX, Math.round(top / FX_PX) * FX_PX,
    Math.max(1, Math.round(width / FX_PX)) * FX_PX, Math.max(1, Math.round(height / FX_PX)) * FX_PX);
}
function fxLine(color, x1, y1, x2, y2, thick = 1) {
  const steps = Math.max(Math.abs(Math.round((x2 - x1) / FX_PX)), Math.abs(Math.round((y2 - y1) / FX_PX)), 1);
  for (let i = 0; i <= steps; i += 1) {
    fxStamp(color, x1 + ((x2 - x1) * i) / steps, y1 + ((y2 - y1) * i) / steps, thick);
  }
}
function fxRing(color, x, y, radiusX, radiusY, start = 0, sweep = Math.PI * 2) {
  const steps = Math.max(12, Math.round((radiusX + radiusY) / 4));
  for (let i = 0; i <= steps; i += 1) {
    const angle = start + (sweep * i) / steps;
    fxStamp(color, x + Math.cos(angle) * radiusX, y + Math.sin(angle) * radiusY);
  }
}
function fxDisc(color, x, y, radius) {
  const cells = Math.max(1, Math.round(radius / FX_PX));
  for (let dy = -cells; dy <= cells; dy += 1) {
    for (let dx = -cells; dx <= cells; dx += 1) {
      if (dx * dx + dy * dy <= cells * cells) fxStamp(color, x + dx * FX_PX, y + dy * FX_PX);
    }
  }
}

function drawLoreSignature(effect, progress) {
  const originX = effect.side === 'player' ? 258 : 702;
  const targetX = effect.targetSide === 'player' ? 258 : 702;
  const direction = targetX > originX ? 1 : -1;
  // Nine held frames: the signatures move in sprite steps, not smooth tweens.
  const held = Math.floor(progress * 9) / 9;
  const pulse = Math.sin(held * Math.PI);
  const travel = Math.min(1, held * 1.45);
  const ink = '#17131c';
  const paper = '#fffdf5';
  ctx.save();
  ctx.globalAlpha = Math.max(0, Math.min(1, Math.sin(progress * Math.PI) * 1.7));

  if (effect.characterId === 'thoth') {
    // Five stolen days orbit a moon while the heart is measured against a feather.
    fxRing(effect.color, originX, 211, 42 + pulse * 16, 42 + pulse * 16, -.75 * Math.PI, 1.5 * Math.PI);
    for (let index = 0; index < 5; index += 1) {
      const angle = held * 4 + (Math.PI * 2 * index) / 5;
      fxStamp(effect.color, originX + Math.cos(angle) * 62 - 6, 211 + Math.sin(angle) * 39 - 6, 2);
    }
    fxLine(ink, targetX - 60, 248, targetX + 60, 248);
    fxLine(ink, targetX, 225, targetX, 276);
    fxRect('#ff6177', targetX - 48, 252, 18, 12);
    fxLine(paper, targetX + 36, 260, targetX + 54, 242);
  } else if (effect.characterId === 'prometheus') {
    // A hidden ember travels the fennel stalk beneath the returning eagle.
    fxRect('#76884c', Math.min(originX, targetX), 258, Math.abs(targetX - originX), 12);
    fxRect('#d8c37c', Math.min(originX, targetX), 264, Math.abs(targetX - originX), 6);
    const emberX = originX + (targetX - originX) * travel;
    fxRect('#ff774f', emberX - 12, 250 - pulse * 30, 24, 24);
    fxRect('#ffd35c', emberX - 6, 244 - pulse * 36, 12, 24);
    const eagleX = originX + direction * 36;
    fxRect(ink, eagleX - 36, 156 - pulse * 18, 72, 6);
    fxRect(ink, eagleX - direction * 6, 150 - pulse * 18, 24, 18);
    fxRect(ink, eagleX + direction * 12, 156 - pulse * 18, 18, 6);
  } else if (effect.characterId === 'minerva') {
    // Loom-lines calculate the target while an armed thought splits its enclosure.
    const thread = colorWithAlpha(effect.color, .8);
    for (let index = -3; index <= 3; index += 1) {
      fxLine(thread, targetX - 78, 215 + index * 17, targetX + 78, 215 + index * 17 + pulse * index * 4);
      fxLine(thread, targetX + index * 21, 165, targetX + index * 21, 324);
    }
    fxLine(paper, originX, 196 - pulse * 42, originX, 142 - pulse * 24);
    fxLine(effect.color, originX - 36, 178, originX, 142 - pulse * 24);
    fxLine(effect.color, originX + 36, 178, originX, 142 - pulse * 24);
  } else if (effect.characterId === 'quetzalcoatl') {
    // The wind jewel becomes a hurricane; old bones stand inside its morning star.
    for (let index = 0; index <= 34; index += 1) {
      const angle = index * .46 + held * 7;
      const radius = 4 + index * 2.25 * pulse;
      fxStamp(effect.color, 480 + Math.cos(angle) * radius, 245 + Math.sin(angle) * radius * .62);
    }
    fxRect(paper, targetX - 6, 209, 12, 75);
    fxRect(paper, targetX - 36, 234, 72, 6);
    fxRect(paper, targetX - 24, 279, 12, 36); fxRect(paper, targetX + 12, 279, 12, 36);
    fxRect('#f0df73', targetX - 6, 155 - pulse * 18, 12, 42);
    fxRect('#f0df73', targetX - 21, 171 - pulse * 18, 42, 12);
  } else if (effect.characterId === 'erlang') {
    // Nine turns circle the truth-eye while the celestial hound crosses the scene.
    fxRing(effect.color, 480, 186, 68 + pulse * 24, 29 + pulse * 8);
    fxDisc('#f55c73', 480, 186, 13 + pulse * 5);
    for (let index = 0; index < 9; index += 1) {
      const angle = (Math.PI * 2 * index) / 9 + held * 5;
      const tokenX = originX + Math.cos(angle) * 67;
      const tokenY = 255 + Math.sin(angle) * 48;
      fxStamp(effect.color, tokenX - 6, tokenY - 6, 2);
      fxStamp(index % 2 ? paper : ink, tokenX - 6, tokenY - 6, 1);
    }
    const houndX = originX + (targetX - originX) * travel;
    fxRect(ink, houndX - 28 * direction, 300 - pulse * 12, 42 * direction, 18);
    fxRect(ink, houndX + 6 * direction, 288 - pulse * 12, 18 * direction, 18);
  } else if (effect.characterId === 'tyr') {
    // The offered hand closes the binding; Fenrir's jaw completes the oath.
    for (let index = 0; index < 8; index += 1) {
      const linkX = originX + direction * (32 + index * 38 * travel);
      fxRing(effect.color, linkX, 236 + (index % 2) * 9, 16, 9);
    }
    fxRect('#8e3841', originX - 24, 204 - pulse * 24, 30, 24);
    fxRect(ink, targetX - 54, 204, 60, 12); fxRect(ink, targetX - 30, 216, 60, 12); fxRect(ink, targetX - 6, 228, 48, 8);
    fxRect(ink, targetX - 54, 280, 60, 12); fxRect(ink, targetX - 30, 268, 60, 12); fxRect(ink, targetX - 6, 258, 48, 8);
    for (let index = 0; index < 5; index += 1) {
      fxRect(paper, targetX - 21 + index * 13, 230 + (index % 2) * 4, 6, 14);
      fxRect(paper, targetX - 21 + index * 13, 252 - (index % 2) * 4, 6, 14);
    }
  } else if (effect.characterId === 'ogma') {
    // Ogham cuts a furrow across the arena; Orna answers with remembered force.
    fxRect(paper, Math.min(originX, targetX), 243, Math.abs(targetX - originX), 7);
    for (let index = 0; index < 14; index += 1) {
      const markX = originX + direction * (18 + index * 25 * travel);
      fxLine(effect.color, markX, 228 - (index % 3) * 6, markX, 264 + (index % 2) * 6);
    }
    fxLine(ink, originX - direction * 18, 315, targetX + direction * 24, 184 - pulse * 24, 2);
    fxLine(paper, originX - direction * 18, 315, targetX + direction * 24, 184 - pulse * 24, 1);
  } else if (effect.characterId === 'jacheongbi') {
    // Five grains and the hardy sixth seed cross fire, then flower around the fallen.
    const grainColors = ['#f0df73', '#e9c48d', '#70ef8e', '#ffce6c', '#fffdf5', '#d994ff'];
    grainColors.forEach((color, index) => {
      const arc = Math.sin(travel * Math.PI) * (46 + index * 5);
      const seedX = originX + (targetX - originX) * travel + direction * index * 5;
      fxRect(color, seedX - 6, 282 - arc + (index % 2) * 8, 12, 8);
    });
    grainColors.forEach((color, index) => {
      const angle = (Math.PI * 2 * index) / grainColors.length;
      fxStamp(color, targetX + Math.cos(angle) * (24 + pulse * 36) - 8, 245 + Math.sin(angle) * (18 + pulse * 27) - 8, 2);
    });
    for (let index = -3; index <= 3; index += 1) {
      fxRect('#6ca56f', targetX + index * 18, 306 - pulse * (18 + Math.abs(index) * 6), 6, 42);
    }
  } else if (effect.characterId === 'omoikane') {
    // Many thoughts become two pillars; the cave opens only where they agree.
    fxRect(ink, targetX - 90, 156, 180, 168);
    fxRect(paper, targetX - 6 - pulse * 18, 156, 12 + pulse * 36, 168);
    for (let index = 0; index < 8; index += 1) {
      const angle = (Math.PI * 2 * index) / 8 + held * 2;
      const fromX = originX + Math.cos(angle) * 92;
      const fromY = 241 + Math.sin(angle) * 70;
      fxStamp(index % 2 ? '#61e7e1' : effect.color, fromX + (480 - fromX) * travel - 6, fromY + (206 - fromY) * travel - 6, 2);
    }
    fxRect(effect.color, originX - 60, 192, 18, 138);
    fxRect(effect.color, originX + 42, 192, 18, 138);
  }
  ctx.restore();
}

function drawEffects(time) {
  state.effects = state.effects.filter((effect) => time - effect.start < effect.duration);
  state.effects.forEach((effect) => {
    const progress = (time - effect.start) / effect.duration;
    const x = effect.side === 'player' ? 258 : 702;
    const direction = effect.side === 'player' ? 1 : -1;
    // Generic effects live on the fighters' own 6px grid (258 and 702 are both
    // multiples of 6) and animate in six held frames, like the sprites do.
    const PX = 6;
    const cx = x / PX;
    const frame = Math.min(5, Math.floor(progress * 6));
    const px = (color, cellX, cellY, cellW = 1, cellH = 1) => {
      ctx.fillStyle = color;
      ctx.fillRect(cellX * PX, cellY * PX, cellW * PX, cellH * PX);
    };
    ctx.save();
    ctx.globalAlpha = Math.max(.15, 1 - frame * .16);
    if (effect.type === 'lore') {
      ctx.globalAlpha = Math.max(0, 1 - progress);
      drawLoreSignature(effect, progress);
    } else if (effect.type === 'hit') {
      const reach = 2 + frame * 2;
      [[1, 0], [0, 1], [-1, 0], [0, -1], [1, 1], [-1, 1], [1, -1], [-1, -1]].forEach(([dx, dy], i) => {
        const dist = reach - (i % 2);
        const size = frame < 3 ? 2 : 1;
        px(i % 3 ? effect.color : '#edf3ff',
          cx + dx * dist - (dx < 0 ? size - 1 : 0),
          45 + dy * Math.round(dist * .8) - (dy < 0 ? size - 1 : 0), size, size);
      });
      if (frame < 3) {
        for (let stair = 0; stair < 6; stair += 1) {
          px('#edf3ff', cx + direction * (stair - 7 + frame * 2), 40 + stair, 2, 1);
        }
      }
      if (frame < 2) {
        px('#edf3ff', cx - 1, 44, 2, 2);
        px(effect.color, cx - 3, 44, 2, 2); px(effect.color, cx + 2, 44, 2, 2);
        px(effect.color, cx - 1, 42, 2, 2); px(effect.color, cx - 1, 46, 2, 2);
      }
    } else if (effect.type === 'shield') {
      const grow = frame >> 1;
      const left = cx - 12 - grow, right = cx + 11 + grow, top = 29 - grow, bottom = 57 + grow;
      px(effect.color, left, top, 4, 1); px(effect.color, left, top + 1, 1, 3);
      px(effect.color, right - 3, top, 4, 1); px(effect.color, right, top + 1, 1, 3);
      px(effect.color, left, bottom, 4, 1); px(effect.color, left, bottom - 3, 1, 3);
      px(effect.color, right - 3, bottom, 4, 1); px(effect.color, right, bottom - 3, 1, 3);
      if (frame % 2 === 0) {
        px('#edf3ff', cx, top, 1, 1); px('#edf3ff', cx, bottom, 1, 1);
        px('#edf3ff', left, 43, 1, 1); px('#edf3ff', right, 43, 1, 1);
      }
    } else if (effect.type === 'heal' || effect.type === 'focus') {
      for (let i = 0; i < 8; i += 1) {
        const col = cx - 8 + i * 2 + (i % 2);
        const cellY = 54 - Math.floor(progress * (9 + (i % 3) * 3));
        px(effect.color, col, cellY, 1, 2);
        px('#edf3ff', col, cellY, 1, 1);
        if (i % 3 === 0 && frame % 2 === 0) {
          px(effect.color, col - 1, cellY + 1, 1, 1); px(effect.color, col + 1, cellY + 1, 1, 1);
        }
      }
    } else if (effect.type === 'burn') {
      for (let i = 0; i < 5; i += 1) {
        const col = cx - 6 + i * 3;
        const base = 54 - Math.floor(progress * (11 + (i % 2) * 4));
        const flick = (frame + i) % 2;
        px('#ff774f', col, base, 2, 3);
        px('#ff8d43', col + flick, base + 1, 1, 2);
        px('#ffd35c', col + 1 - flick, base - 1, 1, 1);
      }
    } else if (effect.type === 'mark') {
      const mid = 43;
      const half = 8 - Math.min(4, frame);
      const bl = cx - half, br = cx + half, bt = mid - half, bb = mid + half;
      px(effect.color, bl, bt, 3, 1); px(effect.color, bl, bt, 1, 3);
      px(effect.color, br - 2, bt, 3, 1); px(effect.color, br, bt, 1, 3);
      px(effect.color, bl, bb, 3, 1); px(effect.color, bl, bb - 2, 1, 3);
      px(effect.color, br - 2, bb, 3, 1); px(effect.color, br, bb - 2, 1, 3);
      if (frame >= 2) {
        px('#edf3ff', cx - 1, mid - 1, 3, 2);
        px('#101529', cx, mid - 1, 1, 1);
      }
    }
    if (effect.text) {
      ctx.globalAlpha = Math.max(0, 1 - progress * 1.15);
      const effectLines = effect.text.split('\n');
      ctx.font = `bold ${effectLines.length > 1 ? 12 : 16}px Courier New`; ctx.textAlign = 'center'; ctx.fillStyle = effect.color;
      effectLines.forEach((line, lineIndex) => fillSplitCanvasText(ctx, line, x, 197 + lineIndex * 15 - progress * 45));
    }
    ctx.restore();
  });
}

function drawFrame(time) {
  drawAnimatedPortraits(time);
  drawArena(time);
  state.lastFrame = time;
  requestAnimationFrame(drawFrame);
}

startButton.addEventListener('click', startBattle);
randomButton.addEventListener('click', randomizeTeam);
archiveButton.addEventListener('click', openArchive);
swapButton.addEventListener('click', openSwapModal);
$('#how-to-button').addEventListener('click', () => { sound.click(); openModal('help-modal'); });
$('#sound-button').addEventListener('click', (event) => {
  state.muted = !state.muted;
  sound.setMuted(state.muted);
  event.currentTarget.setAttribute('aria-pressed', String(state.muted));
  event.currentTarget.textContent = state.muted ? '×' : '♪';
  event.currentTarget.setAttribute('aria-label', state.muted ? 'Unmute sound and music' : 'Mute sound and music');
  if (!state.muted) sound.click();
});
$('#play-again-button').addEventListener('click', resetGame);
$('#ftue-skip').addEventListener('click', completeFtue);
$('#ftue-continue').addEventListener('click', completeFtue);
$('#restart-ftue-button').addEventListener('click', restartFtue);
$('#archive-previous').addEventListener('click', () => {
  if (state.archive.selected <= 0) return;
  state.archive.selected -= 1;
  sound.click();
  renderArchiveReader();
});
$('#archive-next').addEventListener('click', () => {
  if (state.archive.selected >= state.archive.unlocked - 1) return;
  state.archive.selected += 1;
  sound.click();
  renderArchiveReader();
});
document.querySelectorAll('[data-close-modal]').forEach((button) => button.addEventListener('click', closeModal));
modalBackdrop.addEventListener('click', (event) => { if (event.target === modalBackdrop) closeModal(); });
window.addEventListener('keydown', (event) => {
  const modalOpen = !modalBackdrop.hidden;
  if (event.key === 'Escape' && modalOpen) { closeModal(); return; }
  if (!state.battle || battleScreen.hidden || modalOpen) return;
  if (['1', '2', '3'].includes(event.key)) playerAction(Number(event.key) - 1);
  if (event.key.toLowerCase() === 's') openSwapModal();
});

// --- Shed hairs on the glass: long, twisty, wipeable, patient to return. ---
const HAIR_COUNT = 5;
const hairCanvas = document.createElement('canvas');
hairCanvas.className = 'shed-hair';
hairCanvas.setAttribute('aria-hidden', 'true');
document.body.appendChild(hairCanvas);
const hairCtx = hairCanvas.getContext('2d');
const hairPalette = ['#1d1512', '#2a1d15', '#161010', '#33241a', '#241a14'];

function shedHairPath() {
  const margin = 36;
  const width = Math.max(320, window.innerWidth);
  const height = Math.max(320, window.innerHeight);
  let x = margin + Math.random() * (width - margin * 2);
  let y = margin + Math.random() * (height - margin * 2);
  let heading = Math.random() * Math.PI * 2;
  let curvature = (Math.random() - .5) * .06;
  // Long fine hair: gentle drifting curves, only the rare soft loop.
  const steps = 380 + Math.floor(Math.random() * 220);
  const points = [{ x, y }];
  for (let i = 0; i < steps; i += 1) {
    curvature += (Math.random() - .5) * .016;
    curvature = Math.max(-.13, Math.min(.13, curvature));
    if (Math.random() < .008) curvature = (Math.random() - .5) * .3; // a soft turn
    heading += curvature;
    x += Math.cos(heading) * 3.1;
    y += Math.sin(heading) * 3.1;
    if (x < margin || x > width - margin) { heading = Math.PI - heading; curvature *= .4; }
    if (y < margin || y > height - margin) { heading = -heading; curvature *= .4; }
    points.push({ x, y, ox: 0, oy: 0 });
  }
  return points;
}

// The cursor is a finger on the glass: strands near it get brushed aside,
// then settle back into their shed shape.
const hairPointer = { x: -9999, y: -9999, vx: 0, vy: 0 };
const hairStill = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
document.addEventListener('pointermove', (event) => {
  hairPointer.vx = hairPointer.x === -9999 ? 0 : event.clientX - hairPointer.x;
  hairPointer.vy = hairPointer.y === -9999 ? 0 : event.clientY - hairPointer.y;
  hairPointer.x = event.clientX;
  hairPointer.y = event.clientY;
});

function disturbStrand(strand) {
  if (hairStill) return;
  const touchRadius = 42;
  let dragX = 0;
  let dragY = 0;
  let touched = 0;
  strand.points.forEach((point) => {
    const px = point.x + point.ox;
    const py = point.y + point.oy;
    const dx = px - hairPointer.x;
    const dy = py - hairPointer.y;
    const dist = Math.hypot(dx, dy);
    if (dist < touchRadius) {
      const strength = (1 - dist / touchRadius) ** 2;
      const away = strength * 2.6;
      const pushX = (dx / (dist || 1)) * away + hairPointer.vx * strength * .38;
      const pushY = (dy / (dist || 1)) * away + hairPointer.vy * strength * .38;
      point.ox += pushX;
      point.oy += pushY;
      dragX += pushX;
      dragY += pushY;
      touched += 1;
      const magnitude = Math.hypot(point.ox, point.oy);
      if (magnitude > 30) { point.ox *= 30 / magnitude; point.oy *= 30 / magnitude; }
    }
    point.ox *= .9;
    point.oy *= .9;
  });
  // The touch also slides the whole hair a little across the glass, and it
  // stays where it was nudged.
  if (touched) {
    const shiftX = Math.max(-1.6, Math.min(1.6, (dragX / touched) * .3));
    const shiftY = Math.max(-1.6, Math.min(1.6, (dragY / touched) * .3));
    strand.points.forEach((point) => { point.x += shiftX; point.y += shiftY; });
  }
}

const hairStrands = Array.from({ length: HAIR_COUNT }, (_, index) => ({
  index,
  points: null,
  color: hairPalette[index % hairPalette.length],
  alpha: 0,
  landing: true,
  wipe: null,
  returnAt: 0,
}));

function drawHairStrand(strand) {
  const points = strand.points;
  const drift = strand.wipe ? strand.wipe.drift : 0;
  const drawPass = (offsetX, offsetY, color, lineWidth, alpha) => {
    hairCtx.strokeStyle = color;
    hairCtx.lineWidth = lineWidth;
    hairCtx.globalAlpha = alpha;
    hairCtx.beginPath();
    points.forEach((point, i) => {
      const px = point.x + point.ox + offsetX + drift;
      const py = point.y + point.oy + offsetY + drift * .4;
      if (i === 0) hairCtx.moveTo(px, py); else hairCtx.lineTo(px, py);
    });
    hairCtx.stroke();
  };
  drawPass(0, 0, strand.color, .75, strand.alpha);
  drawPass(.5, -.5, 'rgba(140,104,72,.22)', .3, strand.alpha); // a thin sheen along one edge
}

function drawHair(time) {
  const width = window.innerWidth;
  const height = window.innerHeight;
  if (hairCanvas.width !== width || hairCanvas.height !== height) {
    hairCanvas.width = width;
    hairCanvas.height = height;
    hairStrands.forEach((strand) => { if (!strand.wipe && strand.points) strand.points = shedHairPath(); });
  }
  hairCtx.clearRect(0, 0, width, height);
  hairCtx.lineCap = 'round';
  hairCtx.lineJoin = 'round';
  hairStrands.forEach((strand) => {
    if (!strand.points) {
      if (!strand.returnAt) strand.returnAt = time + strand.index * 900; // first sheds arrive one by one
      if (time >= strand.returnAt) {
        strand.points = shedHairPath();
        strand.alpha = 0;
        strand.landing = true;
        strand.wipe = null;
      } else return;
    }
    if (strand.landing) {
      strand.alpha = Math.min(.55, strand.alpha + .02);
      if (strand.alpha >= .55) strand.landing = false;
    }
    if (strand.wipe) {
      strand.wipe.drift += 2.6;
      strand.alpha -= .07;
      if (strand.alpha <= 0) {
        strand.points = null;
        strand.wipe = null;
        strand.returnAt = time + 22000 + Math.random() * 21000;
        return;
      }
    }
    disturbStrand(strand);
    drawHairStrand(strand);
  });
  hairCtx.globalAlpha = 1;
  requestAnimationFrame(drawHair);
}

document.addEventListener('pointerdown', (event) => {
  hairStrands.forEach((strand) => {
    if (!strand.points || strand.wipe || strand.landing) return;
    const hit = strand.points.some((point) => Math.hypot(point.x - event.clientX, point.y - event.clientY) < 10);
    if (!hit) return;
    strand.wipe = { drift: 0 };
    sound.tone(640 - strand.index * 40, .05, 'triangle', .02);
    event.preventDefault();
    event.stopPropagation();
  });
}, true);

installSplitThreeTypography();
updateArchiveProgress();
renderRoster();
openArchiveIntro();
requestAnimationFrame(drawFrame);
requestAnimationFrame(drawHair);
