import campusGrid from './campus-grid.json'

const gridMatrix = campusGrid.grid
const ROWS = campusGrid.height
const COLS = campusGrid.width

const dirs = [
  [1, 0],
  [-1, 0],
  [0, 1],
  [0, -1],
]

export function getGridMeta() {
  return {
    rows: ROWS,
    cols: COLS,
    matrix: gridMatrix,
  }
}

export function nearestWalkable(row, col) {
  const clampRow = Math.min(Math.max(row, 0), ROWS - 1)
  const clampCol = Math.min(Math.max(col, 0), COLS - 1)
  if (gridMatrix[clampRow][clampCol] === 0) {
    return { row: clampRow, col: clampCol }
  }

  const visited = Array.from({ length: ROWS }, () => Array(COLS).fill(false))
  const queue = []
  queue.push([clampRow, clampCol])
  visited[clampRow][clampCol] = true

  while (queue.length) {
    const [r, c] = queue.shift()
    for (const [dr, dc] of dirs) {
      const nr = r + dr
      const nc = c + dc
      if (nr < 0 || nr >= ROWS || nc < 0 || nc >= COLS) continue
      if (visited[nr][nc]) continue
      visited[nr][nc] = true
      if (gridMatrix[nr][nc] === 0) {
        return { row: nr, col: nc }
      }
      queue.push([nr, nc])
    }
  }
  return null
}

class MinHeap {
  constructor() {
    this.items = []
  }

  push(node) {
    this.items.push(node)
    this.bubbleUp(this.items.length - 1)
  }

  pop() {
    if (!this.items.length) return null
    const top = this.items[0]
    const end = this.items.pop()
    if (this.items.length) {
      this.items[0] = end
      this.sinkDown(0)
    }
    return top
  }

  bubbleUp(idx) {
    while (idx > 0) {
      const parent = Math.floor((idx - 1) / 2)
      if (this.items[idx].f >= this.items[parent].f) break
      ;[this.items[idx], this.items[parent]] = [this.items[parent], this.items[idx]]
      idx = parent
    }
  }

  sinkDown(idx) {
    const length = this.items.length
    while (true) {
      let smallest = idx
      const left = idx * 2 + 1
      const right = idx * 2 + 2

      if (left < length && this.items[left].f < this.items[smallest].f) {
        smallest = left
      }
      if (right < length && this.items[right].f < this.items[smallest].f) {
        smallest = right
      }
      if (smallest === idx) break
      ;[this.items[idx], this.items[smallest]] = [this.items[smallest], this.items[idx]]
      idx = smallest
    }
  }

  get size() {
    return this.items.length
  }
}

const keyFor = (row, col) => `${row}:${col}`

export function findPath(start, goal) {
  if (!start || !goal) return null

  const startKey = keyFor(start.row, start.col)
  const goalKey = keyFor(goal.row, goal.col)
  if (startKey === goalKey) return [start]

  const open = new MinHeap()
  const gScore = Array.from({ length: ROWS }, () => Array(COLS).fill(Infinity))
  const cameFrom = new Map()
  const visited = new Set()

  const heuristic = (r, c) => Math.abs(r - goal.row) + Math.abs(c - goal.col)

  gScore[start.row][start.col] = 0
  open.push({ row: start.row, col: start.col, f: heuristic(start.row, start.col), g: 0 })

  while (open.size) {
    const current = open.pop()
    const currentKey = keyFor(current.row, current.col)
    if (visited.has(currentKey)) continue
    visited.add(currentKey)

    if (currentKey === goalKey) {
      const path = [{ row: current.row, col: current.col }]
      let backKey = currentKey
      while (cameFrom.has(backKey)) {
        const prev = cameFrom.get(backKey)
        path.push(prev)
        backKey = keyFor(prev.row, prev.col)
      }
      return path.reverse()
    }

    for (const [dr, dc] of dirs) {
      const nr = current.row + dr
      const nc = current.col + dc
      if (nr < 0 || nr >= ROWS || nc < 0 || nc >= COLS) continue
      if (gridMatrix[nr][nc] !== 0) continue

      const tentativeG = current.g + 1
      if (tentativeG >= gScore[nr][nc]) continue

      gScore[nr][nc] = tentativeG
      cameFrom.set(keyFor(nr, nc), { row: current.row, col: current.col })
      open.push({ row: nr, col: nc, g: tentativeG, f: tentativeG + heuristic(nr, nc) })
    }
  }

  return null
}
