import express from 'express';
import socketio from 'socket.io';
import http from 'http';

const app = express();
const server = http.createServer(app);

// let playerIdsToSocketId: Map<string, socketio.Socket> = new Map<string, socketio.Socket>();

interface Game {
  id: string;
  p1socket: socketio.Socket;
  p2socket: socketio.Socket | null;
}

let games: Game[] = [];

const PORT: Number = parseInt(process.env.PORT!) || 8008;

const io = new socketio.Server(server);

app.use(express.static('public/'));

io.on('connection', (socket: socketio.Socket) => {
  console.log('A client connected!');
  console.log('Socket ID: ' + socket.id);
  // idsToSockets.set(socket.id, socket);

  // Handle socket events here
  socket.on('findGame', (data: any) => {
    console.log(`looking for game: `);
    console.log(data);
    let game = findGame(socket);
  });
});


server.listen(PORT, function () {
  console.log('Your app is listening on port 8080');
});


function findGame(player: socketio.Socket): Game {
  if (games.length == 0) {
    let game = createGame(player);
    return game
  } else {
    let game = games[games.length - 1];
    if (game.p2socket == null) {
      console.log("adding player 2 to game: " + game.id)
      game.p2socket = player;
      return game;
    }

    game = createGame(player);
    return game;
  }
}


function createGame(player: socketio.Socket): Game {
  const id = Math.floor(Math.random() * 1000000000);
  console.log(`creating game with id: ${id}`)
  const game: Game = {
    id: id.toString(),
    p1socket: player,
    p2socket: null
  }
  games.push(game);
  return game;
}