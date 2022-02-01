import { useState, useEffect } from 'react';
import axios from 'axios';
import mqtt from 'mqtt';
import { Link } from 'react-router-dom';
import { Button, Pagination, Typography, TextField } from '@mui/material';
import './UserList.scss';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import Autocomplete from '@mui/material/Autocomplete';
const port = 8080;


function UserList() {
    const [ client, setClient ] = useState(null);
    const [ users, setUsers ] = useState([]);
    const [ searchTerm, setSearchTerm ] = useState("");
    const [ currentPage, setCurrentPage ] = useState(1);
    const usersPerPage = 5;

    useEffect(() => {
        setClient(mqtt.connect('ws://localhost:8000'));
    }, [])

    useEffect(() => {
        if(client) {
            client.on('connect', () => {
                client.subscribe('/users');
            })

            getAllUsers();

            client.on('message', (topic, message) => {
                if (topic.toString() === '/users') {
                    getAllUsers();
                }
            });
        }

    }, [client])

    const getAllUsers = () => {
        axios.get(`http://localhost:${port}/users`).then((res) => {
            setUsers(res.data.users);
        }).catch(err => console.log(err));
    }

    const indexOfLastUser = currentPage * usersPerPage;
    const indexOfFirstUser = indexOfLastUser - usersPerPage;
    const displayedUsers = users.filter(user => { 
        if (searchTerm) {
            return user.name.toLowerCase().includes(searchTerm.toLowerCase());
        } else {
            return true;
        }
    }).slice(indexOfFirstUser, indexOfLastUser);

    return (
        <div className="userList">
            <h1>User List</h1>
            <Autocomplete
                disablePortal
                id="users-box"
                options={users.map(user => user.name)}
                inputValue={searchTerm || ""}
                sx={{ width: 300 }}
                noOptionsText={"NO AVAILABLE USERS"}
                onChange={(e, v) => {setSearchTerm(v)}}
                renderInput={(params) => <TextField {...params} label="Users" onChange={(event) => {setSearchTerm(event.target.value)}}/>}
            />
            {displayedUsers && displayedUsers.map((user, id) => {
                return (
                    <Typography key={id} className="userContainer" variant="h6">{user["name"]}</Typography>
                )
            })

            }
            <Pagination color="primary" className="pagination" count={ Math.ceil(users.length / usersPerPage) } siblingCount={0} onChange={(event, value) => {setCurrentPage(value)}} />
        </div>
    )
}

export default UserList;