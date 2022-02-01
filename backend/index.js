const express = require('express');
const app = express();
const { v4: uuidv4 } = require('uuid');
const cors = require('cors');
const bcrypt = require('bcrypt');
const SimpleNodeLogger = require("simple-node-logger");
opts = {
    logFilePath:'mylogfile.log',
    timestampFormat:'YYYY-MM-DD HH:mm:ss.SSS'
}

const logger = SimpleNodeLogger.createSimpleLogger(opts);

app.use(express.json());
app.use(cors());
const port = 8080;

const mqtt = require('mqtt');
const client = mqtt.connect('ws://localhost:8000');

let allGames = [];
let allUsers = [];

class Game {
    constructor(id, roomName) {
        this.id = id;
        this.roomName = roomName;
        this.participants = [];
        this.board = [ [0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0] ];
        this.player1 = null;
        this.player2 = null;
        this.over = false;
        this.turn = 1;
        this.winner = null;
        this.comments = [];
        this.status = false;
    }

    addParticipant(name) {
        this.participants.push(name);
    }

    isOver(player) {
        // horizontal
        for ( let col = 0; col < 4; col++ ) {
            for ( let row = 0; row < 6; row++ ) {
                if (this.board[col][row] === player && this.board[col+1][row] === player && this.board[col+2][row] === player && this.board[col+3][row] === player) {
                    return true
                }
            }
        }
        // vertical
        for ( let col = 0; col < 7; col++ ) {
            for ( let row = 0; row < 3; row++ ) {
                if (this.board[col][row] === player && this.board[col][row+1] === player && this.board[col][row+2] === player && this.board[col][row+3] === player) {
                    return true
                }
            }
        }
        // diagonal /
        for ( let col = 0; col < 4; col++ ) {
            for ( let row = 0; row < 3; row++ ) {
                if (this.board[col][row] === player && this.board[col+1][row+1] === player && this.board[col+2][row+2] === player && this.board[col+3][row+3] === player) {
                    return true
                }
            }
        }
        // diagonal \
        for ( let col = 0; col < 4; col++ ) {
            for ( let row = 3; row < 7; row++ ) {
                if (this.board[col][row] === player && this.board[col+1][row-1] === player && this.board[col+2][row-2] === player && this.board[col+3][row-3] === player) {
                    return true
                }
            }
        }

        return false;
    }

    checkIfMoveValid(col) {
        return this.board[col][0] === 0;
    }

    makeMove(col, player, row) {
        this.board[col][row] = player;
        if (player !== 0) {
            if (this.turn === 1) {
                this.turn = 2;
            } else {
                this.turn = 1;
            }
        }
        client.publish(`/move/${this.id}`, JSON.stringify({ board: this.board, turn: this.turn }));
    }

    getAvailableRow(col) {
        for ( let i = 5; i >= 0; i-- ) {
            if (this.board[col][i] === 0) {
                return i;
            }
        }
    }
}

//GET /users - getting users
app.get('/users', (req, res) => {
    try {
        logger.info('succesful GET /users request');
        res.send({ users: allUsers })
    } catch(err) {
        console.log(err);
        logger.error('unsuccesful GET /users request');
        res.send({ err: err.message });
    }
})

//POST /users/add - registering
app.post('/users/add', async (req, res) => {
    try {
        const { newName, newPassword } = req.body;
        const usernames = allUsers.map(user => user["name"])
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        client.publish('/users', JSON.stringify({ newName, hashedPassword }));
        
        if (usernames.includes(newName)) {
            logger.info('successful POST /users/add request, user not added');
            res.send({ wasUserAdded: false });
        } else if (newName==="" || newPassword==="") {
            logger.info('successful POST /users/add request, user not added');
            res.send({ wasUserAdded: false });
        } else {
            allUsers.push({name: newName, password: hashedPassword});
            logger.info('successful POST /users/add request, user added');
            console.log(allUsers);
            res.send({ wasUserAdded: true });
        }
    } catch(err) {
        console.log(err);
        logger.error('unsuccessful POST /users/add request');
        res.send({ err: err.message });
    }
})


//POST /users/login - logging in
app.post('/users/login', async (req, res) => {
    try {
        const { name, password } = req.body;
        const ourUser = allUsers.find(user => user["name"] === name);
        if (ourUser === null || !name || !password ) {
            logger.info('successful POST /users/login request, user not logged');
            res.send({ loggedIn: false });
        } else if (await bcrypt.compare(password, ourUser["password"])){
            logger.info('successful POST /users/login request, user logged in');
            res.send({ loggedIn: true });
        } else {
            logger.info('successful POST /users/login request, user not logged');
            res.send({ loggedIn: false });
        }
    } catch(err) {
        console.log(err);
        logger.error('unsuccessful POST /users/login request');
        res.send({ err: err.message });
    }
})

//DELETE /users - deleting an user
app.delete('/users/:name', (req, res) => {
    try {
        const name = req.params.name;
        const newUsers = allUsers.filter(user => user["name"] !== name);
        allUsers = newUsers;
        logger.info('successful DELETE /users/:name request, user deleted');
        logger.info('subscription to /users/delete at', new Date().toJSON());
        client.publish('/users/delete', name);
        res.send({ deletedUser: name });
    } catch(err) {
        console.log(err);
        logger.error('unsuccessful DELETE /users/:name request');
        res.send({ err: err.message });
    }
})

//PUT /users/:name - editing user's name
app.put('/users/:name', (req, res) => {
    try {
        const name = req.params.name;
        const { newName } = req.body;
        const userIndex = allUsers.findIndex((obj => obj["name"] === name));
        const canAdd = allUsers.filter(user => user["name"] === (newName));
        if (canAdd.length === 0) {
            allUsers[userIndex]["name"] = newName;
            logger.info('subscription to /users at', new Date().toJSON());
            logger.info('successful PUT /users/:name request, user edited');
            client.publish('/users');
            res.send({ editedUser: name });
        }
    } catch(err) {
        console.log(err);
        logger.info('unsuccessful PUT /users/:name request');
        res.send({ err: err.message });
    }
})

//GET /games - getting rooms(games)
app.get('/games', (req, res) => {
    try {
        res.send({ games: allGames });
    } catch(err) {
        console.log(err);
        res.send({ err: err.message });
    }
})

//POST /games - adding rooms(games)
app.post('/games', (req, res) => {
    try {
        const id = uuidv4();
        const { roomName } = req.body;

        allGames.push(new Game(id, roomName));
        client.publish('/games', id, roomName);

        res.send({ newGame: id });
    } catch(err) {
        console.log(err);
        res.send({ err: err.message });
    }
})

//DELETE /games/:id - deleting rooms(games)
app.delete('/games/:id', (req, res) => {
    try {
        const id = req.params.id;
        const newGames = allGames.filter(game => id !== game.id);
        allGames = newGames;
        client.publish('/games/delete', id);

        res.send({ deltedGameId: id });
    } catch(err) {
        console.log(err);
        res.send({ err: err.message });
    }
})

//PUT /games/:id - editing a room(game) name
app.put('/games/:id', (req, res) => {
    try {
        const { newRoomName } = req.body;
        const id = req.params.id;
        const game = allGames.find(game => id === game.id);
        game.roomName = newRoomName;
        client.publish('/games', id);

        res.send({ editedGameId: id });
    } catch(err) {
        console.log(err);
        res.send({ err: err.message });
    }
})

// GET /games/:id/board - getting Game board
app.get('/games/:id/board', (req, res) => {
    try {
        const id = req.params.id;
        const game = allGames.find(game => id === game.id);
        res.send({ board: game ? game.board : []});
    } catch(err) {
        console.log(err);
        res.send({ err: err.message });
    }
})

//GET /games/:id - getting whole Game
app.get('/games/:id', (req, res) => {
    try {
        const id = req.params.id;
        const game = allGames.find(game => id === game.id);

        res.send({ player1: game.player1, player2: game.player2, winner: game.winner, turn: game.turn, status: game.status });
    } catch(err) {
        console.log(err);
        res.send({ err: err.message });
    }
});


//POST /games/:id/add - adding Participant
app.post('/games/:id/add', (req, res) => {
    try {
        const id = req.params.id;
        const name = req.body.name;
        const game = allGames.find(game => id === game.id);

        if (!game.participants.includes(name)) {
            game.addParticipant(name);
            client.publish(`/results/${id}`, JSON.stringify({ winner: game.winner }))
            res.send({ wasParticipantAdded: true });
        } else {
            res.send({ wasParticipantAdded: false });
        }
    } catch(err) {
        console.log(err);
        res.send({ err: err.message });
    }
});

//POST /games/:id/play - adding Player
app.post('/games/:id/play', (req, res) => {
    try {
        const id = req.params.id;
        const { player1, player2, color } = req.body;
        const game = allGames.find(game => id === game.id);

        if (player1) {
            game.player1 = player1;
        } else {
            game.player2 = player2;
        }
        
        client.publish(`/addplayers/${id}`, JSON.stringify({ player1, player1color: 1, player2, player2color: 2 }));

        if( game.player1 && game.player2 ) {
            game.status = true;
            client.publish(`/status/${id}`, JSON.stringify({ active: game.status }));
        }

        res.send({ wasPlayerAdded: true });

    } catch(err) {
        console.log(err);
        res.send({ err: err.message });
    }
});

// PUT /games/:id - making a move in the Game
app.put('/games/:id/move', (req, res) => {
    try {
        const id = req.params.id;
        const { player, col } = req.body;
        const game = allGames.find(game => id === game.id);

        if (game.checkIfMoveValid(col)) {
            game.makeMove(col, player, game.getAvailableRow(col));
            if(game.isOver(player)) {
                game.over = true;
                game.winner = player;
                client.publish(`/results/${id}`, JSON.stringify({ winner: player }))
            };
            let drawCondition = 0;
            for (let i = 0; i<7; i++) {
                if (!game.board[i].includes(0)) {
                    if (game.board[i][0]!==0) {
                        drawCondition++;
                    }
                }
            }
            if (drawCondition === 7) {
                game.winner = 3;
                game.over = true;
                client.publish(`/results/${id}`, JSON.stringify({ winner: game.winner }));
            }
        }

        res.send({ wasMoveMade: true });
    } catch(err) {
        console.log(err);
        res.send({ err: err.message });
    }
});

//GET /comments - getting comments from a game
app.get('/games/:id/comments', (req, res) => {
    try {
        const id = req.params.id;
        const game = allGames.find(game => id === game.id);
        res.send({ comments: game.comments });
    } catch(err) {
        console.log(err);
        res.send({ err: err.message });
    }
})

//POST /games/:id/comment - adding comments to a game
app.post('/games/:id/comment', (req, res) => {
    try {
        const id = req.params.id;
        const game = allGames.find(game => id === game.id);
        const commentId = uuidv4();
        const { name, comment } = req.body;

        game.comments.push([commentId, name, comment]);
        client.publish(`/comments/${id}`, JSON.stringify({allComments: game.comments}));

        res.send({ newComment: commentId });
    } catch(err) {
        console.log(err);
        res.send({ err: err.message });
    }
})

//PUT /games/:id/edit/:commentId - edit a comment
app.put('/games/:id/editComment/:commentId', (req, res) => {
    try {
        const id = req.params.id;
        const commentId = req.params.commentId;
        const game = allGames.find(game => id === game.id);
        const commentId2 = game.comments.findIndex(comment => commentId === comment[0]);
        const { name, comment } = req.body;

        if (commentId2) {
            game.comments[commentId2] = [commentId, name, comment];
            client.publish(`/comments/${id}`, JSON.stringify({allComments: game.comments}));
            res.send({ newComment: commentId });
        }
    } catch(err) {
        console.log(err);
        res.send({ err: err.message });
    }
})

//DELETE /games/:id/delete/:commentId - deleting comments
app.delete('/games/:id/deleteComment/:commentId', (req, res) => {
    try {
        const id = req.params.id;
        const commentId = req.params.commentId;
        const game = allGames.find(game => id === game.id);
        if (game) {
            const newComments = game.comments.filter(comment => commentId !== comment[0]);
            game.comments = newComments;
            client.publish(`/comments/${id}`, JSON.stringify({allComments: game.comments}));
            res.send({ deltedGameId: id });
        }
    } catch(err) {
        console.log(err);
        res.send({ err: err.message });
    }
})

app.listen(port, () => {
    console.log(`Listening on port ${port}`);
});