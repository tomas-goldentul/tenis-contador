import * as Print from "expo-print";
import type { MatchStats } from "../core/stats";

function pctLabel(v: number | null): string {
  return v === null ? "—" : `${v}%`;
}

function buildHtml(opts: {
  title: string;
  subtitle: string;
  stats: MatchStats;
}): string {
  const s = opts.stats;
  const rows = [
    ["1.º saque en pista", pctLabel(s.firstServePct)],
    [`1.º saque (dentro/${s.firstServeAttempts})`, String(s.firstServeIn)],
    ["2.º saque en pista", pctLabel(s.secondServePct)],
    [`2.º saque (dentro/${s.secondServeAttempts})`, String(s.secondServeIn)],
    ["Dobles faltas", String(s.doubleFaults)],
    ["Aces", String(s.aces)],
    ["Winners", String(s.winners)],
    ["Winners derecha", String(s.winnersForehand)],
    ["Winners revés", String(s.winnersBackhand)],
    ["Errores no forzados", String(s.unforcedErrors)],
    ["EF derecha", String(s.unforcedErrorsForehand)],
    ["EF revés", String(s.unforcedErrorsBackhand)],
    ["Ratio W / EF", s.ratio === null ? "—" : String(s.ratio)],
  ];

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<style>
  body { font-family: -apple-system, sans-serif; color: #111; padding: 24px; }
  h1 { font-size: 22px; margin: 0 0 4px; }
  .meta { color: #555; margin-bottom: 16px; }
  h2 { font-size: 15px; text-transform: uppercase; letter-spacing: .4px;
       border-bottom: 2px solid #2F9E63; padding-bottom: 4px; margin-top: 20px; }
  table { width: 100%; border-collapse: collapse; }
  td { padding: 6px 0; font-size: 14px; border-bottom: 1px solid #eee; }
  td.v { text-align: right; font-weight: 700; }
</style>
</head>
<body>
  <h1>${opts.title}</h1>
  <div class="meta">${opts.subtitle}</div>
  <h2>Estadísticas</h2>
  <table><tbody>
    ${rows.map(([k, v]) => `<tr><td>${k}</td><td class="v">${v}</td></tr>`).join("")}
  </tbody></table>
</body>
</html>`;
}

export async function exportStatsPdf(opts: {
  title: string;
  subtitle: string;
  stats: MatchStats;
}): Promise<void> {
  const html = buildHtml(opts);
  await Print.printAsync({ html });
  const file = await Print.printToFileAsync({ html });
  if (!file.uri) throw new Error("No se pudo generar el PDF");
}