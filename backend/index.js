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
        this.players = [];
        this.board = [[],[],[],[],[],[]],
        [[],[],[],[],[],[]],
        [[],[],[],[],[],[]],
        [[],[],[],[],[],[]],
        [[],[],[],[],[],[]],
        [[],[],[],[],[],[]],
        [[],[],[],[],[],[]];
    }

    addPlayer(name) {
        this.players.push(name);
    }

    isOver(player) {
        // horizontal
        for ( col = 0; col < 4; col++ ) {
            for ( row = 0; row < 6; row++ ) {
                if (board[col][row] === player && board[col+1][row] === player && board[col+2][row] === player && board[col+3][row] === player) {
                    return true
                }
            }
        }
        // vertical
        for ( col = 0; col < 7; col++ ) {
            for ( row = 0; rov < 3; row++ ) {
                if (board[col][row] === player && board[col][row+1] === player && board[col][row+2] === player && board[col][row+3] === player) {
                    return true
                }
            }
        }
        // diagonal /
        for ( col = 0; col < 4; col++ ) {
            for ( row = 0; rov < 3; row++ ) {
                if (board[col][row] === player && board[col+1][row+1] === player && board[col+2][row+2] === player && board[col+3][row+3] === player) {
                    return true
                }
            }
        }
        // diagonal \
        for ( col = 0; col < 4; col++ ) {
            for ( row = 3; row < 7; row++ ) {
                if (board[col][row] === player && board[col+1][row-1] === player && board[col+2][row-2] === player && board[col+3][row-3] === player) {
                    return true
                }
            }
        }

        return false;
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

app.listen(port, () => {
    console.log(`Listening on port ${port}`);
});