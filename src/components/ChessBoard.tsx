import React, { useMemo, CSSProperties } from 'react';
import { Rank, File } from '../chess/game';
import './css/ChessBoard.css';
import { ReactChessPiece } from '../utils/hooks';

const ChessBoard: React.FC<ChessBoardProperties> = props => {
    const grid = useMemo(() => Array(8 * 8).fill(0).map((_, i) => {
        const x = i % 8;
        const y = Math.floor(i / 8);
    
        return [fileLookup.get(x)!, rankLookup.get(y)!, x, y] as [File, Rank, number, number];
    }), []);

    return (
        <div className="ChessBoard">
            {Array(8).fill(0).map((_,i) => <div className={`ChessBoard__Cell ChessBoard__RankIndicator ChessBoard__Rank${rankLookup.get(i)}`}>{rankLookup.get(i)}</div>)}
            {Array(8).fill(0).map((_,i) => <div className={`ChessBoard__Cell ChessBoard__FileIndicator ChessBoard__File${fileLookup.get(i)?.toUpperCase()}`}>{fileLookup.get(i)}</div>)}
            {grid.map(([file, rank, colNum, rowNum]) => {
                const unHighlightedColor = (colNum + rowNum) % 2 === 0 ? 'beige' : 'brown';

                const gridStyle: CSSProperties = {
                    backgroundColor: props.getHighlightColor(file, rank) ?? unHighlightedColor,
                };

                return (
                    <div
                        key={`${file}${rank}`}
                        className={`ChessBoard__Cell ChessBoard__File${file.toUpperCase()} ChessBoard__Rank${rank}`}
                        style={gridStyle}
                        onClick={() => props.onClickCell(file, rank)}
                    >
                        {props.pieces.find(({ file: f, rank: r }) => f === file && r === rank)?.render()}
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
    onClickCell: (file: File, rank: Rank) => void;
    getHighlightColor: (file: File, rank: Rank) => string | undefined;
    pieces: ReactChessPiece[];
}

export default ChessBoard;