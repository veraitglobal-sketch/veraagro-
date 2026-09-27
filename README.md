# Bio Vera

Monorepo za web, mobilnu aplikaciju i backend Bio Vera platforme.

## Gde šta pripada

| Direktorijum | Namena |
| --- | --- |
| `backend/` | NestJS API, Prisma šema, migracije i API testovi |
| `web/` | Next.js sajt i korisnički portali |
| `mobile/` | Expo / React Native aplikacija |
| `shared/` | Zajednički tipovi, pravila i dizajn tokeni |
| `blockchain/` | Smart contract kod i prateći alati |
| `scripts/` | Alati koji važe za ceo repozitorijum |
| `docs/` | Dokumentacija, planovi i izveštaji |

## Početak rada

- [Lokalno pokretanje i provere](docs/development/GETTING_STARTED.md)
- [Indeks dokumentacije](docs/README.md)
- [Arhitektura sistema](docs/ARCHITECTURE.md)
- [Migracije baze](backend/MIGRATIONS.md)

Svaka aplikacija ima svoj `package.json` i `package-lock.json`. Zavisnosti se instaliraju u odgovarajućem direktorijumu; projekat trenutno nije npm workspace.

## Provere iz korena

```sh
npm run check:repo
npm run parity:typecheck
npm run parity:backend
```

Poslovni i bezbednosni testovi pokreću se iz `backend/`. Detalji su u [vodiču](docs/development/GETTING_STARTED.md#testovi).

## Pravila za fajlove

Izvorni kod pripada svojoj aplikaciji, zajednički kod u `shared/`, a dokumentacija u `docs/`. Generisani izlazi, instalirane zavisnosti, lokalni `.env` fajlovi i rezultati testiranja ne ulaze u Git.

Ranijih 120 dokumenata iz korena sačuvano je u [arhivi](docs/archive/legacy-root/INDEX.md). Njihovi statusi i komande predstavljaju ranije beleške, ne potvrdu trenutnog stanja aplikacije.
