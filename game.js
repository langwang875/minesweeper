class Minesweeper {
    constructor(rows = 16, cols = 30, mines = 99) {
        this.rows = rows;
        this.cols = cols;
        this.mines = mines;
        this.board = [];
        this.revealed = [];
        this.flagged = [];
        this.gameOver = false;
        this.mineCount = mines;
        this.timer = 0;
        this.timerInterval = null;
        
        // 触摸相关变量
        this.touchStartTime = 0;
        this.touchTimeout = null;
        this.lastTapTime = 0;
        this.touchStartX = 0;
        this.touchStartY = 0;
        
        this.gameBoard = document.getElementById('gameBoard');
        this.mineCounter = document.querySelector('.mine-count');
        this.timerDisplay = document.querySelector('.timer');
        this.newGameBtn = document.getElementById('newGame');
        
        this.newGameBtn.addEventListener('click', () => this.startNewGame());
        
        // 自动调整游戏板大小
        this.adjustBoardSize();
        window.addEventListener('resize', () => this.adjustBoardSize());
        
        this.initializeGame();
    }
    
    adjustBoardSize() {
        const isMobile = window.innerWidth <= 768;
        if (isMobile) {
            // 在移动设备上使用较小的尺寸
            this.rows = 12;
            this.cols = 9;
            this.mines = 20;
            this.initializeGame();
        }
    }
    
    initializeGame() {
        clearInterval(this.timerInterval);
        this.timer = 0;
        this.timerDisplay.textContent = '000';
        
        this.board = Array(this.rows).fill().map(() => Array(this.cols).fill(0));
        this.revealed = Array(this.rows).fill().map(() => Array(this.cols).fill(false));
        this.flagged = Array(this.rows).fill().map(() => Array(this.cols).fill(false));
        this.gameOver = false;
        this.mineCount = this.mines;
        this.mineCounter.textContent = String(this.mineCount).padStart(3, '0');
        this.newGameBtn.textContent = '🙂';
        
        this.createBoard();
    }
    
    startTimer() {
        if (!this.timerInterval) {
            this.timerInterval = setInterval(() => {
                this.timer++;
                this.timerDisplay.textContent = String(Math.min(this.timer, 999)).padStart(3, '0');
            }, 1000);
        }
    }
    
    createBoard() {
        this.gameBoard.innerHTML = '';
        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                const cell = document.createElement('div');
                cell.className = 'cell';
                cell.dataset.row = row;
                cell.dataset.col = col;
                
                // 添加触摸事件监听
                cell.addEventListener('touchstart', (e) => this.handleTouchStart(e, row, col));
                cell.addEventListener('touchend', (e) => this.handleTouchEnd(e, row, col));
                cell.addEventListener('touchmove', (e) => this.handleTouchMove(e));
                cell.addEventListener('contextmenu', (e) => e.preventDefault());
                
                // 保留鼠标事件支持
                cell.addEventListener('click', (e) => this.handleClick(row, col));
                cell.addEventListener('dblclick', (e) => this.handleDoubleClick(row, col));
                
                this.gameBoard.appendChild(cell);
            }
        }
    }
    
    handleTouchStart(e, row, col) {
        e.preventDefault();
        this.touchStartTime = Date.now();
        this.touchStartX = e.touches[0].clientX;
        this.touchStartY = e.touches[0].clientY;
        
        // 设置长按定时器
        this.touchTimeout = setTimeout(() => {
            this.handleRightClick(row, col);
        }, 500);
    }
    
    handleTouchMove(e) {
        if (this.touchTimeout) {
            const touchX = e.touches[0].clientX;
            const touchY = e.touches[0].clientY;
            const moveDistance = Math.sqrt(
                Math.pow(touchX - this.touchStartX, 2) + 
                Math.pow(touchY - this.touchStartY, 2)
            );
            
            // 如果移动距离超过阈值，取消长按
            if (moveDistance > 10) {
                clearTimeout(this.touchTimeout);
                this.touchTimeout = null;
            }
        }
    }
    
    handleTouchEnd(e, row, col) {
        e.preventDefault();
        const touchDuration = Date.now() - this.touchStartTime;
        
        // 清除长按定时器
        if (this.touchTimeout) {
            clearTimeout(this.touchTimeout);
            this.touchTimeout = null;
        }
        
        // 如果不是长按，则处理点击
        if (touchDuration < 500) {
            const currentTime = Date.now();
            const tapLength = currentTime - this.lastTapTime;
            
            if (tapLength < 300 && tapLength > 0) {
                // 双击
                this.handleDoubleClick(row, col);
                this.lastTapTime = 0;
            } else {
                // 单击
                this.handleClick(row, col);
                this.lastTapTime = currentTime;
            }
        }
    }
    
    placeMines(firstRow, firstCol) {
        let minesPlaced = 0;
        while (minesPlaced < this.mines) {
            const row = Math.floor(Math.random() * this.rows);
            const col = Math.floor(Math.random() * this.cols);
            
            // 确保第一次点击的位置及其周围没有地雷
            if (Math.abs(row - firstRow) <= 1 && Math.abs(col - firstCol) <= 1) {
                continue;
            }
            
            if (this.board[row][col] !== -1) {
                this.board[row][col] = -1;
                minesPlaced++;
                
                // 更新周围格子的数字
                for (let i = -1; i <= 1; i++) {
                    for (let j = -1; j <= 1; j++) {
                        if (i === 0 && j === 0) continue;
                        const newRow = row + i;
                        const newCol = col + j;
                        if (this.isValidCell(newRow, newCol) && this.board[newRow][newCol] !== -1) {
                            this.board[newRow][newCol]++;
                        }
                    }
                }
            }
        }
    }
    
    isValidCell(row, col) {
        return row >= 0 && row < this.rows && col >= 0 && col < this.cols;
    }
    
    handleClick(row, col) {
        if (this.gameOver || this.flagged[row][col]) return;
        
        // 第一次点击时放置地雷
        if (this.board.every(row => row.every(cell => cell === 0))) {
            this.placeMines(row, col);
            this.startTimer();
        }
        
        if (this.board[row][col] === -1) {
            this.newGameBtn.textContent = '😵';
            this.revealAll();
            clearInterval(this.timerInterval);
            this.gameOver = true;
            return;
        }
        
        this.revealCell(row, col);
        if (this.checkWin()) {
            this.newGameBtn.textContent = '😎';
            clearInterval(this.timerInterval);
            this.gameOver = true;
        }
    }
    
    handleRightClick(row, col) {
        if (this.gameOver || this.revealed[row][col]) return;
        
        this.flagged[row][col] = !this.flagged[row][col];
        const cell = this.gameBoard.children[row * this.cols + col];
        
        if (this.flagged[row][col]) {
            cell.classList.add('flagged');
            this.mineCount--;
        } else {
            cell.classList.remove('flagged');
            this.mineCount++;
        }
        
        this.mineCounter.textContent = String(this.mineCount).padStart(3, '0');
    }
    
    revealCell(row, col) {
        if (!this.isValidCell(row, col) || this.revealed[row][col] || this.flagged[row][col]) return;
        
        this.revealed[row][col] = true;
        const cell = this.gameBoard.children[row * this.cols + col];
        cell.classList.add('revealed');
        
        if (this.board[row][col] === -1) {
            cell.classList.add('mine');
            cell.textContent = '💣';
        } else if (this.board[row][col] > 0) {
            cell.textContent = this.board[row][col];
            // 设置不同数字的颜色
            const colors = ['', '#0000ff', '#008000', '#ff0000', '#000080', '#800000', '#008080', '#000000', '#808080'];
            cell.style.color = colors[this.board[row][col]];
        } else {
            // 如果是空格，递归显示周围的格子
            for (let i = -1; i <= 1; i++) {
                for (let j = -1; j <= 1; j++) {
                    if (i === 0 && j === 0) continue;
                    this.revealCell(row + i, col + j);
                }
            }
        }
    }
    
    revealAll() {
        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                if (this.board[row][col] === -1) {
                    const cell = this.gameBoard.children[row * this.cols + col];
                    cell.classList.add('revealed', 'mine');
                    cell.textContent = '💣';
                }
            }
        }
    }
    
    checkWin() {
        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                if (this.board[row][col] !== -1 && !this.revealed[row][col]) {
                    return false;
                }
            }
        }
        return true;
    }
    
    startNewGame() {
        this.initializeGame();
    }
    
    handleDoubleClick(row, col) {
        if (this.gameOver || !this.revealed[row][col]) return;
        
        if (this.board[row][col] > 0) {
            let flaggedCount = 0;
            for (let i = -1; i <= 1; i++) {
                for (let j = -1; j <= 1; j++) {
                    if (i === 0 && j === 0) continue;
                    const newRow = row + i;
                    const newCol = col + j;
                    if (this.isValidCell(newRow, newCol) && this.flagged[newRow][newCol]) {
                        flaggedCount++;
                    }
                }
            }
            
            if (flaggedCount === this.board[row][col]) {
                let hitMine = false;
                
                for (let i = -1; i <= 1; i++) {
                    for (let j = -1; j <= 1; j++) {
                        if (i === 0 && j === 0) continue;
                        const newRow = row + i;
                        const newCol = col + j;
                        if (this.isValidCell(newRow, newCol) && 
                            this.flagged[newRow][newCol] && 
                            this.board[newRow][newCol] !== -1) {
                            hitMine = true;
                            break;
                        }
                    }
                    if (hitMine) break;
                }
                
                if (hitMine) {
                    this.newGameBtn.textContent = '😵';
                    this.revealAll();
                    clearInterval(this.timerInterval);
                    this.gameOver = true;
                    return;
                }
                
                for (let i = -1; i <= 1; i++) {
                    for (let j = -1; j <= 1; j++) {
                        if (i === 0 && j === 0) continue;
                        const newRow = row + i;
                        const newCol = col + j;
                        if (this.isValidCell(newRow, newCol) && !this.flagged[newRow][newCol]) {
                            this.revealCell(newRow, newCol);
                        }
                    }
                }
                
                if (this.checkWin()) {
                    this.newGameBtn.textContent = '😎';
                    clearInterval(this.timerInterval);
                    this.gameOver = true;
                }
            }
        }
    }
}

// 启动游戏
window.onload = () => {
    new Minesweeper();
}; 