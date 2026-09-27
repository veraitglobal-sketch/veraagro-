# Stabilizacija mobilne aplikacije — 26.09.2026.

Ovaj pregled obuhvata prijavu/odjavu, korpu i slanje porudžbina. Nije potvrda ispravnosti cele aplikacije niti test na uređaju.

## Ispravljeno

- Korpa je računala sledeće stanje iz prethodnog React rendera, a menjala ga tek posle AsyncStorage upisa. Brzi dodiri su mogli da izgube izmene. Sada se stanje menja odmah, upisi idu redom, a dugmad +/− koriste trenutno stanje.
- Izmene tokom početnog učitavanja sačuvane korpe sada se primenjuju na učitane podatke. Osvežavanje ne vraća stariju kopiju preko novih izmena. Neispravne sačuvane stavke se filtriraju; starije stavke bez vrste dobijaju `purchase`.
- Pri slanju više stavki, svaka porudžbina koju server potvrdi uklanja svoju količinu iz korpe. Ako sledeća stavka ne uspe, prethodno potvrđene stavke se ne šalju ponovo iz iste korpe. Korisnik dobija obaveštenje o delimičnom uspehu.
- Checkout odbija obavezna polja koja sadrže samo razmake i blokira istovremena slanja. Napomena o rezervaciji pripada samo rezervisanoj stavci.
- Odjava push uređaja više ne koristi interceptor koji na 401 ponovo pokreće odjavu. Više istovremenih 401 odgovora deli jedan postupak odjave. Mrežno čekanje pri push odjavi ograničeno je na pet sekundi, pri prijavi na 25 sekundi po pokušaju.

## Provere

Iz `mobile/`:

```sh
npm test
npm run typecheck
# ili obe provere:
npm run check
```

Prolazi 18 regresionih testova i TypeScript provera. Testovi izvršavaju aplikacione module, uz memorijsku zamenu za AsyncStorage i kontrolisane mrežne odgovore. Provere AuthContext funkcija koriste zamene za React hookove; ne proveravaju React renderovanje i navigaciju na uređaju. Dodati su u postojeći mobile CI posao, bez novih zavisnosti.

## Otvorena ograničenja i sledeći pregled

- Za prekid veze nakon što server kreira porudžbinu, a pre nego što klijent primi potvrdu, potrebna je serverska idempotentnost. Ova izmena rešava ponavljanje već potvrđenih stavki, ne garantuje izostanak duplikata u tom mrežnom scenariju ili nakon neuspešnog upisa korpe na disk i ponovnog pokretanja aplikacije.
- Mapiranje uloga zahteva usklađivanje: `DRIVER` i `SUPER_ADMIN` trenutno nemaju odredište u `getPostLoginPath`. Za `DRIVER` treba proveriti i backend tok misija, gde se `LOGISTICS_PARTNER` proverava direktno. Samo otvaranje mobilnog ekrana ne rešava backend ovlašćenja.
- Sledeći funkcionalni pregled: proizvođačke parcele i serije, offline unosi i sinhronizacija, misije i primopredaja, zatim stvarni podaci na početnim ekranima.
- Testovi na iOS/Android uređaju ostaju neizvršeni. Prethodni pokušaj i ograničenja opisani su u [izveštaju simulatora](MOBILNI_SIMULATOR_2026-09-26.md).
