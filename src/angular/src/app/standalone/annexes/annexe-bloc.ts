import { Component, computed, input } from '@angular/core';
import { MatTableModule } from '@angular/material/table';
import type { AnnexeBlock } from './annexe-data';
import { CODE_TONES, DEFAULT_CODE_TONE, type Tone } from './annexes-code-tones';

const NATURE_TONES: Readonly<Record<string, Tone>> = {
  TRADE: { bg: 'rgba(15,118,110,0.16)', fg: 'var(--ink-ok)' },
  TRANSFER: { bg: 'rgba(2,132,199,0.16)', fg: 'var(--ink-info)' },
  CORPORATE: { bg: 'rgba(180,83,9,0.16)', fg: 'var(--ink-warn)' },
  CASHFLOW: { bg: 'rgba(162,28,175,0.16)', fg: 'var(--ink-magenta)' },
};

/** Codes reconnus de l'annexe : opérations, natures, méthodes, indicateurs, nomenclature CAEV. */
const KNOWN_CODES: ReadonlySet<string> = new Set([
  'TXN', 'STRUCT', 'NATURE', 'PREV', 'ANOMALIE', 'BUY', 'SELL', 'BUYOPT', 'DIVOPT', 'SPLIT', 'SPINOFF', 'MERGER',
  'DIV', 'TOUT', 'TIN', 'TRANSFER', 'DEPOSIT', 'WITHDRAW', 'INTEREST', 'LENDING', 'FEE', 'REFUND', 'OVERDRAFT',
  'LIMIT', 'TAX', 'TRADE', 'SUBSCRIPTION', 'CORPORATE', 'CASHFLOW', 'PRU', 'METHODE', 'MV', 'UPL', 'RPL', 'DAY',
  'EXP', 'FIFO', 'LIFO', 'MID', 'CUMP', 'CAPI', 'BPA', 'EPS', 'PER', 'YIELD', 'PAYOUT', 'PBR', 'EVEBITDA', 'VE',
  'VOL', 'BETA', 'SHARPE', 'MDD', 'TWR', 'MWR', 'TRI', 'BOOK', 'ORDER', 'INDEX', 'FLOAT', 'MIC', 'DUAL',
  'OBLIGATOIRE', 'AVEC CHOIX', 'VOLONTAIRE', 'COUVERTURE', 'DVCA', 'DVSE', 'DVOP', 'DRIP', 'INTR', 'SPLF', 'SPLR',
  'BONU', 'RHDI', 'EXRI', 'MRGR', 'SOFF', 'EXOF', 'TEND', 'BIDS', 'CAPD', 'REDM', 'LIQU', 'CONV', 'PARI', 'CHAN',
  'ODLT', 'CONS',
]);

interface CellBadge {
  readonly code: string;
  readonly hint: string;
  readonly bg: string;
  readonly fg: string;
}

interface ParsedCell {
  readonly isBadges: boolean;
  readonly text: string;
  readonly badges: readonly CellBadge[];
}

const CODE_PATTERN = /^([A-Z][A-Z0-9+_ ]{1,22})(?:\s*\(([^)]+)\))?$/;

/** Une cellule faite uniquement de codes en capitales devient une suite de badges. */
function parseCell(text: string): ParsedCell {
  const parts = text
    .split(',')
    .map((x) => x.trim())
    .filter(Boolean);
  const parsed = parts.map((p) => {
    const m = CODE_PATTERN.exec(p);
    if (!m) return null;
    const code = m[1].trim();
    const known = KNOWN_CODES.has(code) || code.split(' + ').every((x) => KNOWN_CODES.has(x.trim()));
    if (!known) return null;
    return { code, hint: m[2] ? `· ${m[2]}` : '' };
  });
  if (parts.length && parsed.every((x) => x !== null)) {
    return {
      isBadges: true,
      text,
      badges: parsed.map((x) => {
        const tone = NATURE_TONES[x!.code] ?? CODE_TONES[x!.code] ?? DEFAULT_CODE_TONE;
        return { code: x!.code, hint: x!.hint, bg: tone.bg, fg: tone.fg };
      }),
    };
  }
  return { isBadges: false, text, badges: [] };
}

/** Porté depuis `AnnexeBloc.dc.html` — rend un bloc sub/text/code/table d'une entrée d'annexe. */
@Component({
  selector: 'app-annexe-bloc',
  imports: [MatTableModule],
  templateUrl: './annexe-bloc.html',
  styleUrl: './annexe-bloc.css',
})
export class AnnexeBlocComponent {
  readonly block = input.required<AnnexeBlock>();

  protected readonly columnIds = computed(() => {
    const b = this.block();
    return b.kind === 'table' ? b.head.map((_, i) => `c${i}`) : [];
  });

  protected readonly tableRows = computed(() => {
    const b = this.block();
    if (b.kind !== 'table') return [];
    return b.body.map((cells, i) => ({
      cells: cells.map((c) => parseCell(c)),
      zebra: i % 2 === 1,
    }));
  });
}
