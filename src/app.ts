import express from 'express';
import socketio from 'socket.io';
import http from 'http';

const app = express();
const server = http.createServer(app);

const io = new socketio.Server(server);

app.use(express.static('public/'));

io.on('connection', (socket: socketio.Socket) => {
  console.log('A client connected!');

  // Handle socket events here
  socket.on('my-event', (data: any) => {
    console.log(`Received data: ${data}`);
  });

  // Send data to the client
  socket.emit('my-event', 'Hello, client!');
});


server.listen(8080, function () {
  console.log('Your app is listening on port 8080');
});
