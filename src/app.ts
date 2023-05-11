import express from 'express';
import socketio from 'socket.io';
import http from 'http';

const app = express();
const server = http.createServer(app);
// let playerIdsToSocketId: Map<string, socketio.Socket> = new Map<string, socketio.Socket>();
//Server documentation

interface Game {
  id: string;
  p1socket: socketio.Socket;
  p2socket: socketio.Socket | null;
  board: number[][]; // 0 represents empty, 1 represents player 1, 2 represents player 2
  turn: number;
}

//receives 5 digit code for lobbies
app.use(express.json());
app.post('/api/lobydata', (req, res) => {
  const data = req.body;
  const response = { message: 'Hello from the server!' };
  res.json(response)
  console.log(data)
})

let games: Game[] = [];

const PORT: Number = parseInt(process.env.PORT!) || 8008;

const io = new socketio.Server(server);

app.use(express.static('public/'));

io.on('connection', (socket: socketio.Socket) => {
  console.log('A client connected!');
  console.log('Socket ID: ' + socket.id);
  // idsToSockets.set(socket.id, socket);
  socket.on('disconnect', () => {
    console.log('A client disconnected!');
    for (let game of games) {
      if (game.p1socket == socket || game.p2socket == socket) {
        games.splice(games.indexOf(game), 1);
        console.log("player disconnected, removed game: " + game.id)

      }
    }
  });

  // Handle socket events here

  //NO LONGER USED
  socket.on('findGame', (data: any) => {
    console.log(`looking for game: `);
    console.log(data);
    findGame(socket);
  });
  //NO LONGER USED ^^^

  socket.on('joinGame', (joinId: any) => {
    console.log('lobby joined with id: ')
    console.log(joinId)
    joinGame(socket, joinId.loby)
  })

  socket.on('createGame', (lobyId: any) => {
    console.log('lobby created with id: ');
    console.log(lobyId)
    createGameNew(socket, lobyId.loby)
  })

  socket.on("playerClick", (data: any) => {
    console.log("player clicked: ")
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
      game.p2socket?.emit("playerMoved", data);
      game.turn = game.turn == 1 ? 2 : 1;
    }

  });

});


server.listen(PORT, function () {
  console.log('Your app is listening on port 8008');
});

function getGameFromId(id: string): Game | null {
  for (let game of games) {
    if (game.id == id) {
      return game;
    }
  }
  return null;
}

function joinGame(player: socketio.Socket, lobyId: string): void {
  let game = getGameFromId(lobyId)
  if (game == null) {
    console.log('game doesnt exist')
    player.emit('noGame', { failed: 'failed' })
    return
  }
  if (game.p2socket == null) {
    console.log('adding player 2 to loby: ' + game.id)
    game.p2socket = player
    startGame(game)
  } else {
    console.log('loby is full')
    player.emit('noGame', { failed: 'failed' })
  }
}

//NO LONGER USED
function findGame(player: socketio.Socket): Game {
  if (games.length == 0) {
    let game = createGame(player);
    return game
  } else {
    let game = games[games.length - 1]; // this prolly wont work if a user disconnects
    if (game.p2socket == null) {
      console.log("adding player 2 to game: " + game.id)
      game.p2socket = player;
      startGame(game);
      return game;
    }

    game = createGame(player);
    return game;
  }
}
//NO LONGER USED ^^^

function createGameNew(player: socketio.Socket, lobyId: string): Game {

  const game: Game = {
    id: lobyId,
    p1socket: player,
    p2socket: null,
    board: [[0, 0, 0], [0, 0, 0], [0, 0, 0]],
    turn: 1
  }
  games.push(game)
  return game;

}

//NO LONGER USED
function createGame(player: socketio.Socket): Game {
  const id = Math.floor(Math.random() * 1000000000);
  console.log(`creating game with id: ${id}`)
  const game: Game = {
    id: id.toString(),
    p1socket: player,
    p2socket: null,
    board: [[0, 0, 0], [0, 0, 0], [0, 0, 0]],
    turn: 1
  }
  games.push(game);
  return game;
}
//NO LONGER USED ^^^


function startGame(game: Game) {
  console.log("starting game with player 1")
  game.p1socket.emit('startGame', { id: game.id, player: 1 });
  if (game.p2socket != null) {
    console.log("starting game with player 2")
    game.p2socket.emit('startGame', { id: game.id, player: 2 });
  }
  console.log("started game: " + game.id)
}