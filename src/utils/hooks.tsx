import React, { useState, useMemo, useCallback, CSSProperties } from 'react';
import { Player, File, Rank, beginGame, fileDifference, rankDifference, GameRule, GamePiece } from '../chess/game';
import { ReactComponent as BlackBishop } from '../svg/bb.svg';
import { ReactComponent as BlackKing } from '../svg/bk.svg';
import { ReactComponent as BlackKnight } from '../svg/bn.svg';
import { ReactComponent as BlackPawn } from '../svg/bp.svg';
import { ReactComponent as BlackQueen } from '../svg/bq.svg';
import { ReactComponent as BlackRook } from '../svg/br.svg';
import { ReactComponent as WhiteBishop } from '../svg/wb.svg';
import { ReactComponent as WhiteKing } from '../svg/wk.svg';
import { ReactComponent as WhiteKnight } from '../svg/wn.svg';
import { ReactComponent as WhitePawn } from '../svg/wp.svg';
import { ReactComponent as WhiteQueen } from '../svg/wq.svg';
import { ReactComponent as WhiteRook } from '../svg/wr.svg';

export type PieceSVG = typeof WhiteKing;

export const useRenderTrigger = () => {
    const [,setDummy] = useState(0);

    return () => setDummy(val => val + 1);
};

const standardPieceSvg: Record<string, [PieceSVG, PieceSVG]> = {
    'pawn': [WhitePawn, BlackPawn],
    'rook': [WhiteRook, BlackRook],
    'knight': [WhiteKnight, BlackKnight],
    'bishop': [WhiteBishop, BlackBishop],
    'queen': [WhiteQueen, BlackQueen],
    'king': [WhiteKing, BlackKing],
};

interface PieceProperties {
    key?: string | number;
    style?: CSSProperties;
}

const getPieceRenderer = (svg: Record<string, [PieceSVG, PieceSVG]>) =>
    (type: string, player: Player, props?: PieceProperties) => {
        const Svg: PieceSVG | undefined = svg[type] && svg[type][player === 'white' ? 0 : 1];
        if (!Svg) return null;

        return <Svg key={props?.key} style={props?.style} />;
    };

const numericFileLookup: Record<File, number> = { a: 1, b: 2, c: 3, d: 4, e: 5, f: 6, g: 7, h: 8 };

export const useChessGame: ChessHook = (pieces, customRules, customSvg) => {
    const game = useMemo(() => beginGame(pieces, customRules, true), [pieces, customRules]);
    const renderPiece = useCallback(getPieceRenderer({ ...standardPieceSvg, ...(customSvg ?? {}) }), [customSvg]); // eslint-disable-line
    const [selectedPosition, setSelectedPosition] = useState<[File, Rank]>();
    const [backgroundOverrides, setBackgroundOverrides] = useState<[File, Rank, string][]>([]);
    const [turnNumber, setTurnNumber] = useState(1);
    const [previewedPosition, setPreviewedPosition] = useState<[File, Rank]>();

    const hook: ChessReactState = {
        getPositionProperties: (file, rank, rotationOffset) => {
            const backgroundColor = backgroundOverrides.find(([f, r]) => f === file && r === rank)?.[2] ??
                ((numericFileLookup[file] + rank) % 2 === 0 ? 'brown' : 'beige');
                
            const piece = game.getPieceTypeAtPosition(file, rank);
            let renderedPiece = piece ? renderPiece(...piece) : null;

            if (previewedPosition && selectedPosition && selectedPosition[0] === file && selectedPosition[1] === rank) renderedPiece = (
                <>
                    {renderedPiece}
                    <ArrowPrototype
                        from={selectedPosition}
                        to={previewedPosition}
                        rotationOffset={rotationOffset ?? 0}
                    />
                </>
            );

            return {
                backgroundColor,
                renderedPiece,
            };
        },

        selectPosition: (file, rank) => {
            const piece = game.getPieceTypeAtPosition(file, rank);
            const moveSelection = () => {
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
            };

            const removeSelection = () => {
                setSelectedPosition(undefined);
                setBackgroundOverrides([]);
                setPreviewedPosition(undefined);
            };

            if (selectedPosition && selectedPosition[0] === file && selectedPosition[1] === rank) removeSelection();
            else if (selectedPosition && piece && piece[1] === game.getPlayerTurn()) moveSelection();
            else if (selectedPosition) {
                if (game.movePiece(...selectedPosition, file, rank)) setTurnNumber(turnNumber + 1);
                removeSelection();
            } else moveSelection();
        },

        previewPosition: (file, rank) => {
            if (!selectedPosition) return;

            const movements = game.getPossibleMovesAtPosition(...selectedPosition)!;
            if (!movements.some(movement => movement.movedPieces[0].to[0] === file && movement.movedPieces[0].to[1] === rank)) return;

            setPreviewedPosition([file, rank]);
        },

        unpreviewPosition: () => setPreviewedPosition(undefined),

        undo: () => {
            if (game.undo()) setTurnNumber(turnNumber - 1);
        },

        renderCaptures: player => {
            const capturedPieces = player ?
                game.getCapturedPieces().filter(p => p.player === player) :
                game.getCapturedPieces();

            return (
                <>
                    {capturedPieces.map(({ type, player }, i) => renderPiece(type, player, { key: i, style: { width: 'var(--cell-width)', height: 'var(--cell-width)' }}))}
                </>
            );
        },
        turnNumber,
        playerTurn: game.getPlayerTurn(),
    };

    return hook;
};

const ArrowPrototype: React.FC<ArrowPrototypeProperties> = props => {
    const dx = fileDifference(props.from[0], props.to[0]);
    const dy = rankDifference(props.from[1], props.to[1]);
    const length = Math.sqrt(dx*dx + dy*dy);
    const angle = -Math.atan2(dy, dx) + props.rotationOffset;

    return (
        <div
            className="Arrow"
            style={{
                width: `calc((${length} * var(--cell-width)) - 2rem)`,
                transform: `rotate(${angle}rad)`,
            }}
        />
    );
};

interface ArrowPrototypeProperties {
    from: [File, Rank];
    to: [File, Rank];
    rotationOffset: number;
}

export type ChessHook = (pieces?: GamePiece[], customRules?: GameRule[], customSvg?: Record<string, [PieceSVG, PieceSVG]>) => ChessReactState;

export interface ChessReactState {
    getPositionProperties: (file: File, rank: Rank, arrowRotationOffset?: number) => PositionProperties;
    selectPosition: (file: File, rank: Rank) => void;
    previewPosition: (file: File, rank: Rank) => void; // TODO: Not sure about the API here.
    unpreviewPosition: () => void;
    undo: () => void;
    renderCaptures: (player?: Player) => JSX.Element;
    turnNumber: number;
    playerTurn: Player;
}

export interface PositionProperties {
    backgroundColor: string;
    renderedPiece: JSX.Element | null;
}