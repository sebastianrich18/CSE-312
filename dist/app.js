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
const io = new socket_io_1.default.Server(server);
app.use(express_1.default.static('public/'));
io.on('connection', (socket) => {
    console.log('A client connected!');
    socket.on('my-event', (data) => {
        console.log(`Received data: ${data}`);
    });
    socket.emit('my-event', 'Hello, client!');
});
server.listen(8080, function () {
    console.log('Your app is listening on port 8080');
});
//# sourceMappingURL=app.js.map