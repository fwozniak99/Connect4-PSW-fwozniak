import { useParams } from 'react-router-dom';


function Game() {
    let { id } = useParams();

    return (
        <div>
            Game {id}
        </div>
    )
}

export default Game;