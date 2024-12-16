const express = require('express');
const socketio = require('socket.io');
const cors = require('cors');
const http = require('http');

// Create server
const app = express();
const server = http.Server(app);

// Enable Cors to Socket IO
app.use(cors({origin: '*', credentials: true}));
app.use(express.static('public'))

// Init Socket IO Server
const io = new socketio.Server(server, {
    cors: {
        origins: ['*'],
        handlePreflightRequest: (req, res) => {
            res.writeHead(200, {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Allow-Credentials': true
            })
            res.end()
        }
    },
});

let serverId = null


io.on('connection', (socket) => {
    socket.on('server-connection', (socketId) => {
        serverId = socketId
        console.log('server connection', serverId)
    })

    socket.on('offer', (socketId, description) => {
        socket.to(serverId).emit('offer', socket.id, description);
    });

    // Send Answer From Offer Request
    socket.on('answer', (socketId, description) => {
        socket.to(socketId).emit('answer', description);
    });

    // Send Signals to Establish the Communication Channel
    socket.on('candidate-offer', (signal) => {
        socket.to(serverId).emit('candidate-offer', signal);
    });

    socket.on('candidate-answer', (socketId, signal) => {
        socket.to(socketId).emit('candidate-answer', signal);
    });
});

// Start server in port 3000 or the port passed at "PORT" env variable
server.listen(process.env.PORT || 3000,
    () => console.log('Server Listen On: *:', process.env.PORT || 3000));

