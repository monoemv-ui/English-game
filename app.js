const themes = {
    "Animals 🦁": ["LION", "TIGER", "BEAR", "WOLF", "SHARK", "EAGLE", "SNAKE", "FROG"],
    "Food 🍕": ["PIZZA", "BURGER", "PASTA", "CHERRY", "APPLE", "CHEESE", "BREAD", "CAKE"],
    "Space 🚀": ["PLANET", "STARS", "MOON", "SUN", "COMET", "GALAXY", "ROCKET", "ALIEN"]
};

let selectedWords = [], grid = [], gridSize = 10, isDragging = false, selection = [], score = parseInt(localStorage.getItem('ws_score')) || 0;

// Audio Nivel Pro
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
function playNote(f, d) {
    const o = audioCtx.createOscillator(), g = audioCtx.createGain();
    o.connect(g); g.connect(audioCtx.destination);
    o.frequency.value = f; g.gain.setValueAtTime(0.1, audioCtx.currentTime);
    o.start(); o.stop(audioCtx.currentTime + d);
}

const sounds = {
    click: () => playNote(600, 0.05),
    success: () => { playNote(500, 0.1); setTimeout(() => playNote(700, 0.1), 100); },
    error: () => playNote(150, 0.15)
};

window.onload = () => {
    if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').then(r => r.update());
    
    const savedName = localStorage.getItem('ws_user');
    if (!savedName) {
        document.getElementById('name-modal').style.display = 'flex';
    } else {
        document.getElementById('user-name').innerText = savedName;
        updateScore();
    }
    setupThemes();
};

document.getElementById('save-name-btn').onclick = () => {
    const name = document.getElementById('player-name-input').value.trim() || "Player";
    localStorage.setItem('ws_user', name);
    document.getElementById('user-name').innerText = name;
    document.getElementById('name-modal').style.display = 'none';
    playNote(440, 0.1);
};

function setupThemes() {
    const select = document.getElementById('theme-select');
    Object.keys(themes).forEach(t => select.add(new Option(t, t)));
    initGame();
}

function updateScore() {
    document.getElementById('user-score').innerText = `Score: ${score}`;
    localStorage.setItem('ws_score', score);
}

function initGame() {
    const theme = themes[document.getElementById('theme-select').value];
    gridSize = document.getElementById('difficulty-select').value === 'normal' ? 10 : 12;
    selectedWords = [...theme].sort(() => 0.5 - Math.random()).slice(0, 6);
    
    grid = Array(gridSize).fill().map(() => Array(gridSize).fill(''));
    selectedWords.forEach(w => placeWord(w));
    
    for(let r=0; r<gridSize; r++) 
        for(let c=0; c<gridSize; c++) 
            if(!grid[r][c]) grid[r][c] = String.fromCharCode(65+Math.floor(Math.random()*26));
    
    render();
}

function placeWord(word) {
    let placed = false;
    while (!placed) {
        const dir = [[0,1],[1,0],[1,1]][Math.floor(Math.random()*3)];
        const r = Math.floor(Math.random()*(gridSize - (word.length * dir[0])));
        const c = Math.floor(Math.random()*(gridSize - (word.length * dir[1])));
        
        let safe = true;
        for(let i=0; i<word.length; i++) {
            if(grid[r+i*dir[0]][c+i*dir[1]] !== '' && grid[r+i*dir[0]][c+i*dir[1]] !== word[i]) safe = false;
        }
        
        if (safe) {
            for(let i=0; i<word.length; i++) grid[r+i*dir[0]][c+i*dir[1]] = word[i];
            placed = true;
        }
    }
}

function render() {
    const container = document.getElementById('word-search-container');
    container.style.gridTemplateColumns = `repeat(${gridSize}, 1fr)`;
    container.innerHTML = '';
    
    grid.forEach((row, r) => row.forEach((char, c) => {
        const div = document.createElement('div');
        div.className = 'cell'; div.innerText = char;
        div.onpointerdown = (e) => {
            e.preventDefault();
            isDragging = true; selection = [div];
            div.classList.add('selected');
            sounds.click();
            window.addEventListener('pointermove', handleMove);
            window.addEventListener('pointerup', handleUp);
        };
        container.appendChild(div);
    }));

    const list = document.getElementById('word-list');
    list.innerHTML = '';
    selectedWords.forEach(w => {
        const li = document.createElement('li'); li.innerText = w; li.id = `w-${w}`;
        list.appendChild(li);
    });
}

function handleMove(e) {
    if(!isDragging) return;
    const el = document.elementFromPoint(e.clientX, e.clientY);
    if(el && el.classList.contains('cell') && !selection.includes(el)) {
        selection.push(el); el.classList.add('selected');
        sounds.click();
    }
}

function handleUp() {
    isDragging = false;
    window.removeEventListener('pointermove', handleMove);
    window.removeEventListener('pointerup', handleUp);
    
    const word = selection.map(s => s.innerText).join('');
    const rev = word.split('').reverse().join('');
    const found = selectedWords.find(w => w === word || w === rev);

    if(found && !document.getElementById(`w-${found}`).classList.contains('found')) {
        selection.forEach(s => { s.classList.remove('selected'); s.classList.add('found'); });
        document.getElementById(`w-${found}`).classList.add('found');
        score += 10; updateScore(); sounds.success();
    } else {
        selection.forEach(s => s.classList.remove('selected'));
        if(selection.length > 1) sounds.error();
    }
    selection = [];
}

document.getElementById('new-game-btn').onclick = initGame;
