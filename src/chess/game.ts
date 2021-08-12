import { match } from 'ts-pattern';

export const standardInitialState: readonly GamePiece[] = Object.freeze([
    { type: 'rook', file: 'a', rank: 1, player: 'white' },
    { type: 'knight', file: 'b', rank: 1, player: 'white' },
    { type: 'bishop', file: 'c', rank: 1, player: 'white' },
    { type: 'queen', file: 'd', rank: 1, player: 'white' },
    { type: 'king', file: 'e', rank: 1, player: 'white' },
    { type: 'bishop', file: 'f', rank: 1, player: 'white' },
    { type: 'knight', file: 'g', rank: 1, player: 'white' },
    { type: 'rook', file: 'h', rank: 1, player: 'white' },
    { type: 'pawn', file: 'a', rank: 2, player: 'white' },
    { type: 'pawn', file: 'b', rank: 2, player: 'white' },
    { type: 'pawn', file: 'c', rank: 2, player: 'white' },
    { type: 'pawn', file: 'd', rank: 2, player: 'white' },
    { type: 'pawn', file: 'e', rank: 2, player: 'white' },
    { type: 'pawn', file: 'f', rank: 2, player: 'white' },
    { type: 'pawn', file: 'g', rank: 2, player: 'white' },
    { type: 'pawn', file: 'h', rank: 2, player: 'white' },
    { type: 'rook', file: 'a', rank: 8, player: 'black' },
    { type: 'knight', file: 'b', rank: 8, player: 'black' },
    { type: 'bishop', file: 'c', rank: 8, player: 'black' },
    { type: 'queen', file: 'd', rank: 8, player: 'black' },
    { type: 'king', file: 'e', rank: 8, player: 'black' },
    { type: 'bishop', file: 'f', rank: 8, player: 'black' },
    { type: 'knight', file: 'g', rank: 8, player: 'black' },
    { type: 'rook', file: 'h', rank: 8, player: 'black' },
    { type: 'pawn', file: 'a', rank: 7, player: 'black' },
    { type: 'pawn', file: 'b', rank: 7, player: 'black' },
    { type: 'pawn', file: 'c', rank: 7, player: 'black' },
    { type: 'pawn', file: 'd', rank: 7, player: 'black' },
    { type: 'pawn', file: 'e', rank: 7, player: 'black' },
    { type: 'pawn', file: 'f', rank: 7, player: 'black' },
    { type: 'pawn', file: 'g', rank: 7, player: 'black' },
    { type: 'pawn', file: 'h', rank: 7, player: 'black' },
]);

// TODO: Move somewhere else
const flattenArray = <T>(arr: T[][]) => ([] as T[]).concat.apply([], arr);

const standardRules: GameRule[] = [
    {
        name: 'Pawn Quick Start',
        pieceType: 'pawn',
        apply: (piece, state) => {
            if (piece.moveHistory.length > 0) return;
            
            const result = rayCast(state, [piece.file, piece.rank], [0, piece.player === 'white' ? 1 : -1], 2);
            if (result.length !== 2) return;
            
            const [,[toFile, toRank]] = result;

            piece.possibleMoves.push({
                movedPieces: [{
                    piece,
                    from: [piece.file, piece.rank],
                    to: [toFile, toRank],
                }],
                capturedPieces: [],
            });
        },
    }, {
        name: 'Pawn Standard Movement',
        pieceType: 'pawn',
        apply: (piece, state) => {
            const penultimateRank = (piece.player === 'white' ? 7 : 1);
            if (piece.rank === penultimateRank) return;

            const toRank = offsetRank(piece.rank, piece.player === 'white' ? 1 : -1);
            const otherPiece = state.positionLookup.get(`${piece.file}${toRank}`);
            if (otherPiece) return;

            piece.possibleMoves.push({
                movedPieces: [{
                    piece,
                    from: [piece.file, piece.rank],
                    to: [piece.file, toRank!],
                }],
                capturedPieces: [],
            });
        },
    }, {
        name: 'Pawn Standard Capture',
        pieceType: 'pawn',
        apply: (piece, state) => {
            const targetRank = offsetRank(piece.rank, piece.player === 'white' ? 1 : -1)!;
            const targets: [File, Rank][] = [];
            let targetFile = offsetFile(piece.file, -1);
            if (targetFile) targets.push([targetFile, targetRank]);
            targetFile = offsetFile(piece.file, 1);
            if (targetFile) targets.push([targetFile, targetRank]);

            targets.forEach(([file, rank]) => {
                const otherPiece = state.positionLookup.get(`${file}${rank}`);
                if (!otherPiece) return;

                piece.possibleMoves.push({
                    movedPieces: [{
                        piece,
                        from: [piece.file, piece.rank],
                        to: [file, rank],
                    }],
                    capturedPieces: [otherPiece],
                });
            });
        },
    }, {
        name: 'Pawn En Passant Capture',
        pieceType: 'pawn',
        apply: (piece, state) => {
            const validRank = piece.player === 'white' ? 5 : 4;
            if (piece.rank !== validRank) return;

            const targets: [File, Rank][] = [];
            let targetFile = offsetFile(piece.file, -1);
            if (targetFile) targets.push([targetFile, validRank]);
            targetFile = offsetFile(piece.file, 1);
            if (targetFile) targets.push([targetFile, validRank]);

            targets.forEach(([file, rank]) => {
                const otherPiece = state.positionLookup.get(`${file}${rank}`);
                if (!otherPiece || otherPiece.moveHistory.length !== 1) return;

                const otherPieceLastMove = otherPiece.moveHistory[otherPiece.moveHistory.length - 1];
                const lastMove = state.history[state.history.length - 1];
                if (otherPieceLastMove !== lastMove || lastMove?.movedPieces[0].piece !== otherPiece) return;

                piece.possibleMoves.push({
                    movedPieces: [{
                        piece,
                        from: [piece.file, piece.rank],
                        to: [file, piece.player === 'white' ? 6 : 3],
                    }],
                    capturedPieces: [otherPiece],
                });
            });
        },
    }, {
        name: 'Knight Standard Movement',
        pieceType: 'knight',
        apply: (piece, state) => {
            [
                [offsetFile(piece.file, -1), offsetRank(piece.rank, 2)],
                [offsetFile(piece.file, 1), offsetRank(piece.rank, 2)],
                [offsetFile(piece.file, -2), offsetRank(piece.rank, 1)],
                [offsetFile(piece.file, 2), offsetRank(piece.rank, 1)],
                [offsetFile(piece.file, -2), offsetRank(piece.rank, -1)],
                [offsetFile(piece.file, 2), offsetRank(piece.rank, -1)],
                [offsetFile(piece.file, -1), offsetRank(piece.rank, -2)],
                [offsetFile(piece.file, 1), offsetRank(piece.rank, -2)],
            ]
            .filter((target): target is [File, Rank] => !!target[0] && !!target[1])
            .forEach(([file, rank]) => {
                const otherPiece = state.positionLookup.get(`${file}${rank}`);
                if (otherPiece && otherPiece.player === piece.player) return;

                piece.possibleMoves.push({
                    movedPieces: [{
                        piece,
                        from: [piece.file, piece.rank],
                        to: [file, rank],
                    }],
                    capturedPieces: otherPiece ? [otherPiece] : [],
                });
            });
        },
    }, {
        name: 'Rook Standard Movement',
        pieceType: 'rook',
        apply: (piece, state) => {
            piece.possibleMoves.push(...multiRayCast(piece, state, [1, 0, 8], [-1, 0, 8], [0, 1, 8], [0, -1, 8]));
        },
    }, {
        name: 'Bishop Standard Movement',
        pieceType: 'bishop',
        apply: (piece, state) => {
            piece.possibleMoves.push(...multiRayCast(piece, state, [1, 1, 8], [-1, 1, 8], [1, -1, 8], [-1, -1, 8]));
        },
    }, {
        name: 'Queen Standard Movement',
        pieceType: 'queen',
        apply: (piece, state) => {
            piece.possibleMoves.push(...multiRayCast(
                piece, state,
                [1, 0, 8], [-1, 0, 8], [0, 1, 8], [0, -1, 8],
                [1, 1, 8], [-1, 1, 8], [1, -1, 8], [-1, -1, 8],
            ));
        },
    }, {
        name: 'King Standard Movement',
        pieceType: 'king',
        apply: (piece, state) => {
            piece.possibleMoves.push(...multiRayCast(
                piece, state,
                [1, 0, 1], [-1, 0, 1], [0, 1, 1], [0, -1, 1],
                [1, 1, 1], [-1, 1, 1], [1, -1, 1], [-1, -1, 1],
            ));
        },
    }, // TODO: Castling again
];

// // TODO: Move somewhere else
const makeUnion = <TBase>() => <TUnion extends TBase>(...values: TUnion[]) => {
    Object.freeze(values);
    const valueSet: Set<TBase> = new Set(values);

    const guard = (value: TBase): value is TUnion => valueSet.has(value);

    const unionNamespace = { guard, values };
    return Object.freeze(unionNamespace as typeof unionNamespace & { type: TUnion });
};

export const Player = makeUnion<string>()('white', 'black');
export type Player = typeof Player.type; // eslint-disable-line
export const switchPlayer = (player: Player): Player => player === 'white' ? 'black' : 'white';

export const Rank = makeUnion<number>()(1, 2, 3, 4, 5, 6, 7, 8);
export type Rank = typeof Rank.type; // eslint-disable-line

export const File = makeUnion<string>()('a', 'b', 'c', 'd', 'e', 'f', 'g', 'h');
export type File = typeof File.type; // eslint-disable-line

const offsetFile = (file: File, amount: number) =>
    match<[File, number], File | undefined>([file, amount])
    .with(['a', 0], ['b', -1], ['c', -2], ['d', -3], ['e', -4], ['f', -5], ['g', -6], ['h', -7], () => 'a')
    .with(['a', 1], ['b', 0], ['c', -1], ['d', -2], ['e', -3], ['f', -4], ['g', -5], ['h', -6], () => 'b')
    .with(['a', 2], ['b', 1], ['c', 0], ['d', -1], ['e', -2], ['f', -3], ['g', -4], ['h', -5], () => 'c')
    .with(['a', 3], ['b', 2], ['c', 1], ['d', 0], ['e', -1], ['f', -2], ['g', -3], ['h', -4], () => 'd')
    .with(['a', 4], ['b', 3], ['c', 2], ['d', 1], ['e', 0], ['f', -1], ['g', -2], ['h', -3], () => 'e')
    .with(['a', 5], ['b', 4], ['c', 3], ['d', 2], ['e', 1], ['f', 0], ['g', -1], ['h', -2], () => 'f')
    .with(['a', 6], ['b', 5], ['c', 4], ['d', 3], ['e', 2], ['f', 1], ['g', 0], ['h', -1], () => 'g')
    .with(['a', 7], ['b', 6], ['c', 5], ['d', 4], ['e', 3], ['f', 2], ['g', 1], ['h', 0], () => 'h')
    .otherwise(() => undefined);

const offsetRank = (rank: Rank, amount: number) =>
    Rank.guard(rank + amount) ? rank + amount as Rank : undefined;

const RayCastDirection = makeUnion<number>()(-1, 0, 1);
type RayCastDirection = typeof RayCastDirection.type; // eslint-disable-line

export interface GameState {
    activePieces: ActiveGamePiece[];
    capturedPieces: ActiveGamePiece[];
    positionLookup: Map<string, ActiveGamePiece>;
    history: PieceMovement[];
    playerTurn: Player;
}

export interface SubPieceMovement {
    piece: ActiveGamePiece;
    from: readonly [File, Rank];
    to: readonly [File, Rank];
}

export interface PieceMovement {
    movedPieces: SubPieceMovement[];
    capturedPieces: ActiveGamePiece[];
}

// TODO: Make another one of these that is more general to affect the whole game?
// Like, to activate the check state. They can run after all piece rules
// and can modify the possible moves further. I think I will try that, but
// I want to get the pieces moving normally first again.
export interface GameRule {
    name: string;
    pieceType: string;
    apply: (piece: ActiveGamePiece, state: GameState) => void;
}

export const beginGame = (pieces?: GamePiece[], rules?: GameRule[], includeStandardPiecesAndRules = true) => {
    const state: GameState = {
        activePieces: (includeStandardPiecesAndRules ? standardInitialState : []).concat(pieces ?? []).map(p => ({ ...p, possibleMoves: [], moveHistory: [] })),
        capturedPieces: [],
        positionLookup: new Map<string, ActiveGamePiece>(),
        history: [],
        playerTurn: 'white',
    };

    const allRules = Object.freeze((includeStandardPiecesAndRules ? standardRules : []).concat(rules ?? []));

    const analyzeNewState = () => {
        state.positionLookup.clear();
        state.activePieces.forEach(piece => {
            state.positionLookup.set(`${piece.file}${piece.rank}`, piece);
            piece.possibleMoves = [];
        });

        allRules.forEach(({ pieceType, apply }) => state.activePieces.filter(p => p.type === pieceType).forEach(piece => apply(piece, state)));
    };

    analyzeNewState();

    const game: ChessGame = {
        // state
        getPlayerTurn: () => state.playerTurn,
        getCapturedPieces: () => Object.freeze([...state.capturedPieces]),
        getPieceTypeAtPosition: (file, rank) => {
            const piece = state.positionLookup.get(`${file}${rank}`);

            return piece && [piece.type, piece.player];
        },
        getPossibleMovesAtPosition: (file, rank) => {
            const piece = state.positionLookup.get(`${file}${rank}`);
            if (!piece || piece.player !== state.playerTurn) return [];
            return Object.freeze([...piece.possibleMoves]);
        },
        movePiece: (fromFile, fromRank, toFile, toRank) => {
            const piece = state.positionLookup.get(`${fromFile}${fromRank}`);
            if (!piece) return false;

            const movement = piece.possibleMoves.find(move => move.movedPieces[0].piece === piece && move.movedPieces[0].to[0] === toFile && move.movedPieces[0].to[1] === toRank);
            if (!movement) return false;

            movement.movedPieces.forEach(({ piece, to: [file, rank]}) => {
                piece.file = file;
                piece.rank = rank;
            });

            movement.capturedPieces.forEach(piece => {
                state.activePieces.splice(state.activePieces.indexOf(piece), 1);
                state.capturedPieces.push(piece);
            });

            state.history.push(movement);
            piece.moveHistory.push(movement);
            state.playerTurn = switchPlayer(state.playerTurn);

            analyzeNewState();
            return true;
        },
        undo: () => {
            const lastMovement = state.history.pop();
            if (!lastMovement) return false;

            lastMovement.capturedPieces.forEach(piece => {
                state.capturedPieces.splice(state.capturedPieces.indexOf(piece), 1);
                state.activePieces.push(piece);
            });

            lastMovement.movedPieces.forEach(({ piece, from: [file, rank] }, i) => {
                if (i === 0) piece.moveHistory.pop();
                piece.file = file;
                piece.rank = rank;
            });

            state.playerTurn = switchPlayer(state.playerTurn);

            analyzeNewState();
            return true;
        },
    };

    return game;
};

export interface GamePiece {
    type: string;
    file: File;
    rank: Rank;
    player: Player;
}

export interface ActiveGamePiece extends GamePiece {
    possibleMoves: PieceMovement[];
    moveHistory: PieceMovement[];
}

export interface ChessGame {
    getPlayerTurn: () => Player;
    getCapturedPieces: () => readonly GamePiece[];
    getPieceTypeAtPosition: (file: File, rank: Rank) => [string, Player] | undefined;
    getPossibleMovesAtPosition: (file: File, rank: Rank) => readonly PieceMovement[];
    movePiece: (fromFile: File, fromRank: Rank, toFile: File, toRank: Rank) => boolean;
    undo: () => boolean;
}

const rayCast = (state: GameState, [file, rank]: [File, Rank], [x, y]: [RayCastDirection, RayCastDirection], length?: number) => {
    length = length ?? 8;
    const validSpaces: [File, Rank, ActiveGamePiece | undefined][] = [];

    let nextFile = offsetFile(file, x);
    let nextRank = offsetRank(rank, y);
    let piece = state.positionLookup.get(`${nextFile}${nextRank}`);
    let count = 0;
    while (nextFile && nextRank && count < length) {
        validSpaces.push([nextFile, nextRank, piece]);
        if (piece) break;

        nextFile = offsetFile(nextFile, x);
        nextRank = offsetRank(nextRank, y);
        piece = state.positionLookup.get(`${nextFile}${nextRank}`);
        count++;
    }

    return validSpaces;
};

const multiRayCast = (piece: ActiveGamePiece, state: GameState, ...rays: [RayCastDirection, RayCastDirection, number | undefined][]) =>
    flattenArray(rays.map(([x, y, length]) =>
        rayCast(state, [piece.file, piece.rank], [x, y], length)
        .map<PieceMovement | undefined>(([file, rank, otherPiece]) => {
            if (otherPiece?.player === piece.player) return undefined;

            return {
                movedPieces: [{ from: [piece.file, piece.rank], to: [file, rank], piece }],
                capturedPieces: otherPiece ? [otherPiece] : [],
            };
        })
        .filter((result): result is PieceMovement => typeof result !== 'undefined')));