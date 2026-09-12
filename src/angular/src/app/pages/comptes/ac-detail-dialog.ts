import { Component, HostBinding, computed, inject, signal } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { SidePanel } from '../../ui/side-panel/side-panel';
import { ThemeService } from '../../shell/theme.service';
import type { Icon } from '../../shell/icon-shapes';
import {
  ACCOUNTS,
  KYC,
  LIFE_DATES,
  LIFE_EXTRA_DONE,
  PHASES,
  REACHED,
  STAGES,
  STATES,
  fr,
  initials,
  pct,
} from './comptes-data';

export interface AcDetailDialogData {
  readonly accountId: string;
}

type Pane = 'life' | 'mandate' | 'holders' | 'history';

const ICON_DETAIL: Icon = 'id-card';

/**
 * Panneau de détail du compte client (`detailOpen` du prototype, lignes 177-313) : identité,
 * KPIs, sous-onglets (Vie du mandat / Règles / Titulaires / Historique), points d'attention —
 * un `MatDialog` enveloppant `<app-side-panel>`, comme `tx-struct-dialog.ts`.
 *
 * Vignettes KPI : le prototype teinte le fond de vignette (`--band-ok`/`--band-warn`) via
 * `toneByColor()`, qui détecte le vert/rouge en cherchant des sous-chaînes hexadécimales
 * (`0f766e`, `b45309`…) dans la couleur du texte — or cette couleur est toujours une référence
 * `var(--ink-ok-2)` / `var(--ink-warn-2)`, jamais un hex littéral : la détection ne matche donc
 * jamais et le fond reste systématiquement `var(--surface)` avec un libellé neutre, quel que
 * soit le signe de la valeur. Porté fidèlement (fond neutre constant) ; seule la couleur du
 * texte de la valeur elle-même varie, comme le fait réellement `renderVals()`.
 */
@Component({
  selector: 'app-ac-detail-dialog',
  imports: [MatIconModule, SidePanel, MatTooltipModule],
  templateUrl: './ac-detail-dialog.html',
  styleUrl: './ac-detail-dialog.css',
})
export class AcDetailDialog {
  private readonly data = inject<AcDetailDialogData>(MAT_DIALOG_DATA);
  private readonly dialogRef = inject(MatDialogRef<AcDetailDialog>);
  private readonly theme = inject(ThemeService);

  @HostBinding('attr.data-theme') protected get themeAttr() {
    return this.theme.mode();
  }

  protected readonly icon = ICON_DETAIL;
  protected readonly account = ACCOUNTS.find((a) => a.id === this.data.accountId) || ACCOUNTS[0];
  protected readonly pane = signal<Pane>('life');

  protected readonly totalAum = ACCOUNTS.reduce((n, a) => n + a.aum, 0);

  protected readonly state = STATES[this.account.state] || STATES['active'];

  protected readonly identity = [
    { label: 'Référence', value: this.account.id },
    { label: 'Type de gestion', value: this.account.type },
    { label: 'Profil de risque', value: this.account.risk },
    { label: 'Devise de référence', value: this.account.currency },
    { label: "Date d'ouverture", value: this.account.opened },
    { label: 'Horizon', value: this.account.horizon },
    { label: 'Gérant', value: this.account.manager },
    { label: 'Dépositaire', value: this.account.custodian },
    { label: 'Domiciliation', value: this.account.domicile },
    { label: 'Classification MiFID', value: this.account.mifid },
    { label: 'Régime fiscal', value: this.account.tax },
    { label: 'Tarification', value: this.account.fee },
    { label: 'Prochaine revue', value: this.account.review },
    { label: 'Titulaires', value: this.account.holders.length + ' personne(s) rattachée(s)' },
  ];

  protected readonly kpis = (() => {
    const cur = this.account;
    const totalAum = this.totalAum;
    return [
      { label: 'Encours', value: cur.aum ? fr(cur.aum) + ' M€' : '—', note: cur.aum ? 'Valorisation au 31/08' : 'Compte non alimenté', color: 'var(--color-text)' },
      { label: 'Performance', value: cur.aum ? pct(cur.perf) : '—', note: 'Depuis janvier', color: cur.aum === 0 ? 'var(--color-text)' : cur.perf >= 0 ? 'var(--ink-ok-2)' : 'var(--ink-warn-2)' },
      { label: 'Part du total', value: cur.aum ? fr((cur.aum / totalAum) * 100) + ' %' : '—', note: 'Des encours gérés', color: 'var(--color-text)' },
      { label: "Points d'attention", value: String(cur.flags.length), note: cur.flags.filter((f) => f.level === 'warn').length + ' bloquant(s)', color: cur.flags.some((f) => f.level === 'warn') ? 'var(--ink-warn-2)' : 'var(--ink-ok-2)' },
    ].map((k) => ({ ...k, bg: 'var(--surface)', labelColor: 'var(--color-neutral-700)' }));
  })();

  protected readonly paneTabs: readonly { readonly key: Pane; readonly label: string }[] = [
    { key: 'life', label: 'Cycle de vie' },
    { key: 'mandate', label: 'Compte et limites' },
    { key: 'holders', label: 'Titulaires' },
    { key: 'history', label: 'Historique' },
  ];

  protected readonly paneTitle = computed(() => {
    switch (this.pane()) {
      case 'life': return 'Cycle de vie du compte';
      case 'mandate': return 'Contraintes du compte';
      case 'holders': return 'Titulaires et mandataires';
      default: return 'Historique de la relation';
    }
  });

  private readonly reached = REACHED[this.account.state] === undefined ? 8 : REACHED[this.account.state];

  protected readonly lifeNote = (() => {
    const st = this.account.state;
    return st === 'onboarding' ? 'Entrée en relation en cours'
      : st === 'frozen' ? 'Compte gelé — étapes de vie suspendues'
      : st === 'closing' ? 'Clôture engagée'
      : 'Compte en vie courante';
  })();

  protected readonly lifePhases = PHASES.map((p) => {
    const done = p.upTo < this.reached;
    const current = !done && p.from <= this.reached;
    return {
      label: p.label,
      count: p.from + 1 + '–' + (p.upTo + 1),
      bg: done ? 'var(--ds-brand-fill, var(--field-brand))' : current ? 'rgba(0,61,165,0.12)' : 'var(--color-neutral-200)',
      fg: done ? '#ffffff' : current ? 'var(--ds-brand-fill, var(--ink-brand-2))' : 'var(--color-neutral-700)',
      weight: current || done ? '700' : '400',
    };
  });

  protected readonly life = (() => {
    const dates = LIFE_DATES[this.account.id] || [];
    const reached = this.reached;
    const extraDone = LIFE_EXTRA_DONE[this.account.id] || [];
    return STAGES.map((s, i) => {
      const d = dates[i];
      const extra = extraDone.indexOf(i) >= 0;
      const done = i < reached || extra;
      const current = i === reached;
      return {
        label: i + 1 + '. ' + s.label,
        detail: s.detail,
        actor: s.actor,
        docs: s.docs,
        date: i <= reached || extra ? d || '—' : '—',
        badge: done ? '✓' : String(i + 1),
        badgeBg: done ? 'var(--ds-brand-fill, var(--field-brand))' : current ? 'rgba(0,61,165,0.12)' : 'transparent',
        badgeFg: done ? '#ffffff' : current ? 'var(--ds-brand-fill, var(--ink-brand-2))' : 'var(--color-neutral-600)',
        ring: done || current ? 'var(--ds-brand-fill, var(--ink-brand-2))' : 'var(--color-neutral-400)',
        fg: done || current ? 'var(--color-text)' : 'var(--color-neutral-600)',
        weight: current ? '700' : '400',
        state: done ? 'Franchie' : current ? 'En cours' : 'À venir',
        stateColor: done ? 'var(--ink-ok-2)' : current ? 'var(--ds-brand-fill, var(--ink-brand-2))' : 'var(--color-neutral-600)',
        hasLine: i < STAGES.length - 1,
        line: i < reached ? 'var(--ds-brand-fill, var(--ink-brand-2))' : 'var(--color-neutral-300)',
      };
    });
  })();

  protected readonly mandateRules = this.account.rules.map((r) => {
    const scale = Math.max(r.limit, r.value, 10) * 1.15;
    const near = r.limit > 0 && r.value / r.limit >= 0.9;
    const over = r.limit > 0 && r.value > r.limit;
    return {
      label: r.label,
      value: fr(r.value) + ' %',
      status: over ? 'Limite dépassée' : near ? 'Proche de la limite' : 'Limite ' + r.limit + ' %',
      color: over || near ? 'var(--ink-warn-2)' : 'var(--color-neutral-700)',
      width: ((r.value / scale) * 100).toFixed(1) + '%',
      limit: ((r.limit / scale) * 100).toFixed(1) + '%',
      barColor: over || near ? 'var(--ink-warn-2)' : 'var(--ds-brand-fill, var(--ink-brand-2))',
    };
  });

  protected readonly holders = this.account.holders.map((h) => ({
    name: h.name, role: h.role, detail: h.detail, kyc: h.kyc,
    initials: initials(h.name),
    kycBg: (KYC[h.kyc] || KYC['Hors périmètre']).bg,
    kycFg: (KYC[h.kyc] || KYC['Hors périmètre']).fg,
  }));

  protected readonly history = this.account.history;

  protected readonly flags = this.account.flags.map((f) => ({
    title: f.title, detail: f.detail,
    color: f.level === 'warn' ? 'var(--ink-warn-2)' : 'var(--ds-brand-fill, var(--ink-brand-2))',
  }));

  protected setPane(p: Pane): void {
    this.pane.set(p);
  }

  protected close(): void {
    this.dialogRef.close();
  }

  protected onPinnedChange(pinned: boolean): void {
    this.dialogRef.disableClose = pinned;
  }
}
