# Extraits CSV

Deux tables plates tirées de `../src/PortfolioManagement.Infrastructure/Seed/indices.seed.json`,
la graine qui alimente `/v1/market/indices`. Ce sont des **extraits**, pas une source : le JSON
reste ce que l'application lit, et ces fichiers se refabriquent (voir plus bas).

| Fichier | Lignes | Contenu |
|---|---|---|
| `indices.csv` | 28 | un indice par ligne, sans composition |
| `index-members.csv` | 4 291 | une valeur d'indice par ligne |

`indexKey` joint les deux tables. `rank` est le rang de la valeur dans sa livraison, poids
décroissants — l'ordre du fichier source, qui se perdrait au premier tri.

`count` est l'effectif réel de l'indice (500 pour le S&P 500) et `memberCount` le nombre de lignes
effectivement détenues (479) : c'est le rapport des deux qui donne le taux de couverture. `weight`
est un **pourcentage** — `8.21`, pas `0.0821` — et la somme des poids d'un indice n'a aucune raison
de valoir 100.

Format RFC 4180 : séparateur virgule, UTF-8 sans BOM, guillemets seulement là où c'est nécessaire.
C'est ce qu'attendent `.import` de SQLite et la plupart des outils ; un tableur en locale française
propose la virgule dans son assistant d'import, mais ne la devine pas au double-clic.

## Refabriquer

```bash
cd src/api
python3 - <<'EOF'
import csv, io, json
seed = json.load(open('src/PortfolioManagement.Infrastructure/Seed/indices.seed.json', encoding='utf-8'))
def write(path, header, rows):
    with io.open(path, 'w', encoding='utf-8', newline='') as f:
        w = csv.writer(f, lineterminator='\n'); w.writerow(header); w.writerows(rows)
write('data/indices.csv',
      ['key','name','region','place','mic','currency','count','memberCount','detail','asOf'],
      [[i['key'], i['name'], i['region'], i.get('place',''), i.get('mic',''), i.get('currency',''),
        i.get('count',''), len(i.get('members',[])), i.get('detail',''), i.get('asOf', seed.get('asOf',''))]
       for i in seed['indices']])
write('data/index-members.csv',
      ['indexKey','rank','name','ticker','isin','sector','weight','cap','ref'],
      [[i['key'], r, m['name'], m.get('ticker',''), m.get('isin',''), m.get('sector',''),
        m.get('weight',''), m.get('cap',''), m.get('ref','')]
       for i in seed['indices'] for r, m in enumerate(i.get('members',[]), start=1)])
EOF
```
