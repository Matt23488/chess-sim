import React from 'react';
import './App.css';
import ChessBoard from './components/ChessBoard';
import { useChessGame } from './utils/hooks';

const App = () => {
    const chessGame = useChessGame();

    return (
        <div className="App">
            <div className="ChessBoardContainer">
                <ChessBoard
                    onCellClick={chessGame.selectPosition}
                    chessGame={chessGame}
                />
            </div>
            <button
                style={{ position: 'absolute', left: '0px' }}
                onClick={chessGame.undo}
            >Undo</button>
        </div>
    );
};

export default App;