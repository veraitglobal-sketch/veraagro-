# Misija → dostava i odluka o reklamaciji — 26.09.2026.

Nastavak [primopredaje i kupčevog prijema](PRIMOPREDAJA_PRIJEM_2026-09-26.md). Implementirane su eksplicitna veza misije sa dostavom i administrativna odluka o prijavi, dostupna kupcu posle ponovnog učitavanja.

## Povezivanje i transport

Na web stranici `/admin/dispatch` administrator bira postojeću misiju sa dodeljenom logistikom i plaćenu porudžbinu iste farme. Prikazuju se broj misije, farma, proizvod i količina porudžbine. Administrator potvrđuje da ova misija ispunjava **celu** izabranu porudžbinu. Sistem ne pogađa kupca iz najnovijeg lota ili misije.

`POST /deliveries/admin/link-mission` u transakciji:

1. Zaključava misiju i porudžbinu; proverava aktivan nalog logistike, plaćanje u escrow-u, kompatibilne statuse, farmu i eventualne već određene lotove stavki porudžbine.
2. Upisuje `deliveries.missionId` (jedinstven strani ključ), `missions.orderId` i dostavu. Ako dostava već postoji, prihvata je samo kada se nalog prevoznika i status podudaraju.
3. Preuzima odredište iz porudžbine i poništava staru procenu rute. Postojeći broj misije i lot se čuvaju.
4. Upisuje audit sa administratorom i identifikatorima veze. Ponavljanje vraća istu dostavu; konkurentne različite dodele ne mogu tiho preuzeti porudžbinu.

Izrada otpremnice i povezivanje računa koriste postojeće servise posle čuvanja veze. Greška dokumenata ne briše dostavu: odgovor sadrži `documentsReady`, a administrativni pregled prikazuje povezane dostave kojima nedostaje dokument, sa akcijom za ponavljanje. Ponovljeno povezivanje već završene dostave može dopuniti dokumente bez promene statusa prijema.

Promene `DEPART_FARM`, `START_TRANSIT` i `COMPLETE_DELIVERY` sada upisuju misiju, povezanu dostavu, porudžbinu i audit u jednoj transakciji. Greška upisa vraća sve promene. Ponovljen korak ne pomera datum i ne vraća kasniji status unazad. Misija koja ima porudžbinu, ali nema povezanu dostavu, traži administrativno povezivanje pre daljeg napredovanja; samostalne misije bez porudžbine zadržavaju svoj tok.

Završetak transportne misije nije kupčev potpis: dostava ostaje `IN_TRANSIT` do digitalne primopredaje. Logistika u mobilnom detalju misije vidi broj/status svoje dostave i otvara postojeće skeniranje za početak primopredaje sa njenim `deliveryId`. Povratak na misiju ponovo učitava primopredaju. Kasni odgovor prethodne misije ne može zameniti novu misiju i njenu dostavu.

Za povezanu dostavu stari zasebni pickup/transit endpointi upućuju na životni ciklus misije. QR potvrda ne zaobilazi obaveznu digitalnu primopredaju. Kupčev tracking i izbor temperaturnih zapisa za postojeći obračun koriste eksplicitno povezanu misiju; stari nepovezani podaci zadržavaju legacy fallback.

## Obrada reklamacije

`/admin/delivery-issues` sada podržava:

- **Primljeno → U obradi → Odluka zabeležena**, sa obaveznim obrazloženjem od najmanje 20 znakova.
- Za prijavu posle prijema: **reklamacija prihvaćena** ili **odbijena**.
- Za spor pri primopredaji: **ponovna kontrola kupca** ili **potreban povrat**.

`POST /deliveries/admin/review/:kind/:id` proverava ADMIN/SUPER_ADMIN, očekivanu reviziju i dozvoljen prelaz. Odluka, autor, datum i audit upisuju se zajedno. Isti ponovljeni zahtev vraća sačuvanu odluku; drugačija odluka iz zastarelog prikaza dobija 409 i traži osvežavanje. Administrativni ekran zato ne prepisuje tuđu noviju odluku.

Ponovna kontrola otvara postojeću primopredaju za **novu** inspekciju, bez automatskog prihvatanja robe ili potpisa. Stare fotografije i razlog ostaju u sporu; obrazac primopredaje se prazni i povećava se njegova revizija. Stari zahtev sa telefona ili weba ne može ponovo zatvoriti otvorenu kontrolu. Mobilni i web obrazac šalju učitanu reviziju.

Odluka „potreban povrat“ ostavlja primopredaju spornom i kupčev prijem blokiranim. Ona **ne znači da je roba već vraćena**. Refundacija, povratna transportna misija i potvrda fizičkog povrata nisu dodati u ovom koraku. Posle prijema odluka o reklamaciji takođe ne menja već izvršena finansijska knjiženja. Administrativni obrazac izričito objašnjava te posledice.

Kupac na mobilnom panelu dostave i web listi dostava vidi status obrade, ishod, obrazloženje i datum. Obaveštenje vodi do njegove porudžbine; čitanje odluke ne zavisi od uspeha spoljnog slanja obaveštenja.

## Granice modela i puštanje

- Veza je **jedna misija → jedna dostava → jedna porudžbina**. Konsolidovane ture, podeljene isporuke i alokacija količina više lotova nisu uvedeni. Ako stavke već imaju lot, ne smeju pripadati drugom lotu; kada nisu alocirane, operativa potvrđuje proizvod i količinu. Ovaj ekran ne knjiži nove zalihe.
- `deliveries.driverId` za ovu vezu predstavlja dodeljeni korisnički nalog logističkog partnera. Delegirana osoba iz `logistics_drivers` ostaje zaseban podatak misije. Ne pretvara se ID osobe bez naloga u ID korisnika.
- Za postojeću misiju već u transportu dozvoljeno je povezivanje odgovarajuće porudžbine. Ako nije postojao zapis dostave, `inTransitAt` novog zapisa označava vreme povezivanja; ne izmišlja se istorijsko vreme polaska u transport. `pickedUpAt` se preuzima sa misije.
- Stare dostave se ne povezuju automatski migracijom. Operativa bira i razrešava konfliktne stare dodele. Prikazi povezivanja i nedostajućih dokumenata ograničeni su na poslednjih 200 rezultata; pregled reklamacija na 100 po vrsti.
- QR provera prodavnice i kompletna matrica mobilnih uloga iz ranijeg izveštaja ostaju zasebne stavke. Nema garantovanog reda ponavljanja notifikacija/blockchain efekata.

Nova migracija: [20260926150000_mission_delivery_review](../../backend/prisma/migrations/20260926150000_mission_delivery_review/migration.sql). Dodaje vezu dostave, polja obrade i revizije; istorijski snapshot nije menjan. Za objavljivanje prvo primeniti `npm run prisma:deploy`, zatim backend i ažurirane klijente. Stariji klijenti mogu završiti početnu primopredaju revizije 0, ali zahtev za ponovnu kontrolu traži ažuriran klijent.

**Produkcija nije menjana niti je izvršen deployment.**

## Provere

- `npm run test:integration` u backendu: **70 prošlo, jedan browser test namerno preskočen**. Dvanaest novih proba proverava direktnu vezu i vlasništvo, konkurentne dodele, nedozvoljene statuse, transakcioni rollback, ceo povezani transport/prijem/obračun, oba ishoda reklamacije, ponovnu kontrolu i zastarele zahteve, blokiran povrat, oporavak dokumenata i konflikt prevoznika.
- `npm run check` u mobile: **41 test prošao** i TypeScript provera prošla. Dve nove probe pokrivaju kasni odgovor prethodne misije i ponovno učitavanje primopredaje po povratku na ekran.
- Backend build, web TypeScript, `npm run check:repo` i `git diff --check` za izmenjeni obim: prošli.
- Migracije su primenjene na novoj privremenoj bazi; Prisma poređenje sa šemom javlja **No difference detected**. Istorijski bootstrap i prethodni testovi narudžbina/berbe ostaju zeleni.

HTTP suite koristi stvarne JWT kontrolere, servise misija/dostava/primopredaje/plaćanja, audit, obradu slika i izolovani PostgreSQL. U transportnom scenariju već završen dokaz utovara je test fixture: kamera i stvarni unos utovara nisu deo ovog testa. Spoljašnje notifikacije, blockchain, batch efekti i generatori dokumenata su zamenjeni test servisima; proba neuspeha dokumenta proverava oporavak veze, ne izgled PDF-a.

Novi web ekrani i mobilni prikazi provereni su statički i kroz API/logiku; nisu prošli vizuelni browser/native prolaz u ovom koraku.

Izvori: [povezivanje](../../backend/src/deliveries/mission-delivery.ts), [obrada prijave](../../backend/src/deliveries/delivery-review.ts), [administrativna dodela](../../web/app/admin/dispatch/page.tsx), [HTTP testovi](../../backend/test/orders.integration-spec.ts), [testovi mobilne logike](../../mobile/test/delivery-flow.test.cjs).

Sledeći korak implementacije: [fizički povrat robe i evidencija bankarske refundacije](POVRAT_REFUNDACIJA_2026-09-26.md). Granice prethodnog koraka iznad ostaju istorijski opis; aktuelan obim povrata nalazi se u nastavku.
