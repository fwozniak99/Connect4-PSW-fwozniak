import { useParams } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { TextField } from '@mui/material';
import InputAdornment from '@mui/material/InputAdornment';
import AccountCircle from '@mui/icons-material/AccountCircle';
import SendIcon from '@mui/icons-material/Send';
import Button from '@mui/material/Button';
import axios from 'axios';
import mqtt from 'mqtt';
import './Game.scss';
const port = 8080;


function Game() {
    let { id } = useParams();
    const [ board, setBoard ] = useState([]);
    const [ client, setClient ] = useState(null);
    const [ player1, setPlayer1 ] = useState(null);
    const [ player2, setPlayer2 ] = useState(null);
    const [ status, setStatus ] = useState();
    const [ turn, setTurn ] = useState();
    const [ name, setName ] = useState('');
    const [ visible, setVisible ] = useState(false);
    const [ nameTaken, setNameTaken ] = useState(false);

    useEffect(() => {
        setClient(mqtt.connect('ws://localhost:8000'));
    }, [])

    useEffect(() => {
        if(client) {
            client.on('connect', () => {
                console.log("connected")
                client.subscribe(`/move/${id}`);
            })

            getBoard();

            client.on('message', (topic, message) => {
                if (topic.toString() === `/move/${id}`) {
                    const newBoard = JSON.parse(message.toString());
                    setBoard(newBoard.board);
                    setTurn(newBoard.turn);
                } else if (topic.toString() === `/addPlayers/${id}`) {
                    const player = JSON.parse(message.toString());
                    if (player.player1) {
                        setPlayer2(player.player2);
                    } else {
                        setPlayer1(player.player1);
                    }
                } else if (topic.toString() === `/status/${id}`) {
                    const status = JSON.parse(message.toString());
                    setTurn(status.turn);
            };
            });
        }

    }, [client, id])

    const getBoard = () => {
        axios.get(`http://localhost:${port}/games/${id}/board`).then((res) => {
            setBoard(res.data.board);
            console.log(res.data.board);
        }).catch(err => console.log(err));
    }

    const makeMove = (player, col) => {
        axios.post(`http://localhost:${port}/games/${id}`, { player, col })
            .catch(err => console.log(err));
    };

    const sendPlayer = () => {
        axios.post(`http://localhost:${port}/games/${id}/add`, { name }).then((res) => {
            setNameTaken(!res.data.wasParticipantAdded);
            setVisible(res.data.wasParticipantAdded);
        }).catch(err => console.log(err));
    };


    return (
        <div className="pageContainer">
            <h2>Game {id}</h2>
            <div className="gameAndChatContainer">
                { !visible ?
                <div>    
                    <TextField
                            onChange={(e) => setName(e.target.value)}
                            value={name}
                            label="Type your name..." variant="outlined"
                        />
                    <Button onClick={() => sendPlayer()}>Confirm</Button>
                </div>
                :
                <div>
                    <div className="gameContainer">
                            {board && board.map((col, n) => {
                                return col.map((el, id) => {
                                    return (
                                        <div key={id} onClick={() => {makeMove(1, n)}} className="tokenContainer" style={el===1 ? {backgroundColor: "#FFBF00"} : el===2 ? {backgroundColor: "#EE4B2B"} : {backgroundColor: "#6495ED"}}>
                                        </div>
                                    )
                                })
                            })}
                        </div>
                        <div className="chatbox">
                            <h3>Chat</h3>
                            <div>
                                <TextField
                                    label="Send message"
                                    id="filled-start-adornment"
                                    sx={{ m: 2, width: '25ch' }}
                                    InputProps={{
                                        startAdornment: <InputAdornment position="start"><AccountCircle /></InputAdornment>,
                                    }}
                                    variant="filled"
                                    />
                                <Button>
                                    <SendIcon/>
                                </Button>
                            </div>
                        </div>
                </div>
                }
            </div>
        </div>
    )
}

export default Game;