// Synthesis: results/round*.json -> results/round<N>-report.md. Pure Node.
// Usage: node playtest/synthesize.mjs [N]   (default 1)
// Zero model calls: reads only stored records.
import { existsSync, readFileSync, writeFileSync } from 'node:fs';

const ROUND = Number(process.argv[2] ?? '1');

const ROUND_FILES = [1, 2, 3].map((n) => `playtest/results/round${n}.json`);
const SCREENS = { 1: 'mes 1', 2: 'ayuda ?', 3: 'game over' };
const records = ROUND_FILES.filter(existsSync)
  .flatMap((f) => JSON.parse(readFileSync(f, 'utf8')))
  .filter((r) => r.valid);
if (records.length === 0) {
  console.error('no valid records in playtest/results/');
  process.exit(1);
}
const id = (r) => `${r.persona}:r${r.round}`;
const byRound = (n) => records.filter((r) => r.round === n);

// comprehension per screen: purpose (r1), jargon understanding (r2),
// cause-of-loss understanding (r3) — keyword-litmus per round field.
const litmus = {
  1: (r) => /startup|negocio|empresa|emprend|quebr|plata|sobreviv/i.test(r.answers.de_que_va ?? ''),
  2: (r) => /(tracci|traction|plata|costo|client)/i.test(r.answers.firma_cliente_gris ?? ''),
  3: (r) => /(caja|plata|burn|gasto|runway|cero|mes)/i.test(r.answers.entiendes_por_que_perdiste ?? ''),
};
const comps = [1, 2, 3].map((n) => {
  const set = byRound(n);
  if (set.length === 0) return null;
  const ok = set.filter(litmus[n]).length;
  return { round: n, screen: SCREENS[n], ok, total: set.length };
}).filter(Boolean);

const freq = new Map();
for (const r of records) {
  for (const f of r.answers.fricciones ?? []) {
    const key = f.toLowerCase().trim();
    if (!freq.has(key)) freq.set(key, { text: f, sources: [] });
    freq.get(key).sources.push(id(r));
  }
}
const ranked = [...freq.values()].sort((a, b) => b.sources.length - a.sources.length);
const needsHuman = ranked.filter((f) => /letr|chiquit|pequen|pequeñ|leg|contraste|dim|pierde|chica/i.test(f.text));

const share = byRound(3).map((r) => ({
  tag: id(r), v: (r.answers.compartiras ?? '').toLowerCase(), text: r.answers.con_que_texto ?? '',
}));
const shares = share.filter((s) => s.v.startsWith('s')).length;

const lines = [
  `# Ronda ${ROUND} — panel sintético de founders (simulado)`,
  '',
  `**Registros válidos:** ${records.length} · modelo: ${records[0].model} · prompt ${records[0].promptVersion} · fuente: \`${ROUND_FILES.filter(existsSync).join(', ')}\``,
  '',
  '> **ADVERTENCIA: panel sintético.** Estas son simulaciones de LLM, no personas.',
  '> Generador divergente de problemas de comprensión y lenguaje, no tap-test.',
  '> **Confirmar con 5 founders humanos reales** antes de decisiones irreversibles.',
  '',
  '## Comprensión por pantalla',
  '',
  ...comps.map((c) => `- **${c.screen}: ${c.ok}/${c.total}** enunciaron correctamente (${c.round === 1 ? 'propósito' : c.round === 2 ? 'lock de Firmar cliente' : 'causa de quiebra'})`),
  '',
  '## Fricciones (frecuencia, trazables)',
  '',
  ...ranked.map((f, i) => `${i + 1}. (${f.sources.length}x) ${f.text} — ${f.sources.map((s) => `[${s}]`).join(' ')}`),
  '',
  ...(needsHuman.length > 0
    ? ['### Señaladas como legibilidad/contraste → **requieren confirmación humana**',
      ...needsHuman.map((f) => `- ${f.text} ${f.sources.map((s) => `[${s}]`).join(' ')}`),
      '']
    : []),
  '## Intento de compartir (game over)',
  '',
  `- ${shares}/${share.length} compartirían por WhatsApp:`,
  ...share.map((s) => `  - [${s.tag}] ${s.v}${s.text ? ` — "${s.text}"` : ''}`),
  '',
  '## Veredictos por persona (frases textuales)',
  '',
  ...records.map((r) => `- [${id(r)}] ${r.answers.frase_textual}`),
  '',
];
writeFileSync(`playtest/results/round${ROUND}-report.md`, lines.join('\n') + '\n');
console.log(`wrote playtest/results/round${ROUND}-report.md (${records.length} records)`);
