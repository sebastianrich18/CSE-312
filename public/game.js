class TicTacToe {
    
    grid = [];
    turn = "X";
    playing = true;

    constructor() {
        createCanvas(600, 600);
        
        textAlign(CENTER, CENTER);
        for (let i = 0; i < 3; i++) {
            this.grid[i] = [];
            for (let j = 0; j < 3; j++) {
                this.grid[i][j] = "";
            }
        }
        console.log(this.grid)
        let resetButton = document.getElementById("reset");
        let myLoby = document.getElementById('lobyCode')
        myLoby.innerHTML = sessionStorage.getItem('lobyId')
        resetButton.addEventListener("click", this.resetBoard.bind(this));
        frameRate(10);
    }

    show() {
        background(220);
        for (let i = 0; i < 3; i++) {
            for (let j = 0; j < 3; j++) {
                rect(i * 200, j * 200, 200, 200);
                textSize(78);
                text(this.grid[i][j], i * 200 + 100, j * 200 + 100);
            }
        }
    }

    nextTurn() {
        if (this.turn == "X") {
            this.turn = "O";
        } else {
            this.turn = "X";
        }
        document.getElementById("player-turn").innerText = this.turn;
        let winner = this.checkWinner();
        if (winner != "") {
            this.playerWon(winner);
        }
    }


    playerClicked(gridX, gridY, player) {
        if (!this.playing) {
            return;
        }
        if (this.grid[gridX][gridY] == "") {
            this.grid[gridX][gridY] = this.turn;
        }
        redraw();
        this.nextTurn();
    }

    playerWon(player) {
        document.getElementById("winner").innerText = player + " wins!";
        this.playing = false;
    }

    checkWinner() {
        // Check rows
        for (let i = 0; i < 3; i++) {
            if (this.grid[i][0] == this.grid[i][1] && this.grid[i][1] == this.grid[i][2] && this.grid[i][0] != "") {
                return this.grid[i][0];
            }
        }
        // Check columns
        for (let i = 0; i < 3; i++) {
            if (this.grid[0][i] == this.grid[1][i] && this.grid[1][i] == this.grid[2][i] && this.grid[0][i] != "") {
                return this.grid[0][i];
            }
        }
        // Check diagonals
        if (this.grid[0][0] == this.grid[1][1] && this.grid[1][1] == this.grid[2][2] && this.grid[0][0] != "") {
            return this.grid[0][0];
        }
        if (this.grid[0][2] == this.grid[1][1] && this.grid[1][1] == this.grid[2][0] && this.grid[0][2] != "") {
            return this.grid[0][2];
        }
        return "";
    }

    resetBoard() {
        for (let i = 0; i < 3; i++) {
            this.grid[i] = [];
            for (let j = 0; j < 3; j++) {
                this.grid[i][j] = "";
            }
        }
        this.turn = "X";
        this.playing = true;
        document.getElementById("winner").innerText = "";
        document.getElementById("player-turn").innerText = this.turn;
    }
}