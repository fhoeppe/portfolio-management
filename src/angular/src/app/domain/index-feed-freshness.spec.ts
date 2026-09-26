import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

import { INDEX_FEED_FALLBACK_URL, INDEX_FEED_URL, IndexFeedService } from './index-feed.service';
import { resetIndices } from './indices';

/**
 * Quand la liste des indices est redemandée, et quand elle ne l'est pas.
 *
 * Deux gestes la réclament — l'activation de l'onglet de recherche, l'ouverture du sélecteur — et
 * aucun des deux ne sait si l'autre est déjà passé. C'est donc au service de trancher, et ce qu'il
 * tranche se mesure en requêtes : une liste fraîche n'en vaut aucune, une liste qui date en vaut
 * une. Sans ces cas, la règle des cinq minutes ne se vérifierait qu'en attendant cinq minutes.
 */
describe('fraîcheur de la liste des indices', () => {
  const FEED = {
    version: '1.0',
    source: 'Test',
    asOf: '2026-05-31',
    indices: [{ key: 'cac40', name: 'CAC 40', region: 'Europe continentale', currency: 'EUR', count: 40, memberCount: 40 }],
  };

  let service: IndexFeedService;
  let http: HttpTestingController;

  beforeEach(() => {
    resetIndices();
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: INDEX_FEED_URL, useValue: '/v1/market/indices2' },
        // Le repli est neutralisé : ces cas portent sur la source principale, et un repli qui
        // répondrait masquerait l'échec qu'on veut observer.
        { provide: INDEX_FEED_FALLBACK_URL, useValue: '' },
      ],
    });
    service = TestBed.inject(IndexFeedService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  async function premierChargement(): Promise<void> {
    const promesse = service.load();
    http.expectOne('/v1/market/indices2').flush(FEED);
    await promesse;
  }

  it('demande la liste au premier appel', async () => {
    await premierChargement();
    expect(service.status()).toBe('loaded');
    expect(service.listAge()).not.toBeNull();
  });

  it('ne redemande rien tant que la liste a moins de cinq minutes', async () => {
    await premierChargement();

    await service.load();
    await service.load();

    // `http.verify()` en sortie échouerait si une requête était partie sans être servie ;
    // `expectNone` dit la même chose sur-le-champ, et nomme ce qu'on vérifie.
    http.expectNone('/v1/market/indices2');
  });

  it('redemande la liste quand elle dépasse l’âge accepté', async () => {
    await premierChargement();

    // Âge maximal nul : ce que le temps ferait au bout de cinq minutes, sans attendre cinq minutes.
    const promesse = service.load(0);
    http.expectOne('/v1/market/indices2').flush(FEED);
    await promesse;

    expect(service.status()).toBe('loaded');
  });

  it('retente après un échec, sans attendre l’expiration', async () => {
    const echec = service.load();
    http.expectOne('/v1/market/indices2').flush('', { status: 503, statusText: 'indisponible' });
    await echec;

    expect(service.status()).toBe('error');
    // Rien n'a été chargé : il n'y a pas de fraîcheur à respecter, et le geste suivant doit
    // pouvoir réessayer.
    expect(service.listAge()).toBeNull();

    const reprise = service.load();
    http.expectOne('/v1/market/indices2').flush(FEED);
    await reprise;

    expect(service.status()).toBe('loaded');
  });
});
