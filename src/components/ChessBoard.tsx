import React, { useMemo } from 'react';
import { Rank, File, Player } from '../chess/game';
import './css/ChessBoard.css';
import { ChessHook } from '../utils/hooks';

const ChessBoard: React.FC<ChessBoardProperties> = props => {
    const grid = useMemo(() => Array(8 * 8).fill(0).map((_, i) => {
        const x = i % 8;
        const y = Math.floor(i / 8);
    
        return [fileLookup.get(x)!, rankLookup.get(y)!, x, y] as [File, Rank, number, number];
    }), []);

    return (
        <div className={`ChessBoard ChessBoard__Perspective${props.perspective}`}>
            {Array(8).fill(0).map((_,i) => <div key={`ri${i}`} className={`ChessBoard__Cell ChessBoard__RankIndicator ChessBoard__Rank${rankLookup.get(i)}`}>{rankLookup.get(i)}</div>)}
            {Array(8).fill(0).map((_,i) => <div key={`fi${i}`} className={`ChessBoard__Cell ChessBoard__FileIndicator ChessBoard__File${fileLookup.get(i)?.toUpperCase()}`}>{fileLookup.get(i)}</div>)}
            {grid.map(([file, rank]) => {
                const positionProps = props.chessGame.getPositionProperties(file, rank, props.perspective === 'white' ? 0 : Math.PI);
                
                return (
                    <div
                        key={`${file}${rank}`}
                        className={`ChessBoard__Cell ChessBoard__File${file.toUpperCase()} ChessBoard__Rank${rank}`}
                        style={{ backgroundColor: positionProps.backgroundColor }}
                        onClick={() => props.onCellClick(file, rank)}
                    >
                        {positionProps.renderedPiece}
                    </div>
                );
            })}
        </div>
    );
};

const rankLookup: Map<number, Rank> = new Map([
    [0, 8],
    [1, 7],
    [2, 6],
    [3, 5],
    [4, 4],
    [5, 3],
    [6, 2],
    [7, 1],
]);

const fileLookup: Map<number, File> = new Map([
    [0, 'a'],
    [1, 'b'],
    [2, 'c'],
    [3, 'd'],
    [4, 'e'],
    [5, 'f'],
    [6, 'g'],
    [7, 'h'],
]);

interface ChessBoardProperties {
    onCellClick: (file: File, rank: Rank) => void;
    chessGame: ChessHook;
    perspective: Player;
}

export default ChessBoard;