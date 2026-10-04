import { GUIDE_TOPICS } from './guide-data';
import { GUIDE_TOPICS_EN } from './guide-data.en';

/**
 * Le Guide est traduit à la main, en deux fichiers parallèles. Rien n'empêche d'ajouter une
 * section d'un seul côté — c'est déjà arrivé aux fiches de comptabilité, et c'est ce que ce
 * contrôle d'empreinte rattrape : même suite de clés de thématique, et dans chaque thématique
 * le même nombre de sections, d'étapes, de points clés, de raccourcis et d'entrées de FAQ, avec
 * des tableaux de même forme. Les clés doivent être identiques car `activeKey` survit au
 * changement de langue ; le reste doit l'être parce qu'une thématique qui perd une section en
 * anglais est un guide qui ment sans le dire.
 */
describe('parité FR / EN du guide', () => {
  it('porte les mêmes thématiques, dans le même ordre', () => {
    expect(GUIDE_TOPICS_EN.map((t) => t.key)).toEqual(GUIDE_TOPICS.map((t) => t.key));
  });

  GUIDE_TOPICS.forEach((fr, i) => {
    describe(`thématique « ${fr.key} »`, () => {
      const en = GUIDE_TOPICS_EN[i];

      it('a la même forme : sections, points clés, raccourcis, FAQ', () => {
        expect(en.sections.length).toBe(fr.sections.length);
        expect(en.keys.length).toBe(fr.keys.length);
        expect(en.links.length).toBe(fr.links.length);
        expect(en.faq.length).toBe(fr.faq.length);
      });

      it('a des sections de même structure : étapes et tableaux', () => {
        fr.sections.forEach((s, j) => {
          const e = en.sections[j];
          expect(e.steps?.length ?? 0).toBe(s.steps?.length ?? 0);
          expect(!!e.table).toBe(!!s.table);
          if (s.table && e.table) {
            expect(e.table.columns.length).toBe(s.table.columns.length);
            expect(e.table.rows.length).toBe(s.table.rows.length);
            e.table.rows.forEach((row, k) => expect(row.length).toBe(s.table!.rows[k].length));
            expect(e.table.align).toEqual(s.table.align);
            expect(!!e.table.totalRow).toBe(!!s.table.totalRow);
            expect(!!e.table.note).toBe(!!s.table.note);
            expect(!!e.table.caption).toBe(!!s.table.caption);
          }
        });
      });

      it('ne laisse aucun texte vide', () => {
        const texts = [en.label, en.title, en.intro, ...en.keys, ...en.links,
          ...en.sections.flatMap((s) => [s.heading, s.body, ...(s.steps ?? [])]),
          ...en.faq.flatMap((f) => [f.q, f.a])];
        texts.forEach((t) => expect(t.trim().length).toBeGreaterThan(0));
      });
    });
  });
});
