# Plan berbe → lot → misija — 26.09.2026.

Implementiran je nastavak [povezivanja postojećeg lota](POVEZIVANJE_LOTA_2026-09-26.md), za prekide A07 iz [funkcionalne analize](FUNKCIONALNA_MAPA_2026-09-26.md).

## Ponašanje

1. Pri kreiranju lota mobilna aplikacija šalje **izabrani** `harvestAnnouncementId`. Server proverava vlasnika gazdinstva, autora plana, tip HARVEST, parcelu i da plan nije otkazan. Veza ostaje u `batches.harvestAnnouncementId`, sa stranim ključem i indeksom.
2. Lokalni plan koji još čeka sinhronizaciju blokira kreiranje povezanog lota uz jasnu poruku. Aplikacija ne izostavlja odabrani plan niti šalje `local:` ID serveru. Posle kreiranja otvara detalj novog lota.
3. Detalj lota prikazuje sačuvani plan i povezanu misiju, ili izričito odsustvo veze. Ovi podaci dolaze sa novog, autentifikovanog `GET /batches/:id/workflow`; javni QR endpoint ne dobija podatke plana/misije.
4. Zahtev za transport koristi plan sačuvan na lotu. Uklonjen je izbor „najnovijeg plana sa iste parcele“ iz mobilnog ekrana i iz automatskog serverskog povezivanja.
5. Ako plan već ima misiju bez lota, zahtev priključuje lot toj misiji pre preuzimanja. Čuva broj misije, status, dodelu logistici, odredište, instrukcije operative i planirani termin. Uneta tačna lokacija/adresa preuzimanja zamenjuje približnu lokaciju farme iz plana; ranija procena rute se poništava.
6. Ako misija već pripada tom lotu, ponavljanje zahteva vraća istu misiju. Dva istovremena zahteva — uključujući istovremeni oporavak plana i zahtev za lot — prolaze kroz zajedničku transakciju i PostgreSQL zaključavanje po planu/lotu. Novi broj/ID se ne upisuje pri ponavljanju.
7. Ako je berba sačuvana, a pravljenje misije nije uspelo, odgovor sadrži `transportStatus: RETRY_REQUIRED`. Isto stanje se vidi posle ponovnog učitavanja spiska berbi. Na mobilnom ekranu berbe korisnik može ponoviti **samo prevoz**, preko `POST /harvest-announcements/:id/retry-transport`, i otvoriti dobijenu misiju. Ponovni unos berbe nije potreban.
8. Automatski zahtev iz plana poštuje isto postojeće pravilo administratorskog odobrenja transporta kao ručni zahtev. Dodeljena logistika dobija isti ID lota kroz postojeće API prikaze misija.

## Granice i operativna pravila

- Stari lotovi ostaju bez veze dok se ona pouzdano ne utvrdi; migracija ne zaključuje poreklo iz datuma ili parcele. Kreiranje lota bez odabranog plana ostaje podržano i jasno prikazano kao nepovezano.
- Postojeći model ima **jednu misiju po planu i jedan lot po misiji**. Drugi lot istog plana ne preuzima postojeću misiju i ne pravi tihu, nepovezanu duplikat-misiju: dobija HTTP 409 i upućivanje na operativu. Podrška za više utovara/lotova u jednoj turi zahteva zasebnu promenu modela.
- Postojeća misija posle preuzimanja, otkazivanja ili završetka ne prima novi lot. Ponovljeni zahtev za već priključen lot vraća postojeću misiju sa njenim stvarnim statusom; ne otvara novu turu.
- Stari duplikati misija se ne spajaju automatski. Ako plan/lot već imaju više različitih misija, potrebno je operativno razrešenje.
- Provera kontrolnih fotografija/nalepnica ostaje obavezna pri priključivanju lota. Sama planska misija nije dokaz da je lot spreman za utovar.
- Ovo ne rešava povezivanje plana setve sa berbom, višekorisnički offline red, alokaciju kupčevih porudžbina ili nastavak kroz primopredaju/obračun.

## Provere

- `npm run check --prefix mobile`: **32 testa prošla** i TypeScript provera prošla. Četiri nova testa proveravaju da izbor plana ne zavisi od redosleda, da lokalni/nepostojeći/pogrešan plan blokira slanje i da se odsutan plan ne pogađa.
- `cd backend && npm run test:harvest`: **14 HTTP/PostgreSQL integracionih testova**, uključujući konkurentne zahteve, ponavljanje izgubljenog odgovora, tačnu lokaciju preuzimanja uz očuvanje podataka operative, izolaciju vlasnika, kontrolu fotografija, oporavak posle greške i prikaz istog lota proizvođaču i logistici.
- Postojeće provere narudžbina/migracija: **34 testa prošla**; test browser kupovine je namerno preskočen u običnom integracionom pokretanju. Novi paket je pri prvom pokretanju imao grešku u test podacima (nedostajao `passwordHash`); posle popravke pokrenut je zasebno komandom iznad.
- Serverska kompilacija prolazi. Runner je uspešno primenio novu migraciju na privremenoj bazi i potvrdio da nema razlike između baze i Prisma šeme.

HTTP testovi koriste stvarne kontrolere, autentifikaciju, servise za lotove/berbe/misije, proveru materijala i PostgreSQL. Spoljašnje notifikacije, blockchain, freshness i PHI izračunavanje zamenjeni su test servisima; njihov rad nije predmet ovih proba. Mobilni native ekran, kamera, GPS i push nisu ponovo testirani na uređaju.

## Objavljivanje

Nova migracija: [20260926120000_link_batch_harvest_plan](../../backend/prisma/migrations/20260926120000_link_batch_harvest_plan/migration.sql). Stari snapshot i istorijske migracije nisu menjani. Primeniti uobičajeni `npm run prisma:deploy` na odabranom okruženju pre puštanja novog backenda i mobilnog builda, prema [vodiču za migracije](../../backend/MIGRATIONS.md). **Produkcija nije menjana niti je aplikacija objavljena ovim radom.**

Izvori: [kreiranje lota](../../mobile/features/grower/batches/CreateBatchScreen.tsx), [detalj veze](../../mobile/features/grower/batches/BatchHarvestContext.tsx), [oporavak prevoza](../../mobile/features/grower/harvest/HarvestTransportStatus.tsx), [transakcija misije](../../backend/src/missions/save-workflow-mission.ts), [integracioni testovi](../../backend/test/harvest-workflow.integration-spec.ts).
