
let game;

function setup() {
    game = new TicTacToe();
}

function draw() {
    game.show();
}


function mouseClicked() {
    let gridX = Math.floor(mouseX / 200);
    let gridY = Math.floor(mouseY / 200);
    if (game){
        game.playerClicked(gridX, gridY);
    }
}