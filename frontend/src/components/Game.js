import { useParams } from 'react-router-dom';
import { useState, useEffect } from 'react';
import axios from 'axios';
import mqtt from 'mqtt';
import './Game.scss';
const port = 8080;


function Game() {
    let { id } = useParams();
    const [ board, setBoard ] = useState([]);
    const [ client, setClient ] = useState(null);

    useEffect(() => {
        setClient(mqtt.connect('ws://localhost:8000'));
    }, [])

    useEffect(() => {
        if(client) {
            client.on('connect', () => {
                console.log("connected")
                client.subscribe('/games');
            })

            getBoard();

            client.on('message', (topic, message) => {
                if (topic.toString() === '/games') {
                    getBoard();
                }
            });
        }

    }, [client])

    const getBoard = () => {
        axios.get(`http://localhost:${port}/games/${id}/board`).then((res) => {
            setBoard(res.data.board);
            console.log(res.data.board);
        }).catch(err => console.log(err));
    }

    return (
        <div className="pageContainer">
            <h2>Game {id}</h2>
            <div className="gameContainer">
                {board && board.map((col) => {
                    return col.map((row, id) => {
                        return (
                            <div key={id} className="tokenContainer" style={row===1 ? {backgroundColor: "#FFBF00"} : row===2 ? {backgroundColor: "#EE4B2B"} : {backgroundColor: "#6495ED"}}>
                            </div>
                        )
                    })
                })}
            </div>
        </div>
    )
}

export default Game;