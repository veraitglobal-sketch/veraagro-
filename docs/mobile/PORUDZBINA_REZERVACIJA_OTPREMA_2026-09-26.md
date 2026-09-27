# Porudžbina → rezervacija → otprema / otkaz — 26.09.2026.

## Tok i značenje količine

`inventory.quantity` predstavlja slobodnu raspoloživu količinu. Porudžbina 10 kg iz zalihe od 100 kg odmah ostavlja 90 kg za ostale kupce. U istoj transakciji nastaju porudžbina, stavka sa vezom ka zalihi, rezervacija i audit. Izvorni kataloški ID ostaje u `orders.sourceCatalogId`.

Nova tabela `order_stock_reservations` čuva jednu alokaciju po porudžbini: izabranu zalihu, količinu/jedinicu, aktera i vreme rezervacije, izdavanja ili oslobađanja. Prelazi su `RESERVED → ISSUED` ili `RESERVED → RELEASED`. Ponovljen zahtev ne skida niti vraća količinu dva puta.

- Kupovina konkretne zalihe automatski rezerviše tu zalihu i postavlja stvarno gazdinstvo isporuke.
- Lot sa povezanom zalihom koristi istu rezervaciju; njegova farma i zaliha moraju odgovarati porudžbini.
- Tržišna ponuda ili lot bez zalihe ostaju zahtev operativi. Admin bira odgovarajuću zalihu na stranici porudžbina; lot prvo mora biti povezan sa baš tom zalihom. Do tada nisu dozvoljeni odobrenje, nova potvrda uplate ni dodela dostave.
- Odobrenje porudžbine i potvrda bankarske uplate proveravaju postojeću, važeću rezervaciju.
- Direktno preuzimanje dostave ili polazak povezane misije evidentiraju `ISSUED`. Slobodni saldo ostaje 90 kg, jer je količina već izdvojena pri rezervaciji.
- Kupac ili administrator mogu otkazati samo neplaćenu `PENDING`/`APPROVED` porudžbinu bez dostave. Rezervacija postaje `RELEASED`, slobodni saldo se vraća na 100 kg. Ako je rok istekao, količina se vraća u `EXPIRED` stanje i ne postaje ponovo prodajna.
- Plaćena ili otpremljena porudžbina ne prolazi kroz jednostavan otkaz: potreban je finansijski pregled, odnosno postojeći povrat/refundacija. Upozorenje kupcu obuhvata i uplatu koja još nije proknjižena u aplikaciji.

Opšta administratorska promena statusa više ne može preskočiti naplatu, otpremu, prijem ili refundaciju. Dodeljena farma se ne može promeniti na drugu farmu posle rezervisanja robe.

## Prikaz i krajnji podatak

Mobilni detalj porudžbine i web kupac prikazuju stanje rezervacije i količinu, sa akcijom otkazivanja za neplaćene porudžbine. Administrativna lista prikazuje rezervaciju i izbor odgovarajuće zalihe, uključujući farmu, hub i slobodnu količinu. Bankarska uputstva prikazuju se za odobrenu porudžbinu sa rezervacijom. Web prikaz uplate ispravljen je da koristi jednu povezanu uplatu koju API vraća.

Krajnji zapis nije samo status na ekranu: rezervacija ostaje povezana sa porudžbinom i zalihom, a audit beleži rezervaciju, izdavanje i oslobađanje. Fizički povrat i kontrola robe nastavljaju postojeći tok. Popis vraćene robe ne može prepisati zalihu koja još ima aktivnu rezervaciju druge porudžbine — takve zalihe nisu ponuđene u izboru, a server ponovo proverava uslov pod zaključavanjem.

## Transakcije i kompatibilnost

Redosled zaključavanja je porudžbina pa zaliha; kod misije prvo misija, zatim porudžbina i zaliha. Veza stavke ka zalihi upisuje se tek posle zaključavanja zalihe, da konkurentni strani ključevi ne izazovu deadlock. Decimalna aritmetika računa razliku količina; postojeći Float tip baze nije migriran na Decimal.

Dodela direktne dostave i promena statusa porudžbine su atomske. Dokumenti i obaveštenja nastaju posle sačuvane dodele; greška dokumenta ne ostavlja porudžbinu u poluzavršenom stanju, a ponovna dodela istom vozaču može ponoviti generisanje dokumenata. Promena na drugog vozača ne prolazi kao ponavljanje.

Migracija ne pretpostavlja istorijska zaduženja. Stare porudžbine pre polaska moraju dobiti eksplicitnu alokaciju. Stare dostave već preuzete/u transportu bez rezervacije mogu nastaviti postojeći tok bez retroaktivnog skidanja robe; njihova istorijska zaliha zahteva zaseban pregled. Stara višestavna porudžbina nije automatski raspoređena po jednom skladišnom zapisu.

## Preostale granice

- Nema automatskog isteka rezervacija. Neplaćene rezervacije traju do eksplicitnog otkaza.
- Naknadno je uveden [idempotentan checkout i oporavak izgubljenog odgovora](CHECKOUT_BEZ_DUPLIKATA_2026-09-26.md). Zahtevi starih klijenata bez ključa i dalje mogu napraviti zasebne porudžbine; zaštita zalihe sprečava prekomernu prodaju.
- Nema delimične alokacije, više skladišta po porudžbini, zamene rezervisane zalihe ili automatskog povraćaja novca.
- Ranije pripremljena misija može ostati vidljiva posle otkaza porudžbine, ali ne može biti povezana/otpremljena kao dostava otkazane porudžbine. Ne otkazuje se ceo fizički transport naslepo.
- Fallback katalozi tržišnih cena i lotova ostaju ponude/zahtevi, ne garancija slobodne količine. Nisu redizajnirani u ovom koraku.

## Migracija i provera

Nova migracija: [20260926230000_order_stock_reservations](../../backend/prisma/migrations/20260926230000_order_stock_reservations/migration.sql). Dodaje tabelu/veze, jedinstvenu alokaciju, indeks i provere pozitivne količine i konzistentnih statusa/vremena. Pre objave backend-a primeniti migraciju; zatim objaviti ažurirane klijente.

Produkcija nije menjana. Vizuelni tok u iOS simulatoru/browseru nije proveravan u ovom koraku. HTTP integracioni testovi koriste stvarne kontrolere, JWT i privremeni lokalni PostgreSQL; spoljne notifikacije i generatori dokumenata su test zamene.

Završne provere:

- Backend integracije: **117 prošlo, jedan browser test namerno preskočen** u tri seta. Četrnaest novih testova pokriva trajnu rezervaciju, istovremenu kupovinu poslednje zalihe, transakcioni rollback, ponavljanje otkaza i vlasništvo, istek roka, eksplicitnu alokaciju, vezu lota i farme, konkurentan otkaz/uplatu, zabranu prečica statusa, direktni i misijski izlaz, blokiran fizički popis, staru nealokovanu otpremu i kvar generatora dokumenata.
- Test konkurentne kupovine je prvo otkrio deadlock zbog ranog upisa stranog ključa. Posle promene redosleda zaključavanja ceo integracioni set je ponovo prošao.
- Mobilni `npm run check`: **44 testa prošla** i TypeScript prošao; posle poslednje izmene prikaza bankarskih uputstava TypeScript ponovo prošao.
- Backend `npm run build` i web `npx tsc --noEmit`: prošli.
- Nova migracija na praznoj privremenoj bazi: prošla; Prisma poređenje: **No difference detected**.
- `npm run check:repo` i `git diff --check` za izmenjeni obim: prošli.

Izvori: [rezervacija i izdavanje](../../backend/src/orders/order-stock.ts), [porudžbine](../../backend/src/orders/orders.service.ts), [misija i dostava](../../backend/src/deliveries/mission-delivery.ts), [administrativni izbor zalihe](../../web/components/orders/OrderStockAllocation.tsx), [integracioni testovi](../../backend/test/orders.integration-spec.ts).
