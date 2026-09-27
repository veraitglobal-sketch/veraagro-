# Povezani tokovi proizvođača, nabavke i admin panela

Lokalne izmene od 26.09.2026. Nisu objavljene na produkciji.

## Šta je povezano

| Korak | Podatak koji ostaje sačuvan | Sledeći ekran / odgovornost |
| --- | --- | --- |
| Parcela → zasad → dnevnik | ID parcele i izabranog zasada prenose se u dnevnik rada | Proizvođač evidentira rad uz izabrani plan; zakašnjelo učitavanje prethodne parcele ne prepisuje izbor |
| Zasad → berba | `harvest_announcements.sourcePlantingId` | Server proverava vlasnika, parcelu, tip i status zasada; lokalni nesinhronizovani ID se odbija |
| Berba → lot | Postojeći `batches.harvestAnnouncementId` | Berba prikazuje svoje lotove i otvara kreiranje lota sa istom parcelom i planom |
| Lot → pakovanje → nalepnice → kontrola → prevoz | Isti interni ID lota kroz prelaze | Registracija nalepnica ne gubi lot; iz detalja lota dostupan je dnevnik izvornog zasada |
| Berba ↔ admin prevoz | Plan vraća povezanu misiju i lotove | Admin otvara tačnu misiju, odobrava zahtev i dodeljuje prevoznika; iz misije se vraća na plan |
| Nabavka → potvrđen prijem → Moji proizvodi | `supplier-order:<orderId>:<itemIndex>` i `sourceOrderId` | Potvrda prijema i upis konkretnih stavki su jedna transakcija; red porudžbine je zaključan, ponavljanje ne duplira stavke |
| Moji proizvodi → obračun troškova | Server i uređaj koriste isti ID proizvoda | Proizvodi se čitaju i sa servera, ostaju nakon sinhronizacije i dostupni su izboru u kalkulatoru |
| Prijem isporuke → admin puštanje sredstava → novčanik | Postojeća uplata, porudžbina i transakcije novčanika | Poseban admin red za sredstva u escrow-u, pregled raspodele i potvrda; server i dalje proverava prijem, hladni lanac i reklamacije |
| Novčanik → porudžbina | `orderId` transakcije | Transakcija otvara povezanu porudžbinu; novčanik se osvežava po povratku u aplikaciju |

## Granice

- Puštanje sredstava knjiži novčanike. Ovo nije izvršenje bankovnog transfera.
- Dobavljačke porudžbine trenutno nemaju sačuvan konačan iznos kupovine, zato prijem ne pravi automatski novčani trošak. Stavke koje predstavljaju samo upit nisu proizvodi.
- Evidentirani proizvodi nisu novi skladišni obračun potrošnje. Postojeći sistem materijalnog bilansa ostaje zaseban.
- Stara lokalna kolekcija `pending_products` nema identitet vlasnika. Sačuvana je netaknuta, ali se ne pripisuje nalogu i ne šalje automatski. Novi lokalni proizvodi su odvojeni po korisničkom ID-u. Potrebna je zasebna, pouzdana migracija ako takvi stari redovi postoje na uređajima.
- Istorijske berbe bez pouzdanog podatka o zasadu ostaju nepovezane. Novi `sourcePlantingId` je opcioni zbog starih klijenata, dok ga novi mobilni tok šalje. Povezani zasad se ne može obrisati.
- Produkcija i simulator povezan sa produkcijom još zahtevaju objavu API-ja i primenu migracije, pa ove provere nisu potvrda produkcionog toka. Nisu slati probni poslovni podaci niti puštene stvarne isplate.

## Provere

- 25 HTTP/PostgreSQL integracionih testova (`node scripts/run-isolated-tests.cjs --harvest` iz backend direktorijuma): trajna veza zasada, vlasništvo i parcela, oporavak prevoza, istovremeni zahtevi, ponovljen prijem nabavke, povrat transakcije pri grešci upisa proizvoda.
- Migracije primenjene na privremenu bazu; Prisma poređenje ne nalazi razliku u šemi. Privremeni klaster potom uklonjen.
- 20 provera mobilne poslovne logike i prelaza (`connected-workflow`, `batch-workflow`, `harvest-batch-link`).
- 15 jedinčnih backend provera čitanja proizvoda i zaštite puštanja sredstava.
- TypeScript provera backenda, mobilne aplikacije i web panela.

## Objavljivanje

Pre novog backenda potrebna je migracija `20260926234500_link_harvest_planting`, zajedno sa prethodnim još neprimenjenim migracijama. Objaviti API pre novih klijenata. Koristiti dokumentovan deployment wrapper iz `backend/MIGRATIONS.md`; ne koristiti `db push` nad produkcijom.
