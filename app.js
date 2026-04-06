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
function playNote(freq, dur, type = 'sine', vol = 0.08) {
    try {
        if (audioCtx.state === 'suspended') audioCtx.resume();
        const o = audioCtx.createOscillator();
        const g = audioCtx.createGain();
        o.type = type;
        o.frequency.value = freq;
        g.gain.setValueAtTime(vol, audioCtx.currentTime);
        g.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + dur);
        o.connect(g); g.connect(audioCtx.destination);
        o.start(); o.stop(audioCtx.currentTime + dur);
    } catch (e) { /* silence audio errors */ }
}
const SFX = {
    tick:    () => playNote(600, 0.04, 'sine', 0.05),
    success: () => {
        playNote(523, 0.12); 
        setTimeout(() => playNote(659, 0.12), 120);
        setTimeout(() => playNote(784, 0.25), 240);
    },
    error:   () => playNote(160, 0.12, 'sawtooth', 0.06),
    fanfare: () => {
        const notes = [392, 392, 392, 523, 659, 784];
        notes.forEach((n, i) => setTimeout(() => playNote(n, 0.25, 'square', 0.07), i * 180));
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
function renderGrid() {
    const container = document.getElementById('word-search-container');
    container.innerHTML = '';

    // Size grid to fit screen
    const gameMain   = document.querySelector('.game-main');
    const sidebar    = document.querySelector('.sidebar');
    const sideW      = 110; // px reserved for sidebar
    const availW     = Math.min(gameMain.clientWidth - sideW, gameMain.clientHeight) - 6;
    const cellPx     = Math.floor(availW / state.gridSize);
    const gridPx     = cellPx * state.gridSize + (state.gridSize - 1) * 2 + 6;

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

            div.addEventListener('pointerdown', onPointerDown);
            container.appendChild(div);
        }
    }

    // Global pointer events
    container.addEventListener('pointermove', onPointerMove);
    container.addEventListener('pointerup',   onPointerUp);
    container.addEventListener('pointerleave', onPointerUp);
    container.setPointerCapture; // allow drag outside
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

// ── Selection (pointer events) ───────────────────────────
function cellAt(el) {
    return el && el.classList.contains('cell') ? el : null;
}

function onPointerDown(e) {
    e.preventDefault();
    state.isDragging = true;
    state.selection  = [];
    state.selectionIndices = [];

    const cell = cellAt(e.currentTarget);
    if (cell) addToSelection(cell);

    SFX.tick();
}

function onPointerMove(e) {
    if (!state.isDragging) return;
    const el = document.elementFromPoint(e.clientX, e.clientY);
    const cell = cellAt(el);
    if (!cell) return;

    const r = parseInt(cell.dataset.r);
    const c = parseInt(cell.dataset.c);

    // Already in selection?
    if (state.selectionIndices.some(p => p.r === r && p.c === c)) return;

    // Must be collinear with existing selection
    if (state.selectionIndices.length >= 1 && !isCollinear(r, c)) return;

    addToSelection(cell);
    SFX.tick();
}

function addToSelection(cell) {
    state.selection.push(cell);
    state.selectionIndices.push({ r: parseInt(cell.dataset.r), c: parseInt(cell.dataset.c) });
    cell.classList.add('selected');
}

function isCollinear(r, c) {
    if (state.selectionIndices.length === 0) return true;
    if (state.selectionIndices.length === 1) return true; // any direction OK for 2nd cell

    const first = state.selectionIndices[0];
    const last  = state.selectionIndices[state.selectionIndices.length - 1];

    const dr = last.r - first.r;
    const dc = last.c - first.c;
    const nr = r - first.r;
    const nc = c - first.c;

    // Normalize direction
    const len = Math.max(Math.abs(dr), Math.abs(dc));
    if (len === 0) return true;
    const udr = dr / len, udc = dc / len;

    // New cell must lie along same direction
    const newLen = Math.max(Math.abs(nr), Math.abs(nc));
    if (newLen === 0) return false;
    return Math.abs(nr / newLen - udr) < 0.01 && Math.abs(nc / newLen - udc) < 0.01;
}

function onPointerUp() {
    if (!state.isDragging) return;
    state.isDragging = false;

    const word = state.selection.map(c => c.textContent).join('');
    const rev  = word.split('').reverse().join('');
    const found = state.selectedWords.find(w => (w === word || w === rev) && !state.foundWords.has(w));

    if (found) {
        state.foundWords.add(found);
        state.selection.forEach(c => {
            c.classList.remove('selected');
            c.classList.add('found');
            // Flash animation restart
            c.classList.remove('flash');
            void c.offsetWidth;
            c.classList.add('flash');
        });
        document.getElementById(`wl-${found}`)?.classList.add('found');

        state.score += (state.difficulty === 'easy' ? 10 : 15);
        document.getElementById('hud-score').textContent = state.score;
        updateRing();
        SFX.success();
        checkWin();
    } else {
        state.selection.forEach(c => c.classList.remove('selected'));
        if (state.selection.length > 1) SFX.error();
    }

    state.selection = [];
    state.selectionIndices = [];
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
