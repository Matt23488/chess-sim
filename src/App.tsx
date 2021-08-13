import React, { useState } from 'react';
import './App.css';
import { Player } from './chess/game';
import ChessBoard from './components/ChessBoard';
import { useChessGame } from './utils/hooks';

const App = () => {
    const chessGame = useChessGame();
    const [perspective, setPerspective] = useState<Player | 'turn'>('turn');

    return (
        <div className="App">
            <div className="App__Info">
                <h3>Turn: {chessGame.playerTurn}</h3>
                <label htmlFor="perspectiveEnabled">
                    Player Perspective:&nbsp;
                    <select id="perspectiveEnabled" value={perspective} onChange={e => setPerspective(e.target.value as Player | 'turn')}>
                        <option value="turn">Turn</option>
                        <option value="white">White</option>
                        <option value="black">Black</option>
                    </select>
                </label>

                <button onClick={chessGame.undo}>Undo</button>
            </div>
            <ChessBoard
                onCellClick={chessGame.selectPosition}
                chessGame={chessGame}
                perspective={perspective === 'turn' ? chessGame.playerTurn : perspective}
            />
        </div>
    );
};

export default App;