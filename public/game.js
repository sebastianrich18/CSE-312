let grid = [];
let turn = "X";

function setup() {
    createCanvas(600, 600);
    textAlign(CENTER, CENTER);
    for (let i = 0; i < 3; i++) {
        grid[i] = [];
        for (let j = 0; j < 3; j++) {
            grid[i][j] = "";
        }
    }
}

function draw() {
    background(220);
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
}


function mouseClicked() {
    let x = floor(mouseX / 200);
    let y = floor(mouseY / 200);
    if (grid[x][y] == "") {
        grid[x][y] = turn;
    }
    nextTurn();
}

function checkWinner() {
    
}