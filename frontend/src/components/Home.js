import { useState, useEffect } from 'react';
import axios from 'axios';
import mqtt from 'mqtt';
import { Link } from 'react-router-dom';
import Button from '@mui/material/Button';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import './Home.scss';
const port = 8080;


function Home() {
    const [ games, setGames ] = useState([]);
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

            getAllGames();

            client.on('message', (topic, message) => {
                if (topic.toString() === '/games') {
                    getAllGames();
                }
            });
        }

    }, [client])

    const getAllGames = () => {
        axios.get(`http://localhost:${port}/games`).then((res) => {
            setGames(res.data.games);
        }).catch(err => console.log(err));
    }

    const createNewGame = () => {
        axios.post(`http://localhost:${port}/games`)
        .catch(error => console.log(error));
    }

    return (
        <div>
            <h2>CONNECT4 GAME</h2>
            <Button onClick={() => {createNewGame()}} variant="contained" startIcon={<AddCircleOutlineIcon/>}>Create a new game</Button>
            <h3 id="gamesTypography">List of games</h3>
            <div className="listContainer">
                {games && games.map(game => {
                    return (
                    <div key={game.id} className="roomContainer">
                        <Link to={`/games/${game.id}`}>ENTER GAME</Link>
                        <p>id: {game.id}</p>
                    </div>
                    )}
                )}
            </div>
        </div>
    )
}

export default Home;