export type PlayerSide = "self" | "opponent";

export type ServeDirection = "T" | "Body" | "Wide";

export type Surface = "Polvo de ladrillo" | "Dura";

export type FirstServeOutcome = "in" | "out" | "ace";

export type SecondServeOutcome = "in" | "out" | "doubleFault";

export type RallyShotType = "winner" | "unforcedError";

export type StrokeSide = "forehand" | "backhand";

export type PointEndedBy =
  | "ace"
  | "doubleFault"
  | "winner"
  | "unforcedError"
  | "netPoint"
  | "returnOut";

export interface ServeAttempt {
  outcome: string;
  direction: ServeDirection | null;
}

export interface PointData {
  server: PlayerSide;
  firstServe: ServeAttempt | null;
  secondServe: ServeAttempt | null;
  returns: Array<{ player: PlayerSide; in_: boolean }>;
  rally: Array<{
    player: PlayerSide;
    shotType: RallyShotType;
    strokeSide: StrokeSide;
  }>;
  net: Array<{ player: PlayerSide; won: boolean }>;
  result: { winner: PlayerSide; endedBy: PointEndedBy } | null;
}

export type Phase = "serve1" | "serve2" | "return" | "rally" | "pointEnd" | "newPoint";

export type Action =
  | {
      kind: "serve1";
      outcome: FirstServeOutcome;
      direction: ServeDirection | null;
    }
  | {
      kind: "serve2";
      outcome: SecondServeOutcome;
      direction: ServeDirection | null;
    }
  | { kind: "return"; outcome: "in" | "out" }
  | {
      kind: "rallyShot";
      player: PlayerSide;
      shotType: RallyShotType;
      strokeSide: StrokeSide;
    }
  | { kind: "netPoint"; player: PlayerSide; won: boolean }
  | { kind: "undo" }
  | { kind: "confirmNext"; server: PlayerSide };

export interface MachineState {
  phase: Phase;
  point: PointData;
  actionHistory: Action[];
}

export interface Match {
  id: string;
  surface: Surface;
  matchDate: string;
  firstServeIn: number;
  firstServeOut: number;
  secondServeIn: number;
  secondServeOut: number;
  aces: number;
  winnersForehand: number;
  winnersBackhand: number;
  unforcedErrorsForehand: number;
  unforcedErrorsBackhand: number;
  serveDirectionT: number;
  serveDirectionBody: number;
  serveDirectionWide: number;
  createdAt: string;
  updatedAt: string;
}

export type StatField =
  | "firstServeIn"
  | "firstServeOut"
  | "secondServeIn"
  | "secondServeOut"
  | "aces"
  | "winnersForehand"
  | "winnersBackhand"
  | "unforcedErrorsForehand"
  | "unforcedErrorsBackhand"
  | "serveDirectionT"
  | "serveDirectionBody"
  | "serveDirectionWide";

export type ServeDirectionLabel = "T" | "Cuerpo" | "Abierto";

export type StatDelta = Partial<Record<StatField, number>>;

export type DrillType = "Saque" | "Devolución" | "Red" | "Fondo";

export interface DrillSession {
  id: string;
  drillType: DrillType;
  drillName: string;
  targetShots: number;
  startedAt: string;
  finishedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface DrillEvent {
  id: string;
  sessionId: string;
  successful: boolean;
  shotSide: StrokeSide | null;
  createdAt: string;
  updatedAt: string;
}

export interface SyncQueueEntry {
  id?: number;
  tableName: string;
  operation: "upsert" | "delete";
  recordId: string;
  payload: string | null;
  createdAt: string;
  syncedAt: string | null;
}