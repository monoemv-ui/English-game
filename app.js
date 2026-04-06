// --- CONFIGURACIÓN Y DATOS ---

const themes = {
    "Animals 🦁": ["LION", "TIGER", "ELEPHANT", "GIRAFFE", "MONKEY", "ZEBRA", "RABBIT", "PANDA", "KANGAROO", "HIPPO"],
    "Food 🍕": ["PIZZA", "BURGER", "PASTA", "CHICKEN", "APPLE", "BANANA", "ORANGE", "BREAD", "CHEESE", "CAKE"],
    "Professions 👩‍⚕️": ["DOCTOR", "NURSE", "TEACHER", "POLICE", "PILOT", "CHEF", "DENTIST", "FARMER", "ARTIST", "WRITER"],
    "Space 🚀": ["PLANET", "STARS", "MOON", "SUN", "COMET", "GALAXY", "ROCKET", "ALIEN", "ORBIT", "METEOR"]
};

let selectedWords = [];
let grid = [];
let gridSize = 10;
let isDragging = false;
let selection = [];
let score = parseInt(localStorage.getItem('ws_score')) || 0;

// Referencias DOM
const themeSelect = document.getElementById('theme-select');
const difficultySelect = document.getElementById('difficulty-select');
const newGameBtn = document.getElementById('new-game-btn');
const gridContainer = document.getElementById('word-search-container');
const wordListElement = document.getElementById('word-list');

// --- SISTEMA DE SONIDOS NATIVO (Sin archivos externos) ---

const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

function playSound(frequency, duration, type = 'sine') {
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, audioCtx.currentTime);
    gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    oscillator.start();
    oscillator.stop(audioCtx.currentTime + duration);
}

const sounds = {
    start: () => playSound(440, 0.1, 'square'), // Beep corto
    select: () => playSound(660, 0.05),        // Beep agudo corto
    found: () => {                            // Arpegio ganador
        playSound(523.25, 0.1); // C5
        setTimeout(() => playSound(659.25, 0.1), 100); // E5
        setTimeout(() => playSound(783.99, 0.1), 200); // G5
    },
    error: () => playSound(110, 0.3, 'sawtooth'), // Zumbido grave
    win: () => {                              // Fanfarria
        sounds.found();
        setTimeout(sounds.found, 400);
    }
};

// --- GESTIÓN DE PERFIL Y PUNTUACIÓN ---

window.onload = () => {
    // Forzar actualización de PWA si hay nuevo Service Worker
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.ready.then(registration => {
            registration.update();
        });
    }

    const savedName = localStorage.getItem('ws_user');
    if (!savedName) {
        document.getElementById('name-modal').style.display = 'flex';
    } else {
        document.getElementById('user-name').innerText = savedName;
        updateScoreDisplay();
    }
    initThemes();
};

document.getElementById('save-name-btn').onclick = () => {
    const nameInput = document.getElementById('player-name-input').value.trim();
    const name = nameInput || "Player";
    localStorage.setItem('ws_user', name);
    document.getElementById('user-name').innerText = name;
    document.getElementById('name-modal').style.display = 'none';
    sounds.start();
};

function updateScoreDisplay() {
    document.getElementById('user-score').innerText = `Points: ${score}`;
    localStorage.setItem('ws_score', score);
}

// --- LÓGICA DEL JUEGO ---

function initThemes() {
    Object.keys(themes).forEach(theme => {
        const opt = document.createElement('option');
        opt.value = theme;
        opt.innerText = theme;
        themeSelect.appendChild(opt);
    });
    initGame();
}

function initGame() {
    sounds.start();
    const theme = themes[themeSelect.value];
    const difficulty = difficultySelect.value;
    gridSize = difficulty === 'normal' ? 10 : 14;
    const wordCount = difficulty === 'normal' ? 6 : 10;
    
    selectedWords = [...theme].sort(() => 0.5 - Math.random()).slice(0, wordCount);
    generateGrid();
    renderGrid();
    renderWords();
}

// (Las funciones generateGrid, canPlace, placeWord y renderGrid siguen igual que antes, son sólidas)
// ... [Insertar aquí las funciones generateGrid, canPlace, placeWord, renderGrid de la respuesta anterior] ...

function generateGrid() {
    grid = Array(gridSize).fill().map(() => Array(gridSize).fill(''));
    const directions = [[0, 1], [1, 0], [1, 1], [0, -1], [-1, 0]];

    selectedWords.forEach(word => {
        let placed = false;
        let attempts = 0;
        while (!placed && attempts < 150) {
            const dir = directions[Math.floor(Math.random() * (difficultySelect.value === 'advanced' ? 5 : 2))];
            const row = Math.floor(Math.random() * gridSize);
            const col = Math.floor(Math.random() * gridSize);
            if (canPlace(word, row, col, dir)) {
                placeWord(word, row, col, dir);
                placed = true;
            }
            attempts++;
        }
    });

    for (let r = 0; r < gridSize; r++) {
        for (let c = 0; c < gridSize; c++) {
            if (grid[r][c] === '') grid[r][c] = String.fromCharCode(65 + Math.floor(Math.random() * 26));
        }
    }
}

function canPlace(word, row, col, dir) {
    for (let i = 0; i < word.length; i++) {
        const r = row + i * dir[0], c = col + i * dir[1];
        if (r < 0 || r >= gridSize || c < 0 || c >= gridSize || (grid[r][c] !== '' && grid[r][c] !== word[i])) return false;
    }
    return true;
}

function placeWord(word, row, col, dir) {
    for (let i = 0; i < word.length; i++) grid[row + i * dir[0]][col + i * dir[1]] = word[i];
}

function renderGrid() {
    gridContainer.style.gridTemplateColumns = `repeat(${gridSize}, 1fr)`;
    gridContainer.innerHTML = '';
    grid.forEach((row, r) => {
        row.forEach((char, c) => {
            const div = document.createElement('div');
            div.className = 'cell';
            div.innerText = char;
            div.dataset.r = r;
            div.dataset.c = c;
            // Usar pointerdown para el inicio
            div.addEventListener('pointerdown', startSelection);
            gridContainer.appendChild(div);
        });
    });
}

function renderWords() {
    wordListElement.innerHTML = '';
    selectedWords.forEach(word => {
        const li = document.createElement('li');
        li.innerText = word;
        li.id = `word-${word}`;
        wordListElement.appendChild(li);
    });
}

// --- NUEVA LÓGICA DE SELECCIÓN TÁCTIL CORREGIDA ---

function startSelection(e) {
    e.preventDefault();
    if (e.target.classList.contains('found')) return; // No re-seleccionar palabras encontradas
    
    isDragging = true;
    selection = [e.target];
    e.target.classList.add('selected');
    sounds.select();

    // Añadir escuchadores globales para el movimiento y el final
    document.addEventListener('pointermove', updateSelection);
    document.addEventListener('pointerup', endSelection);
}

function updateSelection(e) {
    if (!isDragging) return;
    
    // DETECCIÓN TÁCTIL PRECISA: Encontrar el elemento bajo el dedo/puntero
    const target = document.elementFromPoint(e.clientX, e.clientY);
    
    // Validar que sea una celda válida y no esté ya seleccionada
    if (target && target.classList.contains('cell') && !target.classList.contains('found') && !selection.includes(target)) {
        selection.push(target);
        target.classList.add('selected');
        sounds.select();
    }
}

function endSelection() {
    isDragging = false;
    
    // Eliminar escuchadores globales
    document.removeEventListener('pointermove', updateSelection);
    document.removeEventListener('pointerup', endSelection);

    const selectedWord = selection.map(el => el.innerText).join('');
    const reversedWord = selectedWord.split('').reverse().join('');

    if (selectedWords.includes(selectedWord) || selectedWords.includes(reversedWord)) {
        const finalWord = selectedWords.includes(selectedWord) ? selectedWord : reversedWord;
        const wordEl = document.getElementById(`word-${finalWord}`);
        
        if (!wordEl.classList.contains('found')) {
            score += 10;
            updateScoreDisplay();
            sounds.found(); // Sonido de acierto
            selection.forEach(el => { el.classList.remove('selected'); el.classList.add('found'); });
            wordEl.classList.add('found');
            checkWin();
        }
    } else {
        if (selection.length > 1) sounds.error(); // Sonido de error solo si arrastró
        selection.forEach(el => el.classList.remove('selected'));
    }
    selection = [];
}

function checkWin() {
    const foundCount = document.querySelectorAll('#word-list li.found').length;
    if (foundCount === selectedWords.length) {
        score += 50;
        updateScoreDisplay();
        setTimeout(() => {
            sounds.win(); // Sonido de victoria
            alert("Congratulations! You found all the words!");
        }, 500);
    }
}

newGameBtn.onclick = initGame;
// Eliminar el pointerup global viejo, ya se gestiona en endSelection
