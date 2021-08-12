import { match } from 'ts-pattern';

export const withPieces = <TSpecific extends GamePieceType>(pieces: Record<TSpecific, PieceMoveCalculator<TSpecific>>) => {
    const beginGame: GameConstructor<TSpecific> = (initialState: BoardState<TSpecific> | undefined) => {
        const state = [...(initialState ?? standardInitialState).map(p => ({ ...p, possibleMoves: [], moveHistory: [] }))] as ActiveBoardState<TSpecific>;
        const pieceLookup = new Map<string, ActiveGamePiece<TSpecific>>();
        const allCaptures: ActiveBoardState<TSpecific> = [];

        const history: [[File, Rank], [File, Rank], ActiveGamePiece<TSpecific>[]][] = [];

        const buildCache = () => {
            // Update the position lookup table
            pieceLookup.clear();
            state.forEach(piece => pieceLookup.set(`${piece.file}${piece.rank}`, piece));

            // Update the possible moves for each piece
            state.forEach(piece => piece.possibleMoves = pieces[piece.type](piece, pieceLookup, history));
        };

        buildCache();

        const game: ChessGame<TSpecific> = {
            getPiece: (file, rank) => pieceLookup.get(`${file}${rank}`),
            movePiece: ([fromFile, fromRank], [toFile, toRank]) => {
                const piece = pieceLookup.get(`${fromFile}${fromRank}`);
                if (!piece) return;

                const move = piece.possibleMoves.find(({ destination: [f, r]}) => f === toFile && r === toRank);
                if (!move) return;

                piece.file = toFile;
                piece.rank = toRank;

                // TODO: This isn't accounted for in the history.
                // Probably should rethink that API
                move.otherMovedPieces.forEach(([piece, f, r]) => {
                    piece.file = f;
                    piece.rank = r;
                });

                const { captures } = move;
                captures.forEach(capture => {
                    allCaptures.push(capture);
                    state.splice(state.indexOf(capture), 1);
                });

                const to = [toFile, toRank] as [File, Rank];
                history.push([[fromFile, fromRank], to, captures]);
                piece.moveHistory.push(to);
                buildCache();
            },
            undo: () => {
                const lastMove = history.pop();
                if (!lastMove) return;

                const [[fromFile, fromRank], [toFile, toRank], captures] = lastMove;

                const piece = pieceLookup.get(`${toFile}${toRank}`)!;
                piece.file = fromFile;
                piece.rank = fromRank;
                piece.moveHistory.pop();

                captures.forEach(capture => {
                    state.push(capture);
                    allCaptures.slice(captures.indexOf(capture), 1);
                });

                buildCache();
            },

            pieces: state,
            capturedPieces: allCaptures,
        };

        return game;
    };

    const piecePool: PiecePool<TSpecific> = {
        beginGame,
    };

    return piecePool;
};

export const withStandardPieces = () => withPieces(standardPieces);
export const withCustomPieces = <TCustom extends CustomPieceType>(customPieces: Record<TCustom, PieceMoveCalculator<TCustom>>) => withPieces({ ...standardPieces, ...customPieces }) as PiecePool<StandardPieceType | TCustom>;

export type ActiveBoardState<TSpecific extends GamePieceType> = ActiveGamePiece<TSpecific>[];
export type BoardState<TSpecific extends GamePieceType> = GamePiece<TSpecific>[];
type GameConstructor<TSpecific extends GamePieceType> =
    StandardPieceType extends TSpecific
    ? (initialState?: BoardState<TSpecific>) => ChessGame<TSpecific>
    : (initialState: BoardState<TSpecific>) => ChessGame<TSpecific>;

export interface PiecePool<TSpecific extends GamePieceType> {
    beginGame: GameConstructor<TSpecific>;
}
export interface ChessGame<TSpecific extends GamePieceType> {
    getPiece: (file: File, rank: Rank) => ActiveGamePiece<TSpecific> | undefined;
    movePiece: (from: [File, Rank], to: [File, Rank]) => void;
    undo: () => void;
    pieces: ActiveGamePiece<TSpecific>[];
    capturedPieces: ActiveGamePiece<TSpecific>[];
}
export interface ActiveGamePiece<TSpecific extends GamePieceType> extends GamePiece<TSpecific> {
    possibleMoves: ReturnType<PieceMoveCalculator<TSpecific>>;
    moveHistory: [File, Rank][];
}
export interface GamePiece<TSpecific extends GamePieceType> {
    type: TSpecific;
    file: File;
    rank: Rank;
    player: Player;
}

export const standardInitialState: readonly GamePiece<StandardPieceType>[] = Object.freeze([
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

interface MoveCalculationResult<TSpecific extends GamePieceType> {
    destination: [File, Rank];
    otherMovedPieces: [ActiveGamePiece<TSpecific>, File, Rank][];
    captures: ActiveGamePiece<TSpecific>[];
}

const rayCast = <TSpecific extends GamePieceType>(pieceLookup: Map<string, ActiveGamePiece<TSpecific>>, [file, rank]: [File, Rank], [x, y]: [RayCastDirection, RayCastDirection], length?: number) => {
    length = length ?? 8;
    const validSpaces: [File, Rank, ActiveGamePiece<TSpecific> | undefined][] = [];

    let nextFile = offsetFile(file, x);
    let nextRank = offsetRank(rank, y);
    let piece = pieceLookup.get(`${nextFile}${nextRank}`);
    let count = 0;
    while (nextFile && nextRank && count < length) {
        validSpaces.push([nextFile, nextRank, piece]);
        if (piece) break;

        nextFile = offsetFile(nextFile, x);
        nextRank = offsetRank(nextRank, y);
        piece = pieceLookup.get(`${nextFile}${nextRank}`);
        count++;
    }

    return validSpaces;
};

// TODO: Move somewhere else
const flattenArray = <T>(arr: T[][]) => ([] as T[]).concat.apply([], arr);

const multiRayCast = <TSpecific extends GamePieceType>(pieceLookup: Map<string, ActiveGamePiece<TSpecific>>, piece: ActiveGamePiece<TSpecific>, ...rays: [RayCastDirection, RayCastDirection, number | undefined][]) =>
    flattenArray(rays.map(([x, y, length]) =>
        rayCast(pieceLookup, [piece.file, piece.rank], [x, y], length)
        .map<MoveCalculationResult<TSpecific> | undefined>(([file, rank, otherPiece]) => otherPiece && otherPiece.player !== piece.player ? { destination: [file, rank], otherMovedPieces: [], captures: [otherPiece] } : otherPiece ? undefined : { destination: [file, rank], otherMovedPieces: [], captures: [] })
        .filter((result): result is MoveCalculationResult<TSpecific> => typeof result !== 'undefined')));

// TODO: Promotion needs to be something that is part of the return value.
export type PieceMoveCalculator<TSpecific extends GamePieceType> = (piece: ActiveGamePiece<TSpecific>, pieceLookup: Map<string, ActiveGamePiece<TSpecific>>, history: [[File, Rank], [File, Rank], ActiveGamePiece<TSpecific>[]][]) => MoveCalculationResult<TSpecific>[];

// TODO: instead of a piece definition, break them into rules, that way you can turn them off.
// I think the API will be much simpler and cleaner that way too.
const standardPieces: Record<StandardPieceType, PieceMoveCalculator<StandardPieceType>> = Object.freeze({
    pawn: (piece, pieceLookup, history) => {
        const moves: MoveCalculationResult<StandardPieceType>[] = [];
        // TODO
        const promotionRank = piece.player === 'white' ? 8 : 1;

        // Standard move forward
        let rank = piece.player === 'white' ? piece.rank + 1 : piece.rank - 1;
        let otherPiece = pieceLookup.get(`${piece.file}${rank}`);
        if (Rank.guard(rank) && !otherPiece) {
            moves.push({
                destination: [piece.file, rank],
                otherMovedPieces: [],
                captures: [],
            });
        }

        // Quick Start
        if (piece.moveHistory.length === 0) {
            rank = piece.player === 'white' ? 4 : 5;
            const castResult = rayCast(pieceLookup, [piece.file, piece.rank], [0, piece.player === 'white' ? 1 : -1], 2);
            if (castResult.length === 2) {
                if (!castResult[1][2]) moves.push({
                    destination: [piece.file, rank as Rank],
                    otherMovedPieces: [],
                    captures: [],
                });
            }
        }

        // Captures
        rank = piece.player === 'white' ? piece.rank + 1 : piece.rank - 1;
        const otherFiles = [offsetFile(piece.file, 1), offsetFile(piece.file, -1)].filter(file => file);
        otherFiles.forEach(file => {
            // Standard Capture
            otherPiece = pieceLookup.get(`${file!}${rank}`);
            if (otherPiece && otherPiece.player !== piece.player) {
                moves.push({
                    destination: [file!, rank as Rank],
                    otherMovedPieces: [],
                    captures: [otherPiece],
                });
            }

            // En Passant
            if (piece.rank !== (piece.player === 'white' ? 5 : 4)) return;

            otherPiece = pieceLookup.get(`${file!}${rank + (piece.player === 'white' ? -1 : 1)}`);
            if (otherPiece && otherPiece.moveHistory.length === 1 && otherPiece.moveHistory[0] === history[history.length - 1][1]) {
                moves.push({
                    destination: [file!, rank as Rank],
                    otherMovedPieces: [],
                    captures: [otherPiece],
                });
            }
        });

        return moves;
    },
    rook: (piece, pieceLookup) => multiRayCast(pieceLookup, piece, [-1, 0, undefined], [1, 0, undefined], [0, -1, undefined], [0, 1, undefined]),
    knight: (piece, pieceLookup) => {
        const moves: MoveCalculationResult<StandardPieceType>[] = [];

        const potentials: [File | undefined, Rank | undefined][] = [
            [offsetFile(piece.file, -1), offsetRank(piece.rank, 2)],
            [offsetFile(piece.file, 1), offsetRank(piece.rank, 2)],
            [offsetFile(piece.file, -2), offsetRank(piece.rank, 1)],
            [offsetFile(piece.file, 2), offsetRank(piece.rank, 1)],
            [offsetFile(piece.file, -2), offsetRank(piece.rank, -1)],
            [offsetFile(piece.file, 2), offsetRank(piece.rank, -1)],
            [offsetFile(piece.file, -1), offsetRank(piece.rank, -2)],
            [offsetFile(piece.file, 1), offsetRank(piece.rank, -2)],
        ];
        const actuals = potentials.filter((position): position is [File, Rank] => !(!position[0] || !position[1]));

        actuals.forEach(([file, rank]) => {
            const otherPiece = pieceLookup.get(`${file}${rank}`);
            if (file && rank && (!otherPiece || otherPiece.player !== piece.player)) {
                moves.push({
                    destination: [file, rank],
                    otherMovedPieces: [],
                    captures: otherPiece ? [otherPiece] : [],
                });
            }
        });

        return moves;
    },
    bishop: (piece, pieceLookup) => multiRayCast(pieceLookup, piece, [-1, -1, undefined], [-1, 1, undefined], [1, -1, undefined], [1, 1, undefined]),
    queen: (piece, pieceLookup, history) => [
        ...standardPieces.rook(piece, pieceLookup, history),
        ...standardPieces.bishop(piece, pieceLookup, history),
    ],
    king: (piece, pieceLookup) => {
        const moves = multiRayCast(
            pieceLookup,
            piece,
            [-1, -1, 1],
            [-1, 0, 1],
            [-1, 1, 1],
            [0, -1, 1],
            [0, 1, 1],
            [1, -1, 1],
            [1, 0, 1],
            [1, 1, 1],
        );

        // Castling
        if (piece.moveHistory.length === 0) {
            const rank = piece.player === 'white' ? 1 : 8;
            const otherPieces = [...pieceLookup.values()].filter(({ player }) => player !== piece.player);
            
            // King-side castle
            let rook = pieceLookup.get(`h${rank}`);
            let path = [['f', rank], ['g', rank]];
            if (rook && rook.type === 'rook' && rook.moveHistory.length === 0 && !path.some(([f, r]) => pieceLookup.get(`${f}${r}`)) && !path.some(path => otherPieces.some(p => p.possibleMoves.some(m => m.destination[0] === path[0] && m.destination[1] === path[1])))) {
                moves.push({
                    destination: ['g', rank],
                    otherMovedPieces: [[rook, 'f', rank]],
                    captures: [],
                });
            }

            // Queen-side castle
            rook = pieceLookup.get(`a${rank}`);
            path = [['c', rank], ['d', rank]];
            if (rook && rook.type === 'rook' && rook.moveHistory.length === 0 && !path.some(([f, r]) => pieceLookup.get(`${f}${r}`)) && !path.some(path => otherPieces.some(p => p.possibleMoves.some(m => m.destination[0] === path[0] && m.destination[1] === path[1])))) {
                moves.push({
                    destination: ['c', rank],
                    otherMovedPieces: [[rook, 'd', rank]],
                    captures: [],
                });
            }
        }

        return moves;
    },
});

// // TODO: Move somewhere else
const makeUnion = <TBase>() => <TUnion extends TBase>(...values: TUnion[]) => {
    Object.freeze(values);
    const valueSet: Set<TBase> = new Set(values);

    const guard = (value: TBase): value is TUnion => valueSet.has(value);

    const unionNamespace = { guard, values };
    return Object.freeze(unionNamespace as typeof unionNamespace & { type: TUnion });
};

export const Player = makeUnion<string>()('white', 'black');
export type Player = typeof Player.type;

export const Rank = makeUnion<number>()(1, 2, 3, 4, 5, 6, 7, 8);
export type Rank = typeof Rank.type;

export const File = makeUnion<string>()('a', 'b', 'c', 'd', 'e', 'f', 'g', 'h');
export type File = typeof File.type;

const offsetFile = (file: File, amount: number) =>
    match<[File, number], File | undefined>([file, amount])
    .with(['a', 0], () => 'a')
    .with(['a', 1], () => 'b')
    .with(['a', 2], () => 'c')
    .with(['a', 3], () => 'd')
    .with(['a', 4], () => 'e')
    .with(['a', 5], () => 'f')
    .with(['a', 6], () => 'g')
    .with(['a', 7], () => 'h')
    .with(['b', -1], () => 'a')
    .with(['b', 0], () => 'b')
    .with(['b', 1], () => 'c')
    .with(['b', 2], () => 'd')
    .with(['b', 3], () => 'e')
    .with(['b', 4], () => 'f')
    .with(['b', 5], () => 'g')
    .with(['b', 6], () => 'h')
    .with(['c', -2], () => 'a')
    .with(['c', -1], () => 'b')
    .with(['c', 0], () => 'c')
    .with(['c', 1], () => 'd')
    .with(['c', 2], () => 'e')
    .with(['c', 3], () => 'f')
    .with(['c', 4], () => 'g')
    .with(['c', 5], () => 'h')
    .with(['d', -3], () => 'a')
    .with(['d', -2], () => 'b')
    .with(['d', -1], () => 'c')
    .with(['d', 0], () => 'd')
    .with(['d', 1], () => 'e')
    .with(['d', 2], () => 'f')
    .with(['d', 3], () => 'g')
    .with(['d', 4], () => 'h')
    .with(['e', -4], () => 'a')
    .with(['e', -3], () => 'b')
    .with(['e', -2], () => 'c')
    .with(['e', -1], () => 'd')
    .with(['e', 0], () => 'e')
    .with(['e', 1], () => 'f')
    .with(['e', 2], () => 'g')
    .with(['e', 3], () => 'h')
    .with(['f', -5], () => 'a')
    .with(['f', -4], () => 'b')
    .with(['f', -3], () => 'c')
    .with(['f', -2], () => 'd')
    .with(['f', -1], () => 'e')
    .with(['f', 0], () => 'f')
    .with(['f', 1], () => 'g')
    .with(['f', 2], () => 'h')
    .with(['g', -6], () => 'a')
    .with(['g', -5], () => 'b')
    .with(['g', -4], () => 'c')
    .with(['g', -3], () => 'd')
    .with(['g', -2], () => 'e')
    .with(['g', -1], () => 'f')
    .with(['g', 0], () => 'g')
    .with(['g', 1], () => 'h')
    .with(['h', -7], () => 'a')
    .with(['h', -6], () => 'b')
    .with(['h', -5], () => 'c')
    .with(['h', -4], () => 'd')
    .with(['h', -3], () => 'e')
    .with(['h', -2], () => 'f')
    .with(['h', -1], () => 'g')
    .with(['h', 0], () => 'h')
    .otherwise(() => undefined);

const offsetRank = (rank: Rank, amount: number) =>
    Rank.guard(rank + amount) ? rank + amount as Rank : undefined;

export const StandardPieceType = makeUnion<string>()('pawn', 'rook', 'knight', 'bishop', 'queen', 'king');
export type StandardPieceType = typeof StandardPieceType.type;

export type CustomPieceType = Exclude<string, StandardPieceType>;
export type GamePieceType = StandardPieceType | CustomPieceType;

const RayCastDirection = makeUnion<number>()(-1, 0, 1);
type RayCastDirection = typeof RayCastDirection.type;