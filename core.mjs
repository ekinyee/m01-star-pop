export const SIZE = 6;
export const COLORS = 4;
export const MOVES = 20;
export const TARGET = 1200;

export function randomSource(seed) {
  let value = seed >>> 0;
  return () => {
    value = (Math.imul(value, 1664525) + 1013904223) >>> 0;
    return value / 4294967296;
  };
}

export function groupAt(board, row, col) {
  if (!Number.isInteger(row) || !Number.isInteger(col) || row < 0 || col < 0 || row >= board.length || col >= board[0].length) return [];
  const color = board[row][col];
  if (color === null) return [];
  const result = [], seen = new Set(), queue = [[row, col]];
  while (queue.length) {
    const [r, c] = queue.pop(), key = `${r}:${c}`;
    if (r < 0 || c < 0 || r >= board.length || c >= board[0].length || seen.has(key) || board[r][c] !== color) continue;
    seen.add(key); result.push([r, c]);
    queue.push([r - 1, c], [r + 1, c], [r, c - 1], [r, c + 1]);
  }
  return result;
}

export function hasMove(board) {
  return board.some((line, r) => line.some((color, c) => color !== null && ((r + 1 < board.length && board[r + 1][c] === color) || (c + 1 < line.length && line[c + 1] === color))));
}

function ensureMove(board) {
  if (!hasMove(board)) board[0][1] = board[0][0];
  return board;
}

export function createBoard(random) {
  return ensureMove(Array.from({ length: SIZE }, () => Array.from({ length: SIZE }, () => Math.floor(random() * COLORS))));
}

export function clearGroup(board, group, random) {
  const copy = board.map(line => [...line]);
  for (const [r, c] of group) copy[r][c] = null;
  for (let c = 0; c < copy[0].length; c++) {
    const kept = copy.map(line => line[c]).filter(color => color !== null);
    const missing = copy.length - kept.length;
    const column = Array.from({ length: missing }, () => Math.floor(random() * COLORS)).concat(kept);
    for (let r = 0; r < copy.length; r++) copy[r][c] = column[r];
  }
  const rescued = !hasMove(copy);
  ensureMove(copy);
  return { board: copy, rescued };
}

export function newGame(seed = Date.now()) {
  const random = randomSource(seed);
  return { board: createBoard(random), score: 0, moves: MOVES, status: "playing", random };
}

export function play(state, row, col) {
  if (state.status !== "playing") return { accepted: false, reason: "finished", state };
  const group = groupAt(state.board, row, col);
  if (group.length < 2) return { accepted: false, reason: "single", state };
  const points = group.length * (group.length - 1) * 10;
  const cleared = clearGroup(state.board, group, state.random);
  const score = state.score + points, moves = state.moves - 1;
  const status = score >= TARGET ? "won" : moves === 0 ? "lost" : "playing";
  return { accepted: true, group, points, rescued: cleared.rescued, state: { ...state, board: cleared.board, score, moves, status } };
}
