/**
 * Référentiel des échéances — porté de `Echeances.dc.html`.
 *
 * L'écran ne crée rien : il agrège ce que les autres écrans laissent en suspens — une pièce KYC
 * manquante côté Comptes, un appel de marge côté Trésorerie, un avis d'opération sur titre, une
 * déclaration fiscale du calendrier. D'où le champ `source`, qui dit d'où vient l'échéance.
 */

export interface DueItem {
  readonly id: string;
  /** Date d'origine, en ISO. Les reports ne la modifient pas (voir `shift` dans le composant). */
  readonly due: string;
  readonly title: string;
  readonly detail: string;
  readonly kind: string;
  readonly account: string;
  readonly owner: string;
  /** Écran d'où provient l'échéance. */
  readonly source: string;
  readonly action: string;
}

export const DUE_ITEMS: readonly DueItem[] = [
  { id: 'e1', due: '2026-08-28', title: 'KYC trésorier à renouveler', detail: "Pièce d'identité expirée depuis le 12/08", kind: 'Conformité', account: 'INP-011', owner: 'A. Meyer', source: 'Comptes', action: 'Obtenir la pièce et actualiser le dossier' },
  { id: 'e2', due: '2026-09-02', title: 'Appel de marge à couvrir', detail: 'Compte de collatéral débiteur de 420 000 €', kind: 'Trésorerie', account: 'BGM-004', owner: 'Back office', source: 'Trésorerie', action: 'Alimenter le compte de collatéral' },
  { id: 'e3', due: '2026-09-05', title: 'Rééquilibrage actions à instruire', detail: 'Bande dépassée : 57,3 % contre 55 % de cible', kind: 'Opération sur titre', account: 'BGM-004', owner: 'F. Hoeppe', source: 'Tableau de bord', action: 'Passer les ordres de rééquilibrage' },
  { id: 'e4', due: '2026-09-05', title: 'Option de fusion REIT à exercer', detail: 'Avis CA-2026-0031, parité 0,82 en titres', kind: 'Opération sur titre', account: 'GLG-002', owner: 'F. Hoeppe', source: 'Opération sur titre', action: "Transmettre l'instruction au dépositaire" },
  { id: 'e5', due: '2026-09-08', title: 'Détachement du coupon GLBEQ', detail: '2,10 € par part sur 94 500 parts', kind: 'Opération sur titre', account: 'BGM-004', owner: 'Dépositaire', source: 'Opération sur titre', action: 'Contrôler la valorisation après détachement' },
  { id: 'e6', due: '2026-09-10', title: 'Division du nominal EUEQ', detail: '3 pour 1, à appliquer en portefeuille', kind: 'Opération sur titre', account: 'BGM-004', owner: 'Back office', source: 'Réconciliation', action: "Appliquer la division et solder l'écart" },
  { id: 'e7', due: '2026-09-12', title: 'Assemblée générale INFRA', detail: '12 résolutions, réponse avant le 12/09', kind: 'Opération sur titre', account: 'BGM-004', owner: 'F. Hoeppe', source: 'Opération sur titre', action: 'Transmettre le vote' },
  { id: 'e8', due: '2026-09-15', title: 'Revue annuelle Cheval Blanc SCI', detail: 'Entretien de revue, convocation non envoyée', kind: 'Contractuel', account: 'BGM-004', owner: 'F. Hoeppe', source: 'Comptes', action: 'Envoyer la convocation et préparer le dossier' },
  { id: 'e9', due: '2026-09-18', title: 'Écritures comptables à valider', detail: 'Droits de garde août et commission T3', kind: 'Comptabilité', account: 'BGM-004', owner: 'Comptabilité', source: 'Comptabilité', action: 'Valider les deux pièces en attente' },
  { id: 'e10', due: '2026-09-22', title: 'Droit préférentiel USLC', detail: '3 droits pour 10 titres, décision attendue', kind: 'Opération sur titre', account: 'BGM-004', owner: 'F. Hoeppe', source: 'Opération sur titre', action: 'Souscrire ou céder les droits' },
  { id: 'e11', due: '2026-09-25', title: 'Reporting trimestriel T3', detail: 'Envoi client au plus tard le 25/09', kind: 'Reporting', account: 'INP-011', owner: 'A. Meyer', source: 'Rapports', action: 'Produire et diffuser le reporting' },
  { id: 'e12', due: '2026-09-30', title: 'Clôture Atlas Industries SA', detail: 'Solde à transférer, liquidation en cours', kind: 'Contractuel', account: 'GLG-005', owner: 'A. Meyer', source: 'Comptes', action: 'Transférer le solde et clôturer' },
  { id: 'e14', due: '2026-10-12', title: 'KYC Meridian à finaliser', detail: 'Bénéficiaires effectifs en cours de vérification', kind: 'Conformité', account: 'GLG-002', owner: 'A. Meyer', source: 'Comptes', action: 'Clore la vérification et ouvrir les comptes' },
  { id: 'e15', due: '2026-10-20', title: 'Revue des limites de contrepartie', detail: 'Revue semestrielle du comité', kind: 'Conformité', account: 'BGM-004', owner: 'Conformité', source: 'Titres', action: 'Préparer le dossier du comité' },
  { id: 'e16', due: '2026-11-02', title: "Test d'adéquation Hoffmann", detail: 'Actualisation annuelle du profil', kind: 'Conformité', account: 'BGM-002', owner: 'A. Meyer', source: 'Comptes', action: 'Faire signer le questionnaire' },

  // Échéances fiscales reprises du calendrier.
  { id: 'f1', due: '2026-10-15', title: 'Retenue à la source — déclaration T3', detail: 'Reversement des retenues sur dividendes du troisième trimestre', kind: 'Fiscal', account: 'Tous', owner: 'Comptabilité', source: 'Calendrier', action: 'Déposer la déclaration et régler le reversement' },
  { id: 'f2', due: '2026-11-30', title: 'Déclaration des revenus de capitaux mobiliers (IFU)', detail: 'Imprimé fiscal unique à transmettre aux titulaires', kind: 'Fiscal', account: 'Tous', owner: 'Comptabilité', source: 'Calendrier', action: 'Éditer et diffuser les IFU' },
  { id: 'f3', due: '2026-12-15', title: "Acompte d'impôt sur les sociétés — 4e échéance", detail: "Solde de l'exercice à verser avant le 15", kind: 'Fiscal', account: 'Tous', owner: 'Comptabilité', source: 'Calendrier', action: 'Calculer le solde et ordonner le virement' },
  { id: 'f4', due: '2026-12-31', title: 'Attestation fiscale annuelle aux clients', detail: 'Récapitulatif des plus-values et revenus par compte', kind: 'Fiscal', account: 'Tous', owner: 'A. Meyer', source: 'Calendrier', action: 'Produire les attestations et les envoyer' },
  { id: 'f5', due: '2027-01-15', title: 'Retenue à la source — déclaration T4', detail: 'Quatrième trimestre : dépôt au plus tard le 15 janvier', kind: 'Fiscal', account: 'Tous', owner: 'Comptabilité', source: 'Calendrier', action: 'Déposer la déclaration' },
  { id: 'f6', due: '2027-01-20', title: 'Déclaration de TVA — décembre', detail: 'Régime réel normal, dépôt le 20', kind: 'Fiscal', account: 'Tous', owner: 'Comptabilité', source: 'Calendrier', action: 'Déposer la déclaration' },

  // Réunions de politique monétaire : à préparer avant la séance.
  { id: 'm1', due: '2026-09-10', title: 'BCE — décision de taux', detail: 'Conseil des gouverneurs, conférence de presse à 14:45', kind: 'Marché', account: 'Tous', owner: 'F. Hoeppe', source: 'Calendrier', action: 'Préparer la note de position avant la séance' },
  { id: 'm2', due: '2026-09-16', title: 'Fed — décision de taux (FOMC)', detail: 'Communiqué et projections trimestrielles', kind: 'Marché', account: 'Tous', owner: 'F. Hoeppe', source: 'Calendrier', action: "Revoir l'exposition taux avant la séance" },
  { id: 'm3', due: '2026-10-29', title: 'BCE — décision de taux', detail: 'Deuxième réunion du trimestre', kind: 'Marché', account: 'Tous', owner: 'F. Hoeppe', source: 'Calendrier', action: 'Préparer la note de position' },
  { id: 'm4', due: '2026-12-17', title: 'BCE — décision de taux', detail: "Projections macroéconomiques de l'Eurosystème", kind: 'Marché', account: 'Tous', owner: 'F. Hoeppe', source: 'Calendrier', action: "Préparer la revue annuelle d'allocation" },
];

export type HorizonKey = '7' | '30' | '90' | '180' | 'all';

export const HORIZONS: readonly { readonly key: HorizonKey; readonly label: string }[] = [
  { key: '7', label: '7 jours' },
  { key: '30', label: '30 jours' },
  { key: '90', label: '90 jours' },
  { key: '180', label: '6 mois' },
  { key: 'all', label: 'Tout' },
];

/** Les trois blocs de la colonne principale, et leurs couleurs d'urgence. */
export type BucketKey = 'late' | 'week' | 'later';

export const BUCKETS: readonly { readonly key: BucketKey; readonly title: string; readonly accent: string; readonly headBg: string; readonly note: string }[] = [
  { key: 'late', title: 'En retard', accent: 'var(--ink-warn)', headBg: 'rgba(180, 83, 9, 0.10)', note: 'À traiter sans délai' },
  { key: 'week', title: 'Cette semaine', accent: 'var(--ink-warn-2)', headBg: 'rgba(180, 83, 9, 0.07)', note: 'Dans les 7 prochains jours' },
  { key: 'later', title: 'À venir', accent: 'var(--ink-brand-2)', headBg: 'rgba(0, 61, 165, 0.07)', note: 'Au-delà de 7 jours' },
];

/** Nombre de semaines de l'histogramme de charge. */
export const WEEK_BUCKETS = 6;
/** Report appliqué par le bouton « Reporter », en jours. */
export const POSTPONE_DAYS = 7;

// -- Dates ----------------------------------------------------------------------------------

/* Minuit du jour courant : toutes les distances sont comptées à partir de là, sinon deux appels
   à quelques heures d'intervalle ne donneraient pas le même nombre de jours restants. */
export function startOfToday(now = new Date()): Date {
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

export function parse(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function iso(d: Date): string {
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

/** Jours restants avant une échéance — négatif si elle est passée. */
export function daysUntil(dueIso: string, today: Date): number {
  return Math.round((parse(dueIso).getTime() - today.getTime()) / 86_400_000);
}

export function shortDate(dueIso: string): string {
  const d = parse(dueIso);
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;
}

export function fullDate(dueIso: string): string {
  const d = parse(dueIso);
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
}

export interface RemainingTag {
  readonly text: string;
  readonly bg: string;
  readonly fg: string;
}

/**
 * Pastille de temps restant. Les paliers sont ceux du prototype : le retard et le jour même en
 * orange soutenu, la semaine en orange pâle, le mois en bleu, le reste en gris — l'urgence se lit
 * à la couleur avant de se lire au chiffre.
 */
export function remainingTag(n: number): RemainingTag {
  if (n < 0) return { text: `En retard de ${Math.abs(n)} j`, bg: 'rgba(180, 83, 9, 0.16)', fg: 'var(--ink-warn)' };
  if (n === 0) return { text: "Aujourd'hui", bg: 'rgba(180, 83, 9, 0.12)', fg: 'var(--ink-warn-2)' };
  if (n <= 7) return { text: `Dans ${n} j`, bg: 'rgba(180, 83, 9, 0.10)', fg: 'var(--ink-warn-2)' };
  if (n <= 30) return { text: `Dans ${n} j`, bg: 'rgba(0, 61, 165, 0.10)', fg: 'var(--ink-brand-2)' };
  return { text: `Dans ${n} j`, bg: 'var(--color-neutral-200)', fg: 'var(--color-neutral-700)' };
}
