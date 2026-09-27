# Povrat robe → prijem na farmi → evidencija refundacije — 26.09.2026.

Nastavak [misije, dostave i odluke o reklamaciji](MISIJA_DOSTAVA_REKLAMACIJA_2026-09-26.md). Implementiran je povrat **cele pošiljke** i evidencija **punog bankarskog povraćaja** za jednu dostavu/porudžbinu.

## Gde informacija ide

| Korak | Ko radi | Gde se čuva i šta otvara |
| --- | --- | --- |
| Odluka o reklamaciji | Administrator na `/admin/delivery-issues` | Prihvaćena reklamacija ili spor sa odlukom `RETURN_REQUIRED` omogućava nalog za povrat. |
| Nalog za povrat | Administrator unosi adresu prijema i uputstvo | `delivery_returns` vezuje odluku, dostavu, originalnog prevoznika i vlasnika farme; jedan povrat po dostavi. |
| Preuzimanje kod kupca | Dodeljeni prevoznik, mobilni meni **Povrati** | `PLANNED → COLLECTED`, najmanje dve fotografije, beleška i potvrda cele pošiljke; čuvaju se autor i vreme. |
| Prijem na farmi | Vlasnik farme, mobilni profil → **Povrati** | `COLLECTED → RECEIVED`, zaseban dokaz i beleška; otvara mogućnost odobrenja refundacije. |
| Odobrenje refundacije | Administrator na `/admin/returns` | `delivery_refunds.APPROVED`, tačan pun iznos sa uplate u centima, razlog i audit. Novac još nije označen kao vraćen. |
| Izvršeni bankarski povraćaj | Administrator nakon stvarnog transfera van aplikacije | Referenca transfera, datum, slika dokaza i potvrda iznosa. Refundacija `CONFIRMED`, uplata i porudžbina `REFUNDED` u istoj transakciji. |
| Pregled kupca | Mobilni detalj porudžbine/dostave i web dostave | Status fizičkog povrata, status refundacije i iznos iz istih zapisa. Bankarski dokaz ostaje dostupan samo administratoru. |

Administrator može evidentirati fizičko preuzimanje/prijem kroz isti pregled, uz iste obavezne dokaze. Mobilni ekran prikazuje akciju samo dodeljenom učesniku u odgovarajućem koraku. Povrat ne prepisuje istorijski status izlazne dostave niti izmišlja novu transportnu misiju.

## Zaštita upisa

- JWT i provera uloge za administraciju; server proverava dodeljenog prevoznika/primaoca za fizičke korake. Lista i dokazi povrata dostupni su kupcu i učesnicima te dostave. Tuđi zapisi nisu dostupni preko promene ID-a.
- Revizija štiti od zastarelog obrasca. Zaključavanje redova i jedinstveni ključevi sprečavaju dupli nalog/refundaciju pri istovremenim zahtevima. Ponovljen završen fizički korak vraća originalni zapis i datum, bez prepisivanja prvobitnog dokaza.
- Fotografije se dekodiraju i čuvaju kao sadržaj, ne kao putanja sa telefona. Liste ne prenose slike; učitavaju se na zahtev. Bankarska referenca i dokaz nisu deo javnog sažetka refundacije.
- Puna količina mora biti izričito potvrđena pravom boolean vrednošću `true`; tekst `"false"` se ne pretvara u potvrdu. Prazne beleške/adrese/razlozi ne prolaze validaciju.
- Odobrenje refundacije i redovna escrow isplata zaključavaju isti red uplate. Odobrena refundacija sprečava novu raspodelu escrow sredstava.
- Bankarska potvrda mora odgovarati odobrenom iznosu/valuti; datum ne sme prethoditi minutu odobrenja niti biti više od pet minuta u budućnosti. Referenca je jedinstvena među refundacijama. Ponovljena identična potvrda vraća isti zapis; druga referenca ili datum ne prepisuju izvršeni povraćaj.
- Refundacija, status uplate, status porudžbine i audit potvrde upisuju se zajedno. Greška vraća sve promene. Ručni administrativni izbor statusa više ne može postaviti `REFUNDED` niti ponovo otvoriti refundiranu porudžbinu.

## Važne granice

**Aplikacija ne izvršava bankarski transfer.** Ovaj tok odobrava refundaciju i čuva potvrdu transfera koji je administrator izvršio van aplikacije. Jedinstvena referenca štiti evidenciju; ne može sprečiti pogrešan dupli transfer napravljen direktno u banci.

Ako je uplata već raspodeljena (`RELEASED`), čuva se `reconciliationRequired=true`. Administrator vidi upozorenje da sredstva proizvođača, prevoznika i platforme zahtevaju usaglašavanje. Originalni wallet krediti i stanja se ne brišu i ne zadužuju automatski. **Naplata od primalaca, odluka ko snosi trošak i zatvaranje tog usaglašavanja ostaju sledeći finansijski korak.**

- Podržan je pun povrat u EUR, u skladu sa postojećim prikazom plaćanja. Postojeće porudžbine/uplate nemaju zasebnu valutu; više valuta i migracija istorijskih valuta nisu rešeni ovim korakom.
- Delimičan povrat, količine po stavci, zamena robe, promena dodeljenog prevoznika i posebna povratna transportna misija nisu uvedeni.
- Prijem vraćene robe ne povećava prodajnu zalihu automatski. Provera upotrebljivosti/oštećenja i dalja odluka o robi ostaju operativni posao.
- Nalozi su dostupni kroz nove menije i osvežavanje podataka. Posebne push/email notifikacije za povrat, garantovana dostava obaveštenja i web obrasci za prevoznika/proizvođača nisu dodati. Web administrator može evidentirati oba fizička koraka.
- Pregled je ograničen na poslednjih 200 naloga; nema paginacije niti automatskog zatvaranja finansijskog usaglašavanja.

Tokom testiranja otkriven je i ispravljen raniji konflikt: dva prva zahteva za transport istog proizvođača mogla su istovremeno napraviti početni saldo ambalaže. Inicijalizacija sada koristi upis koji preskače postojeći jedinstveni zapis, a zatim čita sačuvano stanje; postojeće količine se ne resetuju.

## Migracija i provera

Nova migracija: [20260926180000_delivery_returns_refunds](../../backend/prisma/migrations/20260926180000_delivery_returns_refunds/migration.sql). Dodaje povrat i refundaciju sa vezama, jedinstvenim ključevima i proverom jednog izvora odluke. Istorijski snapshot nije menjan. Za objavljivanje prvo primeniti migracije, zatim backend i ažurirane klijente.

Produkcija nije menjana, deployment nije izvršen i stvarni novac nije pomeran.

Provere obuhvataju HTTP kontrolere sa pravim JWT-om, stvarnu lokalnu PostgreSQL bazu, obradu slika, prava pristupa, konkurentne zahteve, blokadu escrow raspodele, rollback potvrde, privatnost bankarskog dokaza i očuvanje već knjiženih sredstava. Poseban test namerno dovodi dva čitanja salda ambalaže u stanje „zapis ne postoji“, da bi konflikt bio ponovljiv. Spoljni servisi za notifikacije, dokumente i blockchain ostaju test zamene.

Završne provere:

- Backend `npm run test:integration`: **81 prošao, jedan browser test namerno preskočen**. Jedanaest novih testova pokriva povrat/refundaciju i konkurentnu inicijalizaciju salda ambalaže.
- Mobile `npm test`: **43 prošla**. Dve nove probe proveravaju prava i redosled povrata, kao i skrivanje prijema kupca za robu sa nalogom za povrat.
- Backend build, web i mobile TypeScript: prošli.
- Migracije na novoj privremenoj bazi: prošle; poređenje Prisma šeme: **No difference detected**.
- Provera higijene repozitorijuma i `git diff --check` za izmenjeni obim: prošle.

Novi ekrani nisu vizuelno provereni u browseru ili iOS simulatoru; logički/API testovi nisu zamena za taj prolaz.

Izvori: [servis](../../backend/src/deliveries/returns.service.ts), [admin pregled](../../web/app/admin/returns/page.tsx), [mobilni povrati](../../mobile/features/returns/ReturnsScreen.tsx), [HTTP testovi](../../backend/test/orders.integration-spec.ts), [testovi mobilne logike](../../mobile/test/delivery-flow.test.cjs).

Nastavak: [finansijsko usaglašavanje već raspodeljenih sredstava](FINANSIJSKO_USAGLASAVANJE_2026-09-26.md). Opis otvorenog finansijskog koraka iznad važi za stanje pre tog nastavka.
