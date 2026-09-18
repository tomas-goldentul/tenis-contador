import type {
  Action,
  MachineState,
  PlayerSide,
  PointData,
  PointEndedBy,
} from "../types";

export function otherSide(side: PlayerSide): PlayerSide {
  return side === "self" ? "opponent" : "self";
}

export function emptyPoint(server: PlayerSide): PointData {
  return {
    server,
    firstServe: null,
    secondServe: null,
    returns: [],
    rally: [],
    net: [],
    result: null,
  };
}

export function initialState(server: PlayerSide): MachineState {
  return {
    phase: "serve1",
    point: emptyPoint(server),
    actionHistory: [],
  };
}

function endPoint(state: MachineState, point: PointData, winner: PlayerSide, endedBy: PointEndedBy): MachineState {
  return {
    ...state,
    phase: "pointEnd",
    point: { ...point, result: { winner, endedBy } },
  };
}

function withPoint(state: MachineState, point: PointData, phase: MachineState["phase"]): MachineState {
  return { ...state, phase, point };
}

/**
 * Aplica una accion al mismo punto (sin tocar el historial).
 * Las acciones que terminan el punto fuerzan una fase terminal.
 */
function applyAction(state: MachineState, action: Action): MachineState {
  const { point } = state;
  const receiver = otherSide(point.server);

  switch (action.kind) {
    case "serve1": {
      const firstServe = { outcome: action.outcome, direction: action.direction };
      const next = { ...point, firstServe };
      if (action.outcome === "ace") {
        return endPoint(state, next, point.server, "ace");
      }
      if (action.outcome === "out") {
        return withPoint(state, next, "serve2");
      }
      return withPoint(state, next, "return");
    }

    case "serve2": {
      const secondServe = { outcome: action.outcome, direction: action.direction };
      const next = { ...point, secondServe };
      if (action.outcome === "doubleFault") {
        return endPoint(state, next, receiver, "doubleFault");
      }
      return withPoint(state, next, "return");
    }

    case "return": {
      const returns = [...point.returns, { player: receiver, in_: action.outcome === "in" }];
      const next = { ...point, returns };
      if (action.outcome === "out") {
        return endPoint(state, next, point.server, "returnOut");
      }
      return withPoint(state, next, "rally");
    }

    case "rallyShot": {
      const rally = [
        ...point.rally,
        { player: action.player, shotType: action.shotType, strokeSide: action.strokeSide },
      ];
      const next = { ...point, rally };
      if (action.shotType === "winner") {
        return endPoint(state, next, action.player, "winner");
      }
      return endPoint(state, next, otherSide(action.player), "unforcedError");
    }

    case "netPoint": {
      const net = [...point.net, { player: action.player, won: action.won }];
      const next = { ...point, net };
      const winner = action.won ? action.player : otherSide(action.player);
      return endPoint(state, next, winner, "netPoint");
    }

    default:
      return state;
  }
}

/**
 * Motor de estados puro.
 * - Las acciones de punto se aplican y se registran en el historial.
 * - `undo` re-construye el punto desde cero descartando la ultima accion.
 * - `confirmNext` arranca un punto nuevo con el servidor elegido.
 */
export function transition(state: MachineState, action: Action): MachineState {
  switch (action.kind) {
    case "undo": {
      if (state.actionHistory.length === 0) return state;
      const prev = state.actionHistory.slice(0, -1);
      let acc = initialState(state.point.server);
      for (const a of prev) {
        acc = applyAction(acc, a);
      }
      return { ...acc, actionHistory: prev };
    }

    case "confirmNext": {
      return {
        phase: "serve1",
        point: emptyPoint(action.server),
        actionHistory: [],
      };
    }

    default: {
      if (state.phase === "pointEnd" || state.phase === "newPoint") return state;
      const next = applyAction(state, action);
      return { ...next, actionHistory: [...state.actionHistory, action] };
    }
  }
}

/** Devuelve true si la accion es valida para la fase actual. */
export function canApply(state: MachineState, action: Action): boolean {
  if (action.kind === "undo") return state.actionHistory.length > 0;
  if (action.kind === "confirmNext") return state.phase === "pointEnd";
  if (state.phase === "serve1") return action.kind === "serve1";
  if (state.phase === "serve2") return action.kind === "serve2";
  if (state.phase === "return") {
    return action.kind === "return" || action.kind === "rallyShot" || action.kind === "netPoint";
  }
  if (state.phase === "rally") {
    return action.kind === "rallyShot" || action.kind === "netPoint";
  }
  return false;
}

export function pointPhaseLabel(state: MachineState): string {
  switch (state.phase) {
    case "serve1":
      return state.point.firstServe ? "2.º Saque" : "1.º Saque";
    case "serve2":
      return "2.º Saque";
    case "return":
      return "Resto";
    case "rally":
      return "Punto en juego";
    case "pointEnd":
      return "Fin del punto";
    default:
      return state.phase;
  }
}