import React, { useState } from 'react';
import './App.css';
import ChessBoard from './components/ChessBoard';
import { useChessGame } from './utils/hooks';

const App = () => {
    const chessGame = useChessGame();
    const [perspectiveFlipEnabled, setPerspectiveFlipEnabled] = useState(true);

    return (
        <div className="App">
            <div className="App__Info">
                <h3>Turn: {chessGame.playerTurn}</h3>
                <label htmlFor="perspectiveEnabled">
                    <input type="checkbox" id="perspectiveEnabled" checked={perspectiveFlipEnabled} onChange={() => setPerspectiveFlipEnabled(!perspectiveFlipEnabled)} />
                    Enable Perspective Flip
                </label>
                <button onClick={chessGame.undo}>Undo</button>
            </div>
            <ChessBoard
                onCellClick={chessGame.selectPosition}
                chessGame={chessGame}
                perspective={perspectiveFlipEnabled ? chessGame.playerTurn : 'white'}
            />
        </div>
    );
};

export default App;