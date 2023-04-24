let grid = [];
let turn = "X";
let playing = true;

const socket = io();

function setup() {
    createCanvas(600, 600);
    let resetButton = document.getElementById("reset");
    resetButton.addEventListener("click", resetClicked);

    textAlign(CENTER, CENTER);
    for (let i = 0; i < 3; i++) {
        grid[i] = [];
        for (let j = 0; j < 3; j++) {
            grid[i][j] = "";
        }
    }
    frameRate(10);
}

function draw() {
    background(220);
    console.log("draw")
    for (let i = 0; i < 3; i++) {
        for (let j = 0; j < 3; j++) {
            rect(i * 200, j * 200, 200, 200);
            textSize(78);
            text(grid[i][j], i * 200 + 100, j * 200 + 100);
        }
    }
}

function nextTurn() {
    if (turn == "X") {
        turn = "O";
    } else {
        turn = "X";
    }
    document.getElementById("player-turn").innerText = turn;
    let winner = checkWinner();
    if (winner != "") {
        playerWon(winner);
    }
}


function mouseClicked() {
    if (!playing) {
        return;
    }
    let x = floor(mouseX / 200);
    let y = floor(mouseY / 200);
    if (grid[x][y] == "") {
        grid[x][y] = turn;
    }
    redraw();
    nextTurn();
}

function playerWon(player) {
    document.getElementById("winner").innerText = player + " wins!";
    playing = false;
}

function checkWinner() {
    // Check rows
    for (let i = 0; i < 3; i++) {
        if (grid[i][0] == grid[i][1] && grid[i][1] == grid[i][2] && grid[i][0] != "") {
            return grid[i][0];
        }
    }
    // Check columns
    for (let i = 0; i < 3; i++) {
        if (grid[0][i] == grid[1][i] && grid[1][i] == grid[2][i] && grid[0][i] != "") {
            return grid[0][i];
        }
    }
    // Check diagonals
    if (grid[0][0] == grid[1][1] && grid[1][1] == grid[2][2] && grid[0][0] != "") {
        return grid[0][0];
    }
    if (grid[0][2] == grid[1][1] && grid[1][1] == grid[2][0] && grid[0][2] != "") {
        return grid[0][2];
    }
    return "";
}

function resetClicked() {
    for (let i = 0; i < 3; i++) {
        grid[i] = [];
        for (let j = 0; j < 3; j++) {
            grid[i][j] = "";
        }
    }
    turn = "X";
    playing = true;
    document.getElementById("winner").innerText = "";
    document.getElementById("player-turn").innerText = turn;
}