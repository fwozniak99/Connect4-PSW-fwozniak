import { useState, useEffect } from 'react';
import axios from 'axios';
import mqtt from 'mqtt';
import { Link } from 'react-router-dom';
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

    return (
        <div>
            CONNECT 4 ROOMS
            {games && games.map(game => {
                return (
                <div key={game.id}>
                    <Link to={`/games/${game.id}`}>{game.id}</Link>
                </div>
                )}
            )}
        </div>
    )
}

export default Home;