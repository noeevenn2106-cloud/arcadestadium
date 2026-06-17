// ========================================================
// GESTION GLOBALE DE L'INTERFACE
// ========================================================
let pendingGameId = "";
let currentMode = "robot";

function showDashboardHome() {
    document.querySelectorAll('.game-container').forEach(el => el.classList.remove('active'));
    document.getElementById("mainDashboard").classList.remove("hidden");
    cancelAnimationFrame(foot2dAnimFrame);
    isFootTimerRunning = false;
}

function switchGame(gameId) {
    document.getElementById("mainDashboard").classList.add("hidden");
    document.querySelectorAll('.game-container').forEach(el => el.classList.remove('active'));
    document.getElementById(gameId).classList.add('active');
    cancelAnimationFrame(foot2dAnimFrame);
    isFootTimerRunning = false;

    if(gameId === 'game-chess') triggerPopup('game-chess');
    if(gameId === 'game-ttt') triggerPopup('game-ttt');
    if(gameId === 'game-leader') initFoot2D();
    if(gameId === 'game-chrono') initChronoGame();
}

function triggerPopup(gameId) {
    pendingGameId = gameId;
    document.getElementById("modePopup").classList.add("show");
}

function selectGameConfig(mode) {
    document.getElementById("modePopup").classList.remove("show");
    currentMode = mode;
    if(pendingGameId === 'game-chess') initChess();
    if(pendingGameId === 'game-ttt') initTTT();
}

// ==========================================
// MOTEUR D'ÉCHECS ADVANCED
// ==========================================
let chessGrid = [], selectedCell = null, validMoves = []; let chessTurn = "W";
const glyphs = { 'R':'♜', 'N':'♞', 'B':'♝', 'Q':'♛', 'K':'♚', 'P':'♟', 'r':'♜', 'n':'♞', 'b':'♝', 'q':'♛', 'k':'♚', 'p':'♟', '':'' };

function initChess() {
    chessGrid = [
        ['r','n','b','q','k','b','n','r'], ['p','p','p','p','p','p','p','p'],
        ['','','','','','','',''], ['','','','','','','',''], ['','','','','','','',''], ['','','','','','','',''],
        ['P','P','P','P','P','P','P','P'], ['R','N','B','Q','K','B','N','R']
    ];
    selectedCell = null; validMoves = []; chessTurn = "W";
    document.getElementById("chess-status").innerText = "Aux Blancs de jouer";
    renderChess();
}

function renderChess() {
    const board = document.getElementById("chessBoard"); board.innerHTML = '';
    for(let r=0; r<8; r++) {
        for(let c=0; c<8; c++) {
            const cell = document.createElement('div'); cell.className = `chess-cell ${(r+c)%2===0 ? 'cell-light' : 'cell-dark'}`;
            cell.dataset.row = r; cell.dataset.col = c;
            let p = chessGrid[r][c];
            if(p !== '') {
                const span = document.createElement('span'); span.innerText = glyphs[p];
                span.className = p === p.toUpperCase() ? "white-piece" : "black-piece";
                cell.appendChild(span);
            }
            if(selectedCell && selectedCell.r === r && selectedCell.c === c) cell.classList.add('selected');
            if(validMoves.some(m => m.r === r && m.c === c)) cell.classList.add('can-move');
            cell.addEventListener('click', onChessClick); board.appendChild(cell);
        }
    }
}

function onChessClick(e) {
    let cell = e.target.closest('.chess-cell'); if(!cell) return;
    let r = parseInt(cell.dataset.row), c = parseInt(cell.dataset.col);
    let move = validMoves.find(m => m.r === r && m.c === c);

    if(move) {
        chessGrid[r][c] = chessGrid[selectedCell.r][selectedCell.c];
        chessGrid[selectedCell.r][selectedCell.c] = '';
        selectedCell = null; validMoves = [];
        chessTurn = chessTurn === "W" ? "B" : "W";
        document.getElementById("chess-status").innerText = chessTurn === "W" ? "Aux Blancs" : "Aux Noirs";
        renderChess();
        if(chessTurn === "B" && currentMode === "robot") setTimeout(makeBotChess, 500);
    } else {
        let p = chessGrid[r][c];
        if(p !== '' && ((chessTurn === "W" && p === p.toUpperCase()) || (chessTurn === "B" && p === p.toLowerCase()))) {
            selectedCell = {r, c};
            validMoves = getAdvancedMoves(r, c, chessGrid);
            renderChess();
        }
    }
}

function getAdvancedMoves(r, c, grid) {
    let moves = []; let p = grid[r][c]; if(p === '') return moves;
    let isW = p === p.toUpperCase(); let type = p.toUpperCase();

    if(type === 'P') {
        let dir = isW ? -1 : 1; let start = isW ? 6 : 1;
        if(r+dir >= 0 && r+dir < 8 && grid[r+dir][c] === '') { moves.push({r: r+dir, c}); if(r === start && grid[r+dir*2][c] === '') moves.push({r: r+dir*2, c}); }
        [-1, 1].forEach(dc => { if(c+dc>=0 && c+dc<8 && grid[r+dir][c+dc] !== '' && (grid[r+dir][c+dc] === grid[r+dir][c+dc].toUpperCase()) !== isW) moves.push({r: r+dir, c: c+dc}); });
    }
    if(type === 'R' || type === 'Q') {
        let dirs = [[1,0],[-1,0],[0,1],[0,-1]];
        dirs.forEach(d => { let nr = r+d[0], nc = c+d[1]; while(nr>=0 && nr<8 && nc>=0 && nc<8) { if(grid[nr][nc]==='') { moves.push({r:nr, c:nc}); } else { if((grid[nr][nc]===grid[nr][nc].toUpperCase()) !== isW) moves.push({r:nr, c:nc}); break; } nr+=d[0]; nc+=d[1]; } });
    }
    if(type === 'B' || type === 'Q') {
        let dirs = [[1,1],[1,-1],[-1,1],[-1,-1]];
        dirs.forEach(d => { let nr = r+d[0], nc = c+d[1]; while(nr>=0 && nr<8 && nc>=0 && nc<8) { if(grid[nr][nc]==='') { moves.push({r:nr, c:nc}); } else { if((grid[nr][nc]===grid[nr][nc].toUpperCase()) !== isW) moves.push({r:nr, c:nc}); break; } nr+=d[0]; nc+=d[1]; } });
    }
    if(type === 'N') {
        [[2,1],[2,-1],[-2,1],[-2,-1],[1,2],[1,-2],[-1,2],[-1,-2]].forEach(m => { let nr = r+m[0], nc = c+m[1]; if(nr>=0 && nr<8 && nc>=0 && nc<8 && (grid[nr][nc]==='' || (grid[nr][nc]===grid[nr][nc].toUpperCase()) !== isW)) moves.push({r:nr, c:nc}); });
    }
    if(type === 'K') {
        [[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]].forEach(m => { let nr = r+m[0], nc = c+m[1]; if(nr>=0 && nr<8 && nc>=0 && nc<8 && (grid[nr][nc]==='' || (grid[nr][nc]===grid[nr][nc].toUpperCase()) !== isW)) moves.push({r:nr, c:nc}); });
    }
    return moves;
}

function makeBotChess() {
    let legals = [];
    for(let r=0; r<8; r++) { for(let c=0; c<8; c++) { if(chessGrid[r][c] !== '' && chessGrid[r][c] === chessGrid[r][c].toLowerCase()) { let ms = getAdvancedMoves(r, c, chessGrid); ms.forEach(m => legals.push({sr:r, sc:c, dr:m.r, dc:m.c})); } } }
    if(legals.length > 0) {
        let choice = legals[Math.floor(Math.random() * legals.length)];
        chessGrid[choice.dr][choice.dc] = chessGrid[choice.sr][choice.sc]; chessGrid[choice.sr][choice.sc] = '';
        chessTurn = "W"; document.getElementById("chess-status").innerText = "Aux Blancs"; renderChess();
    }
}

// ==========================================
// JEU : MORPION
// ==========================================
let tttGrid = [], tttTurn = "X", tttActive = true;

function initTTT() {
    tttGrid = ['','','','','','','','','']; tttTurn = "X"; tttActive = true;
    document.getElementById("ttt-status").innerText = "Tour : Joueur X";
    renderTTT();
}

function renderTTT() {
    const board = document.getElementById("tttBoard"); board.innerHTML = '';
    for(let i=0; i<9; i++) {
        const cell = document.createElement('div'); cell.className = 'cell-interactive'; cell.innerText = tttGrid[i];
        cell.style.color = tttGrid[i] === 'X' ? '#38bdf8' : '#f43f5e';
        cell.addEventListener('click', () => onTTTClick(i)); board.appendChild(cell);
    }
}

function onTTTClick(i) {
    if(tttGrid[i] !== '' || !tttActive) return;
    executeTTTMove(i);
    if(tttActive && currentMode === "robot" && tttTurn === "O") { setTimeout(makeBotTTT, 400); }
}

function executeTTTMove(i) {
    tttGrid[i] = tttTurn; renderTTT();
    if(checkTTTWin(tttGrid, tttTurn)) { document.getElementById("ttt-status").innerText = `Victoire de ${tttTurn} ! 🎉`; tttActive = false; return; }
    if(!tttGrid.includes('')) { document.getElementById("ttt-status").innerText = "Égalité ! 🤝"; tttActive = false; return; }
    tttTurn = tttTurn === "X" ? "O" : "X";
    document.getElementById("ttt-status").innerText = `Tour : Joueur ${tttTurn}`;
}

function makeBotTTT() {
    let empty = []; tttGrid.forEach((c, idx) => { if(c === '') empty.push(idx); });
    if(empty.length > 0 && tttActive) { executeTTTMove(empty[Math.floor(Math.random() * empty.length)]); }
}

function checkTTTWin(b, p) { const lines = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]]; return lines.some(l => b[l[0]]===p && b[l[1]]===p && b[l[2]]===p); }

// ========================================================
// JEU : MATCH DE FOOT (AVEC ARBITRAGE ET COUP D'ENVOI FIXÉ)
// ========================================================
const fCanvas = document.getElementById("foot2dCanvas"); const fCtx = fCanvas.getContext("2d");
let foot2dAnimFrame; let isFootTimerRunning = false; let isGoalPause = false;
let scoreB = 0, scoreR = 0;
let ball = { x: 290, y: 190, vx: 2, vy: 1, radius: 6 };
let teamB = [], teamR = [];

function initFoot2D() {
    scoreB = 0; scoreR = 0; isGoalPause = false;
    document.getElementById("m-score-b").innerText = 0; document.getElementById("m-score-r").innerText = 0;
    resetPitch(); updateFootMatch();
}

function toggleFootTimer() {
    if(isGoalPause) return; // Sécurité : impossible de forcer pendant le pop-up
    isFootTimerRunning = !isFootTimerRunning;
    document.getElementById("btn-foot-start").innerText = isFootTimerRunning ? "Pause" : "Démarrer";
}

function resetPitch() {
    ball.x = 290; ball.y = 190; 
    ball.vx = Math.random() > 0.5 ? 3.5 : -3.5; ball.vy = Math.random() * 2 - 1;
    teamB = []; teamR = [];
    for(let i=0; i<11; i++) {
        teamB.push({ x: 60 + Math.random()*120, y: 40 + Math.random()*300 });
        teamR.push({ x: 400 + Math.random()*120, y: 40 + Math.random()*300 });
    }
}

function triggerGoalPopup(team) {
    isGoalPause = true;
    isFootTimerRunning = false; // Stop immédiat de la physique en arrière-plan

    const pop = document.getElementById("goalPopup");
    document.getElementById("goalTeamScored").innerText = team === 'blue' ? "L'ÉQUIPE BLEUE VIENT DE MARQUER !" : "L'ÉQUIPE ROUGE VIENT DE MARQUER !";
    pop.classList.add("show");
    
    // Le pop-up reste exactement 2 secondes, puis s'efface et donne le coup d'envoi
    setTimeout(() => { 
        pop.classList.remove("show"); 
        resetPitch(); // Repositionne les joueurs et la balle au centre
        isGoalPause = false;
        isFootTimerRunning = true; // Relance le match directement
        document.getElementById("btn-foot-start").innerText = "Pause";
    }, 2000);
}

function updateFootMatch() {
    if(!document.getElementById('game-leader').classList.contains('active')) return;
    
    if(isFootTimerRunning && !isGoalPause) {
        ball.x += ball.vx; ball.y += ball.vy; ball.vx *= 0.99; ball.