import { Component, computed, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';

import {
  ASSET_CLASSES,
  BASE_SERIE,
  CUSTOM_DEFAULTS,
  CUSTOM_FIELDS,
  DIV_YIELD,
  MODELS,
  SCOPES,
  TICKS,
  TOTAL_BASE,
  eur,
  path,
  pct,
  type CustomKey,
} from './simulation-data';

/**
 * Porté depuis `Simulation.dc.html` — l'écran « Gestion du risque » du menu.
 *
 * Un modèle de choc est choisi à gauche, la simulation se lance, et le résultat apparaît à
 * droite : trajectoire avant et après choc, impact par classe d'actifs, points de vigilance.
 * Tout est recalculé à la volée ; rien n'est stocké, et aucune position réelle n'est touchée.
 *
 * Le prototype remet `ran` à faux dès qu'on change de modèle : le résultat affiché correspond
 * toujours au modèle qui l'a produit, jamais à celui qu'on vient de sélectionner sans relancer.
 */
@Component({
  selector: 'app-simulation',
  imports: [MatButtonModule, MatIconModule, MatListModule, MatSelectModule, MatTableModule, MatTooltipModule],
  templateUrl: './simulation.html',
  styleUrl: './simulation.css',
})
export class Simulation {
  protected readonly scopes = SCOPES;
  protected readonly customFields = CUSTOM_FIELDS;
  protected readonly ticks = TICKS;

  protected readonly scope = signal('all');
  protected readonly selected = signal('crash');
  protected readonly ran = signal(false);
  protected readonly custom = signal<Readonly<Record<CustomKey, string>>>({ ...CUSTOM_DEFAULTS });

  protected readonly subtitle =
    'Stress test du portefeuille · scénarios de marché appliqués aux positions actuelles';

  private readonly model = computed(() => MODELS.find((m) => m.key === this.selected()) ?? MODELS[0]);

  protected readonly isCustom = computed(() => this.model().key === 'custom');

  private readonly totalBase = computed(
    () => TOTAL_BASE * (SCOPES.find((s) => s.value === this.scope())?.share ?? 1),
  );

  protected readonly models = computed(() =>
    MODELS.map((m) => {
      const on = m.key === this.selected();
      return {
        key: m.key,
        title: m.title,
        detail: m.detail,
        /* Une fois retenu, le modèle inverse sa pastille — fond plein de sa couleur, glyphe en
           blanc — et fait apparaître le filet de gauche. */
        iconBg: on ? m.mark : m.iconBg,
        iconFg: on ? '#ffffff' : m.iconFg,
        mark: on ? m.mark : 'transparent',
        bg: on ? 'var(--color-neutral-100)' : 'var(--surface)',
        selected: on,
      };
    }),
  );

  private readonly rows = computed(() => {
    const base = this.totalBase();
    const model = this.model();
    const isCustom = this.isCustom();
    const custom = this.custom();

    return ASSET_CLASSES.map((c) => {
      const before = base * c.weight;
      const shock = isCustom
        ? (parseFloat(String(custom[c.customKey]).replace(',', '.')) || 0) / 100
        : model.shockPct * (c.mult[model.key] ?? 1);
      const after = before * (1 + shock);
      return {
        label: c.label,
        before: eur(before),
        after: eur(after),
        delta: pct((after - before) / before),
        color: after < before ? 'var(--ink-warn-2)' : 'var(--ink-ok-2)',
        beforeRaw: before,
        afterRaw: after,
      };
    });
  });

  private readonly totals = computed(() => {
    const base = this.totalBase();
    const rows = this.rows();
    const after = rows.reduce((n, r) => n + r.afterRaw, 0);
    const delta = (after - base) / base;
    /* La classe la plus touchée est celle dont l'écart *relatif* est le plus bas : comparer les
       montants absolus désignerait toujours les actions, qui pèsent 55 % du portefeuille. */
    const worst = [...rows].sort(
      (a, b) => (a.afterRaw - a.beforeRaw) / a.beforeRaw - (b.afterRaw - b.beforeRaw) / b.beforeRaw,
    )[0];
    return { base, after, delta, worst, tone: delta < 0 ? 'var(--ink-warn-2)' : 'var(--ink-ok-2)' };
  });

  protected readonly kpis = computed(() => {
    const { base, after, delta, worst, tone } = this.totals();
    const negative = delta < 0;
    const bg = negative ? 'rgba(143,63,6,0.10)' : 'rgba(11,95,87,0.10)';
    return [
      { label: 'Valeur avant choc', value: eur(base), note: 'Valorisation actuelle', labelColor: 'var(--color-neutral-700)', color: 'var(--color-text)', bg: 'var(--surface)' },
      { label: 'Valeur après choc', value: eur(after), note: this.model().title, labelColor: tone, color: tone, bg },
      { label: 'Impact total', value: pct(delta), note: eur(after - base), labelColor: tone, color: tone, bg },
      { label: 'Classe la plus touchée', value: worst?.label ?? '—', note: worst ? pct((worst.afterRaw - worst.beforeRaw) / worst.beforeRaw) : '', labelColor: 'var(--color-neutral-700)', color: 'var(--color-text)', bg: 'var(--surface)' },
    ];
  });

  protected readonly result = computed(() => {
    const model = this.model();
    const { base, after, delta, worst, tone } = this.totals();
    /* Le choc frappe au quatrième point et se diffuse sur les quatre suivants, d'où le facteur
       `(i - 2) / 4` : la courbe ne décroche pas d'un coup, elle s'écarte progressivement. */
    const shockSerie = BASE_SERIE.map((v, i) => (i < 3 ? v : v * (1 + delta * ((i - 2) / 4))));
    const divGrowth = this.isCustom() ? 0 : model.divGrowth;
    const divBefore = base * DIV_YIELD;
    const divAfter = divBefore * (1 + divGrowth);

    return {
      title: `${model.title} — trajectoire simulée`,
      scopeNote: SCOPES.find((s) => s.value === this.scope())?.label ?? SCOPES[0].label,
      pathBase: path(BASE_SERIE),
      pathShock: path(shockSerie),
      lineColor: tone,
      impactLabel: `Écart cumulé ${pct(delta)}`,
      rows: this.rows(),
      divRow: {
        label: 'Dividendes projetés (12 mois)',
        before: eur(divBefore),
        after: eur(divAfter),
        delta: pct(divGrowth),
        color: divGrowth < 0 ? 'var(--ink-warn-2)' : 'var(--ink-ok-2)',
      },
      flags: [
        { title: `Perte simulée de ${eur(Math.abs(after - base))}`, detail: model.note, color: tone },
        ...(worst
          ? [{
              title: `${worst.label} le plus exposé au scénario`,
              detail: `Écart de ${pct((worst.afterRaw - worst.beforeRaw) / worst.beforeRaw)} sur cette classe d'actifs.`,
              color: 'var(--ink-warn-2)',
            }]
          : []),
        {
          title: 'Simulation indicative',
          detail: "Hypothèses de marché simplifiées, à usage de sensibilisation — ne remplace pas un modèle de risque réglementaire.",
          color: 'var(--ds-brand-fill, var(--ink-brand-2))',
        },
      ],
    };
  });

  /** La ligne des dividendes clôt le tableau : même jeu de colonnes, fond distinct. */
  protected readonly impactRows = computed(() => [...this.result().rows, this.result().divRow]);

  protected readonly impactColumns = ['label', 'before', 'after', 'delta'];

  protected selectModel(key: string): void {
    this.selected.set(key);
    this.ran.set(false);
  }

  protected setCustom(key: CustomKey, value: string): void {
    this.custom.update((c) => ({ ...c, [key]: value }));
  }

  protected runSim(): void {
    this.ran.set(true);
  }

  protected resetSim(): void {
    this.scope.set('all');
    this.selected.set('crash');
    this.ran.set(false);
    this.custom.set({ ...CUSTOM_DEFAULTS });
  }
}
