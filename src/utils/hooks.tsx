import React, { useState, useMemo, useCallback } from 'react';
import { CustomPieceType, Player, File, Rank, StandardPieceType, ChessGame, GamePieceType, withCustomPieces, withStandardPieces, ActiveGamePiece, PieceMoveCalculator, GamePiece, BoardState } from '../chess/game';
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

const standardPieceSvg: Record<StandardPieceType, [string, string]> = {
    'pawn': [WhitePawn, BlackPawn],
    'rook': [WhiteRook, BlackRook],
    'knight': [WhiteKnight, BlackKnight],
    'bishop': [WhiteBishop, BlackBishop],
    'queen': [WhiteQueen, BlackQueen],
    'king': [WhiteKing, BlackKing],
};

const getPieceRenderer = <TSpecific extends GamePieceType>(svg: Record<TSpecific, [string, string]>) =>
    (type: TSpecific, player: Player) => <img src={player === 'white' ? svg[type][0] : svg[type][1]} alt={`${player} ${type}`} />;

const renderStandardPiece = getPieceRenderer(standardPieceSvg);

export const useChessGame: () => ChessHook = () => {
    const game = useMemo(() => withStandardPieces().beginGame(), []);
    const triggerRender = useRenderTrigger();
    const renderPiece = useCallback(renderStandardPiece, []);

    const hook: ChessHook = {
        getPiece: useCallback((file, rank) => game.getPiece(file, rank), []),

        renderPiece: useCallback((file, rank) => {
            const piece = game.getPiece(file, rank);
            if (piece) {
                const { type, player } = piece;
                return renderPiece(type, player);
            } else return null;
        }, []),

        movePiece: useCallback((from, to) => {
            game.movePiece(from, to);
            triggerRender();
        }, []),

        undo: useCallback(() => {
            game.undo();
            triggerRender();
        }, []),

        pieces: game.pieces.map(({ file, rank, type, player }) => ({ file, rank, render: () => renderPiece(type, player) })),
        capturedPieces: game.capturedPieces.map(({ file, rank, type, player }) => ({ file, rank, render: () => renderPiece(type, player) })),
    };

    return hook;
};

export const useCustomChessGame = <TCustom extends CustomPieceType>(pieces: Record<TCustom, PieceMoveCalculator<TCustom>>, svg: Record<TCustom, [string, string]>, initialState: BoardState<StandardPieceType | TCustom>) => {
    const game = useMemo(() => withCustomPieces(pieces).beginGame(initialState), []);
    const triggerRender = useRenderTrigger();
    const renderPiece = useCallback((type: StandardPieceType | TCustom, player: Player) => {
        const renderCustomPiece = getPieceRenderer(svg);
        if (StandardPieceType.guard(type)) return renderStandardPiece(type, player);
        else return renderCustomPiece(type, player);
    }, []);

    const hook: ChessHook = {
        getPiece: useCallback((file, rank) => game.getPiece(file, rank), []),

        renderPiece: useCallback((file, rank) => {
            const piece = game.getPiece(file, rank);
            if (piece) {
                const { type, player } = piece;
                return renderPiece(type, player);
            } else return null;
        }, []),

        movePiece: useCallback((from, to) => {
            game.movePiece(from, to);
            triggerRender();
        }, []),

        undo: useCallback(() => {
            game.undo();
            triggerRender();
        }, []),

        pieces: game.pieces.map(({ file, rank, type, player }) => ({ file, rank, render: () => renderPiece(type, player) })),
        capturedPieces: game.capturedPieces.map(({ file, rank, type, player }) => ({ file, rank, render: () => renderPiece(type, player) })),
    };

    return hook;
};

export interface ChessHook {
    renderPiece: (file: File, rank: Rank) => JSX.Element | null;
    getPiece: (file: File, rank: Rank) => ActiveGamePiece<string> | undefined;
    movePiece: ChessGame<StandardPieceType>['movePiece'];
    undo: ChessGame<StandardPieceType>['undo'];
    pieces: ReactChessPiece[];
    capturedPieces: ReactChessPiece[];
}

export interface ReactChessPiece {
    file: File;
    rank: Rank;
    render: () => JSX.Element;
}