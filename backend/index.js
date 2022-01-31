const express = require('express');
const app = express();
const { v4: uuidv4 } = require('uuid');
const cors = require('cors');

app.use(express.json());
app.use(cors());
const port = 8080;

const mqtt = require('mqtt');
const client = mqtt.connect('ws://localhost:8000');

let allGames = [];

class Game {
    constructor(id) {
        this.id = id;
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

app.get('/games', (req, res) => {
    try {
        res.send({ games: allGames });
    } catch(err) {
        console.log(err);
        res.send({ err: err.message });
    }
})

app.post('/games', (req, res) => {
    try {
        const id = uuidv4();

        allGames.push(new Game(id));
        client.publish('/games', id);

        res.send({ newGame: id });
    } catch(err) {
        console.log(err);
        res.send({ err: err.message });
    }
})

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
            client.publish(`/status/${id}`, JSON.stringify({ active: true }));
        }

        res.send({ wasPlayerAdded: true });

    } catch(err) {
        console.log(err);
        res.send({ err: err.message });
    }
});

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

app.post('/games/:id', (req, res) => {
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
        }

        res.send({ wasMoveMade: true });
    } catch(err) {
        console.log(err);
        res.send({ err: err.message });
    }
});

app.get('/games/:id', (req, res) => {
    try {
        const id = req.params.id;
        const game = allGames.find(game => id === game.id);

        res.send({ player1: game.player1, player2: game.player2});
    } catch(err) {
        console.log(err);
        res.send({ err: err.message });
    }
});

app.listen(port, () => {
    console.log(`Listening on port ${port}`);
});