import { Component, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { IconGlyph } from '../../shell/icon-glyph';
import { AnnexeBlocComponent } from './annexe-bloc';
import { ANNEXE_SECTIONS, type AnnexeBlock } from './annexe-data';
import { CODE_TONES, DEFAULT_CODE_TONE } from './annexes-code-tones';
import { GROUPS, LEG_GROUP, OPT_GROUP, type LegendGroup, type LegendGroupKey, type LegendRow } from './annexes-legend-data';
import { ICON_ANNEXE, ICON_LEGEND, ICON_LEGS } from './annexes-icons';

type Page = 'annexe' | 'legs' | 'legend';

const TAB_OPTIONS: readonly { readonly key: LegendGroupKey | 'all'; readonly label: string }[] = [
  { key: 'all', label: 'Tout' },
  { key: 'states', label: 'États' },
  { key: 'colors', label: 'Couleurs' },
  { key: 'symbols', label: 'Symboles' },
  { key: 'terms', label: 'Vocabulaire' },
  { key: 'legs', label: 'Jambes' },
  { key: 'codes', label: 'Codes' },
];

/** Une entrée d'annexe, dans laquelle chercher (code, titre, description, champs). */
function annexeEntryMatches(
  entry: { code: string; title: string; desc: string; fields: readonly { text: string }[] },
  q: string,
): boolean {
  if (!q) return true;
  const hit = (t: string) => t.toLowerCase().includes(q);
  return hit(entry.code) || hit(entry.title) || hit(entry.desc) || entry.fields.some((f) => hit(f.text));
}

/** Porté depuis `Legendes.dc.html` — trois sous-pages : Annexes, Jambes, Légendes. */
@Component({
  selector: 'app-annexes',
  imports: [FormsModule, MatButtonToggleModule, IconGlyph, AnnexeBlocComponent],
  templateUrl: './annexes.html',
  styleUrl: './annexes.css',
})
export class Annexes {
  protected readonly page = signal<Page>('annexe');
  protected readonly tab = signal<LegendGroupKey | 'all'>('all');
  protected readonly query = signal('');
  protected readonly openSections = signal<ReadonlySet<number>>(new Set([0]));

  protected readonly tabOptions = TAB_OPTIONS;
  protected readonly icons = { annexe: ICON_ANNEXE, legs: ICON_LEGS, legend: ICON_LEGEND };

  private readonly normalizedQuery = computed(() => this.query().trim().toLowerCase());

  protected readonly subtitle = computed(() =>
    this.page() === 'annexe'
      ? "Référentiel des codes, indicateurs et mécanismes de marché employés par l'application"
      : 'Signification des états, couleurs, symboles et termes employés dans les écrans',
  );

  protected readonly searchHint = computed(() => (this.page() === 'annexe' ? 'Code, notion, mécanisme' : 'Terme, état, couleur'));

  protected setTab(v: string): void {
    this.tab.set(v as LegendGroupKey | 'all');
  }

  protected toggleSection(i: number): void {
    this.openSections.update((set) => {
      const next = new Set(set);
      next.has(i) ? next.delete(i) : next.add(i);
      return next;
    });
  }

  protected isSectionOpen(i: number): boolean {
    return this.openSections().has(i);
  }

  protected readonly annexeSections = computed(() => {
    const q = this.normalizedQuery();
    return ANNEXE_SECTIONS.map((sec, i) => {
      const entries = sec.entries.filter((e) => annexeEntryMatches(e, q));
      const tone = CODE_TONES[sec.title] ?? DEFAULT_CODE_TONE;
      return {
        index: i,
        title: sec.title,
        toneBg: tone.bg,
        toneFg: tone.fg,
        intro: sec.intro ?? '',
        count: `${entries.length} ${entries.length > 1 ? 'entrées' : 'entrée'}`,
        blocks: [] as readonly AnnexeBlock[],
        entries: entries.map((e) => ({
          ...e,
          badgeBg: 'rgba(255,255,255,0.92)',
          badgeFg: tone.fg,
        })),
      };
    }).filter((sec) => !q || sec.entries.length > 0);
  });

  protected readonly annexeTotalEntries = ANNEXE_SECTIONS.reduce((n, s) => n + s.entries.length, 0);

  /** Groupe « codes » : une carte par section de l'annexe, pour l'onglet Légendes. */
  private readonly codeGroups = computed((): readonly LegendGroup[] =>
    ANNEXE_SECTIONS.map((sec): LegendGroup => {
      const tone = CODE_TONES[sec.title] ?? DEFAULT_CODE_TONE;
      const rows: LegendRow[] = sec.entries.map((e) => ({
        kind: 'code',
        bg: tone.bg,
        fg: tone.fg,
        label: e.code,
        meaning: `${e.title} — ${e.desc.split(/(?<=\.)\s/)[0]}`,
        where: e.fields.filter((f) => f.label === 'Effet').map((f) => f.text)[0] ?? 'Onglet Annexes',
      }));
      return { key: 'codes', title: sec.title, note: "Codes de l'annexe", rows };
    }).filter((g) => g.rows.length > 0),
  );

  private readonly toneGroup = computed((): LegendGroup => ({
    key: 'colors',
    title: 'Code couleur des codes de l\'annexe',
    note: 'Onglet Annexes · une teinte par famille',
    rows: Object.keys(CODE_TONES).map((title) => {
      const sec = ANNEXE_SECTIONS.find((s) => s.title === title);
      const codes = sec ? sec.entries.map((e) => e.code) : [];
      const tone = CODE_TONES[title];
      return {
        kind: 'code',
        label: codes[0] ?? '—',
        bg: tone.bg,
        fg: tone.fg,
        meaning: title,
        where: codes.join(' · '),
      };
    }),
  }));

  private readonly fontGroup: LegendGroup = {
    key: 'colors',
    title: 'Traitement des codes et des structures JSON',
    note: 'Onglet Annexes',
    rows: [
      {
        kind: 'code',
        label: 'DIVOPT',
        bg: 'rgba(180,83,9,0.16)',
        fg: 'var(--ink-warn)',
        meaning: "Courier New 700, 11 px, interlettrage 0,04 em — badge du code d'opération, dans la teinte de sa famille.",
        where: 'Bandeau des cartes, liste des codes',
      },
      {
        kind: 'code',
        label: '{ }',
        bg: '#0e1420',
        fg: 'var(--ink-e6ebf5)',
        meaning: 'Tahoma 400, 12 px sur fond #0e1420 — extraits de journal au format JSON, alignement conservé par tabulation à 2.',
        where: 'Blocs de code des cartes',
      },
      {
        kind: 'text',
        label: 'Aptos',
        meaning: 'Police de l\'application : titres, définitions et tableaux. Les badges de code sont en Courier New, les blocs JSON en Tahoma.',
        where: 'Toutes les pages',
      },
    ],
  };

  private readonly allLegendGroups = computed((): readonly LegendGroup[] => [
    LEG_GROUP,
    OPT_GROUP,
    ...GROUPS,
    this.toneGroup(),
    this.fontGroup,
    ...this.codeGroups(),
  ]);

  protected readonly legendTotalEntries = computed(() => this.allLegendGroups().reduce((n, g) => n + g.rows.length, 0));

  protected readonly legendGroups = computed(() => {
    const q = this.normalizedQuery();
    const t = this.tab();
    return this.allLegendGroups()
      .filter((g) => t === 'all' || g.key === t)
      .map((g) => ({
        title: g.title,
        note: g.note,
        rows: g.rows.filter((r) => !q || `${r.label} ${r.meaning} ${r.where}`.toLowerCase().includes(q)),
      }))
      .filter((g) => g.rows.length > 0);
  });

  protected readonly legendShownEntries = computed(() => this.legendGroups().reduce((n, g) => n + g.rows.length, 0));

  protected readonly legsGroups = computed(() => {
    const q = this.normalizedQuery();
    return [LEG_GROUP, OPT_GROUP]
      .map((g) => ({
        title: g.title,
        note: g.note,
        rows: g.rows.filter((r) => !q || `${r.label} ${r.meaning} ${r.where}`.toLowerCase().includes(q)),
      }))
      .filter((g) => g.rows.length > 0);
  });

  protected readonly legsTotalCount = LEG_GROUP.rows.length + OPT_GROUP.rows.length;

  protected readonly pageTabs = computed(() => [
    { key: 'annexe' as const, label: 'Annexes', icon: this.icons.annexe, badge: this.annexeTotalEntries },
    { key: 'legs' as const, label: 'Jambes', icon: this.icons.legs, badge: this.legsTotalCount },
    { key: 'legend' as const, label: 'Légendes', icon: this.icons.legend, badge: this.legendTotalEntries() },
  ]);
}
