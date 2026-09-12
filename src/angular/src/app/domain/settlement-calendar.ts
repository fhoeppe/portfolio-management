/**
 * Quel calendrier et quel cycle s'appliquent au dénouement d'une place de négociation.
 *
 * C'est la pièce qui manquait entre le référentiel des places — qui sait où se traite un titre
 * et sous quel cycle — et le service des jours chômés, qui sait compter en jours ouvrés. Un
 * règlement T+2 compte deux jours **ouvrés de la place**, pas deux jours calendaires : sans ce
 * raccord, une exécution du vendredi se dénouerait le dimanche.
 *
 * Le référentiel des places vit sous `pages/parametres` pour des raisons historiques — c'est là
 * qu'il est édité. La dépendance va donc du domaine vers cette page ; elle ne porte que sur des
 * données, jamais sur du composant.
 */
import { placeOf } from '../pages/parametres/places-data';

export interface SettlementRule {
  /** Zone de `holiday-rules.ts` dont le calendrier fait foi. */
  readonly zoneId: string;
  /** Nombre de jours ouvrés entre exécution et dénouement. */
  readonly cycle: number;
  /** Libellé court à afficher sous le champ : « T+2 · Euronext Paris ». */
  readonly label: string;
}

/**
 * Pays disposant de leur propre calendrier dans `holiday-rules.ts`. Tout le reste retombe sur
 * TARGET2 : c'est le calendrier de règlement de la zone euro, donc la bonne réponse pour les
 * places en euro qui ne sont pas modélisées une à une (Amsterdam, Milan, Madrid, Lisbonne…).
 * Pour les places scandinaves, en couronne, c'est une approximation assumée — leurs fériés
 * nationaux ne sont pas au référentiel.
 */
const ZONE_BY_COUNTRY: Readonly<Record<string, string>> = {
  FR: 'FR',
  DE: 'DE',
  GB: 'GB',
  CH: 'CH',
  US: 'US',
  CA: 'CA',
  JP: 'JP',
  AU: 'AU',
};

/** Cycle retenu quand la place ne renseigne pas le sien — le standard européen actuel. */
export const DEFAULT_CYCLE = 2;

/** `T+2` → 2. Toute autre forme retombe sur le cycle par défaut. */
function parseCycle(cycle: string | undefined): number {
  const m = /^T\+(\d+)$/.exec(cycle ?? '');
  return m ? Number(m[1]) : DEFAULT_CYCLE;
}

export function settlementRuleFor(mic: string): SettlementRule {
  const place = placeOf(mic);
  /* Hors marché (`OTC`) ou MIC inconnu : le gré à gré n'a pas de calendrier de place, on s'en
     remet à TARGET2 et au cycle standard. */
  if (!place) {
    return { zoneId: 'TARGET', cycle: DEFAULT_CYCLE, label: `T+${DEFAULT_CYCLE} · hors marché` };
  }
  const cycle = parseCycle(place.settlement?.cycle);
  return {
    zoneId: ZONE_BY_COUNTRY[place.code] ?? 'TARGET',
    cycle,
    label: `T+${cycle} · ${place.place}`,
  };
}
