// 全局变量
let board = document.getElementById('sudokuBoard');
let timerEl = document.getElementById('timer');
let selectedCell = null;
let sudokuData = [];
let answerData = [];
let timer = null;
let seconds = 0;

// 初始化
window.onload = init;
function init() {
    bindEvents();
    newGame();
}

// 绑定所有事件
function bindEvents() {
    // 模式切换
    document.getElementById('gameModeBtn').onclick = () => toggleMode('game');
    document.getElementById('printModeBtn').onclick = () => toggleMode('print');
    // 游戏控制
    document.getElementById('newGame').onclick = newGame;
    document.getElementById('check').onclick = checkSolution;
    document.getElementById('showAnswer').onclick = showAnswer;
    document.getElementById('delete').onclick = deleteNumber;
    document.getElementById('closeModal').onclick = () => completeModal.style.display = 'none';
    // 数字键盘
    document.querySelectorAll('.num-keypad button[data-num]').forEach(btn => {
        btn.onclick = () => inputNumber(btn.dataset.num);
    });
    // 打印
    document.getElementById('generatePrint').onclick = generatePrint;
}

// 模式切换
function toggleMode(mode) {
    document.querySelectorAll('.mode-switch button').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.mode').forEach(m => m.classList.remove('active'));
    document.getElementById(`${mode}ModeBtn`).classList.add('active');
    document.getElementById(`${mode}Mode`).classList.add('active');
    stopTimer();
}

// 生成新数独游戏
function newGame() {
    [sudokuData, answerData] = generateSudoku();
    renderBoard();
    resetTimer();
    startTimer();
}

// 渲染棋盘
function renderBoard() {
    board.innerHTML = '';
    sudokuData.forEach((row, i) => {
        row.forEach((num, j) => {
            const cell = document.createElement('div');
            cell.className = 'cell';
            cell.dataset.row = i;
            cell.dataset.col = j;
            if (num !== 0) {
                cell.textContent = num;
                cell.classList.add('given');
            }
            cell.onclick = () => selectCell(cell);
            board.appendChild(cell);
        });
    });
}

// 选中格子+高亮行列宫
function selectCell(cell) {
    // 清除选中和高亮
    document.querySelectorAll('.cell').forEach(c => {
        c.classList.remove('selected', 'highlight');
    });
    selectedCell = cell;
    cell.classList.add('selected');
    highlightRelated(cell.dataset.row, cell.dataset.col);
}

// 高亮同行、同列、同宫
function highlightRelated(row, col) {
    const cells = document.querySelectorAll('.cell');
    cells.forEach(cell => {
        const r = cell.dataset.row;
        const c = cell.dataset.col;
        if (r == row || c == col || (Math.floor(r/3) == Math.floor(row/3) && Math.floor(c/3) == Math.floor(col/3))) {
            if (!cell.classList.contains('selected')) cell.classList.add('highlight');
        }
    });
}

// 输入数字
function inputNumber(num) {
    if (!selectedCell || selectedCell.classList.contains('given')) return;
    selectedCell.textContent = num;
    selectedCell.classList.remove('error');
    selectedCell.classList.add('user');
    checkComplete();
}

// 删除数字
function deleteNumber() {
    if (!selectedCell || selectedCell.classList.contains('given')) return;
    selectedCell.textContent = '';
    selectedCell.classList.remove('user', 'error');
}

// 校验答案
function checkSolution() {
    const cells = document.querySelectorAll('.cell');
    cells.forEach(cell => {
        const r = cell.dataset.row;
        const c = cell.dataset.col;
        if (cell.classList.contains('given')) return;
        const userNum = cell.textContent || 0;
        if (userNum != answerData[r][c]) {
            cell.classList.add('error');
            cell.classList.remove('user');
        } else {
            cell.classList.add('user');
            cell.classList.remove('error');
        }
    });
}

// 显示答案
function showAnswer() {
    const cells = document.querySelectorAll('.cell');
    cells.forEach(cell => {
        const r = cell.dataset.row;
        const c = cell.dataset.col;
        if (!cell.classList.contains('given')) {
            cell.textContent = answerData[r][c];
            cell.classList.remove('user', 'error');
            cell.classList.add('given');
        }
    });
}

// 检查是否完成
function checkComplete() {
    const cells = document.querySelectorAll('.cell');
    for (let cell of cells) {
        const r = cell.dataset.row;
        const c = cell.dataset.col;
        if (cell.classList.contains('given')) continue;
        if (!cell.textContent || cell.textContent != answerData[r][c]) return;
    }
    // 完成弹窗
    stopTimer();
    document.getElementById('completeTime').textContent = `用时 ${formatTime(seconds)}`;
    document.getElementById('completeModal').style.display = 'flex';
}

// 计时器
function startTimer() {
    timer = setInterval(() => {
        seconds++;
        timerEl.textContent = formatTime(seconds);
    }, 1000);
}
function stopTimer() {clearInterval(timer);}
function resetTimer() {
    stopTimer();
    seconds = 0;
    timerEl.textContent = '00:00';
}
function formatTime(s) {
    const m = Math.floor(s / 60).toString().padStart(2, '0');
    const sec = (s % 60).toString().padStart(2, '0');
    return `${m}:${sec}`;
}

// 生成数独（简单算法）
function generateSudoku() {
    const ans = Array(9).fill().map(() => Array(9).fill(0));
    fillSudoku(ans);
    const puzzle = JSON.parse(JSON.stringify(ans));
    // 挖空（简单难度）
    for (let i=0; i<45; i++) {
        const r = Math.floor(Math.random()*9);
        const c = Math.floor(Math.random()*9);
        puzzle[r][c] = 0;
    }
    return [puzzle, ans];
}

// 回溯填充数独
function fillSudoku(ans) {
    for (let i=0; i<9; i++) {
        for (let j=0; j<9; j++) {
            if (ans[i][j] === 0) {
                const nums = shuffle([1,2,3,4,5,6,7,8,9]);
                for (let n of nums) {
                    if (isValid(ans, i, j, n)) {
                        ans[i][j] = n;
                        if (fillSudoku(ans)) return true;
                        ans[i][j] = 0;
                    }
                }
                return false;
            }
        }
    }
    return true;
}

// 验证数字合法性
function isValid(ans, row, col, num) {
    for (let i=0; i<9; i++) if (ans[row][i] === num) return false;
    for (let i=0; i<9; i++) if (ans[i][col] === num) return false;
    const r = Math.floor(row/3)*3, c = Math.floor(col/3)*3;
    for (let i=0; i<3; i++) for (let j=0; j<3; j++) if (ans[r+i][c+j] === num) return false;
    return true;
}

// 打乱数组
function shuffle(arr) {
    return arr.sort(() => Math.random() - 0.5);
}

// 生成打印题目
function generatePrint() {
    const count = parseInt(document.getElementById('printCount').value);
    const area = document.getElementById('printArea');
    area.className = `print-area ${count===1?'single':count===2?'double':'quad'}`;
    area.innerHTML = '';
    for (let i=0; i<count; i++) {
        const [puzzle] = generateSudoku();
        const printSudoku = document.createElement('div');
        printSudoku.className = 'print-sudoku';
        puzzle.forEach(row => {
            row.forEach(num => {
                const cell = document.createElement('div');
                cell.className = 'print-cell';
                cell.textContent = num || '';
                printSudoku.appendChild(cell);
            });
        });
        area.appendChild(printSudoku);
    }
    setTimeout(() => window.print(), 500);
}