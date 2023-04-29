"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const socket_io_1 = __importDefault(require("socket.io"));
const http_1 = __importDefault(require("http"));
const app = (0, express_1.default)();
const server = http_1.default.createServer(app);
app.use(express_1.default.json());
app.post('/api/lobydata', (req, res) => {
    const data = req.body;
    const response = { message: 'Hello from the server!' };
    res.json(response);
    console.log(data);
});
let games = [];
const PORT = parseInt(process.env.PORT) || 8008;
const io = new socket_io_1.default.Server(server);
app.use(express_1.default.static('public/'));
io.on('connection', (socket) => {
    console.log('A client connected!');
    console.log('Socket ID: ' + socket.id);
    socket.on('disconnect', () => {
        console.log('A client disconnected!');
        for (let game of games) {
            if (game.p1socket == socket || game.p2socket == socket) {
                games.splice(games.indexOf(game), 1);
                console.log("player disconnected, removed game: " + game.id);
            }
        }
    });
    socket.on('findGame', (data) => {
        console.log(`looking for game: `);
        console.log(data);
        findGame(socket);
    });
    socket.on("playerClick", (data) => {
        var _a;
        console.log("player clicked: ");
        console.log(data);
        let game = getGameFromId(data.gameId);
        if (game == null) {
            console.log("game not found");
            return;
        }
        if (game.turn != data.player) {
            console.log("not your turn");
            return;
        }
        if (game.board[data.x][data.y] === 0) {
            game.board[data.x][data.y] = data.player;
            game.p1socket.emit("playerMoved", data);
            (_a = game.p2socket) === null || _a === void 0 ? void 0 : _a.emit("playerMoved", data);
            game.turn = game.turn == 1 ? 2 : 1;
        }
    });
    socket.on('createLoby', (lobyId) => {
        console.log('loby Id: ', lobyId);
    });
});
server.listen(PORT, function () {
    console.log('Your app is listening on port 8008');
});
function getGameFromId(id) {
    for (let game of games) {
        if (game.id == id) {
            return game;
        }
    }
    return null;
}
function findGame(player) {
    if (games.length == 0) {
        let game = createGame(player);
        return game;
    }
    else {
        let game = games[games.length - 1];
        if (game.p2socket == null) {
            console.log("adding player 2 to game: " + game.id);
            game.p2socket = player;
            startGame(game);
            return game;
        }
        game = createGame(player);
        return game;
    }
}
function createGame(player) {
    const id = Math.floor(Math.random() * 1000000000);
    console.log(`creating game with id: ${id}`);
    const game = {
        id: id.toString(),
        p1socket: player,
        p2socket: null,
        board: [[0, 0, 0], [0, 0, 0], [0, 0, 0]],
        turn: 1
    };
    games.push(game);
    return game;
}
function startGame(game) {
    console.log("starting game with player 1");
    game.p1socket.emit('startGame', { id: game.id, player: 1 });
    if (game.p2socket != null) {
        console.log("starting game with player 2");
        game.p2socket.emit('startGame', { id: game.id, player: 2 });
    }
    console.log("started game: " + game.id);
}
//# sourceMappingURL=app.js.map