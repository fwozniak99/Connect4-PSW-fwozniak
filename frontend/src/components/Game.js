import { useParams, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { TextField, Typography } from '@mui/material';
import InputAdornment from '@mui/material/InputAdornment';
import AccountCircle from '@mui/icons-material/AccountCircle';
import SendIcon from '@mui/icons-material/Send';
import Button from '@mui/material/Button';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
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
    const [ visible, setVisible ] = useState(false);
    const [ nameTaken, setNameTaken ] = useState(false);
    const [ chat, setChat ] = useState([]);
    const [ message, setMessage ] = useState('');
    const [ winner, setWinner ] = useState(null);
    const [ chosen, setChosen ] = useState(false);
    const location = useLocation();
    const { name } = location.state;
    const [ comment, setComment ] = useState("");
    const [ comments, setComments ] = useState([]);

    useEffect(() => {
        setClient(mqtt.connect('ws://localhost:8000'));
    }, [])

    useEffect(() => {
        if(client) {
            client.on('connect', () => {
                client.subscribe(`/move/${id}`);
                client.subscribe(`/addplayers/${id}`);
                client.subscribe(`/chat/${id}`);
                client.subscribe(`/status/${id}`);
                client.subscribe(`/results/${id}`);
                client.subscribe(`/comments/${id}`);
            })

            sendParticipant(name);
            getBoard();
            getComments();

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
                    setChat([message.toString(), ...chat]);
                }
                if (topic.toString() === `/results/${id}`) {
                    const results = JSON.parse(message.toString());
                    setWinner(results.winner);
                }
                if (topic.toString() === `/comments/${id}`) {
                    const comm = JSON.parse(message.toString());
                    getComments();
                }
            });
            axios.get(`http://localhost:${port}/games/${id}`)
            .then(res => {
                setPlayer1([res.data.player1, 1]);
                setPlayer2([res.data.player2, 2]);
                setTurn(res.data.turn);
                setStatus(res.data.status);
                if (res.data.winner) {
                    setWinner(res.data.winner);
                }
            })
            .catch(err => console.log(err));
        }

    }, [client, id, chat, winner, name])

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
        axios.put(`http://localhost:${port}/games/${id}`, { player, col })
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
        setMessage("");
    };

    const getResults = (winner) => {
        if (player1.includes(winner)) {
            return `${player1[0]} wins!`;
        } else {
            return `${player2[0]} wins!`;
        }
    }

    const addComment = (name, comment) => {
        axios.post(`http://localhost:${port}/games/${id}/comment`, { name, comment }).then(() => {
            setComment("");
        }).catch(err => console.log(err));
    }

    const getComments = () => {
        axios.get(`http://localhost:${port}/games/${id}/comments`).then((res) => {
            setComments(res.data.comments);
        }).catch(err => console.log(err));
    }

    const deleteComment = (commentId) => {
        axios.delete(`http://localhost:${port}/games/${id}/deleteComment/${commentId}`).then((res) => {
        }).catch(err => console.log(err));
    }


    return (
        <div className="pageContainer">
            <h2>Game {id}</h2>
            <div className="mainContainer">
                    {!winner ? 
                        <div className="gameAndChatContainer">
                            <div className="playerButtons">
                                {player1 ? player1[0] ? 
                                    <div id="yellowTypography">
                                        {player1[0]} is yellow!
                                    </div> 
                                :
                                    <div>
                                        <Button
                                            disabled={chosen}
                                            onClick={() => {sendPlayer1(name); setChosen(true)}}
                                            id="yellowButton"
                                        >
                                            Play as Yellow
                                        </Button>
                                    </div>
                                :
                                <div>
                                <Button
                                    disabled={chosen}
                                    onClick={() => {sendPlayer1(name); setChosen(true)}}
                                    id="yellowButton"
                                >
                                    Play as Yellow
                                </Button>
                            </div>
                                }

                                {player2 ? player2[0] ?
                                    <div id="redTypography">
                                        {player2[0]} is red!
                                    </div>
                                :
                                <div>
                                    <Button
                                        disabled={chosen}
                                        onClick={() => {sendPlayer2(name); setChosen(true)}}
                                        id="redButton"
                                    >
                                        Play as Red
                                    </Button>
                                </div>
                                :
                                <div>
                                    <Button
                                        disabled={chosen}
                                        onClick={() => {sendPlayer2(name); setChosen(true)}}
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
                                        <div className="chatInputContainer">
                                            <TextField
                                                label="Send message"
                                                id="filled-start-adornment"
                                                value={message}
                                                onChange={e => { setMessage(e.target.value)} }
                                                sx={{ width: '35ch' }}
                                                InputProps={{
                                                    startAdornment: <InputAdornment position="start"><AccountCircle /></InputAdornment>,
                                                }}
                                                variant="filled"
                                                />
                                            <Button onClick={() => {publishMessage(message)}} id="chatButton">
                                                <SendIcon/>
                                            </Button>
                                        </div>
                                        <div className="messagebox">
                                            {chat && chat.map((message, id) => (
                                                <div key={id} >
                                                    <p>{message}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div> 
                            </div>
                            <div className="commentContainer">
                                <h3>Comments</h3>
                                <div className="commentsInputContainer">
                                    <TextField
                                        label="Comment..."
                                        id="filled-start-adornment"
                                        value={comment}
                                        onChange={e => { setComment(e.target.value)} }
                                        sx={{ width: '50ch' }}
                                        InputProps={{
                                            startAdornment: <InputAdornment position="start"><AccountCircle /></InputAdornment>,
                                        }}
                                        variant="filled"
                                        />
                                    <Button onClick={() => {addComment(name, comment)}} id="commentButton">
                                        <SendIcon/>
                                    </Button>
                                </div>
                                <div className="commentbox">
                                            {comments && comments.map((com, id) => (
                                                <div key={id}  className="comment">
                                                    <p>{com[1]+ ": " + com[2]}</p>
                                                    <Button onClick={() => deleteComment(com[0])} className="deleteButton">
                                                        <DeleteOutlineIcon className="deleteIcon"/>
                                                    </Button>
                                                </div>
                                            ))}
                                </div>
                            </div>
                        </div>
                        : 
                        <Typography align="center" variant="h2">
                            { getResults(winner) }
                        </Typography>
                    }
                </div>
        </div>
    )
}

export default Game;