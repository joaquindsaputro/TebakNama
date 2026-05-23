// =========================================
// 1. STATE & LOCAL STORAGE (Langsung Baca dari database.js)
// =========================================
let currentThemeName = localStorage.getItem('tiktokAppTheme') || 'minecraft';
let activeTheme = themeDatabase[currentThemeName]; // Otomatis mengenali themeDatabase
let regularHistory = JSON.parse(localStorage.getItem('tiktokAppHistory')) || [];

// =========================================
// 2. INITIALIZATION
// =========================================
function applyTheme() {
    document.getElementById('app-container').style.backgroundImage = `url('${activeTheme.bg}')`;
    document.body.style.backgroundImage = `url('${activeTheme.body_bg}')`;
    document.getElementById('info-area').style.backgroundImage = `url('${activeTheme.info_bg}')`;
    document.getElementById('cam-frame').style.backgroundImage = `url('${activeTheme.cam}')`;
    document.getElementById('vip-wall').style.backgroundImage = `url('${activeTheme.vip}')`;
    document.getElementById('bottom-area').style.backgroundImage = `url('${activeTheme.bottom_bg}')`;
    document.getElementById('theme-selector').value = currentThemeName;
    renderRegularHistory();
}

window.onload = applyTheme;

if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js')
            .then(reg => console.log('Service worker registered:', reg.scope))
            .catch(err => console.warn('Service worker registration failed:', err));
    });
}

// =========================================
// 3. UI SETTINGS (Gear Modal)
// =========================================
const settingsBtn = document.getElementById('settings-btn');
const settingsModal = document.getElementById('settings-modal');
const saveSettingsBtn = document.getElementById('save-settings');
const closeSettingsBtn = document.getElementById('close-settings');

settingsBtn.onclick = () => settingsModal.classList.remove('hidden');
closeSettingsBtn.onclick = () => settingsModal.classList.add('hidden');

saveSettingsBtn.onclick = () => {
    const selected = document.getElementById('theme-selector').value;
    localStorage.setItem('tiktokAppTheme', selected);
    location.reload(); 
};

// =========================
// 5. INPUT & GLITTER EFFECT
// =========================
const nameInput = document.getElementById('name-input');
const inputContainer = document.getElementById('input-container');

nameInput.addEventListener('input', (e) => {
    const glitter = document.createElement('div');
    glitter.classList.add('glitter');
    
    const randomX = Math.random() * nameInput.offsetWidth;
    const randomY = (Math.random() * nameInput.offsetHeight) - 10;
    
    glitter.style.left = `${randomX}px`;
    glitter.style.top = `${randomY}px`;
    
    inputContainer.appendChild(glitter);
    setTimeout(() => glitter.remove(), 600);
});

nameInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        let text = nameInput.value.trim();
        if (!text) return;

        // FITUR BARU: Cek jika input diapit oleh kurung siku [] untuk Running Text
        if (text.startsWith('[') && text.endsWith(']')) {
            // Ambil teks di dalam kurungnya saja
            const runningString = text.substring(1, text.length - 1).trim();
            // Timpa teks berjalan yang ada di layar
            document.getElementById('running-text').innerText = runningString;
            
            // Bersihkan input dan batalkan aksi gacha (return)
            nameInput.value = ''; 
            return;
        }

        // Unlock audio context (Wajib karena browser butuh interaksi user agar web bisa bersuara)
        if (audioCtx.state === 'suspended') audioCtx.resume();

        let isVIP = false;
        if (text.startsWith('>')) {
            isVIP = true;
            text = text.substring(1).trim();
        }

        processGacha(text, isVIP);
        nameInput.value = ''; 
    }
});

// =========================
// 6. SYNTHESIZED AUDIO (WEB AUDIO API)
// =========================
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

function playTick() {
    const osc = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    
    osc.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(150, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);
    
    gainNode.gain.setValueAtTime(0.5, audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);
    
    osc.start();
    osc.stop(audioCtx.currentTime + 0.1);
}

function playChime() {
    const notes = [1046.50, 1318.51, 1567.98, 2093.00]; 
    notes.forEach((freq, index) => {
        const osc = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        
        osc.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        
        osc.type = 'sine';
        osc.frequency.value = freq;
        
        gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.2, audioCtx.currentTime + 0.05 + index * 0.1);
        gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 1.5 + index * 0.1);
        
        osc.start(audioCtx.currentTime + index * 0.1); 
        osc.stop(audioCtx.currentTime + 2 + index * 0.1);
    });
}

// =========================
// 7. GACHA LOGIC 
// =========================
function processGacha(name, isVIP) {
    const itemPool = isVIP ? activeTheme.vip_items : activeTheme.normal_items;

    const roll = Math.random();
    let rolledRarity = 'common';
    if (roll < 0.1) rolledRarity = 'legendary'; 
    else if (roll < 0.3) rolledRarity = 'rare'; 
    
    const possibleItems = itemPool.filter(item => item.rarity === rolledRarity);
    const finalItem = possibleItems.length > 0 
        ? possibleItems[Math.floor(Math.random() * possibleItems.length)]
        : itemPool[Math.floor(Math.random() * itemPool.length)];

    if (isVIP) {
        addVIP(name);
        startRoulette(name, finalItem, itemPool);
    } else {
        // PERUBAHAN: Sekarang kita mengirim finalItem.name ke dalam history
        addRegular(name, finalItem.name);
        showResult(name, finalItem);
    }
}

// =========================
// 8. ROULETTE ANIMATION (DRAMATIC EASING)
// =========================
function startRoulette(name, finalItem, itemPool) {
    const imgEl = document.getElementById('gacha-image');
    const textEl = document.getElementById('gacha-text');

    imgEl.style.display = 'block';
    imgEl.style.animation = 'none'; 
    textEl.innerText = "ROLLING...";
    textEl.className = '';

    let elapsedTime = 0;
    const fastDuration = 2000;     
    const slowDownDuration = 2000; 
    const totalDuration = fastDuration + slowDownDuration; 

    function rollStep() {
        const randomItem = itemPool[Math.floor(Math.random() * itemPool.length)];
        imgEl.src = randomItem.img;
        
        playTick(); 

        let delay = 60; 

        if (elapsedTime > fastDuration) {
            const slowProgress = (elapsedTime - fastDuration) / slowDownDuration;
            const easeCurve = Math.pow(slowProgress, 3); 
            delay = 60 + (easeCurve * 740); 
        }

        elapsedTime += delay;

        if (elapsedTime < totalDuration) {
            setTimeout(rollStep, delay);
        } else {
            playChime(); 
            showResult(name, finalItem); 
        }
    }

    rollStep();
}

// =========================
// 9. DISPLAY LOGIC (WALLS & OUTPUT)
// =========================
// (Fungsi addVIP biarkan saja seperti aslinya)

// PERUBAHAN: addRegular sekarang menerima 2 parameter (nama user & nama mob)
function addRegular(name, mobName) {
    // Menyimpan data sebagai Object { nama, mob }
    regularHistory.unshift({ userName: name, mob: mobName });
    if (regularHistory.length > 10) regularHistory.pop(); 
    
    localStorage.setItem('tiktokAppHistory', JSON.stringify(regularHistory));
    renderRegularHistory();
}

function renderRegularHistory() {
    const list = document.getElementById('regular-list');
    list.innerHTML = '';
    
    regularHistory.forEach(data => {
        // Fallback aman kalau di LocalStorage masih ada sisa data history yang lama (hanya string nama)
        let nameText = typeof data === 'string' ? data : data.userName;
        let mobText = typeof data === 'string' ? '???' : data.mob;

        const entry = document.createElement('div');
        entry.classList.add('reg-entry');
        
        // Buat span untuk nama User (Kiri)
        const nameSpan = document.createElement('span');
        nameSpan.classList.add('reg-name');
        nameSpan.innerText = nameText;
        
        // Buat span untuk nama Mob (Kanan)
        const mobSpan = document.createElement('span');
        mobSpan.classList.add('reg-mob');
        mobSpan.innerText = mobText;

        entry.appendChild(nameSpan);
        entry.appendChild(mobSpan);
        list.appendChild(entry);
    });
}

function addVIP(name) {
    const list = document.getElementById('vip-list');
    const entry = document.createElement('div');
    entry.classList.add('vip-entry');
    entry.innerText = name;
    list.prepend(entry);
    // Membatasi daftar VIP agar maksimal 5 orang saja yang tampil di layar
    if (list.children.length > 7) list.lastChild.remove();
}


function showResult(name, item) {
    const imgEl = document.getElementById('gacha-image');
    const textEl = document.getElementById('gacha-text');
    const appContainer = document.getElementById('app-container');

    imgEl.style.animation = 'none';
    imgEl.offsetHeight; 

    imgEl.src = item.img;
    imgEl.style.display = 'block';
    imgEl.style.animation = 'popIn 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
    
    textEl.innerText = `${name} IS A ${item.name}!`;
    textEl.className = ''; 
    if (item.rarity !== 'common') textEl.classList.add(`rarity-${item.rarity}`);

    if (item.rarity === 'legendary') {
        appContainer.classList.add('shake-active');
        triggerConfetti();
        if(textEl.innerText !== "ROLLING...") playChime(); 
        setTimeout(() => appContainer.classList.remove('shake-active'), 500);
    }
}

// =========================
// 10. EFEK GAME FEEL (CONFETTI)
// =========================
function triggerConfetti() {
    const container = document.getElementById('confetti-container');
    container.innerHTML = ''; 
    
    for(let i = 0; i < 50; i++) {
        const conf = document.createElement('div');
        conf.classList.add('confetti');
        conf.style.left = Math.random() * 100 + '%';
        conf.style.backgroundColor = Math.random() > 0.5 ? '#ffd700' : '#ff9900';
        conf.style.animationDuration = (Math.random() * 2 + 2) + 's';
        container.appendChild(conf);
    }
}