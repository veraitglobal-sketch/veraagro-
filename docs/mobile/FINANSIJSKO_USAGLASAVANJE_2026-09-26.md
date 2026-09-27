# Refundacija → odluka o trošku → saldo učesnika — 26.09.2026.

Nastavak [fizičkog povrata i evidencije bankarske refundacije](POVRAT_REFUNDACIJA_2026-09-26.md). Zatvara operativno usaglašavanje u slučaju da je novac već raspodeljen kroz novčanike pre refundacije kupcu.

## Povezan tok

1. Administrator evidentira izvršenu bankarsku refundaciju postojećim tokom. Ako je izvorna uplata bila `RELEASED`, predmet ostaje označen za usaglašavanje.
2. Na `/admin/returns`, administrator otvara **Finansijsko usaglašavanje**. API prikazuje stvarne prvobitne kredite vezane za tu porudžbinu i dostavu, primaoce, iznose i trenutni raspoloživi saldo. Ne izračunava ponovo procente na osnovu današnjih podešavanja.
3. Za svaki ceo deo administrator izričito bira **Vrati iz dostupnog salda** ili **Platforma snosi trošak**. Nema unapred izabrane odgovornosti. Obavezni su obrazloženje i potvrda ukupnog zaduženja/troška.
4. Za povraćaj iz salda upisuje se nova negativna `wallet_transactions` stavka tipa `REFUNDED`, vezana za originalni kredit, porudžbinu i dostavu. Raspoloživi saldo se smanjuje. Originalni kredit ostaje neizmenjen.
5. Za trošak platforme čuva se odluka i iznos, bez zaduženja primaoca. Trošak nije prikazan kao naplaćen novac. Ako deo platforme istorijski nije bio knjižen u novčanik, dozvoljena je samo ova eksplicitna odluka za taj deo.
6. Uspešan upis čuva kompletan obračun, stavke, administratora, vreme, obrazloženje i audit; zatvara `reconciliationRequired`. Admin pregled posebno prikazuje iznos vraćen iz salda i iznos koji snosi platforma.
7. U mobilnom pregledu povrata proizvođač/prevoznik vidi samo odluku i iznos za svoj deo. Proizvođačev novčanik prikazuje negativno knjiženje i osvežava se pri otvaranju. Kupac nastavlja da vidi status svoje refundacije, bez tuđih finansijskih stavki.

Novi API:

- `GET /delivery-returns/refunds/:id/reconciliation`: ADMIN/SUPER_ADMIN pregled originalnih kredita ili sačuvane odluke.
- `POST /delivery-returns/refunds/:id/reconciliation`: ADMIN/SUPER_ADMIN konačno usaglašavanje. Telo sadrži reviziju refundacije, valutu, pun iznos, obrazloženje i metod za svaki izvorni kredit.

## Integritet novca

- Usaglašavanje je dozvoljeno tek posle potvrđene refundacije ranije raspodeljene uplate. Refundacija direktno iz escrow-a nema kredite za ovakvo vraćanje.
- Krediti moraju pripadati istoj porudžbini/dostavi, biti završeni i zajedno odgovarati istorijskoj raspodeli uplate. Nepotpuna ili nedosledna istorija blokira usaglašavanje umesto izmišljanja primaoca/iznosa.
- Svaki originalni izvor mora biti naveden tačno jednom. Proveravaju se svi iznosi i valuta. Jedinstvena veza originalnog kredita sprečava dvostruko poravnanje.
- Zaključava se refundacija, zatim novčanici u stabilnom redosledu. Više delova istog primaoca prvo se sabira. Negativan saldo nije dozvoljen; nedovoljno raspoloživog novca vraća 409 bez delimičnog upisa.
- Saldo, negativne transakcije, obračun, stavke, zastavica refundacije i audit upisuju se u jednoj transakciji. Greška bilo kog upisa vraća sve promene.
- Identican ponovljen zahtev, uključujući drugačiji redosled istih stavki, vraća sačuvani obračun. Promenjeni iznosi, metode ili obrazloženje ne mogu prepisati raniju odluku.
- Postojeći javni servisni metodi za kredit i zahtev za povlačenje novca sada takođe menjaju saldo i transakciju atomski. Negativan ili neispravan zahtev za povlačenje je odbijen. Istovremeno čitanje novog novčanika više ne pravi duple početne zapise.
- Postojeće `Float` kolone nisu migrirane. Računanje usaglašavanja koristi cele cente i Decimal proveru, uz vrlo malu toleranciju za istorijsko binarno zaokruživanje. Stvarni delovi centa traže finansijski pregled.
- `totalEarned` ostaje istorijski zbir priliva. Mobilna oznaka sada izričito kaže **Ukupni prilivi pre zaduženja**; raspoloživi saldo i negativne stavke prikazuju učinak usaglašavanja.

Ispravljena je i ranija greška mobilnog prikaza: API šalje `EARNED`, `PLATFORM_FEE`, `REFUNDED` i potpisan iznos, dok je ekran očekivao `CREDIT/DEBIT`. Sada se smer određuje iz znaka iznosa, prikazuje apsolutna vrednost sa jednim znakom i zadržava izvorni tip za objašnjenje refundacije.

## Granice ovog koraka

- Ovo je odluka administratora o poravnanju i operativna evidencija troška, a ne automatsko utvrđivanje odgovornosti, računovodstvena glavna knjiga ili izvoz knjižnih odobrenja.
- Ne izvršava se stvarni bankarski transfer. Nisu uvedeni spoljna naplata od proizvođača/prevoznika, dokaz njihovog bankarskog povraćaja, dug, rate ili automatsko zaduživanje buduće zarade. Kada saldo nije dovoljan, predmet ostaje otvoren dok operativa ne donese odgovarajuću odluku.
- Jedan izvorni deo može biti u celosti vraćen iz novčanika ili u celosti pokriven od platforme. Deljenje jednog dela na više načina/iznosa nije podržano.
- Odluka je nepromenljiva kroz ovaj API. Poseban korektivni postupak za pogrešno unetu odluku nije uveden; postojeća knjiženja ne treba ručno brisati.
- Nema novih push/email obaveštenja. Učesnici vide sačuvano stanje po otvaranju/osvežavanju ekrana. Administrativno obrazloženje i tuđe stavke nisu izloženi drugim učesnicima.
- Odluka o robi posle prijema (karantin, otpis, eventualno vraćanje na prodajnu zalihu) ostaje zaseban naredni tok. Usaglašavanje ne vraća oštećenu robu u zalihu.

## Migracija i provere

Migracija [20260926200000_refund_reconciliation](../../backend/prisma/migrations/20260926200000_refund_reconciliation/migration.sql) dodaje obračun i njegove stavke, veze ka originalnom kreditu/novom zaduženju, jedinstvene ključeve i provere ukupnih iznosa/metoda. Ne menja istorijske kredite niti automatski zatvara stare refundacije. Pri objavljivanju prvo primeniti migracije, zatim backend i klijente.

Produkcija nije menjana, deployment nije izvršen i stvarni novac nije pomeran.

Završne provere:

- Backend `npm run test:integration`: **92 prošla, jedan browser test namerno preskočen**. Jedanaest novih testova proverava ovlašćenja, fazu refundacije, identične konkurentne zahteve, očuvanje originalnih kredita, mešovitu odluku, neispravne/zastarele zahteve, nedovoljan saldo, više refundacija istog primaoca, paralelni priliv/povlačenje, rollback i oporavak, istorijski neknjižen deo platforme, sabiranje više delova jednog novčanika i početno kreiranje novčanika. Uključena je provera da učesnik vidi samo svoje stavke usaglašavanja.
- Mobile `npm run check`: **44 testa prošla** i TypeScript provera prošla. Nova proba proverava smer, iznos i poreklo transakcija novčanika. Posle dopune prikaza sopstvene odluke ponovljena TypeScript provera je prošla.
- Backend build i web TypeScript: prošli.
- Migracije na novoj privremenoj bazi: prošle; Prisma poređenje sa šemom: **No difference detected**.
- `npm run check:repo` i `git diff --check` za izmenjeni obim: prošli.

Novi prikaz nije vizuelno proveren u browseru/iOS simulatoru. HTTP testovi koriste stvarne JWT kontrolere, obradu slika, servise i izolovani PostgreSQL; spoljni servisi ostaju test zamene.

Izvori: [servis usaglašavanja](../../backend/src/deliveries/refund-reconciliation.service.ts), [administrativni obrazac](../../web/components/returns/RefundReconciliation.tsx), [novčanici](../../backend/src/wallets/wallets.service.ts), [mobilni prikaz transakcije](../../mobile/lib/wallet-transaction.ts), [HTTP testovi](../../backend/test/orders.integration-spec.ts).

Nastavak robnog toka: [kontrola vraćene robe i fizički popis](POVRACENA_ROBA_ZALIHE_2026-09-26.md), sa dokumentovanim ograničenjem postojećeg knjiženja izlaza robe.
