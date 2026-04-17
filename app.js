/* ═══════════════════════════════════════════════════════
   WORD SEARCH PRO — app.js
   Fully rewritten: all bugs fixed, stats system, clean logic
═══════════════════════════════════════════════════════ */

'use strict';

// ── Themes ──────────────────────────────────────────────
const THEMES = {
    "Animals 🦁":    ["LION","TIGER","ELEPHANT","GIRAFFE","MONKEY","ZEBRA","RABBIT","PANDA","KANGAROO","HIPPO","DOLPHIN","SHARK","WHALE","PARROT","EAGLE","SNAKE","TURTLE","FROG","WOLF","BEAR"],
    "Food 🍕":       ["PIZZA","BURGER","PASTA","CHICKEN","APPLE","BANANA","ORANGE","CHERRY","BREAD","CHEESE","COOKIE","CAKE","SALAD","TOMATO","POTATO","DONUT","MILK","JUICE","MANGO","STEAK"],
    "Professions 👩‍⚕️":["DOCTOR","NURSE","TEACHER","POLICE","PILOT","CHEF","DENTIST","FARMER","ARTIST","SINGER","ACTOR","WRITER","COACH","JUDGE","BAKER","WAITER","SAILOR","MINER","GUARD","DRIVER"],
    "Places 🏠":     ["HOUSE","SCHOOL","PARK","BEACH","MUSEUM","CINEMA","OFFICE","STREET","GARDEN","FOREST","CHURCH","STORE","BANK","STADIUM","ZOO","AIRPORT","HOTEL","CITY","ISLAND","CASTLE"],
    "Space 🚀":      ["PLANET","STARS","MOON","SUN","COMET","GALAXY","ROCKET","ALIEN","ORBIT","METEOR","NEBULA","ASTEROID","COSMOS","EARTH","MARS","VENUS","SATURN","PLUTO","APOLLO","RADAR"],
    "Sports ⚽":     ["SOCCER","TENNIS","BASKETBALL","BASEBALL","GOLF","RUGBY","HOCKEY","VOLLEYBALL","CRICKET","BOXING","SKIING","SURFING","CYCLING","RUNNING","SWIMMING","KARATE","JUDO","CHESS","DARTS","BOWLING"],
    "Colors 🎨":     ["RED","BLUE","GREEN","YELLOW","BLACK","WHITE","PINK","PURPLE","ORANGE","BROWN","GREY","CYAN","MAGENTA","MAROON","OLIVE","NAVY","TEAL","SILVER","GOLD","INDIGO"],
    "Clothes 👕":    ["SHIRT","PANTS","DRESS","SKIRT","SHOES","SOCKS","HAT","COAT","JACKET","GLOVES","SCARF","BELT","TIE","BOOTS","SWEATER","JEANS","SHORTS","SUIT","BLOUSE","SLIPPERS"],
    "Body 👁️":      ["HEAD","EYES","NOSE","MOUTH","EARS","HAIR","NECK","SHOULDERS","ARMS","HANDS","FINGERS","LEGS","FEET","TOES","BACK","CHEST","STOMACH","KNEES","ELBOWS","TEETH"],
    "Vehicles 🚗":   ["CAR","BUS","TRAIN","BIKE","MOTORCYCLE","AIRPLANE","HELICOPTER","BOAT","SHIP","TRUCK","VAN","TRACTOR","SUBMARINE","SCOOTER","TRAM","AMBULANCE","TAXI","FERRY","GLIDER","WAGON"],
    "Weather 🌤️":   ["RAIN","SUN","CLOUD","WIND","SNOW","STORM","LIGHTNING","THUNDER","FOG","HAIL","TORNADO","HURRICANE","BREEZE","FROST","DEW","RAINBOW","MIST","CYCLONE","BLIZZARD","WARM"],
    "Emotions 😃":   ["HAPPY","SAD","ANGRY","SCARED","EXCITED","BORED","TIRED","PROUD","SHY","BRAVE","CALM","NERVOUS","SURPRISED","JEALOUS","HOPEFUL","LONELY","SILLY","CONFUSED","RELAXED","JOY"],
    "Music 🎵":      ["PIANO","GUITAR","DRUMS","VIOLIN","FLUTE","TRUMPET","BASS","SINGER","SONG","BAND","CONCERT","MELODY","RHYTHM","NOTES","CHORD","STUDIO","RADIO","JAZZ","ROCK","OPERA"],
    "Nature 🌳":     ["TREE","FLOWER","GRASS","LEAF","RIVER","MOUNTAIN","LAKE","OCEAN","ROCK","DIRT","SAND","WOOD","FIRE","ICE","CAVE","HILL","VALLEY","WATERFALL","VOLCANO","DESERT"]
};

// ── Audio ────────────────────────────────────────────────
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

function playTone(freq, dur, type = 'sine', vol = 0.12, attack = 0.01, decay = 0.1) {
    try {
        if (audioCtx.state === 'suspended') audioCtx.resume();
        const o = audioCtx.createOscillator();
        const g = audioCtx.createGain();
        o.type = type;
        o.frequency.value = freq;
        g.gain.setValueAtTime(0, audioCtx.currentTime);
        g.gain.linearRampToValueAtTime(vol, audioCtx.currentTime + attack);
        g.gain.setValueAtTime(vol, audioCtx.currentTime + attack);
        g.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + dur);
        o.connect(g); g.connect(audioCtx.destination);
        o.start(); o.stop(audioCtx.currentTime + dur + 0.05);
    } catch (e) { /* silence audio errors */ }
}

function playChord(freqs, dur, vol = 0.07) {
    freqs.forEach(f => playTone(f, dur, 'sine', vol));
}

function playBounce(freq, dur) {
    try {
        if (audioCtx.state === 'suspended') audioCtx.resume();
        const o = audioCtx.createOscillator();
        const g = audioCtx.createGain();
        o.type = 'sine';
        o.frequency.setValueAtTime(freq * 1.5, audioCtx.currentTime);
        o.frequency.exponentialRampToValueAtTime(freq, audioCtx.currentTime + dur * 0.4);
        g.gain.setValueAtTime(0.13, audioCtx.currentTime);
        g.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + dur);
        o.connect(g); g.connect(audioCtx.destination);
        o.start(); o.stop(audioCtx.currentTime + dur + 0.05);
    } catch(e) {}
}

const SFX = {
    // Playful "boing" tick when dragging
    tick: () => {
        playBounce(800, 0.06);
    },

    // Happy ascending arpeggio when word found
    success: () => {
        const melody = [523, 659, 784, 1047]; // C5 E5 G5 C6
        melody.forEach((n, i) => {
            setTimeout(() => {
                playBounce(n, 0.18);
            }, i * 90);
        });
        // Sparkle harmony on top
        setTimeout(() => playChord([784, 988, 1175], 0.35, 0.04), 300);
    },

    // Gentle "whoops" descending — not scary for kids
    error: () => {
        playTone(440, 0.08, 'sine', 0.09);
        setTimeout(() => playTone(330, 0.12, 'sine', 0.07), 80);
    },

    // Big joyful fanfare — bubbly and triumphant
    fanfare: () => {
        const melody = [523, 659, 784, 659, 784, 1047, 988, 1047];
        const delays = [0, 120, 240, 360, 440, 560, 680, 780];
        melody.forEach((n, i) => {
            setTimeout(() => playBounce(n, 0.22), delays[i]);
        });
        // Final chord burst
        setTimeout(() => {
            playChord([523, 659, 784, 1047], 0.6, 0.06);
        }, 900);
        // Sparkle tinkle
        const sparkle = [1568, 1760, 2093, 1760, 2093];
        sparkle.forEach((n, i) => {
            setTimeout(() => playTone(n, 0.1, 'sine', 0.03), 900 + i * 80);
        });
    }
};

// ── State ────────────────────────────────────────────────
let state = {
    grid: [],
    gridSize: 12,
    selectedWords: [],
    foundWords: new Set(),
    timeElapsed: 0,
    timerInterval: null,
    score: 0,
    difficulty: 'easy',
    theme: '',
    isDragging: false,
    selection: [],          // array of cell elements
    selectionIndices: [],   // array of {r, c}
};

// ── Storage helpers ──────────────────────────────────────
function loadStats() {
    try { return JSON.parse(localStorage.getItem('ws_stats')) || {}; } catch { return {}; }
}
function saveStats(s) {
    localStorage.setItem('ws_stats', JSON.stringify(s));
}

// ── Screen navigation ────────────────────────────────────
function showScreen(id) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(id).classList.add('active');
}

// ── Init ─────────────────────────────────────────────────
window.addEventListener('load', () => {
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('sw.js').catch(() => {});
    }

    // Populate theme select
    const sel = document.getElementById('inp-theme');
    Object.keys(THEMES).forEach(t => {
        const opt = document.createElement('option');
        opt.value = t; opt.textContent = t;
        sel.appendChild(opt);
    });

    // Restore saved name
    const savedName = localStorage.getItem('ws_user') || '';
    if (savedName) document.getElementById('inp-name').value = savedName;

    // Difficulty buttons
    document.querySelectorAll('.diff-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.diff-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
        });
    });

    showScreen('screen-welcome');

    // Button bindings
    document.getElementById('btn-start').addEventListener('click', startGame);
    document.getElementById('btn-exit').addEventListener('click', exitGame);
    document.getElementById('btn-play-again').addEventListener('click', () => showScreen('screen-welcome'));
    document.getElementById('btn-win-stats').addEventListener('click', openStats);
    document.getElementById('btn-stats-from-welcome').addEventListener('click', openStats);
    document.getElementById('btn-stats-back').addEventListener('click', () => showScreen('screen-welcome'));
    document.getElementById('btn-new-game-from-stats').addEventListener('click', () => showScreen('screen-welcome'));
});

// ── Start Game ───────────────────────────────────────────
function startGame() {
    const nameInput = document.getElementById('inp-name').value.trim() || 'Player';
    localStorage.setItem('ws_user', nameInput);

    const themeKey = document.getElementById('inp-theme').value;
    const diffBtn  = document.querySelector('.diff-btn.active');
    const diff     = diffBtn ? diffBtn.dataset.diff : 'easy';

    state.difficulty    = diff;
    state.theme         = themeKey;
    state.gridSize      = diff === 'easy' ? 12 : 16;
    const wordCount     = diff === 'easy' ? 10 : 20;
    state.foundWords    = new Set();
    state.score         = 0;
    state.selection     = [];
    state.selectionIndices = [];
    state.isDragging    = false;

    // Pick random words
    const pool = [...THEMES[themeKey]];
    pool.sort(() => Math.random() - 0.5);
    state.selectedWords = pool.slice(0, wordCount);

    // Build grid
    state.grid = Array.from({ length: state.gridSize }, () => Array(state.gridSize).fill(''));
    state.selectedWords.forEach(w => placeWord(w));
    fillGrid();

    // Update HUD
    document.getElementById('hud-name').textContent = nameInput;
    document.getElementById('hud-theme').textContent = themeKey;
    document.getElementById('hud-score').textContent = '0';
    document.getElementById('hud-time').textContent  = '0s';
    document.getElementById('words-found-count').textContent = '0';
    document.getElementById('words-total-count').textContent = `/ ${wordCount}`;

    renderGrid();
    renderWordList();
    startTimer();
    updateRing();
    showScreen('screen-game');
}

// ── Grid building ────────────────────────────────────────
const DIRECTIONS = [[0,1],[1,0],[1,1],[1,-1],[-1,0],[0,-1],[-1,-1],[-1,1]];

function placeWord(word) {
    let placed = false, attempts = 0;
    while (!placed && attempts < 200) {
        const dir = DIRECTIONS[Math.floor(Math.random() * DIRECTIONS.length)];
        const r   = Math.floor(Math.random() * state.gridSize);
        const c   = Math.floor(Math.random() * state.gridSize);
        if (canPlace(word, r, c, dir)) {
            for (let i = 0; i < word.length; i++) {
                state.grid[r + i * dir[0]][c + i * dir[1]] = word[i];
            }
            placed = true;
        }
        attempts++;
    }
}

function canPlace(word, r, c, dir) {
    for (let i = 0; i < word.length; i++) {
        const nr = r + i * dir[0], nc = c + i * dir[1];
        if (nr < 0 || nr >= state.gridSize || nc < 0 || nc >= state.gridSize) return false;
        const existing = state.grid[nr][nc];
        if (existing !== '' && existing !== word[i]) return false;
    }
    return true;
}

function fillGrid() {
    for (let r = 0; r < state.gridSize; r++)
        for (let c = 0; c < state.gridSize; c++)
            if (!state.grid[r][c])
                state.grid[r][c] = String.fromCharCode(65 + Math.floor(Math.random() * 26));
}

// ── Render ───────────────────────────────────────────────
// cellPx and gridOrigin stored so selection math can use them
state.cellPx = 0;
state.gridOrigin = { x: 0, y: 0 };

function renderGrid() {
    const container = document.getElementById('word-search-container');
    container.innerHTML = '';

    // Bottom bar: 1 row for easy (~72px), 2 rows for hard (~118px)
    const bottomBarH = state.difficulty === 'hard' ? 118 : 72;

    // Apply height dynamically to sidebar
    const sidebar = document.querySelector('.sidebar');
    if (sidebar) sidebar.style.height = bottomBarH + 'px';

    // Leave edge padding so border cells are always reachable
    const screenW  = window.innerWidth;
    const screenH  = window.innerHeight;
    const headerEl = document.querySelector('.game-header');
    const headerH  = headerEl ? headerEl.offsetHeight : 50;
    const edgePad  = 20; // px on each side — keeps grid off the screen edge

    const availW = screenW - edgePad * 2;
    const availH = screenH - headerH - bottomBarH - edgePad;

    const maxByW = Math.floor(availW / state.gridSize);
    const maxByH = Math.floor(availH / state.gridSize);
    const cellPx = Math.max(1, Math.min(maxByW, maxByH));
    const gridPx = cellPx * state.gridSize + (state.gridSize - 1) * 2 + 12; // 6px padding each side

    state.cellPx = cellPx + 2; // cell size + gap

    container.style.gridTemplateColumns = `repeat(${state.gridSize}, ${cellPx}px)`;
    container.style.gridTemplateRows    = `repeat(${state.gridSize}, ${cellPx}px)`;
    container.style.width  = `${gridPx}px`;
    container.style.height = `${gridPx}px`;

    for (let r = 0; r < state.gridSize; r++) {
        for (let c = 0; c < state.gridSize; c++) {
            const div = document.createElement('div');
            div.className = 'cell';
            div.textContent = state.grid[r][c];
            div.style.fontSize = `${Math.max(9, Math.floor(cellPx * 0.5))}px`;
            div.dataset.r = r;
            div.dataset.c = c;
            container.appendChild(div);
        }
    }

    container.addEventListener('pointerdown', onPointerDown);
    container.addEventListener('pointermove', onPointerMove);
    container.addEventListener('pointerup',   onPointerUp);
    container.addEventListener('pointercancel', onPointerUp);
    container.setPointerCapture;
}

function renderWordList() {
    const list = document.getElementById('word-list');
    list.innerHTML = '';
    state.selectedWords.forEach(w => {
        const li = document.createElement('li');
        li.textContent = w;
        li.id = `wl-${w}`;
        list.appendChild(li);
    });
}

// ── Selection — Line-Snap System ─────────────────────────
// Strategy: on pointerdown record start cell. On pointermove,
// compute the raw vector from start to current finger position,
// snap it to the nearest of 8 directions, then highlight ALL
// cells along that line up to the finger distance. This makes
// diagonal selection effortless — you just drag in the rough
// direction and all cells auto-highlight.

function getCellFromPoint(x, y) {
    const container = document.getElementById('word-search-container');
    const rect = container.getBoundingClientRect();
    const lx = x - rect.left - 6; // 6px = container padding
    const ly = y - rect.top  - 6;
    const r = Math.floor(ly / state.cellPx);
    const c = Math.floor(lx / state.cellPx);
    if (r < 0 || r >= state.gridSize || c < 0 || c >= state.gridSize) return null;
    return { r, c };
}

function snapDirection(dr, dc) {
    // Snap raw vector to one of 8 directions
    if (dr === 0 && dc === 0) return { dr: 0, dc: 0 };
    const angle = Math.atan2(dr, dc); // -π to π
    const step  = Math.PI / 4;        // 45°
    const snapped = Math.round(angle / step) * step;
    return {
        dr: Math.round(Math.sin(snapped)),
        dc: Math.round(Math.cos(snapped))
    };
}

function getCellsAlongLine(startR, startC, dr, dc, length) {
    const cells = [];
    for (let i = 0; i < length; i++) {
        const r = startR + i * dr;
        const c = startC + i * dc;
        if (r < 0 || r >= state.gridSize || c < 0 || c >= state.gridSize) break;
        cells.push({ r, c });
    }
    return cells;
}

function highlightCells(cellCoords) {
    // Clear old selection highlights (not found ones)
    document.querySelectorAll('.cell.selected').forEach(el => el.classList.remove('selected'));
    cellCoords.forEach(({ r, c }) => {
        const el = document.querySelector(`.cell[data-r="${r}"][data-c="${c}"]`);
        if (el && !el.classList.contains('found')) el.classList.add('selected');
    });
}

function onPointerDown(e) {
    e.preventDefault();
    const pos = getCellFromPoint(e.clientX, e.clientY);
    if (!pos) return;
    state.isDragging    = true;
    state.startCell     = pos;
    state.currentLine   = [pos];
    highlightCells([pos]);
    SFX.tick();
}

function onPointerMove(e) {
    if (!state.isDragging || !state.startCell) return;
    e.preventDefault();

    const end = getCellFromPoint(e.clientX, e.clientY);
    if (!end) return;

    const rawDr = end.r - state.startCell.r;
    const rawDc = end.c - state.startCell.c;

    if (rawDr === 0 && rawDc === 0) {
        state.currentLine = [state.startCell];
        highlightCells(state.currentLine);
        return;
    }

    const { dr, dc } = snapDirection(rawDr, rawDc);
    // Length = how many steps along snapped direction the finger has travelled
    const length = Math.max(Math.abs(rawDr), Math.abs(rawDc)) + 1;
    const line = getCellsAlongLine(state.startCell.r, state.startCell.c, dr, dc, length);

    // Only update + tick if line changed
    const prevLen = state.currentLine.length;
    state.currentLine = line;
    highlightCells(line);
    if (line.length !== prevLen) SFX.tick();
}

function onPointerUp(e) {
    if (!state.isDragging) return;
    state.isDragging = false;

    const line = state.currentLine || [];
    const word = line.map(({ r, c }) => state.grid[r][c]).join('');
    const rev  = word.split('').reverse().join('');
    const found = state.selectedWords.find(w => (w === word || w === rev) && !state.foundWords.has(w));

    if (found) {
        state.foundWords.add(found);
        line.forEach(({ r, c }) => {
            const el = document.querySelector(`.cell[data-r="${r}"][data-c="${c}"]`);
            if (el) {
                el.classList.remove('selected');
                el.classList.add('found');
                el.classList.remove('flash');
                void el.offsetWidth;
                el.classList.add('flash');
            }
        });
        document.getElementById(`wl-${found}`)?.classList.add('found');
        state.score += (state.difficulty === 'easy' ? 10 : 15);
        document.getElementById('hud-score').textContent = state.score;
        updateRing();
        SFX.success();
        checkWin();
    } else {
        document.querySelectorAll('.cell.selected').forEach(el => el.classList.remove('selected'));
        if (line.length > 1) SFX.error();
    }

    state.startCell   = null;
    state.currentLine = [];
}

// ── Progress Ring ────────────────────────────────────────
function updateRing() {
    const total  = state.selectedWords.length;
    const done   = state.foundWords.size;
    const circ   = 2 * Math.PI * 34; // r=34
    const offset = circ * (1 - done / total);
    document.getElementById('ring-fill').style.strokeDashoffset = offset;
    document.getElementById('words-found-count').textContent = done;
}

// ── Timer ────────────────────────────────────────────────
function startTimer() {
    state.timeElapsed = 0;
    clearInterval(state.timerInterval);
    state.timerInterval = setInterval(() => {
        state.timeElapsed++;
        document.getElementById('hud-time').textContent = formatTime(state.timeElapsed);
    }, 1000);
}

function formatTime(s) {
    if (s < 60) return `${s}s`;
    return `${Math.floor(s/60)}m ${s%60}s`;
}

// ── Win / Exit ───────────────────────────────────────────
function checkWin() {
    if (state.foundWords.size < state.selectedWords.length) return;
    clearInterval(state.timerInterval);
    SFX.fanfare();

    // Save stats
    const stats = loadStats();
    const name  = localStorage.getItem('ws_user') || 'Player';
    if (!stats[name]) stats[name] = { score: 0, games: 0, times: [] };
    stats[name].score += state.score;
    stats[name].games += 1;
    stats[name].times.push(state.timeElapsed);

    // Keep last 10 recent games
    if (!stats[name].recent) stats[name].recent = [];
    stats[name].recent.unshift({
        theme: state.theme,
        score: state.score,
        time:  state.timeElapsed,
        diff:  state.difficulty
    });
    stats[name].recent = stats[name].recent.slice(0, 10);
    saveStats(stats);

    // Populate win screen
    setTimeout(() => {
        document.getElementById('win-score').textContent = state.score;
        document.getElementById('win-time').textContent  = formatTime(state.timeElapsed);
        document.getElementById('win-games').textContent = stats[name].games;

        const emojis = ['🎉','🏆','⭐','🚀','🎊','🦁'];
        document.getElementById('win-emoji').textContent = emojis[Math.floor(Math.random() * emojis.length)];

        showScreen('screen-win');
    }, 600);
}

function exitGame() {
    clearInterval(state.timerInterval);
    // Save partial game (no score, just session ended)
    showScreen('screen-welcome');
}

// ── Stats Screen ─────────────────────────────────────────
function openStats() {
    const name  = localStorage.getItem('ws_user') || 'Player';
    const stats = loadStats();
    const p     = stats[name] || { score: 0, games: 0, times: [] };

    document.getElementById('stats-name').textContent = name;
    document.getElementById('st-score').textContent   = p.score || 0;
    document.getElementById('st-games').textContent   = p.games || 0;

    const times = p.times || [];
    if (times.length > 0) {
        const best = Math.min(...times);
        const avg  = Math.round(times.reduce((a, b) => a + b, 0) / times.length);
        document.getElementById('st-best').textContent = formatTime(best);
        document.getElementById('st-avg').textContent  = formatTime(avg);
    } else {
        document.getElementById('st-best').textContent = '—';
        document.getElementById('st-avg').textContent  = '—';
    }

    const recentList = document.getElementById('recent-list');
    recentList.innerHTML = '';
    const recent = p.recent || [];
    if (recent.length === 0) {
        const li = document.createElement('li');
        li.textContent = 'No games played yet';
        li.style.color = 'var(--text-muted)';
        recentList.appendChild(li);
    } else {
        recent.forEach(g => {
            const li = document.createElement('li');
            li.innerHTML = `<span class="ri-theme">${g.theme}</span><span class="ri-meta">${g.diff} · ${formatTime(g.time)} · +${g.score}pts</span>`;
            recentList.appendChild(li);
        });
    }

    showScreen('screen-stats');
}
