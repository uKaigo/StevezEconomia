enum Players {
  X,
  O,
  UNSET
}

export class TicTacToe {
  table: Players[][]
  turn: Players.X | Players.O

  constructor () {
    this.table = [
      [Players.UNSET, Players.UNSET, Players.UNSET],
      [Players.UNSET, Players.UNSET, Players.UNSET],
      [Players.UNSET, Players.UNSET, Players.UNSET]
    ]

    this.turn = Players.X
  }

  get validMoves () {
    const moves: number[] = []

    for (const column in this.table) {
      for (const row in this.table[Number(column)]) {
        const move = 3 * Number(column) + 1 + Number(row)

        if (this.getSquare(move - 1) === Players.UNSET) {
          moves.push(move)
        }
      }
    }

    return moves
  }

  private getSquare (move: number) {
    return this.table[Math.floor(move / 3)][move % 3]
  }

  makeMove (move: number) {
    if (move < 0 || move > 9) {
      throw new Error('O movimento deve ser de 0 a 9.')
    }

    if (this.getSquare(move) !== Players.UNSET) {
      throw new Error('Movimento já jogado.')
    }

    this.table[Math.floor(move / 3)][move % 3] = this.turn
    this.turn = this.turn === Players.X ? Players.O : Players.X
  }

  get winner () {
    const winningSequences = [
      [0, 1, 2],
      [3, 4, 5],
      [6, 7, 8],
      [0, 3, 6],
      [1, 4, 7],
      [2, 5, 8],
      [0, 4, 8],
      [2, 4, 6]
    ]

    for (const sequence of winningSequences) {
      const resolved = sequence.map(this.getSquare.bind(this))
      if (resolved.includes(Players.UNSET)) {
        continue // Não use o continue!
      }

      if (resolved[0] === resolved[1] && resolved[1] === resolved[2]) {
        return resolved[0]
      }
    }

    return this.validMoves ? null : Players.UNSET
  }
}
