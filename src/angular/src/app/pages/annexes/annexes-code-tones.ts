/** Une teinte par section de l'annexe des codes — porté depuis `CODE_TONES` de Legendes.dc.html. */
export interface Tone {
  readonly bg: string;
  readonly fg: string;
}

export const CODE_TONES: Readonly<Record<string, Tone>> = {
  'Principes de saisie': { bg: 'rgba(67,56,202,0.16)', fg: 'var(--ink-code)' },
  'Achat et vente': { bg: 'rgba(15,118,110,0.16)', fg: 'var(--ink-ok)' },
  'Indicateurs du portefeuille': { bg: 'rgba(124,92,191,0.18)', fg: 'var(--ink-alt)' },
  "Opérations sur titres à impact sur la position": { bg: 'rgba(180,83,9,0.16)', fg: 'var(--ink-warn)' },
  Trésorerie: { bg: 'rgba(162,28,175,0.16)', fg: 'var(--ink-magenta)' },
  'Découvert autorisé': { bg: 'rgba(190,24,93,0.14)', fg: 'var(--ink-9d174d)' },
  'Transfert entre comptes titres': { bg: 'rgba(2,132,199,0.16)', fg: 'var(--ink-info)' },
  'Réorganisations de capital': { bg: 'rgba(217,119,6,0.16)', fg: 'var(--ink-92400e)' },
  'Catalogue des actions de société': { bg: 'rgba(101,116,139,0.18)', fg: 'var(--ink-3f4a5c)' },
  'Indicateurs de valorisation': { bg: 'rgba(14,116,144,0.16)', fg: 'var(--ink-155e75)' },
  'Indicateurs de risque et de performance': { bg: 'rgba(190,18,60,0.16)', fg: 'var(--ink-9f1239)' },
  'Fonctionnement des marchés': { bg: 'rgba(5,150,105,0.16)', fg: 'var(--ink-065f46)' },
  'Place de marché': { bg: 'rgba(120,113,108,0.20)', fg: 'var(--ink-44403c)' },
  'Fiscalité des dividendes': { bg: 'rgba(161,98,7,0.16)', fg: 'var(--ink-854d0e)' },
};

export const DEFAULT_CODE_TONE: Tone = { bg: 'rgba(67,56,202,0.16)', fg: 'var(--ink-code)' };
