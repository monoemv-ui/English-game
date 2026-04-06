// 14 Temas con más de 20 palabras cada uno
const themes = {
    "Animals 🦁": ["LION", "TIGER", "ELEPHANT", "GIRAFFE", "MONKEY", "ZEBRA", "RABBIT", "PANDA", "KANGAROO", "HIPPO", "DOLPHIN", "SHARK", "WHALE", "PARROT", "EAGLE", "SNAKE", "TURTLE", "FROG", "WOLF", "BEAR", "CAMEL"],
    "Food 🍕": ["PIZZA", "BURGER", "PASTA", "CHICKEN", "APPLE", "BANANA", "ORANGE", "CHERRY", "BREAD", "CHEESE", "COOKIE", "CAKE", "SALAD", "TOMATO", "POTATO", "DONUT", "MILK", "JUICE", "MANGO", "STEAK", "GRAPES"],
    "Professions 👩‍⚕️": ["DOCTOR", "NURSE", "TEACHER", "POLICE", "PILOT", "CHEF", "DENTIST", "FARMER", "ARTIST", "SINGER", "ACTOR", "WRITER", "COACH", "JUDGE", "BAKER", "WAITER", "SAILOR", "MINER", "GUARD", "DRIVER", "MAYOR"],
    "Places 🏠": ["HOUSE", "SCHOOL", "PARK", "BEACH", "MUSEUM", "CINEMA", "OFFICE", "STREET", "GARDEN", "FOREST", "CHURCH", "STORE", "BANK", "STADIUM", "ZOO", "AIRPORT", "HOTEL", "CITY", "ISLAND", "CASTLE", "TOWN"],
    "Space 🚀": ["PLANET", "STARS", "MOON", "SUN", "COMET", "GALAXY", "ROCKET", "ALIEN", "ORBIT", "METEOR", "NEBULA", "ASTEROID", "COSMOS", "EARTH", "MARS", "VENUS", "SATURN", "PLUTO", "APOLLO", "SPACESUIT", "RADAR"],
    "Sports ⚽": ["SOCCER", "TENNIS", "BASKETBALL", "BASEBALL", "GOLF", "RUGBY", "HOCKEY", "VOLLEYBALL", "CRICKET", "BOXING", "SKIING", "SURFING", "CYCLING", "RUNNING", "SWIMMING", "KARATE", "JUDO", "CHESS", "DARTS", "BOWLING", "SKATE"],
    "Colors 🎨": ["RED", "BLUE", "GREEN", "YELLOW", "BLACK", "WHITE", "PINK", "PURPLE", "ORANGE", "BROWN", "GREY", "CYAN", "MAGENTA", "MAROON", "OLIVE", "NAVY", "TEAL", "SILVER", "GOLD", "INDIGO", "VIOLET"],
    "Clothes 👕": ["SHIRT", "PANTS", "DRESS", "SKIRT", "SHOES", "SOCKS", "HAT", "COAT", "JACKET", "GLOVES", "SCARF", "BELT", "TIE", "BOOTS", "SWEATER", "JEANS", "SHORTS", "SUIT", "BLOUSE", "SLIPPERS", "CAP"],
    "Body 👁️": ["HEAD", "EYES", "NOSE", "MOUTH", "EARS", "HAIR", "NECK", "SHOULDERS", "ARMS", "HANDS", "FINGERS", "LEGS", "FEET", "TOES", "BACK", "CHEST", "STOMACH", "KNEES", "ELBOWS", "TEETH", "ANKLE"],
    "Vehicles 🚗": ["CAR", "BUS", "TRAIN", "BIKE", "MOTORCYCLE", "AIRPLANE", "HELICOPTER", "BOAT", "SHIP", "TRUCK", "VAN", "TRACTOR", "SUBMARINE", "SCOOTER", "TRAM", "AMBULANCE", "TAXI", "FERRY", "GLIDER", "WAGON"],
    "Weather 🌤️": ["RAIN", "SUN", "CLOUD", "WIND", "SNOW", "STORM", "LIGHTNING", "THUNDER", "FOG", "HAIL", "TORNADO", "HURRICANE", "BREEZE", "FROST", "DEW", "RAINBOW", "MIST", "CYCLONE", "BLIZZARD", "WARM", "COLD"],
    "Emotions 😃": ["HAPPY", "SAD", "ANGRY", "SCARED", "EXCITED", "BORED", "TIRED", "PROUD", "SHY", "BRAVE", "CALM", "NERVOUS", "SURPRISED", "JEALOUS", "GUILTY", "HOPEFUL", "LONELY", "SILLY", "CONFUSED", "RELAXED", "JOY"],
    "Music 🎵": ["PIANO", "GUITAR", "DRUMS", "VIOLIN", "FLUTE", "TRUMPET", "BASS", "SINGER", "SONG", "BAND", "CONCERT", "MELODY", "RHYTHM", "NOTES", "CHORD", "STUDIO", "RADIO", "JAZZ", "ROCK", "POP", "OPERA"],
    "Nature 🌳": ["TREE", "FLOWER", "GRASS", "LEAF", "RIVER", "MOUNTAIN", "LAKE", "OCEAN", "ROCK", "DIRT", "SAND", "WOOD", "FIRE", "ICE", "CAVE", "HILL", "VALLEY", "WATERFALL", "VOLCANO", "DESERT", "POND"]
};

let selectedWords = [], grid = [], gridSize = 14;
let isDragging = false, selection = [];
let score = parseInt(localStorage.getItem('ws_score')) || 0;
let timeElapsed = 0;
let timerInterval = null;

// Audio Nivel Pro (Añadida Fanfarria)
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
function playNote(f, d, type='sine') {
    if(audioCtx.state === 'suspended') audioCtx.resume();
    const o = audioCtx.createOscillator(), g = audioCtx.createGain();
    o.type = type;
    o.connect(g); g.connect(audioCtx.destination);
    o.frequency.value = f; g.gain.setValueAtTime(0.1, audioCtx.currentTime);
    o.start(); o.stop(audioCtx.currentTime + d);
}

const sounds = {
    click: () => playNote(600, 0.05),
    success: () => { playNote(500, 0.1); setTimeout(() => playNote(700, 0.15), 100); },
    error: () => playNote(150, 0.15, 'sawtooth'),
    fanfare: () => {
        playNote(392.00, 0.2, 'square'); // G4
        setTimeout(() => playNote(392.00, 0.2, 'square'), 200);
        setTimeout(() => playNote(392.00, 0.2, 'square'), 400);
        setTimeout(() => playNote(523.25, 0.4, 'square'), 600); // C5
        setTimeout(() => playNote(659.25, 0.6, 'square'), 1000); // E5
    }
};

window.onload = () => {
    if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').then(r => r.update());
    
    const savedName = localStorage.getItem('ws_user');
    if (!savedName) {
        document.getElementById('name-modal').style.display = 'flex';
    } else {
        document.getElementById('user-name').innerText = savedName;
        updateScore();
        setupThemes();
    }
};

document.getElementById('save-name-btn').onclick = () => {
    const name = document.getElementById('player-name-input').value.trim() || "Player";
    localStorage.setItem('ws_user', name);
    document.getElementById('user-name').innerText = name;
    document.getElementById('name-modal').style.display = 'none';
    sounds.click();
    setupThemes();
};

function setupThemes() {
    const select = document.getElementById('theme-select');
    if(select.options.length === 0) {
        Object.keys(themes).forEach(t => select.add(new Option(t, t)));
    }
    initGame();
}

function updateScore() {
    document.getElementById('user-score').innerText = `Score: ${score}`;
    localStorage.setItem('ws_score', score);
}

function startTimer() {
    clearInterval(timerInterval);
    timeElapsed = 0;
    document.getElementById('user-time').innerText = `⏱️ 0s`;
    timerInterval = setInterval(() => {
        timeElapsed++;
        document.getElementById('user-time').innerText = `⏱️ ${timeElapsed}s`;
    }, 1000);
}

function initGame() {
    document.getElementById('win-modal').style.display = 'none';
    const theme = themes[document.getElementById('theme-select').value];
    const diff = document.getElementById('difficulty-select').value;
    
    const wordCount = diff === 'normal' ? 10 : 20;
    gridSize = diff === 'normal' ? 14 : 20; // 20x20 es necesario para 20 palabras cruzadas
    
    selectedWords = [...theme].sort(() => 0.5 - Math.random()).slice(0, wordCount);
    grid = Array(gridSize).fill().map(() => Array(gridSize).fill(''));
    
    selectedWords.forEach(w => placeWord(w));
    
    for(let r=0; r<gridSize; r++) 
        for(let c=0; c<gridSize; c++) 
            if(!grid[r][c]) grid[r][c] = String.fromCharCode(65+Math.floor(Math.random()*26));
    
    render();
    startTimer();
}

function placeWord(word) {
    let placed = false;
    let attempts = 0;
    while (!placed && attempts < 200) {
        const dir = [[0,1],[1,0],[1,1]][Math.floor(Math.random()*3)]; // Horizontal, Vertical, Diagonal
        const r = Math.floor(Math.random()*gridSize);
        const c = Math.floor(Math.random()*gridSize);
        
        // Comprobar si cabe en la dirección
        if(r + (word.length * dir[0]) <= gridSize && c + (word.length * dir[1]) <= gridSize) {
            let safe = true;
            for(let i=0; i<word.length; i++) {
                if(grid[r+i*dir[0]][c+i*dir[1]] !== '' && grid[r+i*dir[0]][c+i*dir[1]] !== word[i]) safe = false;
            }
            if (safe) {
                for(let i=0; i<word.length; i++) grid[r+i*dir[0]][c+i*dir[1]] = word[i];
                placed = true;
            }
        }
        attempts++;
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
        score += 10; 
        updateScore(); 
        sounds.success();
        checkWin();
    } else {
        selection.forEach(s => s.classList.remove('selected'));
        if(selection.length > 1) sounds.error();
    }
    selection = [];
}

function checkWin() {
    const foundCount = document.querySelectorAll('#word-list li.found').length;
    if (foundCount === selectedWords.length) {
        clearInterval(timerInterval);
        score += 50; // Bonus por completar
        updateScore();
        setTimeout(() => {
            sounds.fanfare();
            document.getElementById('win-stats').innerText = `Total Score: ${score} | Time: ${timeElapsed}s`;
            document.getElementById('win-modal').style.display = 'flex';
        }, 500);
    }
}

document.getElementById('new-game-btn').onclick = initGame;
document.getElementById('next-level-btn').onclick = initGame;
