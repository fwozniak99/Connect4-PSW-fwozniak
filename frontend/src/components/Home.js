import { useState, useEffect } from 'react';
import axios from 'axios';
import mqtt from 'mqtt';
import { Link } from 'react-router-dom';
import { Button, Pagination } from '@mui/material';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import './Home.scss';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
const port = 8080;


function Home() {
    const [ games, setGames ] = useState([]);
    const [ client, setClient ] = useState(null);
    const [ currentPage, setCurrentPage ] = useState(1);
    const gamesPerPage = 4;


    useEffect(() => {
        setClient(mqtt.connect('ws://localhost:8000'));
    }, [])

    useEffect(() => {
        if(client) {
            client.on('connect', () => {
                console.log("connected")
                client.subscribe('/games');
                client.subscribe('/games/delete');
            })

            getAllGames();

            client.on('message', (topic, message) => {
                if (topic.toString() === '/games') {
                    getAllGames();
                }
                if (topic.toString() === '/games/delete') {
                    getAllGames();
                    //const deletedGameId = JSON.parse(message.toString())
                    //setGames(games.filter(game => game.id !== deletedGameId));
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

    const deleteGame = (id) => {
        axios.delete(`http://localhost:${port}/games/${id}`)
        .catch(error => console.log(error));
    }

    const indexOfLastGame = currentPage * gamesPerPage;
    const indexOfFirstGame = indexOfLastGame - gamesPerPage;
    const displayedGames = games.slice(indexOfFirstGame, indexOfLastGame)

    return (
        <div>
            <h2>CONNECT4 GAME</h2>
            <Button onClick={() => {createNewGame()}} variant="contained" startIcon={<AddCircleOutlineIcon/>}>Create a new game</Button>
            <h3 id="gamesTypography">List of games</h3>
            <div className="listContainer">
                {displayedGames && displayedGames.map(game => {
                    return (
                    <div key={game.id} className="roomContainer">
                        <Link to={`/games/${game.id}`}>ENTER GAME</Link>
                        <p>id: {game.id}</p>
                        <Button onClick={() => deleteGame(game.id)} className="deleteButton">
                            <DeleteOutlineIcon className="deleteIcon"/>
                        </Button>
                    </div>
                    )}
                )}
            </div>
            <div id="paginationContainer">
                    <Pagination color="primary" count={ Math.ceil(games.length / gamesPerPage) } siblingCount={0} onChange={(event, value) => {setCurrentPage(value)}} />
            </div>
        </div>
    )
}

export default Home;