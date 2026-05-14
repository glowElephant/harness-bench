import type { BenchmarkResult } from '../types.js';
import { axisLabels, CHARACTERS } from '../scoring/label.js';

const W = 1200;
const H = 630;
const BG = '#0b0d10';
const FG = '#e6e9ef';
const DIM = '#7a8290';
const BAR_BG = '#1a1f26';
const ACCENT_HIGH = '#5eead4';
const ACCENT_MID = '#60a5fa';
const ACCENT_LOW = '#f59e0b';
const ACCENT_BAD = '#f87171';

function barColor(score: number): string {
  if (score >= 8) return ACCENT_HIGH;
  if (score >= 5) return ACCENT_MID;
  if (score >= 3) return ACCENT_LOW;
  return ACCENT_BAD;
}

function esc(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function renderSvgCard(result: BenchmarkResult): string {
  const char = CHARACTERS[result.label];
  const rows = result.axes;

  const titleY = 90;
  const subtitleY = 130;
  const barsY = 200;
  const barRowH = 38;

  const barX = 80;
  const barLabelX = barX;
  const barScoreX = barX + 250;
  const barTrackX = barX + 280;
  const barTrackW = 480;
  const barTrackH = 18;

  const totalBoxX = 850;
  const totalBoxY = 200;
  const totalBoxW = 270;
  const totalBoxH = 260;

  const bars = rows
    .map((axis, i) => {
      const y = barsY + i * barRowH;
      const filledW = Math.max(2, (axis.score / 10) * barTrackW);
      const color = barColor(axis.score);
      return `
        <text x="${barLabelX}" y="${y + 14}" fill="${DIM}" font-size="18" font-family="system-ui">${esc(axisLabels[axis.axis])}</text>
        <text x="${barScoreX}" y="${y + 14}" fill="${FG}" font-size="18" font-family="system-ui" font-weight="600" text-anchor="end">${axis.score}/10</text>
        <rect x="${barTrackX}" y="${y}" width="${barTrackW}" height="${barTrackH}" rx="3" fill="${BAR_BG}"/>
        <rect x="${barTrackX}" y="${y}" width="${filledW}" height="${barTrackH}" rx="3" fill="${color}"/>
      `;
    })
    .join('');

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">
  <rect width="${W}" height="${H}" fill="${BG}"/>

  <text x="80" y="${titleY}" fill="${FG}" font-size="48" font-weight="700" font-family="system-ui">Harness Benchmark</text>
  <text x="80" y="${subtitleY}" fill="${DIM}" font-size="22" font-family="system-ui">How AI-Native is your dev environment?</text>

  ${bars}

  <rect x="${totalBoxX}" y="${totalBoxY}" width="${totalBoxW}" height="${totalBoxH}" rx="12" fill="${BAR_BG}" stroke="${ACCENT_MID}" stroke-width="2"/>
  <text x="${totalBoxX + totalBoxW / 2}" y="${totalBoxY + 50}" fill="${DIM}" font-size="18" font-family="system-ui" text-anchor="middle">TOTAL</text>
  <text x="${totalBoxX + totalBoxW / 2}" y="${totalBoxY + 110}" fill="${FG}" font-size="64" font-weight="800" font-family="system-ui" text-anchor="middle">${result.total}</text>
  <text x="${totalBoxX + totalBoxW / 2}" y="${totalBoxY + 140}" fill="${DIM}" font-size="20" font-family="system-ui" text-anchor="middle">/ ${result.maxTotal}</text>

  <text x="${totalBoxX + totalBoxW / 2}" y="${totalBoxY + 190}" fill="${DIM}" font-size="14" font-family="system-ui" text-anchor="middle">LABEL</text>
  <text x="${totalBoxX + totalBoxW / 2}" y="${totalBoxY + 225}" fill="${ACCENT_HIGH}" font-size="28" font-weight="700" font-family="system-ui" text-anchor="middle">${char.emoji} ${esc(char.label)}</text>

  <text x="80" y="${H - 70}" fill="${DIM}" font-size="16" font-style="italic" font-family="system-ui">"${esc(char.tagline)}"</text>
  <text x="80" y="${H - 30}" fill="${DIM}" font-size="14" font-family="system-ui">harness-bench · github.com/glowElephant/harness-bench · npx harness-bench</text>
</svg>`;
}
