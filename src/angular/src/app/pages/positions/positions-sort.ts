/** Bouton d'en-tête de colonne triable, partagé par les tableaux de Positions et le panneau d'historique. */
export interface SortHeaderView {
  readonly color: string;
  readonly weight: string;
  readonly opacity: string;
  readonly rotate: string;
  readonly title: string;
}

export function sortHeaderView(activeKey: string | null, dir: 'asc' | 'desc', key: string): SortHeaderView {
  const active = activeKey === key;
  return {
    color: active ? 'var(--color-text)' : 'var(--color-neutral-700)',
    weight: active ? '600' : '500',
    opacity: active ? '1' : '0',
    rotate: active && dir === 'desc' ? '180deg' : '0deg',
    title: active ? (dir === 'asc' ? 'Trier par ordre décroissant' : 'Annuler le tri') : 'Trier par ordre croissant',
  };
}

export function nextSort(activeKey: string | null, dir: 'asc' | 'desc', key: string): { readonly key: string | null; readonly dir: 'asc' | 'desc' } {
  if (activeKey !== key) return { key, dir: 'asc' };
  if (dir === 'asc') return { key, dir: 'desc' };
  return { key: null, dir: 'asc' };
}
