import { defineStore,  } from 'pinia'
import { pieces as rawPieces } from './pieces'

type Cell = {
    id: number,
    filled: boolean,
}

type Piece = {
    probability: number
    cumProb: number
    piece: Cell[][]
}

type State = {
    score: number
    width: number
    height: number
    field: Cell[][]
    pieceWidth: number
    pieceHeight: number
    pieceX: number
    pieceY: number
    piece: Cell[][]
    gameOver: boolean
}

const empty: Cell = { id: 0, filled: false, }
const filled: Cell = { id: 1, filled: true, }
const cells = [empty, filled]

let pieces: Piece[] = []
let totalProb = 0
for (const rawPiece of rawPieces) {
    totalProb += rawPiece.probability
    const piece = {
        probability: rawPiece.probability,
        cumProb: totalProb,
        piece: rawPiece.piece.map(row => row.map(c => cells[c])),
    }
    pieces.push(piece)
}

function createArray<T>(length: number, initialValue: T): T[] {
    return Array(length).fill(initialValue)
}

function create2DArray<T>(width: number, height: number, initialValue: T): T[][] {
    return Array.from(Array(height), () => createArray(width, initialValue))
}

function initPiece(state: State, piece: Piece) {
    state.piece = piece.piece
    state.pieceWidth = state.piece[0].length
    state.pieceHeight = state.piece.length
    state.pieceX = Math.floor((state.width - state.pieceWidth) / 2)
    state.pieceY = state.height - state.pieceHeight

    if (hasCollision(state)) {
        state.gameOver = true
    }
}

function newPiece(state: State) {
    const r = Math.random() * totalProb
    for (const piece of pieces) {
        if (r < piece.cumProb) {
            initPiece(state, piece)
            return
        }
    }
    initPiece(state, pieces[0])
}

function commitPiece(state: State) {
    for (let x = 0; x < state.pieceWidth; x++) {
        for (let y = 0; y < state.pieceHeight; y++) {
            if (state.piece[y][x].filled) {
                state.field[state.pieceY + y][state.pieceX + x] = state.piece[y][x]
            }
        }
    }
    removeFullRows(state)
}

function removeRow(state: State, row: number) {
    for (let y = row; y < state.height - 1; y++) {
        state.field[y] = state.field[y + 1]
    }
    state.field[state.height - 1] = createArray(state.width, empty)
}

function removeFullRows(state: State) {
    let totalRemoved = 0
    for (let y = 0; y < state.height; y++) {
        while (state.field[y].every(c => c.filled)) {
            removeRow(state, y)
            totalRemoved++
        }
    }
    state.score += 100 * totalRemoved * totalRemoved
}

function hasCollision(state: State) {
    if (state.pieceY < 0
        || state.pieceX < 0
        || state.pieceX + state.pieceWidth > state.width
        || state.pieceY + state.pieceHeight > state.height) {
        return true
    }

    for (let x = 0; x < state.pieceWidth; x++) {
        for (let y = 0; y < state.pieceHeight; y++) {
            if (state.piece[y][x].filled && state.field[state.pieceY + y][state.pieceX + x].filled) {
                return true
            }
        }
    }

    return false;
}

function moveLeft(state: State) {
    if (state.gameOver) return;
    state.pieceX -= 1
    if (hasCollision(state)) {
        state.pieceX += 1
    }
}

function moveRight(state: State) {
    if (state.gameOver) return;
    state.pieceX += 1
    if (hasCollision(state)) {
        state.pieceX -= 1
    }
}

function moveDown(state: State) {
    if (state.gameOver) return;
    state.pieceY -= 1
    if (hasCollision(state)) {
        state.pieceY += 1
        commitPiece(state)
        newPiece(state)
    }
}

function rotate(state: State) {
    if (state.gameOver) return;
    let oldPiece = state.piece
    let oldPieceX = state.pieceX
    let oldPieceY = state.pieceY

    let newPiece = create2DArray(state.pieceHeight, state.pieceWidth, empty)
    for (let x = 0; x < state.pieceWidth; x++) {
        for (let y = 0; y < state.pieceHeight; y++) {
            newPiece[state.pieceWidth - x - 1][y] = state.piece[y][x]
        }
    }
    state.piece = newPiece
    state.pieceWidth = state.piece[0].length
    state.pieceHeight = state.piece.length
    if (state.pieceWidth - state.pieceHeight > 2) {
        state.pieceX -= 1
        state.pieceY += 1
    }

    if (state.pieceHeight - state.pieceWidth > 2) {
        state.pieceX += 1
        state.pieceY -= 1
    }

    if (state.pieceX < 0) {
        state.pieceX++
    }

    if (state.pieceX + state.pieceWidth > state.width) {
        state.pieceX--
    }

    while (state.pieceY + state.pieceHeight > state.height) {
        state.pieceY--
    }

    if (hasCollision(state)) {
        state.piece = oldPiece
        state.pieceX = oldPieceX
        state.pieceY = oldPieceY
        state.pieceWidth = state.piece[0].length
        state.pieceHeight = state.piece.length
    }
}

function drop(state: State) {
    if (state.gameOver) return;
    while (!hasCollision(state)) {
        state.pieceY -= 1
    }
    state.pieceY += 1
    commitPiece(state)
    newPiece(state)
}

export const useStore = defineStore({
    id: 'game',
    state: () => {
        let width = 10
        let height = 20
        let pieceWidth = 4
        let pieceHeight = 4
        let pieceX = 0
        let pieceY = 0

        const state: State = {
            score: 0,
            width,
            height,
            field: create2DArray(width, height, empty),
            pieceWidth,
            pieceHeight,
            pieceX,
            pieceY,
            piece: create2DArray(pieceWidth, pieceHeight, empty),
            gameOver: false
        }
        return state
    },
    actions: {
        tick() {
            if (this.gameOver) return;
            this.$patch(moveDown)
        },
        init() {
            this.$reset()
            this.$patch((state) => {
                for (let x = 0; x < state.width; x++) {
                    for (let y = 0; y < 2; y++) {
                        const r = Math.random() * 3
                        const content = r < 1 ? filled : empty
                        state.field[y][x] = content
                    }
                }
                newPiece(state)
            })
        },
        moveLeft() {
            if (this.gameOver) return;
            this.$patch(moveLeft)
        },
        moveRight() {
            if (this.gameOver) return;
            this.$patch(moveRight)
        },
        rotate() {
            if (this.gameOver) return;
            this.$patch(rotate)
        },
        moveDown() {
            if (this.gameOver) return;
            this.$patch(moveDown)
        },
        drop() {
            if (this.gameOver) return;
            this.$patch(drop)
        },
    },
})

export const useRunner = defineStore({
    id: 'game-runner',
    state: () => {
        const game = useStore()
        let result: {
            game: typeof game
            tickIntervalId?: number
            tickInterval: number
        } = {
            game,
            tickIntervalId: undefined,
            tickInterval: 1000
        }
        return result;
    },
    actions: {
        start() {
            if (this.tickIntervalId === undefined) {
                this.tickIntervalId = setInterval(() => this.game.tick(), this.tickInterval);
            }
        },
        stop() {
            if (this.tickIntervalId !== undefined) {
                clearInterval(this.tickIntervalId);
                this.tickIntervalId = undefined;
            }
        },
    }
})
