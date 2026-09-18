import {
  canApply,
  initialState,
  otherSide,
  transition,
} from "./stateMachine";

describe("flujo de saque", () => {
  it("ace en 1.º saque termina el punto a favor del servidor", () => {
    let s = initialState("self");
    s = transition(s, { kind: "serve1", outcome: "ace", direction: "T" });
    expect(s.phase).toBe("pointEnd");
    expect(s.point.result).toEqual({ winner: "self", endedBy: "ace" });
    expect(s.point.firstServe?.outcome).toBe("ace");
  });

  it("1.º fuera pasa a 2.º saque", () => {
    let s = initialState("self");
    s = transition(s, { kind: "serve1", outcome: "out", direction: "T" });
    expect(s.phase).toBe("serve2");
    expect(canApply(s, { kind: "serve1", outcome: "in", direction: null })).toBe(false);
    expect(canApply(s, { kind: "serve2", outcome: "in", direction: null })).toBe(true);
  });

  it("2.º fuera es doble falta y gana el resto", () => {
    let s = initialState("self");
    s = transition(s, { kind: "serve1", outcome: "out", direction: "T" });
    s = transition(s, { kind: "serve2", outcome: "doubleFault", direction: null });
    expect(s.phase).toBe("pointEnd");
    expect(s.point.result).toEqual({ winner: "opponent", endedBy: "doubleFault" });
  });

  it("1.º dentro pasa a resto", () => {
    let s = initialState("self");
    s = transition(s, { kind: "serve1", outcome: "in", direction: "Body" });
    expect(s.phase).toBe("return");
  });

  it("2.º dentro pasa a resto", () => {
    let s = initialState("self");
    s = transition(s, { kind: "serve1", outcome: "out", direction: null });
    s = transition(s, { kind: "serve2", outcome: "in", direction: "Wide" });
    expect(s.phase).toBe("return");
  });
});

describe("flujo de resto", () => {
  it("resto fuera gana el servidor", () => {
    let s = initialState("self");
    s = transition(s, { kind: "serve1", outcome: "in", direction: "T" });
    s = transition(s, { kind: "return", outcome: "out" });
    expect(s.phase).toBe("pointEnd");
    expect(s.point.result).toEqual({ winner: "self", endedBy: "returnOut" });
    expect(s.point.returns).toEqual([{ player: "opponent", in_: false }]);
  });

  it("resto dentro pasa a punto en juego", () => {
    let s = initialState("self");
    s = transition(s, { kind: "serve1", outcome: "in", direction: "T" });
    s = transition(s, { kind: "return", outcome: "in" });
    expect(s.phase).toBe("rally");
    expect(s.point.returns).toEqual([{ player: "opponent", in_: true }]);
  });

  it("se puede pasar directo a golpe desde la fase resto", () => {
    let s = initialState("self");
    s = transition(s, { kind: "serve1", outcome: "in", direction: "T" });
    s = transition(s, { kind: "rallyShot", player: "self", shotType: "winner", strokeSide: "forehand" });
    expect(s.phase).toBe("pointEnd");
    expect(s.point.result).toEqual({ winner: "self", endedBy: "winner" });
  });
});

describe("fondo y red", () => {
  it("winner termina a favor del autor", () => {
    let s = initialState("self");
    s = transition(s, { kind: "serve1", outcome: "in", direction: "T" });
    s = transition(s, { kind: "return", outcome: "in" });
    s = transition(s, { kind: "rallyShot", player: "opponent", shotType: "winner", strokeSide: "backhand" });
    expect(s.point.result).toEqual({ winner: "opponent", endedBy: "winner" });
    expect(s.point.rally[0]).toEqual({
      player: "opponent",
      shotType: "winner",
      strokeSide: "backhand",
    });
  });

  it("error no forzado lo pierde quien lo comete", () => {
    let s = initialState("self");
    s = transition(s, { kind: "serve1", outcome: "in", direction: "T" });
    s = transition(s, { kind: "return", outcome: "in" });
    s = transition(s, { kind: "rallyShot", player: "self", shotType: "unforcedError", strokeSide: "forehand" });
    expect(s.point.result).toEqual({ winner: "opponent", endedBy: "unforcedError" });
  });

  it("punto en la red ganado es del autor, perdido del rival", () => {
    let s = initialState("self");
    s = transition(s, { kind: "serve1", outcome: "in", direction: "T" });
    s = transition(s, { kind: "netPoint", player: "self", won: true });
    expect(s.point.result).toEqual({ winner: "self", endedBy: "netPoint" });

    s = transition(initialState("self"), { kind: "serve1", outcome: "in", direction: "T" });
    s = transition(s, { kind: "return", outcome: "in" });
    s = transition(s, { kind: "netPoint", player: "self", won: false });
    expect(s.point.result).toEqual({ winner: "opponent", endedBy: "netPoint" });
  });
});

describe("undo", () => {
  it("deshace la ultima accion y vuelve a la fase previa", () => {
    let s = initialState("self");
    s = transition(s, { kind: "serve1", outcome: "out", direction: "T" });
    expect(s.phase).toBe("serve2");
    s = transition(s, { kind: "undo" });
    expect(s.phase).toBe("serve1");
    expect(s.point.firstServe).toBeNull();
  });

  it("undo tras pointEnd revierte el punto completo", () => {
    let s = initialState("self");
    s = transition(s, { kind: "serve1", outcome: "ace", direction: "T" });
    expect(s.phase).toBe("pointEnd");
    s = transition(s, { kind: "undo" });
    expect(s.phase).toBe("serve1");
    expect(s.point.firstServe).toBeNull();
    expect(s.actionHistory).toHaveLength(0);
  });

  it("undo tras confirmNext es no-op porque la historia quedó limpia", () => {
    let s = initialState("self");
    s = transition(s, { kind: "serve1", outcome: "ace", direction: "T" });
    s = transition(s, { kind: "confirmNext", server: "opponent" });
    expect(s.phase).toBe("serve1");
    const after = transition(s, { kind: "undo" });
    expect(after).toBe(s);
  });

  it("undo en fases intermedias conserva el historial para seguir deshaciendo", () => {
    let s = initialState("self");
    s = transition(s, { kind: "serve1", outcome: "out", direction: "T" });
    s = transition(s, { kind: "serve2", outcome: "in", direction: "Wide" });
    s = transition(s, { kind: "return", outcome: "in" });
    s = transition(s, { kind: "undo" });
    expect(s.phase).toBe("return");
    s = transition(s, { kind: "undo" });
    expect(s.phase).toBe("serve2");
    expect(s.point.secondServe).toBeNull();
    s = transition(s, { kind: "undo" });
    expect(s.phase).toBe("serve1");
    expect(s.actionHistory).toHaveLength(0);
  });

  it("undo sin historia no cambia nada", () => {
    const s = initialState("self");
    expect(transition(s, { kind: "undo" })).toBe(s);
  });
});

describe("rotacion de saque", () => {
  it("confirmNext cambia el servidor y arranca punto limpio", () => {
    let s = initialState("self");
    s = transition(s, { kind: "serve1", outcome: "in", direction: "T" });
    s = transition(s, { kind: "return", outcome: "out" });
    s = transition(s, { kind: "confirmNext", server: "opponent" });
    expect(s.phase).toBe("serve1");
    expect(s.point.server).toBe("opponent");
    expect(s.actionHistory).toHaveLength(0);
  });
});

describe("otherSide", () => {
  it("invierte el lado", () => {
    expect(otherSide("self")).toBe("opponent");
    expect(otherSide("opponent")).toBe("self");
  });
});

describe("canApply", () => {
  it("rechaza acciones fuera de fase y acepta undo solo con historia", () => {
    let s = initialState("self");
    expect(canApply(s, { kind: "undo" })).toBe(false);
    expect(canApply(s, { kind: "return", outcome: "in" })).toBe(false);
    s = transition(s, { kind: "serve1", outcome: "out", direction: "T" });
    expect(canApply(s, { kind: "undo" })).toBe(true);
    expect(canApply(s, { kind: "serve1", outcome: "in", direction: null })).toBe(false);
  });
});