import express from 'express';
import socketio from 'socket.io';
import http from 'http';
import crypto from 'crypto';
const cookieParser = require('cookie-parser');

const app = express();
const server = http.createServer(app);
// let playerIdsToSocketId: Map<string, socketio.Socket> = new Map<string, socketio.Socket>();

interface Game {
  id: string;
  p1socket: socketio.Socket;
  p2socket: socketio.Socket | null;
  board: number[][]; // 0 represents empty, 1 represents player 1, 2 represents player 2
  turn: number;
}

//receives 5 digit code for lobbies
app.use(express.json());
app.use(cookieParser());
app.post('/api/lobydata', (req, res) => {
  const data = req.body;
  const response = { message: 'Hello from the server!' };
  res.json(response)
  console.log(data)
})


app.get('/api/check-login', async (req, res) => {
  const isLoggedIn = await loggedInAs(req.cookies.auth);

  if (isLoggedIn != null) {
    res.json({ isLoggedIn: true, username: isLoggedIn});
  } else {
    res.json({ isLoggedIn: false });
  }
});

app.post('/api/signup', async (req, res) => {
  const exists = await checkIfUserExists(req.body.username);
  if (exists) {
    res.json({ message: 'Username already exists' });
    return;
  }
  else {
    console.log("SHOULDNT BE HERE")
    const cookie = createCookie();
    createUser(req.body.username, req.body.password, cookie);
    res.cookie('auth', cookie);
    res.json({ message: 'User created' });
  }

});

app.get('/leaderboard', async (req, res) => {
  console.log(req)
  try {
    const leaderboard = await getLeaderboard();
    console.log("LDearboard results:")
    console.log(leaderboard)
    res.send(leaderboard);
  } catch (error) {
    console.error('Error getting leaderboard:', error);
    res.sendStatus(500);
  }
});

app.post('/increment-counter', async (req, res) => {
  const authCookie = req.cookies.auth; // get the value of the 'auth' cookie from the request
  // do something with the cookie value, such as incrementing a counter
  console.log("app.ts increment called")
  await incrementWin(authCookie);
  console.log(authCookie)
  res.json({ message: 'Counter incremented' });
});



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
        let winner = checkWinnerBoard(game.board);
        if (winner != 0) {
            if (winner == 1) {                
                game.p1socket.emit("gameWon", "Congrats! You won!");
                game.p2socket?.emit("gameLost", "Sorry, you lost.");
            } else {
                game.p2socket?.emit("gameWon", "Congrats! You won!");
                game.p1socket.emit("gameLost", "Sorry, you lost.");
            }
        }
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

function checkWinnerBoard(board: number[][]): number {
  // check rows
  for (let i = 0; i < 3; i++) {
    if (board[i][0] != 0 && board[i][0] == board[i][1] && board[i][1] == board[i][2]) {
      return board[i][0];
    }
  }
  // check columns
  for (let i = 0; i < 3; i++) {
    if (board[0][i] != 0 && board[0][i] == board[1][i] && board[1][i] == board[2][i]) {
      return board[0][i];
    }
  }
  // check diagonals
  if (board[0][0] != 0 && board[0][0] == board[1][1] && board[1][1] == board[2][2]) {
    return board[0][0];
  }
  if (board[0][2] != 0 && board[0][2] == board[1][1] && board[1][1] == board[2][0]) {
    return board[0][2];
  }
  return 0;
}

function joinGame(player: socketio.Socket, lobyId: string): void{
  console.log('joining game: ' + player)
  let game = getGameFromId(lobyId)
  if(game == null){
    console.log('game doesnt exist')
    player.emit('noGame', {failed:'failed'})
    return
  }
  if(game.p2socket == null){
    console.log('adding player 2 to loby: ' + game.id)
    game.p2socket = player
    startGame(game)
  }else{
    console.log('loby is full')
    player.emit('noGame', {failed:'failed'})
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

function createGameNew(player: socketio.Socket, lobyId: string): Game{

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




//Database stuff

import admin from 'firebase-admin';
import { CANCELLED } from 'dns';
import { create } from 'domain';
const serviceAccount = require('../public/privatekey.json');
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://tictactoe-c2eec-default-rtdb.firebaseio.com"
})

//Check if the username exists
async function checkIfUserExists(username: string): Promise<boolean> {
  const database = admin.database();
  const usersRef = database.ref('users');
  
  return new Promise<boolean>((resolve, reject) => {
    usersRef.child(username).once('value')
      .then((snapshot) => {
        const user = snapshot.val();
        console.log(user);
        if (user) {
          console.log("Username already exists");
          resolve(true);
        } else {
          resolve(false);
        }
        resolve(false);
      })

      .catch((error) => {
        console.error("Error checking if user exists: ", error);
        reject(error);
      });
  });
}


// function signUp(username: string, password: string, res: express.Response): boolean{

//   signUpSubmitted(username, password, res);
//   return true;
// }


// function signUpSubmitted(username: string, password: string, res: express.Response) {

//   const database = admin.database();
//   const usersRef = database.ref('users');
  
//   // Check if the username already exists
//   const handler = usersRef.child(username).on('value', (snapshot) => {
//     usersRef.child(username).off('value', handler); // Detach the listener immediately
//     const user = snapshot.val();
//     console.log(user)
//     if (user) {
//       // Username already exists, show an error message to the user
//       console.log("Username already exists");
//     } else {
//       // Username is available, add it to the database
//       const { hashedString: cookie, salt: cookieSalt } = createCookie();
//       const theSalt = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
//       const { hashedPassword, salt: passwordSalt } = hashPassword(password, theSalt);

//       const newUserRef = usersRef.child(username);
//       newUserRef.set({
//         cookie,
//         cookieSalt,
//         username,
//         password: hashedPassword,
//         passwordSalt,
//       })
//         .then(() => {
//           // Redirect the user to the index.html page
//           console.log("User data added to database successfully");
//           res.cookie('auth', `${cookieSalt}:${cookie}`, { maxAge: 24 * 60 * 60 * 1000 });
//         })
//         .catch((error) => {
//           console.error("Error adding user data to database: ", error);
//         });
//     }
//   });
// }

function createCookie() {
  const cookieValue = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  return cookieValue
}


function createHash(password: string, salt: string) : string{
  // Concatenate the password and salt
  const saltedPassword = password + salt;

  // Hash the salted password using SHA256 algorithm
  const hash = crypto.createHash('sha256');
  hash.update(saltedPassword);
  const hashedPassword = hash.digest('hex');

  return hashedPassword;
}

function createUser(username: string, password: string, cookie: string){
    //Crate random salt
    const cookieSalt = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    //Create password salt
    const passwordSalt = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    //Hash password
    const hashedPassword = createHash(password, passwordSalt);
    //Hash cookie
    const hashedCookie = createHash(cookie, cookieSalt);


    const database = admin.database();
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
        // Add user to the leaderboard with 0 wins
        const leaderboardRef = database.ref('leaderboard');
        leaderboardRef.child(username).set(0)
          .then(() => {
            // Redirect the user to the index.html page
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

//Life cycle

// 1. User signs up
// 2. Api gets called
// 3. generate random cookie/salt pair and store it in variable
// 4. add username, cookie, salt, password, password salt to database
// 5. send cookie to client


async function loggedInAs(cookie: string): Promise<string | null> {
  const database = admin.database();
  const usersRef = database.ref('users');
  
  return new Promise<string | null>((resolve, reject) => {
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
}

async function incrementWin(cookie: string){
  const username = await loggedInAs(cookie);
  console.log('Increment win for ' + username)

  //Increment the leaderboard for the user, if user is not in the leaderboard collection, add them and set wins to 1. Username: wins
  const database = admin.database();
  const leaderboardRef = database.ref('leaderboard');
  if (username != null) {
    const userRef = leaderboardRef.child(username);
    userRef.once('value')
      .then((snapshot) => {
        const user = snapshot.val();
        if (user) {
          // User is already in the leaderboard, increment the wins
          userRef.set(parseInt(user) + 1);
        } else {
          // User is not in the leaderboard, add them
          userRef.set(1);
        }
      })

  }

}


type LeaderboardEntry = {
  username: string;
  wins: number;
}

//Get wins into a list of objects
async function getLeaderboard(): Promise<LeaderboardEntry[]> {
  console.log('Getting leaderboard');
  const database = admin.database();
  const leaderboardRef = database.ref('leaderboard');

  return new Promise<LeaderboardEntry[]>((resolve, reject) => {
    leaderboardRef.once('value')
      .then((snapshot) => {
        const leaderboard: LeaderboardEntry[] = [];
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
        leaderboard.sort((a, b) => b.wins - a.wins); // sort by wins in descending order
        resolve(leaderboard);
      })
      .catch((error) => {
        console.error("Error getting leaderboard: ", error);
        reject(error);
      });
  });
}