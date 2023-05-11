
let game;
let socket;
let gameFound = false;
let gameId = "";
let playerNumber = -1;
const player_id = Math.floor(Math.random() * 1000000);
let lobyId = sessionStorage.getItem('lobyId');
let creator = JSON.parse(sessionStorage.getItem('createLoby')) //Json parse is necesary to convert string value to boolean



function setup() {
    socket = io();
    game = new TicTacToe(socket);
    socket.on("connect", function () {
        socket.on("startGame", function (data) {
            console.log("game " + data.id + " found, you are player " + data.player);
            gameFound = true;
            gameId = data.id;
            playerNumber = data.player;
            game = new TicTacToe(socket);
        });

        socket.on("playerMoved", function (data) {
            console.log("player " + data.player + " moved to " + data.x + ", " + data.y)
            game.playerClicked(data.x, data.y, data.player);
        })
        socket.on("gameOver", function (data) {
            console.log("SOCKT EMIT GAME OVER")
            const authCookie = getCookie("auth");
            console.log("Winner: ", authCookie)
        })
        console.log("connected");
        console.log("loby id: " + lobyId)
        findGame();

        socket.on('noGame', () => {
            noGame()
        })

        socket.on("gameWon", function (message) {
            alert(message);
        });
        
        socket.on("gameLost", function (message) {
            alert(message);
        });
    })
}

function noGame() {
    window.location = '/'
}

function draw() {
    game.show();
}


function mouseClicked() {
    let gridX = Math.floor(mouseX / 200);
    let gridY = Math.floor(mouseY / 200);
    sendClick(gridX, gridY);
}

function findGame() {
    console.log(creator)
    creator ? createGame() : joinGame()
    //socket.emit("findGame", {player: player_id});   
}


function sendClick(x, y) {
    socket.emit("playerClick", {x: x, y: y, gameId: gameId, player: playerNumber});
}

function createGame() {
    socket.emit("createGame", {loby: lobyId})
}

function joinGame() {
    socket.emit("joinGame", {loby: lobyId})
}
