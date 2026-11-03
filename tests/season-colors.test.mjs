import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

// Grundton je Jahreszeit (global.css): Frühling steht in @theme, die anderen drei überschreiben die Slate-Töne.
const css = readFileSync(new URL('../src/styles/global.css', import.meta.url), 'utf8');
const tones = ['950', '900', '800', '700', '600'];
const read = (block, n) => block.match(new RegExp(`--color-slate-${n}:\\s*(#[0-9a-fA-F]{6})`))?.[1];
const theme = css.match(/@theme\s*\{[\s\S]*?\n\}/)[0];
const season = (name) => css.match(new RegExp(`html\\[data-season="${name}"\\]\\s*\\{[^}]*--color-slate-950[^}]*\\}`))?.[0];

const palettes = {
  fruehling: theme,
  sommer: season('sommer'),
  herbst: season('herbst'),
  winter: season('winter'),
};

const lum = (hex) => {
  const c = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
    .map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
};
const contrast = (a, b) => {
  const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
};
const stone = { 200: '#d9d4cc', 400: '#a89d8f' };

for (const [name, block] of Object.entries(palettes)) {
  test(`Grundton ${name}: alle fünf Slate-Töne gesetzt`, () => {
    assert.ok(block, `Block für ${name} fehlt in global.css`);
    for (const n of tones) assert.ok(read(block, n), `slate-${n} fehlt (${name})`);
  });

  test(`Grundton ${name}: Textkontraste`, () => {
    const body = read(block, '800');
    const card = read(block, '700');
    const foot = read(block, '950');
    assert.ok(contrast(stone[200], body) >= 7, `stone-200 auf Body ${name}`);
    assert.ok(contrast(stone[200], card) >= 7, `stone-200 auf Karte ${name}`);
    assert.ok(contrast(stone[400], body) >= 4.5, `stone-400 auf Body ${name}`);
    assert.ok(contrast(stone[400], card) >= 4.5, `stone-400 auf Karte ${name}`);
    assert.ok(contrast(stone[400], foot) >= 4.5, `stone-400 auf Footer ${name}`);
  });
}
