# Prva faza: zaštita naloga, uloga i plaćanja

Implementirano lokalno 26.09.2026. Nema deploymenta, promene produkcione baze ili migracije šeme.

## Promene ponašanja

- Pokretanje API-ja više ne kreira test korisnike. `CREATE_TEST_USERS` više ne uključuje seed pri pokretanju. Ručni `create:users` odbija izvršavanje osim kada je `NODE_ENV` eksplicitno `development` ili `test`; komanda se koristi samo sa zasebnom test bazom.
- ADMIN više ne prolazi provere koje zahtevaju isključivo SUPER_ADMIN. ADMIN ne može da kreira SUPER_ADMIN nalog, dodeli sebi tu ulogu ili izmeni postojeći SUPER_ADMIN nalog. Postojeća zaštita resetovanja njegove lozinke ostaje na snazi.
- Generisane privremene lozinke koriste `crypto.randomInt`.
- Autentifikovani HTTP zahtevi učitavaju aktuelni status i uloge korisnika iz baze. Obrisani i neaktivni korisnici dobijaju 401; uklonjene uloge ne ostaju važeće kroz stare JWT tvrdnje. Ovo dodaje jedan upit po autentifikovanom HTTP zahtevu. Ne uvodi opoziv tokena pri promeni lozinke niti prekid već otvorenih WebSocket veza.
- `GET /payments/order/:orderId` filtrira zapis prema vezi sa korisnikom: kupac, vlasnik imanja narudžbine, vlasnik imanja koje izvršava narudžbinu ili dodeljeni vozač. ADMIN/SUPER_ADMIN imaju operativni pristup. Neovlašćeno čitanje vraća 404 bez detalja plaćanja.
- `POST /payments/order/:orderId/release` zahteva ADMIN ili SUPER_ADMIN. Postojeće provere stanja dostave i plaćanja u servisu ostaju. Interni pozivi iz toka potvrde dostave nisu menjani.
- Stari kupčev `POST /orders/:id/pay` sada vraća 403 sa objašnjenjem da uplatu potvrđuje Vera nakon prijema bankovnog transfera. Ne kreira escrow, ne menja status narudžbine i ne generiše račun. Administratorski `confirm-bank-payment` ostaje raspoloživ. U pregledanim web/mobile ekranima nije pronađen poziv ovog starog kupčevog metoda; definicija u web API klijentu ostaje radi kompatibilnosti.

## Provera

- `npm test -- --runInBand` u backend direktorijumu: **35 testova prolazi, 5 test paketa**.
- Testovi pokrivaju granice uloga, podizanje prava kroz upravljanje korisnicima, zastarele JWT tvrdnje, neaktivne/obrisane naloge, zabranu kupčeve potvrde uplate i HTTP zaštitu payment ruta.
- HTTP testovi koriste privremeni port na `127.0.0.1`, test ključ i mock podatke; ne pristupaju stvarnoj bazi ni platnim servisima.
- Backend TypeScript provera i `npm run build`: uspešno.
- Ručno pokretanje seed komande sa `NODE_ENV=production` i nevažećom test adresom baze: očekivano odbijeno pre kreiranja Prisma klijenta.
- Backend CI sada izvršava testove pre builda. Jest ne zavisi od lokalnog Watchman servisa.
- Provera whitespace grešaka prolazi za menjane backend i CI fajlove.

## Pre objavljivanja i naredna faza

Ova izmena ne uklanja već kreirane produkcione test naloge. Njih treba proveriti i deaktivirati ili bezbedno zameniti uz potvrđen pristup stvarnog superadministratora. Produkcioni nalozi nisu pregledani ni menjani.

Sledeća faza je validacija količine i merodavne cene na serveru, transakciona pouzdanost potvrde bankovne uplate, testovi idempotentne isplate i kompletan tok isporuke na izolovanoj bazi. Ovi delovi nisu predstavljeni kao rešeni ovom izmenom. Ovo je ciljano zatvaranje nalaza iz prve faze, ne potpuna bezbednosna revizija svih API ruta.
