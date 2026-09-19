import { Component, HostBinding, WritableSignal, computed, inject, signal } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ThemeService } from '../../shell/theme.service';
import { IndexCompositionService } from '../../domain/index-composition.service';
import { SecurityUniverseStore } from '../../domain/security-universe.store';
import { IndexDef } from './titres-data';
import {
  computePreview,
  isLockedInUniverse,
} from './titres-filters';
import { nextSort, sortHeaderView } from '../positions/positions-sort';

/** Colonne qui range le tableau au repos : le nom, toujours. */
const DEFAULT_SORT = 'composant';

/** Comparaison des libellés : accents rangés comme en français, « 3i Group » avant « 30 ». */
const cmp = (a: string, b: string): number =>
  a.localeCompare(b, 'fr', { numeric: true, sensitivity: 'base' });

export interface TiPreviewDialogData {
  readonly idx: IndexDef;
  readonly refs: WritableSignal<ReadonlyMap<string, 'ok' | 'none'>>;
}

/**
 * Modale d'aperçu d'un indice (`previewOpen` de la source) — un `MatDialog` standard, centré et
 * fermable, plutôt que la boîte `position:fixed` + glisser-déposer (`startDrag`/`mousemove`) du
 * prototype : ce chrome de déplacement manuel n'apporte rien qu'un dialogue Material ne fasse
 * déjà (recentrage, fermeture au clic extérieur/Échap).
 */
@Component({
  selector: 'app-ti-preview-dialog',
  imports: [MatIconModule, MatDialogModule, MatButtonModule, MatSlideToggleModule, MatTableModule, MatTooltipModule],
  templateUrl: './ti-preview-dialog.html',
  styleUrl: './ti-preview-dialog.css',
})
export class TiPreviewDialog {
  private readonly data = inject<TiPreviewDialogData>(MAT_DIALOG_DATA);
  private readonly dialogRef = inject(MatDialogRef<TiPreviewDialog>);
  private readonly theme = inject(ThemeService);

  @HostBinding('attr.data-theme') protected get themeAttr() {
    return this.theme.mode();
  }

  private readonly indexService = inject(IndexCompositionService);
  /* Les décisions du comité ne transitent plus par la donnée de la modale : elles ont un service,
     que la modale interroge directement. */
  private readonly universe = inject(SecurityUniverseStore);

  protected readonly idx = this.data.idx;

  protected readonly previewColumns = ['composant', 'cotation', 'secteur', 'poids', 'bascule', 'statut'];

  /* La composition vient du référentiel et de lui seul : l'écran ne tient plus de copie locale
     depuis que la source la fournit. */
  private readonly members = computed(() => this.idx.members);

  protected readonly preview = computed(() =>
    computePreview(this.universe.all(), this.idx, this.members(), this.data.refs(), this.universe.decisionMap()),
  );

  /**
   * Ce qui était déjà retenu à l'ouverture.
   *
   * Lu une seule fois, à la construction : c'est la référence qui permet de dire, à la fermeture,
   * lesquels sont *nouveaux*. Un `computed` ne conviendrait pas — il suivrait les bascules et
   * n'aurait plus rien à comparer.
   */
  private readonly retenusALOuverture = new Set(
    this.preview().rows.filter((r) => r.on).map((r) => r.ticker),
  );

  /* La composition vient du service, sur la liste effectivement chargée : c'est lui qui sait où
     l'indice cote, de quel pays chaque composant est émis et ce que l'univers en connaît. La modale
     se contentait du nom, du secteur et du poids. */
  private readonly composition = computed(() => this.indexService.withMembers(this.idx.key, this.members()));

  /** Place et devise de l'indice, pour l'en-tête — « plusieurs places » quand il en couvre plusieurs. */
  protected readonly venue = computed(() => {
    const c = this.composition();
    if (!c) return '';
    return `${c.mic ? c.mic + ' · ' : ''}${c.place} · ${c.currency}`;
  });

  /** Ce que l'indice partage avec l'univers, en poids — l'information que la modale n'avait pas. */
  protected readonly universeKpi = computed(() => {
    const c = this.indexService.universeCoverage(this.idx.key);
    if (!c.known) return { label: 'Part à l’univers', value: 'Aucun composant', color: 'var(--color-neutral-700)' };
    return {
      label: 'Part à l’univers',
      value: `${c.knownWeight.toFixed(1).replace('.', ',')} % · ${c.known} valeur${c.known > 1 ? 's' : ''}`,
      color: 'var(--ink-ok-2)',
    };
  });

  /* Les lignes du tableau, complétées par ce que le service ajoute. L'appariement se fait par ISIN
     et non par ticker : c'est le seul identifiant qui ne dépend pas de la place. */
  protected readonly rows = computed(() => {
    const byIsin = new Map((this.composition()?.components ?? []).map((c) => [c.isin, c]));
    const rows = this.preview().rows.map((r) => {
      const c = byIsin.get(r.isin);
      /* La cotation s'écrit `MIC.Ticker` — `XPAR.TTE` : c'est la désignation d'usage d'une ligne
         cotée, place puis code local, et elle est sans ambiguïté là où le seul ticker ne l'est pas
         (`MC` désigne LVMH à Paris et McCormick à New York). Sans MIC — un indice réparti sur
         plusieurs places n'en a pas — il ne reste que le ticker. */
      const mic = c?.mic || '';
      return {
        ...r,
        listing: mic ? `${mic}.${r.ticker}` : r.ticker,
        flag: c?.flag ?? '',
        country: c?.country ?? '',
        inUniverse: !!c?.inUniverse,
      };
    });

    const key = this.sortKey();
    if (!key) return rows;
    const dir = this.sortDir() === 'asc' ? 1 : -1;
    const of = (r: (typeof rows)[number]): string =>
      key === 'cotation' ? r.listing : key === 'secteur' ? r.sector : key === 'statut' ? r.eligible : r.name;
    /* Tri stable de repli sur le nom : deux lignes du même secteur ou du même statut gardent entre
       elles l'ordre alphabétique, sinon elles se rangeraient dans l'ordre de la source — le poids —
       et un même clic donnerait deux ordres différents selon l'indice. */
    return [...rows].sort(
      (a, b) => dir * cmp(of(a), of(b)) || cmp(a.name, b.name),
    );
  });

  // -- Tri des colonnes -------------------------------------------------------------------------

  /* Le tri démarre explicitement sur le nom, et non à `null` : l'en-tête se montrant actif dès
     l'ouverture, un état interne vide aurait rendu le premier clic sans effet — il aurait posé le
     tri croissant déjà en place au lieu de l'inverser. `null` reste le troisième temps du cycle,
     qui rend la composition à son ordre par défaut, alphabétique lui aussi : une modale d'indice
     sert à retrouver une valeur précise parmi cinq cents, l'ordre des noms est le seul repos. */
  private readonly sortKey = signal<string | null>(DEFAULT_SORT);
  private readonly sortDir = signal<'asc' | 'desc'>('asc');

  protected sortHeader(key: string) {
    /* La colonne du nom se montre active tant qu'aucune autre ne l'est, puisque c'est elle qui
       range effectivement le tableau. */
    const active = this.sortKey() ?? DEFAULT_SORT;
    return sortHeaderView(active, this.sortDir(), key);
  }

  protected onSort(key: string): void {
    const next = nextSort(this.sortKey(), this.sortDir(), key);
    /* Le cycle habituel a trois temps — croissant, décroissant, sans tri — mais « sans tri » rend
       ici la composition rangée par nom, c'est-à-dire exactement ce que donne le tri croissant sur
       le nom. Laisser ce troisième temps sur cette colonne produirait un clic sans effet visible.
       Elle bascule donc simplement entre croissant et décroissant ; les autres colonnes gardent les
       trois temps, leur troisième clic ramenant au classement alphabétique. */
    const idle = next.key === null && key === DEFAULT_SORT;
    this.sortKey.set(idle ? DEFAULT_SORT : next.key);
    this.sortDir.set(idle ? 'asc' : next.dir);
  }

  /** Ferme sans rien demander à l'écran. */
  protected close(): void {
    this.dialogRef.close();
  }

  /**
   * Ferme en demandant que la composition passe aux résultats.
   *
   * Les deux boutons du pied appelaient `close()` à l'identique : « Charger dans la liste »
   * fermait le dialogue et rien d'autre, alors que son libellé promet une action. Rendre `true`
   * est le minimum pour que l'écran sache lequel des deux a été pressé — c'est lui qui décide
   * ensuite quoi en faire, le dialogue n'ayant pas à connaître le panneau de résultats.
   *
   * Ce qui remonte, ce sont les titres retenus **pendant cette ouverture**, et eux seuls. Verser
   * la composition entière noierait le geste : on vient d'en cocher deux sur quarante, et c'est
   * ces deux-là qu'on veut retrouver dans la liste. Ceux qui étaient déjà retenus avant n'ont pas
   * été choisis maintenant — ils sont déjà dans l'univers, ils n'ont pas à revenir.
   */
  protected load(): void {
    const nouveaux = this.preview().rows
      .filter((r) => r.on && !this.retenusALOuverture.has(r.ticker))
      .map((r) => r.ticker);
    this.dialogRef.close(nouveaux);
  }

  /**
   * Bascule une ligne.
   *
   * Le refus est ici et pas seulement sur l'attribut `disabled` du gabarit : une bascule grisée
   * empêche le clic, elle n'empêche pas l'appel. C'est au domaine de dire non — la vue ne fait
   * que le montrer.
   */
  protected toggleRow(ticker: string, on: boolean): void {
    if (isLockedInUniverse(ticker, on)) return;
    this.data.refs.update((m) => {
      const next = new Map(m);
      next.set(this.idx.key + '/' + ticker, on ? 'none' : 'ok');
      return next;
    });
  }

  /**
   * Bascule toute la composition.
   *
   * Tout décocher épargne les titres détenus : ils restent retenus. Un « tout décocher » qui les
   * sortirait de l'univers ferait par lot ce que la ligne refuse une par une, et c'est le genre
   * d'échappatoire qu'on ne découvre qu'après coup.
   */
  protected toggleAll(): void {
    const p = this.preview();
    const on = !p.allOn;
    this.data.refs.update((m) => {
      const next = new Map(m);
      this.idx.members.forEach((mem) => {
        if (!on && isLockedInUniverse(mem.ticker, true)) return;
        next.set(this.idx.key + '/' + mem.ticker, on ? 'ok' : 'none');
      });
      return next;
    });
  }
}
