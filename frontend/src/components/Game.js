import { useParams } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Input from '@mui/material/Input';
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
                    setBoard(newBoard);
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

    const makeMove = (player, col) => {
        axios.post(`http://localhost:${port}/games/${id}`, { player, col })
            .catch(error => console.log(error));
    };


    return (
        <div className="pageContainer">
            <h2>Game {id}</h2>
            <div className="gameAndChatContainer">
                <div className="gameContainer">
                    {board && board.map((col, n) => {
                        return col.map((el, id) => {
                            return (
                                <div key={id} onClick={() => {makeMove(1, n)}} className="tokenContainer" style={el===1 ? {backgroundColor: "#FFBF00"} : el===2 ? {backgroundColor: "#EE4B2B"} : {backgroundColor: "#6495ED"}}>
                                {n}
                                </div>
                            )
                        })
                    })}
                </div>
                <div className="chatbox">
                                <h3>Chat</h3>

                                <Input
                                id="input-with-icon-adornment"
                                startAdornment={
                                    <InputAdornment position="start">
                                        <AccountCircle />
                                    </InputAdornment>
                                }/>
                                <Button>
                                    <SendIcon/>
                                </Button>
                </div>
            </div>
        </div>
    )
}

export default Game;