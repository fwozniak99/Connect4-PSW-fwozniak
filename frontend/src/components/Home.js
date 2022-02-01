import { useState, useEffect } from 'react';
import axios from 'axios';
import mqtt from 'mqtt';
import { Link } from 'react-router-dom';
import { Button, Pagination, TextField } from '@mui/material';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import './Home.scss';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
const port = 8080;


function Home() {
    const [ games, setGames ] = useState([]);
    const [ client, setClient ] = useState(null);
    const [ currentPage, setCurrentPage ] = useState(1);
    const gamesPerPage = 4;
    const [ visible, setVisible ] = useState(false);
    const [ nameTaken, setNameTaken ] = useState(false);
    const [ name, setName ] = useState('');
    const [ password, setPassword ] = useState('');
    const [ wrongCredentials, setWrongCredentials] = useState(false);
    const [ newName, setNewName ] = useState('');
    const [ newPassword, setNewPassword ] = useState('');


    useEffect(() => {
        setClient(mqtt.connect('ws://localhost:8000'));
    }, [])

    useEffect(() => {
        if(client) {
            client.on('connect', () => {
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

    const sendUser = () => {
        axios.post(`http://localhost:${port}/users/add`, { newName, newPassword}).then((res) => {
            setNameTaken(!res.data.wasUserAdded);
        }).catch(err => console.log(err));
    };

    const login = () => {
        axios.post(`http://localhost:${port}/users/login`, { name, password }).then((res) => {
            setVisible(res.data.loggedIn);
            setWrongCredentials(!res.data.loggedIn);
        }).catch(err => console.log(err));
    }

    const indexOfLastGame = currentPage * gamesPerPage;
    const indexOfFirstGame = indexOfLastGame - gamesPerPage;
    const displayedGames = games.slice(indexOfFirstGame, indexOfLastGame)

    return (
        <div>
            <h2>CONNECT4 GAME</h2>
            { !visible ?
                <div className="registerAndLoginForms">    
                    {!nameTaken ? 
                        <div>
                            <h3>Add User</h3>
                            <div className="inputsContainer">
                                <TextField
                                        onChange={(e) => setNewName(e.target.value)}
                                        value={newName}
                                        label="Choose name..." variant="outlined"
                                    />
                                <TextField
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        value={newPassword}
                                        label="Choose password..." variant="outlined"
                                        type="password"
                                    />
                            </div>
                            <Button onClick={() => sendUser()}>Confirm</Button>
                        </div>
                        :
                        <div>
                            <h3>Add User</h3>
                            <div className="inputsContainer">
                                <TextField
                                        onChange={(e) => setNewName(e.target.value)}
                                        value={newName}
                                        error
                                        label="Name is taken..." variant="outlined"
                                    />
                                <TextField
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        value={newPassword}
                                        label="Choose password..." variant="outlined"
                                        type="password"
                                    />
                            </div>
                            <Button onClick={() => sendUser()}>Confirm</Button>
                        </div>
                    }
                    {
                        !wrongCredentials ? 
                            <div>
                                <h3>Login</h3>
                                <div className="inputsContainer">
                                    <TextField
                                        onChange={(e) => setName(e.target.value)}
                                        value={name}
                                        label="Type your name..." variant="outlined"
                                    />
                                    <TextField
                                        onChange={(e) => setPassword(e.target.value)}
                                        value={password}
                                        label="Type password..." variant="outlined"
                                        type="password"
                                    />
                                </div>
                                <Button onClick={() => login()}>Confirm</Button>
                            </div>
                            :
                            <div>
                                <h3>Login</h3>
                                <div className="inputsContainer">
                                    <TextField
                                        onChange={(e) => setName(e.target.value)}
                                        value={name}
                                        error
                                        label="Wrong credentials..." variant="outlined"
                                    />
                                    <TextField
                                        onChange={(e) => setPassword(e.target.value)}
                                        value={password}
                                        error
                                        label="Wrong credentials..." variant="outlined"
                                        type="password"
                                    />
                                </div>
                                <Button onClick={() => login()}>Confirm</Button>
                            </div>
                    }
                </div>
                :
                <div>
                    <Button onClick={() => {createNewGame()}} variant="contained" startIcon={<AddCircleOutlineIcon/>}>Create a new game</Button>
                    <h3 id="gamesTypography">List of games</h3>
                    <div className="listContainer">
                        {displayedGames && displayedGames.map(game => {
                            return (
                            <div key={game.id} className="roomContainer">
                                <Link to={`/games/${game.id}`} state={{ name: name }}>ENTER GAME</Link>
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
                </div>}
        </div>
    )
}

export default Home;