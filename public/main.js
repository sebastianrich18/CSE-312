
let game;
let socket;
const player_id = Math.floor(Math.random() * 1000000);

function setup() {
    game = new TicTacToe();
    socket = io();
    socket.on("connect", function () {
        console.log("connected");
        findGame();
    })
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

function findGame() {
    socket.emit("findGame", {player: player_id});
}

socket.on("gameFound", function (data) {
    game = new TicTacToe(data.player);
    console.log("game found");
});