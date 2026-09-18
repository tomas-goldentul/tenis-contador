import type { Match } from "../types";

export function pct(part: number, total: number): number | null {
  return total === 0 ? null : Math.round((part / total) * 1000) / 10;
}

export interface MatchStats {
  firstServeIn: number;
  firstServeOut: number;
  firstServeAttempts: number;
  firstServePct: number | null;
  secondServeIn: number;
  secondServeOut: number;
  secondServeAttempts: number;
  secondServePct: number | null;
  doubleFaults: number;
  aces: number;
  winners: number;
  unforcedErrors: number;
  ratio: number | null;
  winnersForehand: number;
  winnersBackhand: number;
  unforcedErrorsForehand: number;
  unforcedErrorsBackhand: number;
}

export function computeMatchStats(m: Pick<
  Match,
  | "firstServeIn"
  | "firstServeOut"
  | "secondServeIn"
  | "secondServeOut"
  | "aces"
  | "winnersForehand"
  | "winnersBackhand"
  | "unforcedErrorsForehand"
  | "unforcedErrorsBackhand"
>): MatchStats {
  const firstServeAttempts = m.firstServeIn + m.firstServeOut;
  const secondServeAttempts = m.secondServeIn + m.secondServeOut;
  const winners = m.winnersForehand + m.winnersBackhand;
  const unforcedErrors = m.unforcedErrorsForehand + m.unforcedErrorsBackhand;
  return {
    firstServeIn: m.firstServeIn,
    firstServeOut: m.firstServeOut,
    firstServeAttempts,
    firstServePct: pct(m.firstServeIn, firstServeAttempts),
    secondServeIn: m.secondServeIn,
    secondServeOut: m.secondServeOut,
    secondServeAttempts,
    secondServePct: pct(m.secondServeIn, secondServeAttempts),
    doubleFaults: m.secondServeOut,
    aces: m.aces,
    winners,
    unforcedErrors,
    winnersForehand: m.winnersForehand,
    winnersBackhand: m.winnersBackhand,
    unforcedErrorsForehand: m.unforcedErrorsForehand,
    unforcedErrorsBackhand: m.unforcedErrorsBackhand,
    ratio: unforcedErrors === 0 ? null : Math.round((winners / unforcedErrors) * 100) / 100,
  };
}

export interface MatchCounters {
  firstServeIn: number;
  firstServeOut: number;
  secondServeIn: number;
  secondServeOut: number;
  aces: number;
  winnersForehand: number;
  winnersBackhand: number;
  unforcedErrorsForehand: number;
  unforcedErrorsBackhand: number;
}

export function mergeMatchStats(matches: MatchCounters[]): MatchStats {
  const total: MatchStats = {
    firstServeIn: 0,
    firstServeOut: 0,
    firstServeAttempts: 0,
    firstServePct: null,
    secondServeIn: 0,
    secondServeOut: 0,
    secondServeAttempts: 0,
    secondServePct: null,
    doubleFaults: 0,
    aces: 0,
    winners: 0,
    unforcedErrors: 0,
    ratio: null,
    winnersForehand: 0,
    winnersBackhand: 0,
    unforcedErrorsForehand: 0,
    unforcedErrorsBackhand: 0,
  };
  for (const m of matches) {
    total.firstServeIn += m.firstServeIn;
    total.firstServeOut += m.firstServeOut;
    total.secondServeIn += m.secondServeIn;
    total.secondServeOut += m.secondServeOut;
    total.aces += m.aces;
    total.winnersForehand += m.winnersForehand;
    total.winnersBackhand += m.winnersBackhand;
    total.unforcedErrorsForehand += m.unforcedErrorsForehand;
    total.unforcedErrorsBackhand += m.unforcedErrorsBackhand;
  }
  total.winners = total.winnersForehand + total.winnersBackhand;
  total.unforcedErrors = total.unforcedErrorsForehand + total.unforcedErrorsBackhand;
  total.firstServeAttempts = total.firstServeIn + total.firstServeOut;
  total.secondServeAttempts = total.secondServeIn + total.secondServeOut;
  total.firstServePct = pct(total.firstServeIn, total.firstServeAttempts);
  total.secondServePct = pct(total.secondServeIn, total.secondServeAttempts);
  total.ratio = total.unforcedErrors === 0 ? null : Math.round((total.winners / total.unforcedErrors) * 100) / 100;
  return total;
}

export function computeDrillStats(events: Array<{ successful: boolean }>): {
  total: number;
  successful: number;
  pct: number | null;
} {
  const total = events.length;
  const successful = events.filter((e) => e.successful).length;
  return { total, successful, pct: pct(successful, total) };
}