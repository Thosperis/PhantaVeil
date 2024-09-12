const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

let gameSessions = {}; // Stores active game sessions with invite codes

// Serve static files from the specified directory
app.use(express.static('/var/www/PHANTAVEIL'));

// Route to serve the main page
app.get('/', (req, res) => {
    res.sendFile(path.join('/var/www/PHANTAVEIL', 'index.html'));
});

// Socket.io connection handler
io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);

    // Handle creating a new invite code
    socket.on('createInvite', () => {
        const inviteCode = generateInviteCode();
        gameSessions[inviteCode] = {
            creator: socket.id,
            players: [socket.id]
        };

        socket.join(inviteCode);
        socket.emit('inviteCreated', inviteCode);
        io.to(inviteCode).emit('updatePlayers', getPlayers(inviteCode));
    });

    // Handle joining an existing game with invite code
    socket.on('joinInvite', (inviteCode) => {
        if (gameSessions[inviteCode]) {
            gameSessions[inviteCode].players.push(socket.id);
            socket.join(inviteCode);
            socket.emit('joinedLobby'); // Notify the client that they have joined a lobby
            io.to(inviteCode).emit('updatePlayers', getPlayers(inviteCode));
        } else {
            socket.emit('invalidInvite');
        }
    });

    // Handle starting the game, only allowed by creator
    socket.on('startGame', (inviteCode) => {
        if (gameSessions[inviteCode] && gameSessions[inviteCode].creator === socket.id) {
            io.to(inviteCode).emit('gameStarted');
        }
    });

    // Handle disconnection
    socket.on('disconnect', () => {
        console.log('A user disconnected:', socket.id);
        // Clean up any sessions or players when a user disconnects
        for (let code in gameSessions) {
            const index = gameSessions[code].players.indexOf(socket.id);
            if (index !== -1) {
                gameSessions[code].players.splice(index, 1);
                io.to(code).emit('updatePlayers', getPlayers(code));
                if (gameSessions[code].players.length === 0) {
                    delete gameSessions[code]; // Remove empty sessions
                }
                break;
            }
        }
    });
});

// Helper functions
function generateInviteCode() {
    return Math.random().toString(36).substring(2, 10).toUpperCase();
}

function getPlayers(inviteCode) {
    return gameSessions[inviteCode].players.map((player, index) => `user${index + 1}`);
}

// Start the server
const PORT = 3001;
server.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
