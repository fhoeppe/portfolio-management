import { Component, computed, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTooltipModule } from '@angular/material/tooltip';

import { DocPage } from '../../ui/doc-preview/doc-page';
import { ZoomPan } from '../../ui/doc-preview/zoom-pan';
import {
  ACCESS_OPTIONS,
  CONFIDENCE_TINT,
  FOLDERS,
  FORMS,
  IA_FIELDS,
  OCR_STATS,
  OCR_TEXT,
  PREVIEW_LINES,
  RETENTION_OPTIONS,
  SEED_DOCS,
  SOURCE_OPTIONS,
  STATES,
  STATE_FILTER_OPTIONS,
  STEPS,
  TYPES,
  accessLabel,
  blankDraft,
  folderLabel,
  formLabel,
  fr,
  isoToday,
  lastVersion,
  typeLabel,
  type Doc,
  type DocState,
  type Draft,
} from './documents-data';

type Tab = 'library' | 'capture' | 'review';

/**
 * Porté depuis `Documents.dc.html`. Trois onglets : la bibliothèque, la saisie guidée en six
 * étapes, et la revue des métadonnées et des versions.
 *
 * Le registre (`docs`) est le seul état que l'écran modifie réellement : dépôt, nouvelle
 * version, validation, archivage et suppression l'altèrent, tout le reste en dérive. Rien
 * n'est persisté — aucune couche de stockage n'existe encore.
 *
 * L'OCR et l'analyse IA sont simulés, comme dans le prototype : ils basculent un drapeau et
 * révèlent des résultats écrits à l'avance. Le bouton « Appliquer au classement » recopie ces
 * propositions dans le brouillon, ce qui est le seul endroit où elles ont un effet.
 */
@Component({
  selector: 'app-documents',
  imports: [
    MatButtonModule,
    MatButtonToggleModule,
    MatCheckboxModule,
    MatIconModule,
    MatSelectModule,
    MatTableModule,
    MatTabsModule,
    MatTooltipModule,
    DocPage,
  ],
  templateUrl: './documents.html',
  styleUrl: './documents.css',
})
export class Documents {
  // -- Référentiels exposés au gabarit ------------------------------------------------------
  protected readonly typeOptions = TYPES;
  protected readonly formOptions = FORMS;
  protected readonly folderOptions = FOLDERS;
  protected readonly accessOptions = ACCESS_OPTIONS;
  protected readonly retentionOptions = RETENTION_OPTIONS;
  protected readonly sourceOptions = SOURCE_OPTIONS;
  protected readonly stateFilterOptions = STATE_FILTER_OPTIONS;
  protected readonly ocrStats = OCR_STATS;
  protected readonly ocrText = OCR_TEXT;
  protected readonly previewLines = PREVIEW_LINES;

  // -- État ---------------------------------------------------------------------------------
  protected readonly tab = signal<Tab>('library');
  protected readonly docs = signal<readonly Doc[]>(SEED_DOCS);
  protected readonly query = signal('');
  protected readonly filterType = signal('all');
  protected readonly filterState = signal('all');
  protected readonly step = signal(0);
  protected readonly draft = signal<Draft>(blankDraft());
  protected readonly selectedId = signal('d2');
  protected readonly page = signal(1);
  protected readonly ocrDone = signal(false);
  protected readonly iaDone = signal(false);
  protected readonly iaApplied = signal(false);
  protected readonly compareText = signal('');

  protected readonly view = new ZoomPan();

  protected setTab(t: Tab): void {
    this.tab.set(t);
  }

  protected patch(p: Partial<Draft>): void {
    this.draft.update((d) => ({ ...d, ...p }));
  }

  // -- En-tête ------------------------------------------------------------------------------
  protected readonly reviewCount = computed(() => this.docs().filter((d) => d.state === 'review').length);

  protected readonly subtitle = computed(() => {
    switch (this.tab()) {
      case 'capture':
        return 'Saisie guidée en six étapes, OCR puis analyse IA';
      case 'review':
        return 'Contrôle des métadonnées et des versions';
      default:
        return 'Bibliothèque des pièces rattachées aux comptes';
    }
  });

  protected readonly headerStat = computed(
    () => `${this.docs().length} documents · ${this.reviewCount()} en attente de revue`,
  );

  protected readonly pageTabs = computed(() => [
    { key: 'library' as const, label: 'Gestion documentaire', icon: 'book', badge: 0 },
    { key: 'capture' as const, label: 'Nouveau document', icon: 'file-text', badge: 0 },
    { key: 'review' as const, label: 'Revue et métadonnées', icon: 'eye', badge: this.reviewCount() },
  ]);

  // -- Bibliothèque -------------------------------------------------------------------------
  protected readonly rows = computed(() => {
    const q = this.query().trim().toLowerCase();
    const type = this.filterType();
    const state = this.filterState();
    return this.docs()
      .filter((d) => {
        if (type !== 'all' && d.type !== type) return false;
        if (state !== 'all' && d.state !== state) return false;
        return !q || `${d.name} ${d.tags} ${d.file}`.toLowerCase().includes(q);
      })
      .map((d) => {
        const last = lastVersion(d);
        const st = STATES[d.state];
        return {
          id: d.id,
          name: d.name,
          ext: d.ext,
          meta: `${d.file} · ${last.size}`,
          type: `${typeLabel(d.type)} · ${formLabel(d.form ?? 'original')}`,
          folder: d.folder,
          version: `v${last.n}`,
          versionMeta: fr(last.date),
          stateLabel: st.label,
          stateBg: st.bg,
          stateFg: st.fg,
        };
      });
  });

  protected readonly libraryColumns = ['doc', 'type', 'folder', 'version', 'state', 'actions'];

  protected goCapture(): void {
    this.tab.set('capture');
    this.step.set(0);
    this.draft.set(blankDraft());
    this.resetAnalysis();
  }

  protected openReview(id: string): void {
    this.tab.set('review');
    this.selectedId.set(id);
    this.compareText.set('');
  }

  /** Dépose une nouvelle version d'un document existant : l'assistant s'ouvre pré-rempli. */
  protected newVersionOf(id: string): void {
    const doc = this.docs().find((d) => d.id === id);
    this.tab.set('capture');
    this.step.set(0);
    this.draft.set({
      ...blankDraft(),
      isNewVersion: true,
      parentId: id,
      type: doc?.type ?? 'mandat',
      folder: doc?.folder ?? 'BGM-004',
    });
    this.resetAnalysis();
  }

  protected removeDoc(id: string): void {
    this.docs.update((list) => list.filter((d) => d.id !== id));
  }

  // -- Assistant de saisie ------------------------------------------------------------------
  /* En saisie manuelle, les deux étapes d'analyse n'ont pas d'objet : il n'y a pas de fichier
     à reconnaître. Elles restent visibles dans le fil, grisées, plutôt que de disparaître —
     leur absence changerait la numérotation d'une étape à l'autre. */
  protected stepDisabled(i: number): boolean {
    return this.draft().mode === 'manual' && (STEPS[i].key === 'ocr' || STEPS[i].key === 'ia');
  }

  protected readonly steps = computed(() => {
    const step = this.step();
    return STEPS.map((s, i) => {
      const off = this.stepDisabled(i);
      return {
        index: i,
        title: s.title,
        hint: off ? 'Désactivé — saisie manuelle' : s.hint,
        badge: off ? '—' : String(i + 1),
        done: !off && i < step,
        disabled: off,
        badgeBg: off ? 'rgba(0,0,0,0.12)' : i <= step ? 'var(--ds-brand-fill, var(--ink-brand-2))' : 'var(--color-neutral-700)',
        badgeFg: off ? 'var(--color-neutral-500)' : '#ffffff',
        fg: off ? 'var(--color-neutral-500)' : i === step ? 'var(--color-text)' : 'var(--color-neutral-700)',
        weight: i === step && !off ? '500' : '400',
        hasLine: i < STEPS.length - 1,
      };
    });
  });

  protected goToStep(i: number): void {
    if (!this.stepDisabled(i)) this.step.set(i);
  }

  /** Avance ou recule en sautant les étapes désactivées. */
  protected jump(dir: 1 | -1): void {
    let i = this.step() + dir;
    while (i > 0 && i < STEPS.length - 1 && this.stepDisabled(i)) i += dir;
    if (this.stepDisabled(i)) i = dir > 0 ? STEPS.length - 1 : 0;
    this.step.set(Math.max(0, Math.min(STEPS.length - 1, i)));
  }

  protected readonly stepKey = computed(() => STEPS[this.step()].key);
  protected readonly stepLabel = computed(
    () => `Étape ${this.step() + 1} sur ${STEPS.length} — ${STEPS[this.step()].title}`,
  );
  protected readonly isLastStep = computed(() => this.step() === STEPS.length - 1);
  protected readonly submitLabel = computed(() =>
    this.draft().isNewVersion ? 'Enregistrer la nouvelle version' : 'Enregistrer le document',
  );

  protected readonly modeHint = computed(() =>
    this.draft().mode === 'file'
      ? "Le fichier déposé passe par la reconnaissance OCR puis l'analyse IA."
      : 'Saisie manuelle : les étapes Analyse OCR et Analyse IA sont désactivées.',
  );

  protected readonly fileFieldLabel = computed(() =>
    this.draft().mode === 'file' ? 'Nom du fichier' : 'Référence de la saisie',
  );

  protected setMode(mode: 'file' | 'manual'): void {
    this.patch({ mode });
    /* Passer en saisie manuelle efface les résultats d'analyse : ils portaient sur un fichier
       qui n'est plus dans le circuit. */
    if (mode === 'manual') this.resetAnalysis();
  }

  private resetAnalysis(): void {
    this.ocrDone.set(false);
    this.iaDone.set(false);
    this.iaApplied.set(false);
  }

  protected pickFile(): void {
    this.patch({ file: this.draft().file || 'document-scanne.pdf' });
  }

  // -- Aperçu -------------------------------------------------------------------------------
  protected readonly preview = computed(() => {
    const d = this.draft();
    return {
      name: d.file || 'document-a-saisir.pdf',
      pageLabel: `${this.page()} / 9`,
      kicker: `Page ${this.page()}`,
      title: d.title || typeLabel(d.type),
      footer: `Aperçu — ${d.reference || 'référence à saisir'}`,
    };
  });

  protected prevPage(): void {
    this.page.update((p) => Math.max(1, p - 1));
  }

  protected nextPage(): void {
    this.page.update((p) => Math.min(9, p + 1));
  }

  /** Ouvre la visionneuse dans une fenêtre séparée, comme le prototype. */
  protected openViewer(): void {
    const d = this.draft();
    const q = new URLSearchParams({
      name: d.file || 'document-a-saisir.pdf',
      title: d.title || typeLabel(d.type),
      ref: d.reference,
      pages: d.pages || '9',
    });
    window.open(`/visionneuse?${q.toString()}`, '_blank', 'noopener');
  }

  // -- OCR et analyse -----------------------------------------------------------------------
  protected readonly ocr = computed(() => {
    const done = this.ocrDone();
    return {
      done,
      title: done ? 'Reconnaissance terminée' : 'Reconnaissance de texte',
      hint: done ? 'Le document est indexé et interrogeable.' : "Lance l'OCR sur le fichier déposé avant l'analyse IA.",
      action: done ? 'Relancer' : "Lancer l'OCR",
      dotBg: done ? 'rgba(15,118,110,0.12)' : 'var(--color-neutral-200)',
      dotFg: done ? 'var(--ink-ok-2)' : 'var(--color-neutral-700)',
    };
  });

  protected readonly ia = computed(() => {
    const done = this.iaDone();
    return {
      done,
      title: done ? 'Métadonnées proposées' : 'Extraction assistée par IA',
      hint: done ? 'Vérifiez puis appliquez au classement.' : 'Analyse le texte reconnu pour proposer le classement.',
      action: done ? 'Relancer' : "Lancer l'analyse",
      dotBg: done ? 'rgba(15,118,110,0.12)' : 'var(--color-neutral-200)',
      dotFg: done ? 'var(--ink-ok-2)' : 'var(--color-neutral-700)',
      applied: this.iaApplied() ? 'Proposition appliquée aux champs de classement.' : '',
      fields: IA_FIELDS.map((f) => ({ ...f, ...CONFIDENCE_TINT[f.level] })),
    };
  });

  protected runOcr(): void {
    this.ocrDone.set(true);
  }

  protected runIa(): void {
    this.iaDone.set(true);
  }

  protected applyIa(): void {
    this.patch({
      type: 'mandat',
      folder: 'BGM-004',
      date: '2026-02-11',
      issuer: 'Cheval Blanc SCI',
      tags: 'mandat, profil équilibré, signature',
    });
    this.iaApplied.set(true);
  }

  // -- Contrôle et enregistrement -----------------------------------------------------------
  protected readonly versionPreview = computed(() => {
    const parent = this.docs().find((d) => d.id === this.draft().parentId);
    if (!parent) return '';
    return `Sera enregistré en version v${lastVersion(parent).n + 1} de « ${parent.name} ».`;
  });

  protected readonly recap = computed(() => {
    const d = this.draft();
    return [
      { label: 'Mode de saisie', value: d.mode === 'manual' ? 'Saisie manuelle (sans OCR ni IA)' : 'Dépôt de fichier' },
      { label: 'Fichier', value: d.file || '—' },
      { label: 'Enregistrement', value: d.isNewVersion ? 'Nouvelle version' : 'Nouveau document' },
      { label: 'Nature du document', value: typeLabel(d.type) },
      { label: 'Type de document', value: formLabel(d.form) },
      { label: 'Dossier', value: folderLabel(d.folder) },
      { label: 'Date du document', value: fr(d.date) },
      { label: 'Émetteur', value: d.issuer || '—' },
      { label: 'Mots-clés', value: d.tags || '—' },
      { label: 'Confidentialité', value: accessLabel(d.access) },
      { label: 'Conservation', value: d.retention === 'perm' ? 'Illimitée' : `${d.retention} ans` },
      { label: 'Revue', value: d.needsReview ? 'Soumis à revue' : 'Sans revue' },
    ];
  });

  protected readonly docOptions = computed(() =>
    this.docs().map((d) => ({ value: d.id, label: `${d.name} (v${lastVersion(d).n})` })),
  );

  protected submit(): void {
    const d = this.draft();
    if (d.isNewVersion) {
      this.docs.update((list) =>
        list.map((doc) => {
          if (doc.id !== d.parentId) return doc;
          return {
            ...doc,
            state: d.needsReview ? ('review' as DocState) : doc.state,
            versions: [
              ...doc.versions,
              { n: lastVersion(doc).n + 1, date: d.date, author: 'F. Hoeppe', note: d.versionNote || 'Nouvelle version', size: '—' },
            ],
          };
        }),
      );
      this.tab.set('review');
      this.selectedId.set(d.parentId);
    } else {
      /* Le nom se déduit du fichier quand l'intitulé n'a pas été saisi : « convention-mandat.pdf »
         donne « convention mandat ». */
      const name =
        d.title.trim() ||
        d.file.replace(/\.[a-z0-9]+$/i, '').replace(/[-_]+/g, ' ').trim() ||
        'Nouveau document';
      const ext = (d.file.split('.').pop() || 'pdf').toUpperCase();
      this.docs.update((list) => [
        {
          id: `n${Date.now()}`,
          name,
          file: d.file || 'document.pdf',
          ext,
          type: d.type,
          form: d.form,
          folder: d.folder,
          state: d.needsReview ? ('review' as DocState) : ('draft' as DocState),
          access: d.access,
          tags: d.tags,
          issuer: d.issuer || '—',
          versions: [{ n: 1, date: d.date, author: 'F. Hoeppe', note: 'Version initiale', size: '—' }],
        },
        ...list,
      ]);
      this.tab.set('library');
    }
    this.step.set(0);
    this.draft.set(blankDraft());
    this.resetAnalysis();
  }

  // -- Revue --------------------------------------------------------------------------------
  private readonly currentDoc = computed(
    () => this.docs().find((d) => d.id === this.selectedId()) ?? this.docs()[0],
  );

  protected readonly queue = computed(() =>
    this.docs().map((d) => {
      const on = d.id === this.selectedId();
      return {
        id: d.id,
        name: d.name,
        version: `v${lastVersion(d).n}`,
        meta: `${STATES[d.state].label} · ${d.folder}`,
        bg: on ? 'var(--color-neutral-100)' : 'var(--surface)',
        mark: on ? 'var(--ds-brand-fill, var(--ink-brand-2))' : 'transparent',
        weight: on ? '700' : '400',
      };
    }),
  );

  protected select(id: string): void {
    this.selectedId.set(id);
    this.compareText.set('');
  }

  protected readonly current = computed(() => {
    const c = this.currentDoc();
    if (!c) return null;
    const last = lastVersion(c);
    const st = STATES[c.state];
    return {
      name: c.name,
      type: c.type,
      form: c.form ?? 'original',
      folder: c.folder,
      access: c.access,
      tags: c.tags,
      meta: `${c.file} · ${typeLabel(c.type)} · v${last.n} du ${fr(last.date)} · ${c.issuer}`,
      stateLabel: st.label,
      stateBg: st.bg,
      stateFg: st.fg,
    };
  });

  protected editCurrent(p: Partial<Doc>): void {
    const id = this.selectedId();
    this.docs.update((list) => list.map((d) => (d.id === id ? { ...d, ...p } : d)));
  }

  protected readonly metaCount = computed(() => {
    const c = this.currentDoc();
    return c ? `${this.metaList().length} champs · dernière mise à jour ${fr(lastVersion(c).date)}` : '';
  });

  /* Les 31 métadonnées de la fiche : identité du fichier, classement, dates, cycle de revue,
     versions, conservation et empreinte. Calculées et non stockées — le prototype les dérive
     toutes du document et de sa dernière version. */
  protected readonly metaList = computed(() => {
    const c = this.currentDoc();
    if (!c) return [];
    const last = lastVersion(c);
    const first = c.versions[0];
    const plusYears = (iso: string, n: number) => fr(`${+iso.slice(0, 4) + n}${iso.slice(4)}`);
    return [
      { label: 'Identifiant', value: `${c.id.toUpperCase()}-${c.folder}` },
      { label: 'Nom de fichier', value: c.file },
      { label: 'Format', value: c.ext },
      { label: 'Taille', value: last.size },
      { label: 'Nature du document', value: typeLabel(c.type) },
      { label: 'Type de document', value: formLabel(c.form ?? 'original') },
      { label: 'Dossier', value: folderLabel(c.folder) },
      { label: 'Émetteur', value: c.issuer },
      { label: 'Source', value: c.issuer === 'Dépositaire' || c.issuer === 'Flux' ? 'Flux dépositaire' : 'Dépôt manuel' },
      { label: 'Référence document', value: `DOC-${c.folder}-${c.id.replace(/\D/g, '').padStart(4, '0')}` },
      { label: "Date d'émission", value: fr(first.date) },
      { label: 'Date de réception', value: fr(last.date) },
      { label: 'Date de dépôt', value: fr(last.date) },
      { label: 'Échéance', value: c.type === 'mandat' ? plusYears(first.date, 3) : 'Sans échéance' },
      { label: 'Date de revue', value: c.state === 'review' ? 'En cours' : fr(last.date) },
      { label: 'Revue par', value: c.state === 'valid' ? 'A. Meyer' : '—' },
      { label: 'Prochaine revue', value: plusYears(last.date, 1) },
      { label: 'Déposé par', value: last.author },
      { label: 'Version courante', value: `v${last.n}` },
      { label: 'Nombre de versions', value: String(c.versions.length) },
      { label: 'État', value: STATES[c.state].label },
      { label: 'Confidentialité', value: accessLabel(c.access) },
      { label: 'Conservation', value: '10 ans' },
      { label: 'Échéance de purge', value: plusYears(first.date, 10) },
      { label: 'Mots-clés', value: c.tags || '—' },
      { label: 'Langue', value: 'Français' },
      { label: 'Pages', value: c.ext === 'PDF' ? String(6 + c.versions.length * 3) : '—' },
      {
        label: 'Empreinte SHA-256',
        value: `${(c.id + last.n + c.file).replace(/[^a-z0-9]/gi, '').padEnd(16, '0').slice(0, 16).toLowerCase()}…`,
      },
      { label: 'Signature électronique', value: c.type === 'mandat' ? 'Signée — horodatée' : 'Non applicable' },
      { label: 'Indexation OCR', value: c.ext === 'PDF' ? 'Effectuée' : 'Non requise' },
      { label: 'Dernière modification', value: `${fr(last.date)} — ${last.author}` },
    ];
  });

  protected readonly versions = computed(() => {
    const c = this.currentDoc();
    if (!c) return [];
    const last = lastVersion(c);
    return [...c.versions].reverse().map((v, i) => ({
      n: v.n,
      label: `v${v.n}`,
      isCurrent: i === 0,
      canRestore: i !== 0,
      date: fr(v.date),
      author: v.author,
      note: v.note,
      size: v.size,
      compareLabel: i === 0 ? 'Détails' : 'Comparer',
      compareText:
        i === 0
          ? `v${v.n} — déposée le ${fr(v.date)} par ${v.author} · ${v.size} · ${v.note}`
          : `Comparaison v${v.n} → v${last.n} : ${v.note} (${fr(v.date)}) puis ${last.note} (${fr(last.date)}).`,
    }));
  });

  protected readonly versionColumns = ['version', 'date', 'author', 'note', 'actions'];

  /* Restaurer n'écrase pas l'historique : la version choisie est redéposée en tête, ce qui
     laisse trace du retour en arrière. */
  protected restoreVersion(n: number, size: string): void {
    const id = this.selectedId();
    this.docs.update((list) =>
      list.map((d) =>
        d.id === id
          ? {
              ...d,
              versions: [
                ...d.versions,
                { n: lastVersion(d).n + 1, date: isoToday(), author: 'F. Hoeppe', note: `Restauration de la v${n}`, size },
              ],
            }
          : d,
      ),
    );
    this.compareText.set(`La v${n} a été replacée en version courante (enregistrée comme nouvelle version).`);
  }

  protected showCompare(text: string): void {
    this.compareText.set(text);
  }

  protected validate(): void {
    this.editCurrent({ state: 'valid' });
  }

  protected reject(): void {
    this.editCurrent({ state: 'draft' });
  }

  protected archive(): void {
    this.editCurrent({ state: 'archived' });
  }

  protected addVersion(): void {
    this.newVersionOf(this.selectedId());
  }
}
