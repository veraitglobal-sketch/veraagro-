# Checkout: izgubljen odgovor i nastavak bez duplih porudžbina — 26.09.2026.

## Ponašanje

Ažurirani mobilni i web kupac šalju `clientRequestId` (UUID v4) za svaku stavku/pokušaj kupovine. Oznaka se čuva pre mrežnog zahteva. Server pamti oznaku i kanonski hash podataka uz porudžbinu, jedinstveno za par kupac + oznaka. Provera ponavljanja prethodi proveri nove cene i raspoloživosti robe.

- Isti kupac + ista oznaka + isti podaci vraćaju već sačuvanu porudžbinu sa `checkoutReplay: true`, čak i ako su cena, količina zalihe ili status porudžbine u međuvremenu promenjeni.
- Ponovljeni zahtev ne pravi stavku, rezervaciju, audit rezervacije ni obaveštenje o novoj porudžbini.
- Više istovremenih zahteva zaključava isti pokušaj i daje jedan ID porudžbine. PostgreSQL jedinstveni indeks ostaje dodatna zaštita.
- Ista oznaka sa promenjenom količinom, cenom, adresom ili napomenama daje `409 ORDER_REQUEST_MISMATCH`; ne menja već sačuvanu porudžbinu.
- Klijenti za taj konkretan konflikt učitavaju original preko `GET /orders/checkout/:requestId`. Pristup je ograničen na kupca iz prijavljene sesije. Prikazuju poruku da je ranija porudžbina pronađena i da treba proveriti originalne detalje/status.
- Nova namerna kupovina dobija novu oznaku. Drugi kupac sa istom oznakom ima zaseban pokušaj; ne dobija tuđe podatke.
- Transakcioni neuspeh ne ostavlja zauzet ključ bez porudžbine; isti zahtev može ponovo pokušati.

Otkazana porudžbina se ne otvara ponovo ponavljanjem checkout-a: vraća se njen postojeći otkazani status. Ovaj tok ne pokreće bankarsku naplatu.

## Mobilna aplikacija

Korpa dobija trajni ključ tek pri pripremi slanja. Upis ključa mora uspeti pre POST-a; pri neuspehu lokalnog čuvanja slanje se zaustavlja. Ponovno otvaranje aplikacije i ponovni pokušaj koriste sačuvani ključ.

Potvrđena stavka se uklanja zasebno, uz čekanje na čuvanje korpe. Ako odgovor nedostaje ili kasnija stavka padne, nepotvrđene stavke ostaju sa svojim ključevima. Ako čuvanje korpe padne posle odgovora servera, posle ponovnog pokretanja stari ključ omogućava oporavak iste porudžbine.

Pri oporavku se oduzima stvarna količina originalne porudžbine, ne eventualno izmenjena količina iz trenutnog obrasca. Na primer: porudžbina od 2 kg je sačuvana, odgovor se izgubio, korisnik je u međuvremenu povećao korpu na 5 kg; oporavak potvrđuje originalnih 2 kg, a 3 kg ostaju za novu namernu kupovinu sa novom oznakom. Ponovljena potvrda istog ključa ne uklanja taj ostatak drugi put.

Zaseban modal rezervacije takođe čuva oznaku po kupcu i proizvodu, ima zaštitu od ponovljenog dodira i uklanja oznaku posle potvrđenog odgovora. Neuspešno pamćenje poslednje adrese više ne predstavlja uspešnu porudžbinu kao neuspešnu.

## Web

Korpa se čuva u localStorage, odvojeno po kupcu. Ključevi se čuvaju pre slanja; svaka potvrđena stavka se odmah uklanja iz sačuvane korpe. Ranije je uspešna prva stavka ostajala u korpi kada druga padne, pa je ponovno slanje moglo napraviti kopiju prve porudžbine. Ponovni klik u istom prikazu blokiran je sinhronim zaključavanjem.

## Granice

- Stari klijenti bez `clientRequestId` ostaju podržani, ali nemaju ovu garanciju. Zaštita od prekomerne prodaje zalihe i dalje važi.
- Garancija se odnosi na isti sačuvani ključ. Dva nezavisna pokušaja sa različitim ključevima, drugi uređaj ili ručno obrisana i ponovo napravljena korpa predstavljaju zasebne kupovine. Nema globalnog prepoznavanja namere kupca po sličnosti proizvoda/adrese, niti koordinacije više otvorenih web tabova.
- Brisanje lokalnih podataka uklanja sačuvane ključeve. Postojeće porudžbine ostaju dostupne u pregledu kupca.
- Oporavak ne menja adresu niti količinu postojeće porudžbine. Izmene kupac proverava kroz detalje i postojeći tok otkazivanja neplaćene porudžbine.
- Korpa se i dalje obrađuje stavku po stavku. Nije uvedena jedna atomska porudžbina za celu korpu.
- Server ne ponavlja obaveštenja pri replay-u; garantovana dostava obaveštenja/outbox nije uvedena.

## Migracija i provere

[20260926233000_checkout_idempotency](../../backend/prisma/migrations/20260926233000_checkout_idempotency/migration.sql) dodaje `clientRequestId`, `requestHash`, jedinstven indeks po kupcu i proveru da su oba polja zajedno popunjena/prazna. Postojeće porudžbine zadržavaju null vrednosti. Migraciju primeniti pre nove verzije backend-a, zatim ažurirati klijente.

Produkcija nije menjana. Novi vizuelni tok nije pokretan u simulatoru/browseru. Provere koriste stvarni HTTP/JWT/PostgreSQL i izvršavanje stvarnih mobilnih modula sa test zamenama za mrežu/disk.

Završne provere:

- Backend integracije: **123 prošla testa, jedan browser test preskočen**. Šest novih slučajeva proverava konkurentna ponavljanja, replay posle promene cene/statusa, promenjen sadržaj i vlasništvo, izolaciju po kupcu/nove pokušaje, UUID/kanonski hash i rollback pa ponavljanje.
- Mobilni moduli: **50 testova prošlo**, uključujući šest novih provera oporavka i trajnog čuvanja ključa.
- Backend build, web TypeScript i migracija na praznoj testnoj bazi prošli; Prisma poređenje: **No difference detected**.
- Provera higijene repozitorijuma i whitespace provera izmenjenog obima prošle.
- Mobilni TypeScript je dodatno proveravan nakon ograničavanja obaveznog ključa na API porudžbina.

Izvori: [servis porudžbina](../../backend/src/orders/orders.service.ts), [mobilna korpa](../../mobile/lib/cart-store.ts), [mobilni checkout](../../mobile/features/buyer/checkout/BuyerCheckoutScreen.tsx), [web kupovina](../../web/app/buyer/shop/page.tsx), [testovi oporavka](../../mobile/test/checkout-recovery.test.cjs).
