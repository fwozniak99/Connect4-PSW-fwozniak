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
    const [ status, setStatus ] = useState(false);
    const [ turn, setTurn ] = useState(1);
    const [ name, setName ] = useState('');
    const [ visible, setVisible ] = useState(false);
    const [ nameTaken, setNameTaken ] = useState(false);
    const [ chat, setChat ] = useState([]);
    const [ message, setMessage ] = useState('');

    useEffect(() => {
        setClient(mqtt.connect('ws://localhost:8000'));
    }, [])

    useEffect(() => {
        if(client) {
            client.on('connect', () => {
                console.log("connected")
                client.subscribe(`/move/${id}`);
                client.subscribe(`/addplayers/${id}`);
                client.subscribe(`/chat/${id}`);
                client.subscribe(`/status/${id}`);
            })

            getBoard();

            client.on('message', (topic, message) => {
                if (topic.toString() === `/move/${id}`) {
                    const newBoard = JSON.parse(message.toString());
                    setBoard(newBoard.board);
                    setTurn(newBoard.turn);
                }
                if (topic.toString() === `/addplayers/${id}`) {
                    const player = JSON.parse(message.toString());
                    if (!player.player1) {
                        setPlayer2([player.player2, player.player2color]);
                    } else {
                        setPlayer1([player.player1, player.player1color]);
                    }
                }
                if (topic.toString() === `/status/${id}`) {
                    const status = JSON.parse(message.toString());
                    setStatus(status.active);
                };
                if (topic.toString() === `/chat/${id}`) {
                    setChat([...chat, message.toString()]);
                }
            });
            axios.get(`http://localhost:${port}/games/${id}`)
            .then(res => {
                setPlayer1(res.data.player1);
                setPlayer2(res.data.player2);
            })
            .catch(err => console.log(err));
        }

    }, [client, id, chat])

    const getPlayer = (name) => {
        if (player1) {
            if(player1.includes(name)) {
                return player1[1];
            }
        }
        if (player2) {
            if(player2.includes(name)) {
                return player2[1];
            }
        }
        return 0;
    }

    const getBoard = () => {
        axios.get(`http://localhost:${port}/games/${id}/board`).then((res) => {
            setBoard(res.data.board);
        }).catch(err => console.log(err));
    }

    const makeMove = (player, col) => {
        axios.post(`http://localhost:${port}/games/${id}`, { player, col })
            .catch(err => console.log(err));
    };

    const sendParticipant = () => {
        axios.post(`http://localhost:${port}/games/${id}/add`, { name }).then((res) => {
            setNameTaken(!res.data.wasParticipantAdded);
            setVisible(res.data.wasParticipantAdded);
        }).catch(err => console.log(err));
    };

    const sendPlayer1 = (name) => {
        axios.post(`http://localhost:${port}/games/${id}/play`, { player1: name, color: 1 }).then(() => {
                setPlayer1([name, 1]);
            }).catch(err => console.log(err));
    };

    const sendPlayer2 = (name) => {
        axios.post(`http://localhost:${port}/games/${id}/play`, { player2: name, color: 2 }).then(() => {
                setPlayer2([name, 2]);
            }).catch(err => console.log(err));
    };

    const publishMessage = (message) => {
        client.publish(`/chat/${id}`, name + ": " + message);
    };


    return (
        <div className="pageContainer">
            <h2>Game {id}</h2>
            <div className="mainContainer">
                { !visible ?
                <div>    
                    {!nameTaken ? 
                        <div>
                            <TextField
                                    onChange={(e) => setName(e.target.value)}
                                    value={name}
                                    label="Type your name..." variant="outlined"
                                />
                            <Button onClick={() => sendParticipant()}>Confirm</Button>
                        </div>
                        :
                        <div>
                            <TextField
                                    onChange={(e) => setName(e.target.value)}
                                    value={name}
                                    error
                                    label="Name is taken..." variant="outlined"
                                />
                            <Button onClick={() => sendParticipant()}>Confirm</Button>
                        </div>
                    }
                </div>
                :
                <div className="gameAndChatContainer">
                    <div className="playerButtons">
                        {player1 ? 
                            <div id="yellowTypography">
                                {player1[0]} is yellow!
                            </div> 
                        :
                            <div>
                                <Button
                                    onClick={() => {sendPlayer1(name)}}
                                    id="yellowButton"
                                >
                                    Play as Yellow
                                </Button>
                            </div>}

                        {player2 ? 
                            <div id="redTypography">
                                {player2[0]} is red!
                            </div>
                        :
                        <div>
                            <Button
                                onClick={() => {sendPlayer2(name)}}
                                id="redButton"
                            >
                                Play as Red
                            </Button>
                        </div>}
                    </div>


                    <div>
                        <div className="gameContainer">
                                {board && board.map((col, n) => {
                                    return col.map((el, id) => {
                                        return (
                                            <div key={id} onClick={() => {
                                                if (status === true){
                                                    console.log("turn "+turn);
                                                    if (turn === getPlayer(name)) {
                                                        makeMove(getPlayer(name), n);
                                                    }
                                                }
                                                }} className="tokenContainer" style={el===1 ? {backgroundColor: "#FFBF00"} : el===2 ? {backgroundColor: "#EE4B2B"} : {backgroundColor: "#6495ED"}}>
                                            </div>
                                        )
                                    })
                                })}
                            </div>
                            <div className="chatbox">
                                <h3>Chat</h3>
                                {chat && chat.map((message, id) => (
                                    <div key={id}>
                                        <p>{message}</p>
                                    </div>
                                ))}
                                <div>
                                    <TextField
                                        label="Send message"
                                        id="filled-start-adornment"
                                        value={message}
                                        onChange={e => setMessage(e.target.value)}
                                        sx={{ m: 2, width: '25ch' }}
                                        InputProps={{
                                            startAdornment: <InputAdornment position="start"><AccountCircle /></InputAdornment>,
                                        }}
                                        variant="filled"
                                        />
                                    <Button onClick={() => {publishMessage(message)}}>
                                        <SendIcon/>
                                    </Button>
                                </div>
                            </div>
                    </div>
                </div>
                }
            </div>
        </div>
    )
}

export default Game;