"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const socket_io_1 = __importDefault(require("socket.io"));
const http_1 = __importDefault(require("http"));
const crypto_1 = __importDefault(require("crypto"));
const cookieParser = require('cookie-parser');
const app = (0, express_1.default)();
const server = http_1.default.createServer(app);
const PORT = parseInt(process.env.PORT) || 8009;
const io = new socket_io_1.default.Server(server);
app.use(express_1.default.json());
app.use(cookieParser());
app.post('/api/lobydata', (req, res) => {
    const data = req.body;
    const response = { message: 'Hello from the server!' };
    res.json(response);
    console.log(data);
});
app.get('/api/check-login', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const isLoggedIn = yield loggedInAs(req.cookies.auth);
    if (isLoggedIn != null) {
        res.json({ isLoggedIn: true, username: isLoggedIn });
    }
    else {
        res.json({ isLoggedIn: false });
    }
}));
app.post('/api/signup', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const username = req.body.username;
    const htmlSpecialChars = ['&', '<', '>', '"', "'", '/', '`', '=', '+', '!'];
    for (let char of htmlSpecialChars) {
        if (username.includes(char)) {
            res.json({ message: 'Username contains invalid characters' });
            return;
        }
    }
    console.log("new user: " + username);
    const exists = yield checkIfUserExists(username);
    if (exists) {
        res.json({ message: 'Username already exists' });
        return;
    }
    else {
        const cookie = createCookie();
        createUser(username, req.body.password, cookie);
        res.cookie('auth', cookie);
        res.json({ message: 'User created' });
    }
}));
app.post('/api/login', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const username = req.body.username;
    const password = req.body.password;
    const htmlSpecialChars = ['&', '<', '>', '"', "'", '/', '`', '=', '+', '!'];
    for (let char of htmlSpecialChars) {
        if (username.includes(char)) {
            res.json({ message: 'Username contains invalid characters' });
            return;
        }
    }
    const userExists = yield checkIfUserExists(username);
    if (userExists) {
        const passwordCorrect = yield checkPassword(username, password);
        if (passwordCorrect) {
            console.log("PAssword correct");
            const cookie = createCookie();
            res.cookie('auth', cookie);
            yield saveCookie(username, cookie);
            console.log("cookie: ", cookie);
            res.json({ message: 'User created' });
        }
    }
    else {
        res.json({ message: 'Username does not exist' });
        return;
    }
}));
app.get('/leaderboard', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    console.log(req);
    try {
        const leaderboard = yield getLeaderboard();
        console.log("LDearboard results:");
        console.log(leaderboard);
        res.send(leaderboard);
    }
    catch (error) {
        console.error('Error getting leaderboard:', error);
        res.sendStatus(500);
    }
}));
app.post('/increment-counter', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const authCookie = req.cookies.auth;
    console.log("app.ts increment called");
    yield incrementWin(authCookie);
    console.log(authCookie);
    res.json({ message: 'Counter incremented' });
}));
app.post('/profile', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const username = req.body.username;
    const wins = yield getWins(username);
    if (wins === null) {
        res.status(404).json({ message: 'Player not found' });
    }
    else {
        res.status(200).json({ wins: wins });
    }
}));
let games = [];
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
    socket.on('joinGame', (joinId) => {
        console.log('lobby joined with id: ');
        console.log(joinId);
        joinGame(socket, joinId.loby);
    });
    socket.on('createGame', (lobyId) => {
        console.log('lobby created with id: ');
        console.log(lobyId);
        createGameNew(socket, lobyId.loby);
    });
    socket.on("playerClick", (data) => {
        var _a, _b, _c;
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
            let winner = checkWinnerBoard(game.board);
            if (winner != 0) {
                if (winner == 1) {
                    game.p1socket.emit("gameWon", "Congrats! You won!");
                    (_b = game.p2socket) === null || _b === void 0 ? void 0 : _b.emit("gameLost", "Sorry, you lost.");
                }
                else {
                    (_c = game.p2socket) === null || _c === void 0 ? void 0 : _c.emit("gameWon", "Congrats! You won!");
                    game.p1socket.emit("gameLost", "Sorry, you lost.");
                }
            }
        }
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
function checkWinnerBoard(board) {
    for (let i = 0; i < 3; i++) {
        if (board[i][0] != 0 && board[i][0] == board[i][1] && board[i][1] == board[i][2]) {
            return board[i][0];
        }
    }
    for (let i = 0; i < 3; i++) {
        if (board[0][i] != 0 && board[0][i] == board[1][i] && board[1][i] == board[2][i]) {
            return board[0][i];
        }
    }
    if (board[0][0] != 0 && board[0][0] == board[1][1] && board[1][1] == board[2][2]) {
        return board[0][0];
    }
    if (board[0][2] != 0 && board[0][2] == board[1][1] && board[1][1] == board[2][0]) {
        return board[0][2];
    }
    return 0;
}
function joinGame(player, lobyId) {
    let game = getGameFromId(lobyId);
    if (game == null) {
        console.log('game doesnt exist');
        player.emit('noGame', { failed: 'failed' });
        return;
    }
    if (game.p2socket == null) {
        console.log('adding player 2 to loby: ' + game.id);
        game.p2socket = player;
        startGame(game);
    }
    else {
        console.log('loby is full');
        player.emit('noGame', { failed: 'failed' });
    }
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
function createGameNew(player, lobyId) {
    const game = {
        id: lobyId,
        p1socket: player,
        p2socket: null,
        board: [[0, 0, 0], [0, 0, 0], [0, 0, 0]],
        turn: 1
    };
    games.push(game);
    return game;
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
const firebase_admin_1 = __importDefault(require("firebase-admin"));
const serviceAccount = require('../public/privatekey.json');
firebase_admin_1.default.initializeApp({
    credential: firebase_admin_1.default.credential.cert(serviceAccount),
    databaseURL: "https://tictactoe-c2eec-default-rtdb.firebaseio.com"
});
function checkIfUserExists(username) {
    return __awaiter(this, void 0, void 0, function* () {
        const database = firebase_admin_1.default.database();
        const usersRef = database.ref('users');
        return new Promise((resolve, reject) => {
            usersRef.child(username).once('value')
                .then((snapshot) => {
                const user = snapshot.val();
                console.log(user);
                if (user) {
                    console.log("Username already exists");
                    resolve(true);
                }
                else {
                    resolve(false);
                }
                resolve(false);
            })
                .catch((error) => {
                console.error("Error checking if user exists: ", error);
                reject(error);
            });
        });
    });
}
function createCookie() {
    const cookieValue = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    return cookieValue;
}
function createHash(password, salt) {
    const saltedPassword = password + salt;
    const hash = crypto_1.default.createHash('sha256');
    hash.update(saltedPassword);
    const hashedPassword = hash.digest('hex');
    return hashedPassword;
}
function saveCookie(username, cookie) {
    return __awaiter(this, void 0, void 0, function* () {
        const cookieSalt = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
        const hashedCookie = createHash(cookie, cookieSalt);
        const database = firebase_admin_1.default.database();
        const usersRef = database.ref('users');
        const userRef = usersRef.child(username);
        userRef.update({
            cookie: hashedCookie,
            cookieSalt: cookieSalt
        })
            .then(() => {
            console.log("Cookie saved to database");
        })
            .catch((error) => {
            console.error("Error saving cookie to database: ", error);
        });
    });
}
function createUser(username, password, cookie) {
    const cookieSalt = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    const passwordSalt = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    const hashedPassword = createHash(password, passwordSalt);
    const hashedCookie = createHash(cookie, cookieSalt);
    const database = firebase_admin_1.default.database();
    const usersRef = database.ref('users');
    const newUserRef = usersRef.child(username);
    newUserRef.set({
        cookie: hashedCookie,
        cookieSalt,
        username,
        password: hashedPassword,
        passwordSalt,
    })
        .then(() => {
        const leaderboardRef = database.ref('leaderboard');
        leaderboardRef.child(username).set(0)
            .then(() => {
            console.log("User data added to database successfully");
        })
            .catch((error) => {
            console.error("Error adding user to leaderboard: ", error);
        });
    })
        .catch((error) => {
        console.error("Error adding user data to database: ", error);
    });
}
function loggedInAs(cookie) {
    return __awaiter(this, void 0, void 0, function* () {
        const database = firebase_admin_1.default.database();
        const usersRef = database.ref('users');
        return new Promise((resolve, reject) => {
            usersRef.once('value')
                .then((snapshot) => {
                snapshot.forEach((userSnapshot) => {
                    const user = userSnapshot.val();
                    if (user && user.cookie && user.cookieSalt) {
                        const hashedCookie = createHash(cookie, user.cookieSalt);
                        if (user.cookie === hashedCookie) {
                            resolve(user.username);
                        }
                    }
                });
                resolve(null);
            })
                .catch((error) => {
                console.error("Error checking if user is logged in: ", error);
                reject(error);
            });
        });
    });
}
function incrementWin(cookie) {
    return __awaiter(this, void 0, void 0, function* () {
        const username = yield loggedInAs(cookie);
        console.log('Increment win for ' + username);
        const database = firebase_admin_1.default.database();
        const leaderboardRef = database.ref('leaderboard');
        if (username != null) {
            const userRef = leaderboardRef.child(username);
            userRef.once('value')
                .then((snapshot) => {
                const user = snapshot.val();
                if (user) {
                    userRef.set(parseInt(user) + 1);
                }
                else {
                    userRef.set(1);
                }
            });
        }
    });
}
function getLeaderboard() {
    return __awaiter(this, void 0, void 0, function* () {
        console.log('Getting leaderboard');
        const database = firebase_admin_1.default.database();
        const leaderboardRef = database.ref('leaderboard');
        return new Promise((resolve, reject) => {
            leaderboardRef.once('value')
                .then((snapshot) => {
                const leaderboard = [];
                snapshot.forEach((userSnapshot) => {
                    const username = userSnapshot.key;
                    const wins = userSnapshot.val();
                    if (username) {
                        leaderboard.push({
                            username,
                            wins,
                        });
                    }
                });
                leaderboard.sort((a, b) => b.wins - a.wins);
                resolve(leaderboard);
            })
                .catch((error) => {
                console.error("Error getting leaderboard: ", error);
                reject(error);
            });
        });
    });
}
function checkPassword(username, password) {
    return __awaiter(this, void 0, void 0, function* () {
        const database = firebase_admin_1.default.database();
        const usersRef = database.ref('users');
        const userRef = usersRef.child(username);
        return new Promise((resolve, reject) => {
            userRef.once('value')
                .then((snapshot) => {
                const user = snapshot.val();
                if (user && user.password && user.passwordSalt) {
                    const hashedPassword = createHash(password, user.passwordSalt);
                    if (user.password === hashedPassword) {
                        resolve(true);
                    }
                }
                resolve(false);
            })
                .catch((error) => {
                console.error("Error checking password: ", error);
                reject(error);
            });
        });
    });
}
function getWins(username) {
    return __awaiter(this, void 0, void 0, function* () {
        const database = firebase_admin_1.default.database();
        const leaderboardRef = database.ref('leaderboard');
        const userRef = leaderboardRef.child(username);
        console.log("leaderboard user ref: ", userRef);
        return new Promise((resolve, reject) => {
            userRef.once('value')
                .then((snapshot) => {
                const user = snapshot.val();
                console.log("user: ", user);
                if (user) {
                    resolve(user);
                }
                resolve(0);
            })
                .catch((error) => {
                console.error("Error getting wins: ", error);
                reject(error);
            });
        });
    });
}
//# sourceMappingURL=app.js.map