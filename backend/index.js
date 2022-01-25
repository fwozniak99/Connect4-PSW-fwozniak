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
        [[],[],[],[],[],[]]
    }

}

app.listen(port, () => {
    console.log(`Listening on port ${port}`);
});