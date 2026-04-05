const themes = {
    "Animals 🦁": ["LION", "TIGER", "ELEPHANT", "GIRAFFE", "MONKEY", "ZEBRA", "RABBIT", "PANDA", "KANGAROO", "HIPPO", "DOLPHIN", "SHARK", "WHALE", "PARROT", "EAGLE", "SNAKE", "TURTLE", "FROG", "WOLF", "BEAR"],
    "Food 🍕": ["PIZZA", "BURGER", "PASTA", "CHICKEN", "APPLE", "BANANA", "ORANGE", "CHERRY", "BREAD", "CHEESE", "COOKIE", "CAKE", "SALAD", "TOMATO", "POTATO", "DONUT", "MILK", "JUICE", "MANGO", "STEAK"],
    "Professions 👩‍⚕️": ["DOCTOR", "NURSE", "TEACHER", "POLICE", "PILOT", "CHEF", "DENTIST", "FARMER", "ARTIST", "SINGER", "ACTOR", "WRITER", "COACH", "JUDGE", "BAKER", "WAITER", "SAILOR", "MINER", "GUARD", "DRIVER"],
    "Places 🏠": ["HOUSE", "SCHOOL", "PARK", "BEACH", "MUSEUM", "CINEMA", "OFFICE", "STREET", "GARDEN", "FOREST", "CHURCH", "STORE", "BANK", "STADIUM", "ZOO", "AIRPORT", "HOTEL", "CITY", "ISLAND", "CASTLE"],
    "Space 🚀": ["PLANET", "STARS", "MOON", "SUN", "COMET", "GALAXY", "ROCKET", "ALIEN", "ORBIT", "NASA", "METEOR", "SATURN", "MARS", "VENUS", "EARTH", "COSMOS", "VOID", "LIGHT", "CRATER", "DUST"],
    "Sports ⚽": ["SOCCER", "TENNIS", "BOXING", "GOLF", "RUGBY", "HOCKEY", "CHESS", "SKATING", "RUNNING", "SWIMMING", "KARATE", "CYCLING", "JUDO", "SURFING", "DANCING", "DIVING", "SKIING", "SAILING", "FENCING", "YOGA"],
    "School 🎒": ["PENCIL", "ERASER", "RULER", "BOOKS", "PAPER", "DESK", "BOARD", "GLUE", "COLORS", "LESSON", "MATH", "MUSIC", "ART", "SCIENCE", "HISTORY", "RECESS", "STUDENT", "GRADES", "LUNCH", "LIBRARY"],
    "Nature 🌳": ["FLOWER", "MOUNTAIN", "RIVER", "OCEAN", "DESERT", "VALLEY", "VOLCANO", "CAVE", "ISLAND", "JUNGLE", "CLOUD", "STORM", "RAIN", "SNOW", "WIND", "THUNDER", "LIGHTNING", "GRASS", "LEAF", "BRANCH"],
    "Clothing 👕": ["SHIRT", "PANTS", "DRESS", "JACKET", "SHOES", "SOCKS", "HAT", "GLOVES", "SCARF", "SHORTS", "SKIRT", "BOOTS", "SWEATER", "JEANS", "COAT", "BELT", "CAP", "WATCH", "RING", "PURSE"],
    "Body 🦷": ["HEAD", "EYES", "NOSE", "MOUTH", "EARS", "HANDS", "FINGERS", "FEET", "KNEE", "ELBOW", "SHOULDER", "BACK", "STOMACH", "HEART", "BRAIN", "TONGUE", "TEETH", "CHEEK", "CHIN", "NECK"]
};

let selectedWords = [];
let grid = [];
let gridSize = 10;
let isDragging = false;
let selection = [];

const themeSelect = document.getElementById('theme-select');
const difficultySelect = document.getElementById('difficulty-select');
const newGameBtn = document.getElementById('new-game-btn');
const gridContainer = document.getElementById('word-search-container');
const wordListElement = document.getElementById('word-list');

// Initialize themes
Object.keys(themes).forEach(theme => {
    const opt = document.createElement('option');
    opt.value = theme;
    opt.innerText = theme;
    themeSelect.appendChild(opt);
});

function initGame() {
    const theme = themes[themeSelect.value];
    const difficulty = difficultySelect.value;
    gridSize = difficulty === 'normal' ? 12 : 16;
    const wordCount = difficulty === 'normal' ? 10 : 20;
    
    // Shuffle and pick words
    selectedWords = [...theme].sort(() => 0.5 - Math.random()).slice(0, wordCount);
    generateGrid();
    renderGrid();
    renderWords();
}

function generateGrid() {
    grid = Array(gridSize).fill().map(() => Array(gridSize).fill(''));
    const directions = [
        [0, 1], [1, 0], [1, 1], [0, -1], [-1, 0] // H, V, D
    ];

    selectedWords.forEach(word => {
        let placed = false;
        let attempts = 0;
        while (!placed && attempts < 100) {
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

    // Fill empty cells
    for (let r = 0; r < gridSize; r++) {
        for (let c = 0; c < gridSize; c++) {
            if (grid[r][c] === '') {
                grid[r][c] = String.fromCharCode(65 + Math.floor(Math.random() * 26));
            }
        }
    }
}

function canPlace(word, row, col, dir) {
    for (let i = 0; i < word.length; i++) {
        const r = row + i * dir[0];
        const c = col + i * dir[1];
        if (r < 0 || r >= gridSize || c < 0 || c >= gridSize || (grid[r][c] !== '' && grid[r][c] !== word[i])) {
            return false;
        }
    }
    return true;
}

function placeWord(word, row, col, dir) {
    for (let i = 0; i < word.length; i++) {
        grid[row + i * dir[0]][col + i * dir[1]] = word[i];
    }
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
    isDragging = true;
    selection = [e.target];
    e.target.classList.add('selected');
}

function updateSelection(e) {
    if (!isDragging) return;
    if (!selection.includes(e.target)) {
        selection.push(e.target);
        e.target.classList.add('selected');
    }
}

function endSelection() {
    isDragging = false;
    const selectedWord = selection.map(el => el.innerText).join('');
    const reversedWord = selectedWord.split('').reverse().join('');

    if (selectedWords.includes(selectedWord) || selectedWords.includes(reversedWord)) {
        const finalWord = selectedWords.includes(selectedWord) ? selectedWord : reversedWord;
        selection.forEach(el => {
            el.classList.remove('selected');
            el.classList.add('found');
        });
        document.getElementById(`word-${finalWord}`).classList.add('found');
    } else {
        selection.forEach(el => el.classList.remove('selected'));
    }
    selection = [];
}

newGameBtn.addEventListener('click', initGame);
document.addEventListener('pointerup', () => isDragging = false);
initGame();