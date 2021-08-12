import React, { useState, useMemo, useCallback } from 'react';
import { Player, File, Rank, beginGame } from '../chess/game';
import BlackBishop from '../svg/bb.svg';
import BlackKing from '../svg/bk.svg';
import BlackKnight from '../svg/bn.svg';
import BlackPawn from '../svg/bp.svg';
import BlackQueen from '../svg/bq.svg';
import BlackRook from '../svg/br.svg';
import WhiteBishop from '../svg/wb.svg';
import WhiteKing from '../svg/wk.svg';
import WhiteKnight from '../svg/wn.svg';
import WhitePawn from '../svg/wp.svg';
import WhiteQueen from '../svg/wq.svg';
import WhiteRook from '../svg/wr.svg';

export const useRenderTrigger = () => {
    const [,setDummy] = useState(0);

    return () => setDummy(val => val + 1);
};

const standardPieceSvg: Record<string, [string, string]> = {
    'pawn': [WhitePawn, BlackPawn],
    'rook': [WhiteRook, BlackRook],
    'knight': [WhiteKnight, BlackKnight],
    'bishop': [WhiteBishop, BlackBishop],
    'queen': [WhiteQueen, BlackQueen],
    'king': [WhiteKing, BlackKing],
};

const getPieceRenderer = (svg: Record<string, [string, string]>) =>
    (type: string, player: Player) => svg[type] ? <img src={player === 'white' ? svg[type][0] : svg[type][1]} alt={`${player} ${type}`} /> : null;

const renderStandardPiece = getPieceRenderer(standardPieceSvg);

const numericFileLookup: Record<File, number> = { a: 1, b: 2, c: 3, d: 4, e: 5, f: 6, g: 7, h: 8 };

export const useChessGame: () => ChessHook = () => {
    const game = useMemo(() => beginGame(), []);
    const renderPiece = useCallback(renderStandardPiece, []);
    const [selectedPosition, setSelectedPosition] = useState<[File, Rank]>();
    const [backgroundOverrides, setBackgroundOverrides] = useState<[File, Rank, string][]>([]);
    const [turnNumber, setTurnNumber] = useState(1);

    const hook: ChessHook = {
        getPositionProperties: (file, rank) => {
            const backgroundColor = backgroundOverrides.find(([f, r]) => f === file && r === rank)?.[2] ??
                ((numericFileLookup[file] + rank) % 2 === 0 ? 'brown' : 'beige');
                
            const piece = game.getPieceTypeAtPosition(file, rank);
            const renderedPiece = piece ? renderPiece(...piece) : null
            return {
                backgroundColor,
                renderedPiece,
            };
        },

        selectPosition: (file, rank) => {
            if (selectedPosition) {
                if (game.movePiece(...selectedPosition, file, rank)) setTurnNumber(turnNumber + 1);
                setSelectedPosition(undefined);
                setBackgroundOverrides([]);
            } else {
                const piece = game.getPieceTypeAtPosition(file, rank);
                if (!piece || piece[1] !== game.getPlayerTurn()) return;

                const movements = game.getPossibleMovesAtPosition(file, rank);
                if (movements.length === 0) return;

                const underAttack: [File, Rank, string][] = [];
                const selectedPieceDestinations: [File, Rank, string][] = [];

                movements.forEach(movement => {
                    underAttack.push(...movement.capturedPieces.map<[File, Rank, string]>(p => [p.file, p.rank, 'red']));

                    const [primary] = movement.movedPieces;
                    selectedPieceDestinations.push([...primary.to, 'cyan']);
                });

                setSelectedPosition([file, rank]);
                setBackgroundOverrides([[file, rank, 'green'], ...underAttack, ...selectedPieceDestinations]);
            }
        },
        undo: () => {
            if (game.undo()) setTurnNumber(turnNumber - 1);
        },
        turnNumber,
    };

    return hook;
};

// export const useCustomChessGame = <TCustom extends CustomPieceType>(pieces: Record<TCustom, PieceMoveCalculator<TCustom>>, svg: Record<TCustom, [string, string]>, initialState: BoardState<StandardPieceType | TCustom>) => {
//     const game = useMemo(() => withCustomPieces(pieces).beginGame(initialState), []);
//     const triggerRender = useRenderTrigger();
//     const renderPiece = useCallback((type: StandardPieceType | TCustom, player: Player) => {
//         const renderCustomPiece = getPieceRenderer(svg);
//         if (StandardPieceType.guard(type)) return renderStandardPiece(type, player);
//         else return renderCustomPiece(type, player);
//     }, []);

//     const hook: ChessHook = {
//         getPiece: useCallback((file, rank) => game.getPiece(file, rank), []),

//         renderPiece: useCallback((file, rank) => {
//             const piece = game.getPiece(file, rank);
//             if (piece) {
//                 const { type, player } = piece;
//                 return renderPiece(type, player);
//             } else return null;
//         }, []),

//         movePiece: useCallback((from, to) => {
//             game.movePiece(from, to);
//             triggerRender();
//         }, []),

//         undo: useCallback(() => {
//             game.undo();
//             triggerRender();
//         }, []),

//         pieces: game.pieces.map(({ file, rank, type, player }) => ({ file, rank, render: () => renderPiece(type, player) })),
//         capturedPieces: game.capturedPieces.map(({ file, rank, type, player }) => ({ file, rank, render: () => renderPiece(type, player) })),
//     };

//     return hook;
// };

export interface ChessHook {
    getPositionProperties: (file: File, rank: Rank) => PositionProperties;
    selectPosition: (file: File, rank: Rank) => void;
    undo: () => void;
    turnNumber: number;
}

export interface PositionProperties {
    backgroundColor: string;
    renderedPiece: JSX.Element | null;
}