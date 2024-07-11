import { useEffect, useRef, useState } from "react";
import "./game.css";

type Empty = "";
type Player1 = "X";
type Player2 = "O";
type CellState = Empty | Player1 | Player2;
type GameState = CellState[];

type GameProps = {
  size: number;
  state: GameState;
  onClick: (index: number) => void;
};

const EMPTY: Empty = "";
const PLAYER_1: Player1 = "X";
const PLAYER_2: Player2 = "O";
const PLAYERS = [PLAYER_1, PLAYER_2];

export function Game({ size, state, onClick }: GameProps) {
  return (
    <div className="game">
      {Array.from({ length: size * size }).map((_, index) => {
        return (
          <div key={index} className="cell" onClick={() => onClick(index)}>
            {state[index]}
          </div>
        );
      })}
    </div>
  );
}

type IndexToRowProps = {
  index: number;
  size: number;
};

function indexToRow({ index, size }: IndexToRowProps) {
  return Math.floor(index / size);
}

type IndexToColumnProps = {
  index: number;
  size: number;
};

function indexToColumn({ index, size }: IndexToColumnProps) {
  return index % size;
}

type CheckProps = {
  state: GameState;
  size: number;
};

type CheckResult = {
  [PLAYER_1]: number;
  [PLAYER_2]: number;
};

function checkVertical({ state, size }: CheckProps): Promise<boolean> {
  return new Promise((resolve) => {
    const result: CheckResult[] = state.reduce(
      (acc: CheckResult[], value: CellState, index: number): CheckResult[] => {
        if (value === EMPTY) {
          return acc;
        }

        const column = indexToColumn({ index, size });

        acc[column][value] += 1;

        return acc;
      },
      Array.from({ length: size }).map(() => ({
        [PLAYER_1]: 0,
        [PLAYER_2]: 0,
      })),
    );

    resolve(
      result.some((row) => row[PLAYER_1] === size || row[PLAYER_2] === size),
    );
  });
}

function checkHorizontal({ state, size }: CheckProps): Promise<boolean> {
  return new Promise((resolve) => {
    const result: CheckResult[] = state.reduce(
      (acc: CheckResult[], value: CellState, index: number): CheckResult[] => {
        if (value === EMPTY) {
          return acc;
        }

        const row = indexToRow({ index, size });

        acc[row][value] += 1;

        return acc;
      },
      Array.from({ length: size }).map(() => ({
        [PLAYER_1]: 0,
        [PLAYER_2]: 0,
      })),
    );

    resolve(
      result.some((row) => row[PLAYER_1] === size || row[PLAYER_2] === size),
    );
  });
}

function checkDiagonal({ state, size }: CheckProps): Promise<boolean> {
  return new Promise((resolve) => {
    const result: CheckResult[] = state.reduce(
      (acc: CheckResult[], value: CellState, index: number): CheckResult[] => {
        if (value === EMPTY) {
          return acc;
        }

        const row = indexToRow({ index, size });
        const column = indexToColumn({ index, size });

        if (row === column) {
          acc[0][value] += 1;
        }

        if (row === size - 1 - column) {
          acc[1][value] += 1;
        }

        return acc;
      },
      Array.from({ length: 2 }).map(() => ({
        [PLAYER_1]: 0,
        [PLAYER_2]: 0,
      })),
    );

    resolve(
      result.some((row) => row[PLAYER_1] === size || row[PLAYER_2] === size),
    );
  });
}

function checkAllFilled({ state }: CheckProps): boolean {
  return state.every((value) => value !== EMPTY);
}

async function checkWinner({ state, size }: CheckProps): Promise<boolean> {
  const result = await Promise.all([
    checkHorizontal({ state, size }),
    checkVertical({ state, size }),
    checkDiagonal({ state, size }),
  ]);

  return result.some((value) => value);
}

enum PlayState {
  Ready,
  Busy,
}

export function App() {
  const size = 3;
  const gameState = useRef(PlayState.Ready);
  const [winner, setWinner] = useState<null | Empty | Player1 | Player2>(null);
  const [turn, setTurn] = useState(0);
  const [state, setState] = useState<GameState>(
    Array.from({ length: size * size }).map(() => EMPTY),
  );
  const player = PLAYERS[turn % PLAYERS.length];

  const handleClick = async (index: number) => {
    if (gameState.current !== PlayState.Ready || state[index] !== EMPTY) {
      return;
    }

    const nextState = [...state];
    nextState[index] = player;

    gameState.current = PlayState.Busy;
    setState(nextState);
    setTurn(turn + 1);
  };

  useEffect(() => {
    checkWinner({ state, size }).then((hasWinner) => {
      if (hasWinner) {
        const player = PLAYERS[(turn - 1) % PLAYERS.length];
        setWinner(player);
      } else if (checkAllFilled({ state, size })) {
        setWinner(EMPTY);
      }

      gameState.current = PlayState.Ready;
    });
  }, [state, size, turn]);

  return (
    <>
      {winner !== null && (
        <div className="winner">
          {winner === EMPTY ? "Draw" : `Player ${winner} wins`}
        </div>
      )}

      <Game size={size} state={state} onClick={handleClick} />
    </>
  );
}
