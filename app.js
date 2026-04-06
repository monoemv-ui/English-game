const themes = {
    "Animales 🦁": ["LEON", "TIGRE", "ELEFANTE", "JIRAFA", "MONO", "CEBRA", "CONEJO", "PANDA", "CANGURO", "HIPOPOTAMO"],
    "Comida 🍕": ["PIZZA", "HAMBURGUESA", "PASTA", "POLLO", "MANZANA", "PLATANO", "NARANJA", "PAN", "QUESO", "PASTEL"],
    "Profesiones 👩‍⚕️": ["DOCTOR", "ENFERMERA", "PROFESOR", "POLICIA", "PILOTO", "CHEF", "DENTISTA", "GRANJERO", "ARTISTA", "ESCRITOR"],
    "Espacio 🚀": ["PLANETA", "ESTRELLAS", "LUNA", "SOL", "COMETA", "GALAXIA", "COHETE", "ALIEN", "ORBITA", "METEORO"]
};

let selectedWords = [];
let grid = [];
let gridSize = 10;
let isDragging = false;
let selection = [];
let score = parseInt(localStorage.getItem('ws_score')) || 0;

const themeSelect = document.getElementById('theme-select');
const difficultySelect = document.getElementById('difficulty-select');
const newGameBtn = document.getElementById('new-game-btn');
const gridContainer = document.getElementById('word-search-container');
const wordListElement = document.getElementById('word-list');

// Perfil de Usuario
window.onload = () => {
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
    const name = document.getElementById('player-name-input').value || "Jugador";
    localStorage.setItem('ws_user', name);
    document.getElementById('user-name').innerText = name;
    document.getElementById('name-modal').style.display = 'none';
    playSound("¡Hola " + name + "! Vamos a jugar.");
};

function initThemes() {
    Object.keys(themes).forEach(theme => {
        const opt = document.createElement('option');
        opt.value = theme;
        opt.innerText = theme;
        themeSelect.appendChild(opt);
    });
    initGame();
}

function playSound(text, type = 'speech') {
    if ('speechSynthesis' in window) {
        const msg = new SpeechSynthesisUtterance(text);
        msg.rate = 1.2;
        msg.pitch = 1.1;
        window.speechSynthesis.speak(msg);
    }
}

function updateScoreDisplay() {
    document.getElementById('user-score').innerText = `Puntos: ${score}`;
    localStorage.setItem('ws_score', score);
}

function initGame() {
    const theme = themes[themeSelect.value];
    const difficulty = difficultySelect.value;
    gridSize = difficulty === 'normal' ? 10 : 14;
    const wordCount = difficulty === 'normal' ? 6 : 12;
    
    selectedWords = [...theme].sort(() => 0.5 - Math.random()).slice(0, wordCount);
    generateGrid();
    renderGrid();
    renderWords();
}

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
            div.addEventListener('pointerdown', startSelection);
            div.addEventListener('pointerenter', updateSelection);
            div.addEventListener('pointerup', endSelection);
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

function startSelection(e) {
    e.preventDefault();
    isDragging = true;
    selection = [e.target];
    e.target.classList.add('selected');
}

function updateSelection(e) {
    if (!isDragging || selection.includes(e.target)) return;
    selection.push(e.target);
    e.target.classList.add('selected');
}

function endSelection() {
    isDragging = false;
    const selectedWord = selection.map(el => el.innerText).join('');
    const reversedWord = selectedWord.split('').reverse().join('');

    if (selectedWords.includes(selectedWord) || selectedWords.includes(reversedWord)) {
        const finalWord = selectedWords.includes(selectedWord) ? selectedWord : reversedWord;
        const wordEl = document.getElementById(`word-${finalWord}`);
        
        if (!wordEl.classList.contains('found')) {
            score += 10;
            updateScoreDisplay();
            playSound("¡Muy bien!");
            selection.forEach(el => { el.classList.remove('selected'); el.classList.add('found'); });
            wordEl.classList.add('found');
            checkWin();
        }
    } else {
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
            playSound("¡Felicidades, ganaste!");
            alert("¡Has completado el nivel!");
        }, 300);
    }
}

newGameBtn.onclick = initGame;
document.addEventListener('pointerup', () => isDragging = false);
