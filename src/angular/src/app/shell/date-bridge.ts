/**
 * Passerelle entre les dates ISO (`2026-09-11`) que manipule tout le domaine — filtres,
 * formulaires, comparaisons de chaînes dans `filterTransactions`, `LEGS`… — et les objets
 * `Date` qu'attend `MatDatepicker`. Convertir aux deux bornes évite de retoucher la logique
 * métier existante, qui reste entièrement en chaînes.
 *
 * Les conversions passent volontairement par les composantes locales (`new Date(y, m, d)` et
 * `getFullYear/getMonth/getDate`) et non par `new Date(iso)` / `toISOString()` : ces derniers
 * interprètent puis réémettent en UTC, ce qui décale la date d'un jour dès que le fuseau du
 * navigateur est négatif — le 11/09 saisi ressortirait au 10/09.
 */

export function isoToDate(iso: string | null | undefined): Date | null {
  if (!iso) return null;
  const [y, m, d] = iso.split('-').map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d);
}

export function dateToIso(date: Date | null | undefined): string {
  if (!date) return '';
  const p = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${p(date.getMonth() + 1)}-${p(date.getDate())}`;
}
