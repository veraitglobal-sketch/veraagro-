# Primopredaja → prijem kupca → prijava problema — 26.09.2026.

Nastavak funkcionalne analize: A10 (navigacija), A12 (dokazi) i deo A11 (kupčev nastavak isporuke).

Kasniji nastavak: [direktna veza misije i dostave, obrada i odluka o reklamaciji](MISIJA_DOSTAVA_REKLAMACIJA_2026-09-26.md). Granice ispod opisuju stanje pre tog nastavka.

## Put podatka

| Radnja | Trajni zapis | Ko dobija nastavak |
| --- | --- | --- |
| Vozač pokreće primopredaju postojeće dostave | `digital_handovers.deliveryId` | Kupčevo obaveštenje otvara `/manager/handover-complete` sa istim `handoverId` |
| Kupac fotografiše robu, unese temperaturu i potpiše prihvat | Slike i potpis u `digital_handovers`; status dostave i porudžbine u istoj transakciji | Kupac vidi sačuvane dokaze i može da potvrdi preuzimanje |
| Kupac označi oštećenje pri primopredaji | `digital_handovers.status = DISPUTED` i jedan `disputes` zapis sa fotografijama | Administracija vidi spor; potvrda preuzimanja blokirana, uključujući stari QR ulaz |
| Kupac potvrdi preuzimanje | `deliveries.buyerPickupConfirmedAt`, `CONFIRMED`; postojeći escrow/wallet obračun | Kupčev ekran prikazuje vreme prijema i rok za prijavu |
| Kupac prijavi problem u naredna 24 sata | `buyer_delivery_issues`, opis i fotografije povezani sa dostavom i kupcem | Kupac ponovo učitava prijavu; ADMIN/SUPER_ADMIN je čita na `/admin/delivery-issues` |
| Obaveštenje za utovar/potpis misije | Sačuvan `missionId` u parametrima navigacije | Logistički ekran dobija konkretnu misiju, bez gubitka ID-ja u resolveru |

Detalj kupčeve porudžbine sada prikazuje postojeći `shipmentTracking` i zajednički panel dostave. Novi mobilni `/delivery/[id]` otvara se iz obaveštenja koja nose **deliveryId**, dok detalj porudžbine ostaje zasnovan na **orderId**. Različiti identifikatori se ne zamenjuju.

## Dokazi, ponavljanje i pristup

- Kamera šalje sadržaj datoteke kao data URL. Backend dekodira sliku, odbacuje lokalne i udaljene putanje i neispravne slike, uklanja metapodatke ponovnim kodiranjem i čuva samostalni sadržaj u PostgreSQL. Fotografije su JPEG, potpis PNG. Najviše šest fotografija; limit po slici je 1,8 MB i 20 miliona dekodiranih piksela. Primopredaja zahteva najmanje dve fotografije (mobilni obrazac četiri); prijava problema najmanje jednu.
- Ovo koristi postojeća polja baze i ne zavisi od javnog URL-a niti od opstanka lokalne datoteke na telefonu. Veći obim dokaza povećava bazu i veličinu odgovora; izdvajanje u privatno skladište sa kontrolisanim pristupom ostaje kasnija optimizacija. Stare `file://` adrese se ne mogu retroaktivno pretvoriti u fotografije.
- Čitanje primopredaje dozvoljeno je povezanom kupcu, dodeljenom vozaču i administratoru. Završavanje je ograničeno na kupca porudžbine i administratora. Kupčeva dostava proverava vlasništvo; administrativni dokazi imaju posebnu kontrolu uloge.
- Paralelni početak primopredaje upisuje jednu primopredaju po dostavi. Završavanje koristi transakciju i zaključavanje reda: ponavljanje vraća postojeći zapis, ne duplira spor i ne menja datum završetka. Greška promene dostave vraća i upis dokaza.
- Potvrda preuzimanja čuva prvi datum; ponavljanje ne produžava rok i ne duplira wallet knjiženja. Ista prijava sa istim opisom i fotografijama u okviru roka vraća isti ID, i pri istovremenim zahtevima. Različita prijava ostaje poseban zapis.
- Administrativni pregled učitava metapodatke poslednjih 100 prijava i 100 sporova, a slike tek na zahtev. Sačuvani podaci su dostupni i kada spoljašnja notifikacija ne uspe; slanje notifikacija nema trajni red za ponavljanje.

## Granice ovog koraka

- Misijska primopredaja `logistics_handovers` i kupčeva primopredaja `digital_handovers` ostaju različiti zapisi. Nije uvedeno automatsko povezivanje svake misije sa kupčevom porudžbinom i `deliveries`. Ovaj nastavak radi za već povezanu/dodeljenu dostavu; kraj celog lanca od plana do kupca još nije proglašen završenim.
- Administracija sada može da **pregleda** problem i dokaze. Nisu dodati dodela reklamacije operateru, odgovor kupcu, odluka, refundacija ili status zatvaranja `buyer_delivery_issues`. To je naredni poslovni korak A11.
- Zadržano je postojeće pravilo obračuna: kupčeva potvrda preuzimanja oslobađa escrow, a prijava problema sama ne menja novac. Interfejs to objašnjava pre potvrde. Testovi proveravaju lokalno knjiženje; nema poziva stvarnom platnom servisu.
- Postojeća provera `STORE-` QR prefiksa nije potvrda stvarnog identiteta prodavnice. Nepovezani stari QR tok bez digitalne primopredaje ostaje podržan. Matrica mobilnih uloga DRIVER/SUPER_ADMIN iz A13 nije rešena ovim korakom.
- PDF potvrda je pomoćni postojeći mehanizam; njen neuspeh više ne poništava uspešan odgovor o sačuvanoj primopredaji. Distribucija/trajno skladištenje PDF-a i garantovano naknadno izvršavanje blockchain/batch/notifikacionih efekata nisu rešeni ovde.

## Provere

- `npm run test:integration` u backendu: **58 prošlo, 1 namerno preskočen browser test**. Deset novih proba pokriva ovaj nastavak, uključujući konkurentne zahteve, ponovno čitanje slika, zabranu tuđeg pristupa, neuspeh transakcije, PDF grešku, QR zaobilaženje, rok i neduplo knjiženje. Runner primenjuje migracije na praznu lokalnu bazu i potvrđuje odsustvo razlike prema Prisma šemi.
- `npm test` u mobile: **39 prošlo**, od toga sedam novih proba ID-jeva navigacije, stanja prijema/roka i pretvaranja lokalnih slika u sadržaj.
- Backend build, mobilni i web TypeScript i `npm run check:repo`: prošli. `git diff --check` za ovaj obim je čist; globalna provera i dalje prijavljuje ranije završne razmake u `web/public/llms-full.txt`, koji nije deo ovog rada.

Testovi mobilne logike nisu test kamere, potpisa ili navigacije na fizičkom uređaju. Administrativni web ekran proveren je TypeScript proverom; vizuelna/prolazna browser proba ovog novog ekrana nije izvršena.

HTTP integracione probe koriste stvarne kontrolere, JWT, validaciju, obradu slika, servise isporuke/primopredaje/plaćanja i izolovani PostgreSQL. Notifikacije, blockchain, batch efekti i normalno generisanje PDF-a su zamenjeni test servisima. Posebna proba ubrizgava PDF grešku.

Nema nove migracije u ovom koraku. Prethodna migracija veze plana i lota ostaje potrebna za celokupan radni skup. Produkcija nije menjana, niti je objavljen mobilni build.

Izvori: [mobilni panel dostave](../../mobile/features/buyer/delivery/BuyerDeliveryPanel.tsx), [primopredaja](../../backend/src/digital-handover/digital-handover.service.ts), [dostave](../../backend/src/deliveries/deliveries.service.ts), [administrativni pregled](../../web/app/admin/delivery-issues/page.tsx), [HTTP testovi](../../backend/test/orders.integration-spec.ts), [mobilni testovi](../../mobile/test/delivery-flow.test.cjs).
