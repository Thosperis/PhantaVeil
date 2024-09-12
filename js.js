document.addEventListener('DOMContentLoaded', () => {
    const socket = io();

    const makeInviteBtn = document.getElementById('makeInvite');
    const joinInviteBtn = document.getElementById('joinInvite');
    const gameSection = document.getElementById('game');
    const menuSection = document.getElementById('menu');
    const board = document.getElementById('board');
    const hand = document.getElementById('hand');
    const inviteDisplay = document.getElementById('inviteDisplay');
    const playerList = document.getElementById('playerList');
    const statusMessage = document.getElementById('statusMessage');
    const startGameBtn = document.getElementById('startGame');
    const inviteCodeInput = document.getElementById('inviteCode');
    const submitInviteBtn = document.getElementById('submitInviteCode');

    let isCreator = false; // Track if the user is the game creator
    let hasJoinedLobby = false; // Track if the user has joined a lobby

    makeInviteBtn.addEventListener('click', () => {
        socket.emit('createInvite');
    });

    joinInviteBtn.addEventListener('click', () => {
        if (!hasJoinedLobby) {
            menuSection.style.display = 'none';
            gameSection.style.display = 'block';
        }
    });

    submitInviteBtn.addEventListener('click', () => {
        const code = inviteCodeInput.value.trim();
        if (code && !hasJoinedLobby) {
            socket.emit('joinInvite', code);
        } else {
            alert('Please enter a valid invite code or you are already in a lobby.');
        }
    });

    startGameBtn.addEventListener('click', () => {
        const inviteCode = inviteDisplay.textContent.split(': ')[1];
        socket.emit('startGame', inviteCode);
    });

    socket.on('inviteCreated', (code) => {
        menuSection.style.display = 'none';
        gameSection.style.display = 'block';
        inviteDisplay.textContent = `Invite Code: ${code}`;
        isCreator = true; // Mark this user as the creator
        hasJoinedLobby = true; // Mark this user as having joined a lobby
        // Hide the join section for the creator
        document.querySelector('.invite-code').style.display = 'none';
    });

    socket.on('updatePlayers', (players) => {
        playerList.innerHTML = '';
        players.forEach(player => {
            const playerElement = document.createElement('div');
            playerElement.textContent = player;
            playerList.appendChild(playerElement);
        });
        checkGameStartCondition(players.length);
    });

    socket.on('invalidInvite', () => {
        alert('Invalid invite code!');
    });

    socket.on('gameStarted', () => {
        startGame();
    });

    socket.on('joinedLobby', () => {
        hasJoinedLobby = true; // Mark that this user has joined a lobby
        // Hide the join section once joined
        document.querySelector('.invite-code').style.display = 'none';
    });

    function checkGameStartCondition(playerCount) {
        if (playerCount >= 2 && isCreator) {
            statusMessage.style.display = 'none';
            startGameBtn.style.display = 'block';
        } else {
            statusMessage.style.display = 'block';
            startGameBtn.style.display = 'none';
        }
    }

    function startGame() {
        statusMessage.style.display = 'none';
        startGameBtn.style.display = 'none';
        board.style.display = 'grid';
        hand.style.display = 'flex';

        console.log('Game started!');
        initializeGameBoard();
    }

    function initializeGameBoard() {
        const dominoImages = [
            'images/domino1.png',
            'images/domino2.png',
            // Add paths to all your domino images here
        ];

        dominoImages.forEach(imgSrc => addDominoToBoard(imgSrc));
    }

    function addDominoToBoard(imgSrc) {
        const dominoElement = document.createElement('img');
        dominoElement.className = 'domino';
        dominoElement.src = imgSrc;
        board.appendChild(dominoElement);
    }
});
