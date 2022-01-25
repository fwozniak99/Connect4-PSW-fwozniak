import { useParams } from 'react-router-dom';
import { useState, useEffect } from 'react';
import axios from 'axios';
import mqtt from 'mqtt';
const port = 8080;


function Game() {
    let { id } = useParams();

    return (
        <div>
            Game {id}
        </div>
    )
}

export default Game;