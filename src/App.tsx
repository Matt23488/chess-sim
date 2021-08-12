import React, { useState } from 'react';
import './App.css';
import { Rank, File } from './chess/game';
import ChessBoard from './components/ChessBoard';
import { useChessGame } from './utils/hooks';

const App = () => {
    const { renderPiece, getPiece, movePiece, undo, pieces } = useChessGame();
    const [selection, setSelection] = useState<[File, Rank]>();
    const [highlightedCells, setHighlightedCells] = useState<[File, Rank, string][]>([]);

    const onClickCell = (file: File, rank: Rank) => {
        if (selection && selection[0] === file && selection[1] === rank) {
            setHighlightedCells([]);
            setSelection(undefined);
        } else if (selection) {
            movePiece(selection, [file, rank]);
            setSelection(undefined);
            setHighlightedCells([]);
        } else {
            const piece = getPiece(file, rank);
            if (!piece) return;

            const getMoveHighlights = () => {
                // Destination Squares
                const destinations = piece.possibleMoves.map(move => [...move.destination, 'cyan'] as [File, Rank, string]);

                // Captures
                const captures = piece.possibleMoves.reduce((highlights, move) => [...highlights, ...move.captures.map(capture => {
                    return [capture.file, capture.rank, 'red'] as [File, Rank, string];
                })], [] as [File, Rank, string][]);

                // TODO: Other Moved Pieces (Maybe)
                return [
                    ...captures,
                    ...destinations,
                ];
            };

            setSelection([file, rank]);
            setHighlightedCells([
                [file, rank, 'green'],
                ...getMoveHighlights(),
            ]);
        }
    };

    return (
        <div className="App">
            <div className="ChessBoardContainer">
                <ChessBoard
                    onClickCell={onClickCell}
                    getHighlightColor={(file, rank) => highlightedCells.find(([f, r]) => f === file && r === rank)?.[2]}
                    pieces={pieces}
                />
            </div>
            <button
                style={{ position: 'absolute', left: '0px' }}
                onClick={undo}
            >Undo</button>
        </div>
    );
};

export default App;