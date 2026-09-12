import { Component, computed, signal } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatChipsModule } from '@angular/material/chips';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatTableModule } from '@angular/material/table';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTooltipModule } from '@angular/material/tooltip';

import {
  CONTINENT_ORDER,
  allMicCodes,
  continentOf,
  flagOf,
  placeOf,
  placesOfCountry,
  placeCountries,
  settlementPlaces,
  PLACES,
  type Place,
} from './places-data';
import { MIC_COUNT, allMics, micByCode, micGroup } from './mic-registry';
import {
  PERMISSION_AREAS,
  PERMISSION_LEVELS,
  PERMISSION_ORDER,
  ROLES,
  USERS,
  USER_STATUS,
  defaultLevel,
  initials,
  type PermissionLevel,
  type UserStatus,
} from './roles-data';
import {
  HOLDER_STATUS,
  HOME_GROUPS,
  ISO_RULES,
  RESIDENCES,
  SUSPENSE_RULES,
  parseRate,
  pct,
  ratesForResidence,
} from './withholding-data';

type Tab = 'prefs' | 'tax' | 'settle' | 'venues' | 'roles';

/** Retouches d'un taux, champ par champ : une clé absente signifie « barème officiel ». */
interface RateEdit {
  readonly legal?: string;
  readonly treaty?: string;
  readonly recovery?: string;
}

interface TaxRow {
  readonly kind: 'row';
  readonly code: string;
  readonly flag: string;
  readonly country: string;
  readonly continent: string;
  readonly chips: readonly { mic: string; place: string }[];
  readonly addOptions: readonly { value: string; label: string }[];
  readonly chipBorder: string;
  readonly hasHiddenChips: boolean;
  readonly legal: string;
  readonly treaty: string;
  readonly recovery: string;
  readonly applied: string;
  readonly color: string;
  readonly border: string;
  readonly bg: string;
}

interface GroupRow {
  readonly kind: 'group';
  readonly continent: string;
  readonly count: string;
}

interface VenueRow {
  readonly kind: 'row';
  readonly code: string;
  readonly flag: string;
  readonly country: string;
  readonly continent: string;
  readonly chips: readonly { mic: string; place: string }[];
  readonly addOptions: readonly { value: string; label: string }[];
  readonly chipBorder: string;
  readonly venues: readonly { name: string; hint: string }[];
  readonly indices: readonly { label: string; hint: string }[];
  readonly currencies: readonly string[];
  readonly zones: readonly { label: string; full: string }[];
  readonly sessions: readonly { hours: string; mic: string }[];
  readonly touched: boolean;
  readonly resetTitle: string;
  readonly bg: string;
}

/**
 * Porté depuis `Parametres.dc.html`. Quatre onglets indépendants : préférences de session,
 * prélèvement à la source, règlement-livraison et places boursières.
 *
 * Les trois référentiels que le prototype chargeait par `<script>` (`withholding-rates.js`,
 * `places-service.js`, `mic-registry.js`) deviennent trois modules TypeScript voisins, importés
 * plutôt que lus sur `window` — ce qui les rend utilisables en rendu serveur, où `window`
 * n'existe pas et où chaque accès du prototype retombait sur une liste vide.
 *
 * Toutes les retouches (taux, cycles, places, codes MIC) vivent en mémoire et n'altèrent jamais
 * les référentiels : un état de surcharge se superpose au barème officiel, exactement comme
 * dans le prototype, et les boutons de réinitialisation le vident.
 */
@Component({
  selector: 'app-parametres',
  imports: [
    MatIconModule,
    MatButtonModule,
    MatButtonToggleModule,
    MatChipsModule,
    MatExpansionModule,
    MatSelectModule,
    MatSlideToggleModule,
    MatTableModule,
    MatTabsModule,
    MatTooltipModule,
  ],
  templateUrl: './parametres.html',
  styleUrl: './parametres.css',
})
export class Parametres {
  // -- Onglets ------------------------------------------------------------------------------
  protected readonly tab = signal<Tab>('prefs');

  protected readonly pageTabs = [
    { key: 'prefs' as const, label: 'Préférences', icon: 'settings' },
    { key: 'tax' as const, label: 'Prélèvement à la source', icon: 'receipt' },
    { key: 'settle' as const, label: 'Règlement-livraison', icon: 'transfer' },
    { key: 'venues' as const, label: 'Places boursières', icon: 'globe' },
    { key: 'roles' as const, label: 'Gestion des rôles', icon: 'shield' },
  ];

  protected setTab(t: Tab): void {
    this.tab.set(t);
  }

  protected readonly subtitle = computed(() => {
    switch (this.tab()) {
      case 'tax':
        return 'Retenue à la source appliquée aux revenus de vos titres';
      case 'settle':
        return 'Délais de dénouement par place et règles de suspens';
      case 'venues':
        return 'Places rattachées à chaque pays, avec les indices et devises qui en découlent';
      case 'roles':
        return "Droits accordés par rôle, écran par écran, et rôle attribué à chaque utilisateur";
      default:
        return "Préférences d'affichage et de notification appliquées à votre session";
    }
  });

  // -- Préférences de session ---------------------------------------------------------------
  /* Le prototype peint ces trois réglages en dur ; l'écran porté les rend effectivement
     manipulables, sans rien persister — aucune couche de stockage n'existe encore. */
  protected readonly density = signal<'compact' | 'standard'>('compact');
  protected readonly language = signal<'FR' | 'EN'>('FR');
  protected readonly emailNotifications = signal(true);
  protected readonly homePage = signal('Tableau de bord');
  protected readonly homeGroups = HOME_GROUPS;

  // -- Régime du titulaire ------------------------------------------------------------------
  protected readonly residences = RESIDENCES;
  protected readonly holderStatus = HOLDER_STATUS;
  protected readonly residence = signal('FR');
  protected readonly status = signal('resident');

  protected readonly statusOption = computed(
    () => HOLDER_STATUS.find((o) => o.value === this.status()) ?? HOLDER_STATUS[0],
  );
  protected readonly certificate = signal('2027-06-30');

  protected readonly certified = computed(() => this.certificate().trim().length > 0);

  protected readonly certificateHint = computed(() =>
    this.certified() ? 'Taux conventionnels appliqués' : 'Sans certificat : taux légal retenu',
  );

  // -- Barème fiscal ------------------------------------------------------------------------
  private readonly rateEdits = signal<ReadonlyMap<string, RateEdit>>(new Map());
  /** Places retirées puis rajoutées à un pays, sur l'onglet fiscal. */
  private readonly placeRemovals = signal<ReadonlyMap<string, ReadonlySet<string>>>(new Map());
  private readonly placeAdds = signal<ReadonlyMap<string, readonly string[]>>(new Map());

  private readonly rates = computed(() => {
    const edits = this.rateEdits();
    const removals = this.placeRemovals();
    const adds = this.placeAdds();
    const certified = this.certified();

    return ratesForResidence(this.residence()).map((c, i) => {
      const e = edits.get(c.code) ?? {};
      const legalRaw = e.legal ?? String(c.legal);
      const treatyRaw = e.treaty ?? String(c.treaty);
      const legalVal = Number.isFinite(parseRate(legalRaw)) ? parseRate(legalRaw) : c.legal;
      const treatyVal = Number.isFinite(parseRate(treatyRaw)) ? parseRate(treatyRaw) : c.treaty;
      const applied = certified ? treatyVal : legalVal;
      const touched = e.legal !== undefined || e.treaty !== undefined || e.recovery !== undefined;

      const removed = removals.get(c.code) ?? new Set<string>();
      const added = adds.get(c.code) ?? [];
      const own = placesOfCountry(c.code).map((p) => p.mic);
      const chips = own
        .concat(added.filter((m) => !own.includes(m)))
        .map((m) => placeOf(m))
        .filter((p): p is Place => p !== null && !removed.has(p.mic))
        .sort((a, b) => a.mic.localeCompare(b.mic))
        .map((p) => ({ mic: p.mic, place: p.place }));
      const hidden = removed.size > 0 || added.length > 0;

      return {
        kind: 'row' as const,
        code: c.code,
        flag: c.flag,
        country: c.country,
        continent: c.continent,
        chips,
        addOptions: this.addOptionsFor(chips),
        chipBorder: hidden ? 'var(--ink-brand-2)' : 'var(--color-neutral-300)',
        hasHiddenChips: hidden,
        legal: legalRaw.replace('.', ','),
        treaty: treatyRaw.replace('.', ','),
        recovery: e.recovery ?? c.recovery,
        applied: pct(applied),
        color: applied > treatyVal ? 'var(--ink-warn)' : 'var(--ink-ok)',
        border: touched ? 'var(--ink-brand-2)' : 'var(--color-neutral-300)',
        bg: i % 2 ? 'rgba(0,0,0,0.025)' : 'var(--surface)',
      } satisfies TaxRow;
    });
  });

  /** Toutes les places du référentiel que la ligne ne porte pas déjà, par ordre de MIC. */
  private addOptionsFor(chips: readonly { mic: string }[]): readonly { value: string; label: string }[] {
    return PLACES.filter((p) => !chips.some((ch) => ch.mic === p.mic))
      .slice()
      .sort((a, b) => a.mic.localeCompare(b.mic))
      .map((p) => ({ value: p.mic, label: `${p.mic} — ${p.place}` }));
  }

  /* Un panneau dépliant par continent plutôt qu'un tableau unique à sous-en-têtes : le barème
     compte vingt pays, et l'Europe en concentre seize — replier les zones qu'on ne consulte pas
     est le seul moyen de garder les autres à l'écran. Chaque groupe porte son propre tableau,
     les définitions de colonnes de MatTable étant liées à leur table. */
  protected readonly taxGroups = computed(() => {
    const rows = this.rates();
    return [...new Set(rows.map((r) => r.continent))].map((continent) => {
      const group = rows.filter((r) => r.continent === continent);
      return {
        continent,
        count: `${group.length} pays`,
        rows: group.map((r, i) => ({ ...r, bg: i % 2 ? 'rgba(0,0,0,0.025)' : 'var(--surface)' })),
      };
    });
  });

  /* Tous ouverts au départ : c'est l'état du tableau d'origine, et un écran de paramètres se
     lit d'abord en entier. */
  private readonly closedTaxContinents = signal<ReadonlySet<string>>(new Set());

  protected taxContinentOpen(continent: string): boolean {
    return !this.closedTaxContinents().has(continent);
  }

  protected setTaxContinentOpen(continent: string, open: boolean): void {
    this.closedTaxContinents.update((s) => {
      const next = new Set(s);
      if (open) next.delete(continent);
      else next.add(continent);
      return next;
    });
  }

  /** Insère un sous-en-tête à chaque changement de continent, la liste étant déjà triée.
      Employé par le seul référentiel des places ; le barème fiscal, lui, sépare ses continents
      en panneaux dépliants. */
  private withGroupRows<T extends { continent: string }>(rows: readonly T[]): readonly (T | GroupRow)[] {
    const out: (T | GroupRow)[] = [];
    let last: string | null = null;
    for (const r of rows) {
      if (r.continent !== last) {
        last = r.continent;
        out.push({
          kind: 'group',
          continent: r.continent,
          count: `${rows.filter((x) => x.continent === r.continent).length} pays`,
        });
      }
      out.push(r);
    }
    return out;
  }

  protected readonly rateNote = computed(() =>
    this.certified()
      ? `${ratesForResidence(this.residence()).filter((c) => c.legal > c.treaty).length} pays où le certificat réduit la retenue`
      : 'Certificat absent — taux légal appliqué partout',
  );

  protected readonly hasRateEdits = computed(
    () => this.rateEdits().size + this.placeAdds().size + this.placeRemovals().size > 0,
  );

  protected readonly rateEditCount = computed(() => `${this.rateEdits().size} pays modifié(s)`);

  protected setRate(code: string, field: keyof RateEdit, value: string): void {
    this.rateEdits.update((m) => {
      const next = new Map(m);
      next.set(code, { ...next.get(code), [field]: value });
      return next;
    });
  }

  /** Pas de 0,5 point, borné à l'intervalle des taux possibles. */
  protected stepRate(code: string, field: 'legal' | 'treaty', current: string, delta: number): void {
    const base = parseRate(current);
    const n = Math.min(100, Math.max(0, Math.round((base + delta) * 1000) / 1000));
    this.setRate(code, field, String(n).replace('.', ','));
  }

  protected resetRates(): void {
    this.rateEdits.set(new Map());
    this.placeAdds.set(new Map());
    this.placeRemovals.set(new Map());
  }

  protected removeTaxPlace(code: string, mic: string): void {
    this.placeRemovals.update((m) => {
      const next = new Map(m);
      next.set(code, new Set([...(next.get(code) ?? []), mic]));
      return next;
    });
  }

  protected addTaxPlace(code: string, mic: string): void {
    if (!mic) return;
    this.placeAdds.update((m) => {
      const next = new Map(m);
      const list = next.get(code) ?? [];
      if (!list.includes(mic)) next.set(code, [...list, mic]);
      return next;
    });
    this.placeRemovals.update((m) => {
      const next = new Map(m);
      const set = new Set(next.get(code) ?? []);
      set.delete(mic);
      if (set.size) next.set(code, set);
      else next.delete(code);
      return next;
    });
  }

  protected restoreTaxPlaces(code: string): void {
    this.placeRemovals.update((m) => {
      const next = new Map(m);
      next.delete(code);
      return next;
    });
    this.placeAdds.update((m) => {
      const next = new Map(m);
      next.delete(code);
      return next;
    });
  }

  // -- Règlement-livraison ------------------------------------------------------------------
  private readonly cycleEdits = signal<ReadonlyMap<string, string>>(new Map());
  protected readonly cycleOptions = ['T+0', 'T+1', 'T+2', 'T+3'];
  protected readonly suspenseRules = SUSPENSE_RULES;

  private cycleOf(p: Place): string {
    return this.cycleEdits().get(p.mic) ?? p.settlement?.cycle ?? 'T+2';
  }

  protected readonly settleRows = computed(() =>
    settlementPlaces().map((p, i) => {
      const cycle = this.cycleOf(p);
      const edited = this.cycleEdits().has(p.mic);
      return {
        flag: p.flag,
        mic: p.mic,
        place: p.place,
        cycle,
        shift: p.settlement?.shift ?? '—',
        csd: p.settlement?.csd ?? '—',
        penalty: p.settlement?.penalty ?? '—',
        cycleBg: cycle === 'T+1' ? 'rgba(15,118,110,0.14)' : cycle === 'T+0' ? 'rgba(124,92,191,0.16)' : 'rgba(0,61,165,0.12)',
        cycleFg: cycle === 'T+1' ? 'var(--ink-ok)' : cycle === 'T+0' ? 'var(--ink-alt)' : 'var(--ink-brand)',
        cycleBorder: edited ? 'var(--ink-brand-2)' : 'var(--color-neutral-300)',
        bg: i % 2 ? 'rgba(0,0,0,0.025)' : 'var(--surface)',
      };
    }),
  );

  /* Mêmes panneaux par continent que le barème fiscal : dix places, dont sept en Europe.
     L'ordre des zones est celui du référentiel, pas celui d'apparition des places. */
  protected readonly settleGroups = computed(() => {
    const rows = this.settleRows();
    return CONTINENT_ORDER.map((continent) => ({
      continent,
      rows: rows
        .filter((p) => continentOf(placeOf(p.mic)?.code ?? '') === continent)
        .map((p, i) => ({ ...p, bg: i % 2 ? 'rgba(0,0,0,0.025)' : 'var(--surface)' })),
    }))
      .filter((g) => g.rows.length > 0)
      .map((g) => ({ ...g, count: `${g.rows.length} place(s)` }));
  });

  private readonly closedSettleContinents = signal<ReadonlySet<string>>(new Set());

  protected settleContinentOpen(continent: string): boolean {
    return !this.closedSettleContinents().has(continent);
  }

  protected setSettleContinentOpen(continent: string, open: boolean): void {
    this.closedSettleContinents.update((s) => {
      const next = new Set(s);
      if (open) next.delete(continent);
      else next.add(continent);
      return next;
    });
  }

  protected readonly settleNote = computed(() => {
    const places = settlementPlaces();
    const n1 = places.filter((p) => this.cycleOf(p) === 'T+1').length;
    const n2 = places.filter((p) => this.cycleOf(p) === 'T+2').length;
    const other = places.length - n1 - n2;
    return `${n1} en T+1 · ${n2} en T+2${other ? ` · ${other} autre(s)` : ''}`;
  });

  protected setCycle(mic: string, cycle: string): void {
    this.cycleEdits.update((m) => new Map(m).set(mic, cycle));
  }

  // -- Places boursières : note ISO 10383 ---------------------------------------------------
  protected readonly isoPanelOpen = signal(true);
  protected readonly isoRules = ISO_RULES;
  private readonly micOff = signal<ReadonlySet<string>>(new Set());
  private readonly micAdd = signal<readonly string[]>([]);
  private readonly micSel = signal<ReadonlySet<string>>(new Set());
  protected readonly micInput = signal('');

  protected readonly isoMicChips = computed(() => {
    const off = this.micOff();
    const extra = this.micAdd();
    const own = allMicCodes();
    const sel = this.micSel();
    /* Périmètre applicatif : les places suivies, plus les codes ajoutés à la main — et non le
       registre entier, qui compte 291 entrées. */
    return allMics()
      .filter((e) => own.includes(e.mic) || extra.includes(e.mic))
      .slice()
      .sort((a, b) => a.mic.localeCompare(b.mic))
      .filter((e) => !off.has(e.mic))
      .map((e) => {
        const p = placeOf(e.mic);
        const parts = [e.marketName, e.city, e.countryCode].filter(Boolean);
        const selected = sel.has(e.mic);
        return {
          mic: e.mic,
          flag: flagOf(e.countryCode) || (p?.flag ?? ''),
          hint: parts.length ? parts.join(' · ') : p ? `${p.place} · ${p.country}` : e.mic,
          removeLabel: `Retirer ${e.mic}`,
          selected,
          bg: selected ? 'var(--field-brand)' : 'rgba(0,61,165,0.14)',
          fg: selected ? '#ffffff' : 'var(--ink-brand)',
          border: selected ? 'var(--field-brand)' : 'transparent',
        };
      });
  });

  protected readonly micAddOptions = computed(() => {
    const shown = new Set<string>();
    const off = this.micOff();
    const own = allMicCodes();
    for (const e of allMics()) if (own.includes(e.mic) && !off.has(e.mic)) shown.add(e.mic);
    for (const m of this.micAdd()) shown.add(m);
    return allMics()
      .filter((e) => !shown.has(e.mic))
      .slice()
      .sort((a, b) => a.mic.localeCompare(b.mic))
      .map((e) => ({
        value: e.mic,
        label: [flagOf(e.countryCode), e.mic, e.countryCode, e.city].filter(Boolean).join(' — '),
      }));
  });

  protected toggleMicSel(mic: string): void {
    this.micSel.update((s) => {
      const next = new Set(s);
      if (next.has(mic)) next.delete(mic);
      else next.add(mic);
      return next;
    });
  }

  protected removeMic(mic: string): void {
    this.micOff.update((s) => new Set(s).add(mic));
  }

  /** Ajout d'un code : refusé s'il n'existe pas au registre, le champ étant libre. */
  protected commitMicInput(): void {
    const raw = this.micInput().trim().toUpperCase().split(/[\s—-]/)[0];
    this.micInput.set('');
    if (!raw || !micByCode(raw)) return;
    this.micAdd.update((l) => (l.includes(raw) ? l : [...l, raw]));
    this.micOff.update((s) => {
      const next = new Set(s);
      next.delete(raw);
      return next;
    });
  }

  protected readonly micHasSel = computed(() => this.micSel().size > 0);
  protected readonly micSelNote = computed(() => `${this.micSel().size} code(s) sélectionné(s)`);
  protected clearMicSel(): void {
    this.micSel.set(new Set());
  }

  protected readonly micTouched = computed(
    () => this.micOff().size > 0 || this.micAdd().length > 0 || this.micSel().size > 0,
  );

  protected readonly micOffCount = computed(() => {
    const off = this.micOff().size;
    const add = this.micAdd().length;
    const sel = this.micSel().size;
    return [off ? `${off} retiré(s)` : '', add ? `${add} ajouté(s)` : '', sel ? `${sel} sélectionné(s)` : '']
      .filter(Boolean)
      .join(' · ');
  });

  protected resetMic(): void {
    this.micOff.set(new Set());
    this.micAdd.set([]);
    this.micSel.set(new Set());
  }

  protected readonly isoMicNote = computed(() => {
    const own = allMicCodes();
    const add = this.micAdd().filter((m) => !own.includes(m));
    const n = own.length + add.length - this.micOff().size;
    const pays = new Set(PLACES.map((p) => p.code)).size;
    return `${n} code(s) dans le périmètre · ${pays} pays — sur ${MIC_COUNT} du registre ISO 10383`;
  });

  /** Fiche détaillée des codes sélectionnés : registre ISO d'abord, référentiel applicatif ensuite. */
  protected readonly micSelCards = computed(() =>
    [...this.micSel()].sort().map((mic) => {
      const e = micByCode(mic);
      const p = placeOf(mic);
      const group = micGroup(e ? e.operatingMic : mic);
      const fields: { label: string; value: string }[] = [
        { label: 'Type', value: e ? (e.type === 'OPRT' ? 'MIC opérateur' : 'MIC de segment') : '—' },
        { label: 'MIC opérateur', value: e?.operatingMic ?? '—' },
        { label: 'Pays', value: e?.countryCode || p?.code || '—' },
        { label: 'Ville', value: e?.city || p?.place || '—' },
        { label: 'Acronyme', value: e?.acronym || '—' },
        { label: 'Catégorie', value: e?.marketCategoryCode || '—' },
        { label: 'Segments du groupe', value: group.length ? String(group.length) : '—' },
      ];
      if (p) {
        fields.push({ label: 'Devise de règlement', value: p.currency });
        fields.push({ label: 'Fuseau', value: p.tz });
        fields.push({ label: 'Séance', value: p.hours });
        if (p.index) fields.push({ label: 'Indice de référence', value: p.index });
        if (p.settlement) {
          fields.push({ label: 'Cycle', value: p.settlement.cycle });
          fields.push({ label: 'Dépositaire', value: p.settlement.csd });
        }
      }
      const isOperator = !e || e.type === 'OPRT';
      return {
        mic,
        flag: flagOf(e?.countryCode ?? p?.code ?? '') || (p?.flag ?? ''),
        marketName: e?.marketName ?? p?.place ?? mic,
        typeLabel: isOperator ? 'Opérateur' : 'Segment',
        typeBg: isOperator ? 'rgba(0,61,165,0.14)' : 'rgba(124,92,191,0.16)',
        typeFg: isOperator ? 'var(--ink-brand)' : 'var(--ink-alt)',
        fields,
      };
    }),
  );

  // -- Places boursières : référentiel ------------------------------------------------------
  protected readonly venuePanelOpen = signal(false);
  protected readonly venueQuery = signal('');
  private readonly venueOff = signal<ReadonlyMap<string, ReadonlySet<string>>>(new Map());
  private readonly venueAdd = signal<ReadonlyMap<string, readonly string[]>>(new Map());

  private readonly venues = computed<readonly VenueRow[]>(() => {
    const q = this.venueQuery().trim().toLowerCase();
    const off = this.venueOff();
    const add = this.venueAdd();

    return placeCountries()
      .map((c) => {
        const removed = off.get(c.code) ?? new Set<string>();
        const own = placesOfCountry(c.code).map((p) => p.mic);
        const extra = (add.get(c.code) ?? []).filter((m) => !own.includes(m));
        const chips = own
          .concat(extra)
          .filter((m) => !removed.has(m))
          .map((m) => placeOf(m))
          .filter((p): p is Place => p !== null)
          .sort((a, b) => a.mic.localeCompare(b.mic))
          .map((p) => ({ mic: p.mic, place: p.place }));
        const touched = removed.size > 0 || extra.length > 0;

        const venues = chips.map((ch) => {
          const e = micByCode(ch.mic);
          const p = placeOf(ch.mic);
          return {
            name: e?.marketName ?? p?.place ?? ch.mic,
            hint: ch.mic + (e?.city ? ` · ${e.city}` : p?.place ? ` · ${p.place}` : ''),
          };
        });

        const indices = [...new Set(chips.map((ch) => placeOf(ch.mic)?.index).filter((x): x is string => !!x && x !== '—'))]
          .sort((a, b) => a.localeCompare(b, 'fr'))
          .map((label) => {
            const v = PLACES.find((x) => x.index === label);
            return { label, hint: v ? `${v.mic} — ${v.place}` : label };
          });

        const zones = [...new Set(chips.map((ch) => placeOf(ch.mic)?.tz).filter((x): x is string => !!x))]
          .sort()
          .map((tz) => ({ label: tz.replace(/_/g, ' '), full: tz }));

        const sessions = [
          ...new Map(
            chips
              .map((ch) => placeOf(ch.mic))
              .filter((p): p is Place => p !== null && !!p.hours)
              .map((p) => [p.hours, { hours: p.hours, mic: p.mic }] as const),
          ).values(),
        ].sort((a, b) => a.hours.localeCompare(b.hours));

        const currencies = [...new Set(chips.map((ch) => placeOf(ch.mic)?.currency).filter((x): x is string => !!x))].sort();

        return {
          kind: 'row' as const,
          code: c.code,
          flag: c.flag,
          country: c.country,
          continent: continentOf(c.code),
          chips,
          addOptions: this.addOptionsFor(chips),
          chipBorder: touched ? 'var(--ink-brand-2)' : 'var(--color-neutral-300)',
          venues,
          indices,
          currencies,
          zones,
          sessions,
          touched,
          resetTitle: touched ? "Revenir aux places d'origine" : 'Aucune modification',
          bg: 'var(--surface)',
        } satisfies VenueRow;
      })
      .filter(
        (r) =>
          !q ||
          `${r.code} ${r.country} ${r.chips.map((c) => `${c.mic} ${c.place}`).join(' ')}`.toLowerCase().includes(q),
      )
      .sort((a, b) => {
        const d = CONTINENT_ORDER.indexOf(a.continent) - CONTINENT_ORDER.indexOf(b.continent);
        return d !== 0 ? d : a.country.localeCompare(b.country, 'fr');
      })
      .map((r, i) => ({ ...r, bg: i % 2 ? 'rgba(0,0,0,0.025)' : 'var(--surface)' }));
  });

  protected readonly venueRows = computed<readonly (VenueRow | GroupRow)[]>(() =>
    this.withGroupRows(this.venues()),
  );

  protected readonly venueNote = computed(() => {
    const off = this.venueOff();
    const add = this.venueAdd();
    const codes = [...new Set(PLACES.map((p) => p.code))];
    const total = codes.reduce((n, code) => {
      const removed = off.get(code) ?? new Set<string>();
      const own = placesOfCountry(code).map((p) => p.mic);
      const extra = (add.get(code) ?? []).filter((m) => !own.includes(m));
      return n + own.concat(extra).filter((m) => !removed.has(m)).length;
    }, 0);
    return `${codes.length} pays · ${total} place(s) rattachée(s)`;
  });

  protected removeVenue(code: string, mic: string): void {
    this.venueOff.update((m) => {
      const next = new Map(m);
      next.set(code, new Set([...(next.get(code) ?? []), mic]));
      return next;
    });
  }

  protected addVenue(code: string, mic: string): void {
    if (!mic) return;
    this.venueAdd.update((m) => {
      const next = new Map(m);
      const list = next.get(code) ?? [];
      if (!list.includes(mic)) next.set(code, [...list, mic]);
      return next;
    });
    this.venueOff.update((m) => {
      const next = new Map(m);
      const set = new Set(next.get(code) ?? []);
      set.delete(mic);
      if (set.size) next.set(code, set);
      else next.delete(code);
      return next;
    });
  }

  protected restoreVenues(code: string): void {
    this.venueOff.update((m) => {
      const next = new Map(m);
      next.delete(code);
      return next;
    });
    this.venueAdd.update((m) => {
      const next = new Map(m);
      next.delete(code);
      return next;
    });
  }

  protected resetVenues(): void {
    this.venueQuery.set('');
    this.venueOff.set(new Map());
    this.venueAdd.set(new Map());
  }

  // -- Gestion des rôles --------------------------------------------------------------------
  protected readonly roles = ROLES;
  protected readonly permissionLevels = PERMISSION_LEVELS;
  protected readonly permissionOrder = PERMISSION_ORDER;
  protected readonly userStatus = USER_STATUS;
  protected readonly initials = initials;

  /* Surcharges de la matrice, clé « écran|rôle ». Même principe que les taux et les cycles :
     un barème calculé fait foi, l'état ne retient que ce qui s'en écarte — c'est ce qui permet
     de dire combien de droits ont été retouchés, et de tout rendre en une fois. */
  private readonly permissionEdits = signal<ReadonlyMap<string, PermissionLevel>>(new Map());

  protected levelOf(areaId: string, roleKey: string): PermissionLevel {
    return this.permissionEdits().get(`${areaId}|${roleKey}`) ?? defaultLevel(areaId, roleKey);
  }

  protected setLevel(areaId: string, roleKey: string, level: PermissionLevel): void {
    this.permissionEdits.update((m) => {
      const next = new Map(m);
      const key = `${areaId}|${roleKey}`;
      if (level === defaultLevel(areaId, roleKey)) next.delete(key);
      else next.set(key, level);
      return next;
    });
  }

  protected readonly permissionEditCount = computed(() => this.permissionEdits().size);

  protected resetPermissions(): void {
    this.permissionEdits.set(new Map());
  }

  /* La matrice est découpée par section du menu, chaque section formant un panneau dépliant —
     même mise en page que les continents des deux onglets précédents. */
  protected readonly permissionGroups = computed(() => {
    const edits = this.permissionEdits();
    return [...new Set(PERMISSION_AREAS.map((a) => a.section))].map((section) => {
      const areas = PERMISSION_AREAS.filter((a) => a.section === section);
      return {
        section,
        count: `${areas.length} écran(s)`,
        rows: areas.map((a, i) => ({
          ...a,
          cells: ROLES.map((r) => {
            const level = this.levelOf(a.id, r.key);
            const def = PERMISSION_LEVELS[level];
            return {
              roleKey: r.key,
              roleLabel: r.label,
              level,
              label: def.short,
              bg: def.bg,
              fg: def.fg,
              hint: `${r.label} — ${def.label} : ${def.hint}`,
              /* Le rôle d'administrateur porte l'accès complet : le rétrograder fermerait
                 l'application à son seul détenteur. */
              locked: r.locked === true,
              edited: edits.has(`${a.id}|${r.key}`),
            };
          }),
        })),
      };
    });
  });

  private readonly closedPermissionSections = signal<ReadonlySet<string>>(new Set());

  protected permissionSectionOpen(section: string): boolean {
    return !this.closedPermissionSections().has(section);
  }

  protected setPermissionSectionOpen(section: string, open: boolean): void {
    this.closedPermissionSections.update((s) => {
      const next = new Set(s);
      if (open) next.delete(section);
      else next.add(section);
      return next;
    });
  }

  /** Décompte des droits accordés par rôle, tous écrans confondus. */
  protected readonly roleCards = computed(() => {
    const users = this.userRoles();
    return ROLES.map((r) => {
      const levels = PERMISSION_AREAS.map((a) => this.levelOf(a.id, r.key));
      const granted = levels.filter((l) => l !== 'none').length;
      return {
        ...r,
        granted: `${granted} / ${PERMISSION_AREAS.length} écrans`,
        approvals: levels.filter((l) => l === 'approve').length,
        users: [...users.values()].filter((k) => k === r.key).length,
      };
    });
  });

  // -- Utilisateurs -------------------------------------------------------------------------
  private readonly userRoleEdits = signal<ReadonlyMap<string, string>>(new Map());
  protected readonly userQuery = signal('');

  private readonly userRoles = computed(() => {
    const edits = this.userRoleEdits();
    return new Map(USERS.map((u) => [u.id, edits.get(u.id) ?? u.role]));
  });

  protected readonly userRows = computed(() => {
    const q = this.userQuery().trim().toLowerCase();
    const roles = this.userRoles();
    const edits = this.userRoleEdits();
    return USERS.filter((u) => !q || `${u.name} ${u.email}`.toLowerCase().includes(q)).map((u, i) => {
      const roleKey = roles.get(u.id) ?? u.role;
      const role = ROLES.find((r) => r.key === roleKey) ?? ROLES[ROLES.length - 1];
      const st = USER_STATUS[u.status as UserStatus];
      return {
        ...u,
        initials: initials(u.name),
        roleKey,
        roleLabel: role.label,
        roleBg: role.bg,
        roleFg: role.fg,
        roleHint: role.hint,
        roleEdited: edits.has(u.id),
        statusLabel: st.label,
        statusBg: st.bg,
        statusFg: st.fg,
        bg: i % 2 ? 'rgba(0,0,0,0.025)' : 'var(--surface)',
      };
    });
  });

  protected readonly userNote = computed(() => {
    const roles = this.userRoles();
    const actifs = USERS.filter((u) => u.status === 'active').length;
    const admins = [...roles.values()].filter((k) => k === 'admin').length;
    return `${USERS.length} comptes · ${actifs} actifs · ${admins} administrateur(s)`;
  });

  protected setUserRole(userId: string, roleKey: string): void {
    this.userRoleEdits.update((m) => {
      const next = new Map(m);
      const original = USERS.find((u) => u.id === userId)?.role;
      if (roleKey === original) next.delete(userId);
      else next.set(userId, roleKey);
      return next;
    });
  }

  protected readonly userEditCount = computed(() => this.userRoleEdits().size);

  protected resetUsers(): void {
    this.userRoleEdits.set(new Map());
    this.userQuery.set('');
  }

  // -- Colonnes des tableaux ----------------------------------------------------------------
  protected readonly taxColumns = ['country', 'places', 'legal', 'treaty', 'applied', 'recovery'];
  protected readonly settleColumns = ['mic', 'place', 'cycle', 'shift', 'csd', 'penalty'];
  protected readonly venueColumns = ['country', 'places', 'venues', 'indices', 'currency', 'zone', 'session'];
  protected readonly venueGroupColumns = ['group'];
  protected readonly userColumns = ['user', 'role', 'status', 'lastSeen'];

  protected isGroupRow = (_: number, row: TaxRow | VenueRow | GroupRow): boolean => row.kind === 'group';
  protected isDataRow = (_: number, row: TaxRow | VenueRow | GroupRow): boolean => row.kind === 'row';
}
