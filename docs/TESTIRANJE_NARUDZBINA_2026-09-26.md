# Narudžbine, potvrda uplate i isplata — rezultati samostalnog testiranja

Datum: 26.09.2026. Izmene su lokalne; produkcija nije menjana.

## Rezultat

- **35 bezbednosnih testova prolazi.**
- **34 integraciona testa prolaze: 30 poslovnih HTTP testova i 4 provere migracija sa pravim PostgreSQL-om.**
- **Browser test prolazi u Chromium-u na desktop (1440 × 1000) i mobilnom viewport-u (390 × 844).**
- Web i mobile TypeScript provere prolaze.
- Backend TypeScript provera i Nest build prolaze. Build zadržava `dist/main.js`; test kod je isključen iz produkcionog builda.
- **Podizanje prazne baze i provera jednakosti šeme sada prolaze.** Detalji su ispod.

## Šta je stvarno provereno

Integracioni testovi koriste Nest kontrolere, stvarnu JWT autentifikaciju, poslovne servise, Prisma upite i zaseban PostgreSQL klaster. Svako pokretanje pravi novu bazu `biovera_test` na nasumičnom lokalnom portu. Runner zamenjuje DATABASE_URL, a nakon testiranja zaustavlja i uklanja svoj klaster. Nisu korišćeni stvarni korisnici, novac ili produkciona baza.

Proveren je tok kroz API: kreiranje narudžbine → administratorsko odobrenje → izbor imanja → potvrda bankovne uplate → dodela vozača → preuzimanje → transport → kupčeva QR potvrda → podela iznosa i evidentiranje na novčanicima.

Testovi obuhvataju:

- identitet proizvoda, aktivnu serversku cenu, nepostojeći proizvod, promenjen naziv i klijentsko snižavanje cene;
- nultu, negativnu, tekstualnu i null količinu, količinu veću od dostupne, neispravnu adresu, neaktivnu/isteklu robu;
- identifikatore inventara, batch robe i rezervacija zasnovanih na tržišnoj ceni;
- odbijanje tuđeg plaćanja i neovlašćenog potvrđivanja uplate;
- ponovljene i paralelne potvrde iste uplate;
- namerno izazvan neuspeh u kreiranju escrow zapisa i PostgreSQL trigger koji odbija PAID upis, uz proveru potpunog rollbacka;
- paralelne release zahteve za istu narudžbinu, paralelne isplate različitih narudžbina na iste novčanike, uključujući prvo kreiranje novčanika;
- rollback cele isplate kada upis poslednjem primaocu ne uspe;
- raspodelu malog iznosa u celim centima;
- preranu potvrdu prijema i preskakanje preuzimanja pre transporta;
- ovlašćenje superadministratora za dodelu dostave i zabranu dodele običnom vozaču.

U poslovnim HTTP testovima email, notifikacije, izrada računa i tovarnog lista zamenjeni su testnim servisima. U browser testu prijava koristi stvarnu proveru lozinke, a notifikacije stvarni servis i WebSocket gateway. Email, push i izrada PDF-a ostaju testne zamene. Stvarno slanje, PDF sadržaj, banka i fizički telefon nisu provereni.

## Provera kroz pregledač

`npm run test:browser` pokreće izolovanu bazu kroz pravi migracioni postupak, Nest test aplikaciju i lokalni Next server. Playwright upravlja Chromium-om i koristi isključivo testni nalog. Testni API koristi stvarne kontrolere i servise za prijavu, inventar, narudžbine i notifikacije; nije pokrenut ceo produkcioni AppModule sa svim pozadinskim poslovima.

Na oba viewport-a provereno je:

- prijava kroz formu partner kodom i lozinkom;
- prikaz proizvoda, dodavanje u korpu i povećanje količine na 2 kg;
- zaustavljanje potvrde kada adresa nije popunjena;
- unos adrese i kreiranje narudžbine od 5 EUR;
- prelazak na pregled narudžbina i očuvanje narudžbine posle osvežavanja;
- prikaz pune adrese i odsustvo horizontalnog izlaska stranice narudžbina van ekrana;
- odsustvo JavaScript izuzetaka, grešaka konzole i HTTP grešaka testnog API-ja.

Na kraju se direktno u PostgreSQL-u proveravaju obe narudžbine: vlasnik, proizvod, količina, cena, ukupni iznos, status PENDING i adresa. Proverava se i da nije kreirano plaćanje samim klikom na potvrdu narudžbine.

Spoljni zahtevi pregledača su blokirani. U uspešnom prolazu blokiran je samo Vercel analytics skript; njegova očekivana mrežna greška odvojena je od provere grešaka aplikacije. Test ne zamenjuje produkcione API odgovore lažnim podacima.

Browser provera je otkrila da pregled narudžbina čita staro polje `address`, a checkout šalje `street`. Lista i detalji sada prikazuju ulicu, poštanski broj, grad i državu, uz podršku starom formatu.

Snimci i JSON rezultat su lokalno u `backend/test-results/browser/` (ignorisano u git-u). CI dobija poseban `buyer-browser` posao koji pokreće istu komandu i čuva snimke i logove kao artifact. Udaljeni CI nije izvršen iz ove sesije.

## Greške reprodukovane i popravljene

Prvi prolaz imao je **12 neuspešnih od 19 testova**. Posle popravki tih 19 je prošlo. Dodatni testovi otkrili su još dve greške: gubitak jedne od dve paralelne isplate različitih narudžbina i oslobađanje plaćanja pre početka transporta.

1. **Nedovoljna validacija narudžbine.** Dodat je DTO, serversko pronalaženje proizvoda i cene i odbijanje nevažećih ulaza. Cena u checkout-u služi za proveru da kupac prihvata važeću cenu; ne određuje cenu u bazi. Kada se cena razlikuje, API vraća 409 umesto tihog menjanja iznosa.
2. **Escrow je ostajao upisan kada PAID upis padne.** Oba upisa sada su u istoj transakciji. Zaključavanje reda narudžbine serijalizuje potvrde; ponavljanje iste reference ne pravi novo plaćanje ni novi poziv izrade računa.
3. **Izgubljeno uvećanje salda.** Test je pokazao 17,5 umesto očekivanih 35 za dve narudžbine. `creditWalletTx` sada koristi atomski upsert i increment.
4. **Prerana potvrda i pogrešan redosled dostave.** Potvrda prijema zahteva IN_TRANSIT ili DELIVERED; početak transporta zahteva PICKED_UP.
5. **SUPER_ADMIN nije mogao dodeliti dostavu.** Popravljena provera uloga uz eksplicitno odbijanje običnog DRIVER naloga koji se drugde mapira na LOGISTICS_PARTNER.

Dodatno su zaštićeni upisi inventara od kupčevog kreiranja proizvoljne cene, usklađeno filtriranje aktivnih tržišnih cena i normalizovane relacije inventara pri prikazu kataloga. Raspodela plaćanja sada koristi cele cente; ostatak centi dodeljuje se najvećim razlomljenim udelima, a pri jednakim udelima redom proizvođaču, vozaču i platformi.

## Kompatibilnost klijenata

Web checkout, mobilni checkout i mobilna rezervacija sada šalju `productId` iz kataloga. Stari mobilni zahtevi bez tog polja ostaju podržani samo ako server može jednoznačno da pronađe proizvod iz naziva, jedinice i dostupnog podatka o imanju. Cena se i tada proverava prema bazi. Ako postoji više mogućih proizvoda, zahtev se odbija umesto da server nagađa. Ovo je pokriveno posebnim integracionim testovima.

Adresa zahteva ulicu, grad i državu. Poštanski broj ostaje opcionalan na API-ju radi kompatibilnosti starog modalnog prozora za rezervaciju; novi mobilni prozor ga traži, čuva i šalje. Nema deploymenta u ovoj fazi.

Narudžbine i dalje prolaze administratorsko odobrenje. Provera količine nije rezervacija zaliha: konkurentne narudžbine za istu robu još nisu rešene sistemom rezervacija. Testovi ne predstavljaju potvrdu svih ostalih poslovnih tokova.

## Rešeno: podizanje prazne baze

Direktno izvršavanje istorijskog niza migracija reprodukovalo je `P3018` / PostgreSQL `42P01`: migracija `20260203120000_logistics_drivers_pickup_proof` menja `missions` pre nego što je kasniji squash kreira.

Dodat je zamrznuti snapshot sa manifestom SHA-256 vrednosti. Deployment wrapper samo na praznoj šemi atomski primenjuje snapshot i beleži obuhvaćenu istoriju; potom standardni Prisma primenjuje nove migracije. Na postojećoj šemi ne menja početne podatke ni istoriju. Stari SQL fajlovi nisu prepravljani.

Četiri testa proveravaju checksum/evidenciju, očuvanje postojeće baze, paralelnu inicijalizaciju i buduću migraciju. Runner sada koristi pravi deployment postupak, a zatim proverava da nema razlike prema schema.prisma. Više ne koristi db push. Detalji: [backend/MIGRATIONS.md](../backend/MIGRATIONS.md).

Postojeća produkciona baza sa neuspelim migracijama zahteva zaseban pregled; ovim postupkom se ne popravlja automatski.

## Ponovno pokretanje

Iz `backend` direktorijuma:

```sh
npm test -- --runInBand
npm run test:integration
npm run test:migrations
npm run test:browser
npm run build
```

Za integracione i migracione testove potrebni su PostgreSQL binarni alati. Runner koristi `pg_config --bindir`, ili eksplicitno podešen PG_BIN. Ne prihvata postojeću aplikacionu bazu kao test odredište. HTTP i PostgreSQL testovi zahtevaju dozvoljeno lokalno otvaranje portova. Browser test dodatno zahteva instalirane web zavisnosti i Chromium (`cd ../web && npx playwright install chromium`). Test sa mobilnim viewport-om proverava web na uskom ekranu, ne Expo aplikaciju.

CI je proširen instalacijom PostgreSQL alata i pokretanjem integracionih testova. CI na udaljenom repozitorijumu nije pokretan iz ove sesije. Provera jednakosti šeme i migracioni testovi sada su uključeni u integracionu komandu koju izvršava CI.
