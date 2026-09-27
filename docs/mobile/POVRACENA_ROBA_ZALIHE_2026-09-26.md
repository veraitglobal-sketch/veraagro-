# Prijem povrata → kontrola robe → odluka / fizički popis — 26.09.2026.

Naknadno povezivanje porudžbine sa rezervacijom i izlazom robe završeno je u [sledećem koraku](PORUDZBINA_REZERVACIJA_OTPREMA_2026-09-26.md). Opis ispod beleži stanje pre tog povezivanja.

Nastavak [finansijskog usaglašavanja](FINANSIJSKO_USAGLASAVANJE_2026-09-26.md). Fizičko postupanje sa robom sada ima svoj tok, nezavisan od refundacije novca.

## Važan nalaz u postojećem modelu

`OrdersService.create` proverava cenu i dostupnu količinu kataloga, ali ne knjiži izlaz/reservaciju robe i ne čuva pouzdanu vezu izabranog kataloškog zapisa kroz `order_items`. `InventoryService.reserveInventory` postoji, ali nema poziva iz porudžbine/otpreme. Zato **nije bezbedno automatski dodati količinu povrata na trenutno stanje zalihe**: ono možda nikada nije umanjeno.

Ovaj korak ne prikriva tu prazninu. Vraćena roba je zasebna evidencija; odobrenje prodaje zahteva fizički popis **ukupne raspoložive količine** na izabranoj zalihi. Primer: ako je u bazi već 100 kg, a stvarno je izbrojano 100 kg uključujući odobreni povrat od 10 kg, novi upis je 100 kg, a ne 110 kg. Popis može i smanjiti prethodno netačno stanje; mora obuhvatiti ceo izabrani zapis zalihe.

**Rezervacija i izlaz robe po porudžbini/otpremi, povezivanje sa konkretnom zalihom i oslobađanje rezervacija pri otkazu ostaju sledeći neophodan tok.** Ovaj rad ne rešava prekomernu prodaju kod istovremenog kreiranja običnih porudžbina.

## Ko radi i gde podatak završava

| Korak | Akter / ekran | Sačuvan rezultat |
| --- | --- | --- |
| Prijem cele pošiljke na farmi | Proizvođač ili administrator, postojeći tok povrata | `RECEIVED`; roba čeka odluku u `QUARANTINED`, bez automatskog povećanja prodajne zalihe. |
| Nova kontrola | ADMIN/SUPER_ADMIN, `/admin/returns` → postupanje sa robom | Količina i originalna jedinica mere, 2–6 fotografija, nalaz, autor i datum u `return_dispositions`. |
| Zadržavanje u karantinu | Administrator | Novi nepromenljiv zapis kontrole; stanje ostaje `QUARANTINED` i kasnija kontrola je moguća. |
| Otpis | Administrator | Konačno `WRITTEN_OFF` za celu izdvojenu povratnu pošiljku; stare kontrole ostaju dostupne. |
| Odobrenje prodaje uz popis | Administrator | Konačno `RESTOCKED`; vezan zapis zalihe, prethodna i popisana količina, prethodni i potvrđeni rok. Stanje zalihe postaje potvrđena ukupna količina. |
| Pregled | Mobilni povrati proizvođača/prevoznika, mobilni i web pregled kupčeve dostave | Status odluke; učesnici povrata vide poslednji nalaz. Fotografije se otvaraju na zahtev. |

Administrativna odluka o robi ne potvrđuje refundaciju i ne menja salda. Finansijski i robni tok dele istu dostavu/povrat, ali imaju nezavisne revizije i pravila.

## Odobrenje prodaje i trag promene zalihe

Za upis `RESTOCK` obavezni su:

- već potvrđen fizički prijem cele pošiljke i tačna količina/jedinica iz porudžbine;
- nalaz i fotografije kontrole, uz izričitu potvrdu kvaliteta cele pošiljke;
- postojeća zaliha iste farme, proizvoda i jedinice, čiji vlasnik odgovara evidentiranom primaocu povrata;
- potvrda da se roba fizički nalazi na lokaciji izabranog skladišnog zapisa; ne pretpostavlja se da je farma automatski lokacija huba;
- fizički prebrojana ukupna prodajna količina, uključujući ovu odobrenu pošiljku i isključujući ostalu robu iz karantina/otpisa;
- budući potvrđeni rok upotrebe, koji ne produžava postojeći rok zalihe;
- nepromenjena prethodna količina i vreme poslednje izmene zalihe.

Zaliha mora biti `AVAILABLE` ili prazna `RESERVED`. Roba u transportu, već raspoređena, prodata ili istekla ne može se otvoriti ovim putem. Ako odgovarajuća zaliha ne postoji, ne pravi se proizvoljan novi zapis: potrebna je operativna korekcija evidencije, a povrat ostaje u karantinu.

Upis zaključava povrat, pa zalihu. Popis, odluka, stanje povrata i audit upisuju se u jednoj transakciji. Ponovljeni isti zahtev vraća raniji zapis bez novog knjiženja; drugačiji zahtev iste revizije ili iz zastarelog prikaza vraća konflikt. Dva popisa sa istom verzijom zalihe ne mogu oba tiho uspeti.

Servis rezervacije sada takođe zaključava zalihu i ažurira vreme izmene, pa rezervacija i popis ne mogu izgubiti međusobne izmene. Ovo unapređuje postojeći servis, ali ga još ne povezuje sa kreiranjem porudžbine. Katalog više ne prikazuje stvarni skladišni zapis sa nultom količinom ili isteklim rokom kao raspoloživu zalihu; raniji zasebni fallback katalozi lotova/tržišnih cena nisu redizajnirani.

## API, dokazi i granice

- `GET /delivery-returns/:id/disposition`: administrativni pregled istorije i do 200 odgovarajućih zapisa zalihe.
- `POST /delivery-returns/:id/disposition`: administrativna kontrola i odluka za celu pošiljku.
- `GET /delivery-returns/:id/disposition/:decisionId/evidence`: dokaz pojedinačne kontrole, dostupan samo administratoru i učesnicima te dostave. ID kontrole mora pripadati prosleđenom povratu.

Lista povrata i istorija ne učitavaju slike. Web otvara fotografije svake kontrole pojedinačno; mobilni pregled dokaza učitava i najnoviju kontrolu. Fotografije se proveravaju/dekodiraju i čuvaju kao sadržaj, ne kao putanja sa telefona. Poslednji nalaz, vreme i stanje ostaju dostupni po ponovnom otvaranju.

- Kontrola važi za celu pošiljku. Delimičan otpis, razvrstavanje po stavkama/lotovima i mešovita odluka nisu uvedeni.
- Otpis evidentira postupanje sa **izdvojenom vraćenom robom**. Ne oduzima proizvoljno količinu iz postojećeg kataloga bez dokaza prethodnog izlaza. Ako stari prodajni saldo već uključuje tu robu, neophodan je zaseban popis/ispravka zalihe. Obrazac to izričito objašnjava.
- Potvrda kvaliteta je odluka administratora sa dokazima, ne automatska laboratorijska potvrda. Otpis ne znači da je sistem fizički uništio robu ili izdao potvrdu o uništenju.
- Popis postavlja ceo saldo izabranog zapisa i može ga smanjiti; ne predstavljati razliku u popisu kao dokaz originalnog izlaza konkretne porudžbine.
- Raniji `RECEIVED` povrati migracijom dobijaju stanje čekanja/karantina. Stare odluke o robi nisu pretpostavljene.
- Konačni otpis/odobrenje prodaje ne prepisuju se ovim API-jem. Korektivni postupak, skladišna glavna knjiga, zasebno usaglašavanje proizvoljne zalihe i garantovane notifikacije nisu uvedeni.

## Migracija i provere

Migracija [20260926220000_return_disposition](../../backend/prisma/migrations/20260926220000_return_disposition/migration.sql) dodaje stanje/reviziju postupanja i istoriju kontrola, vezu ka zalihi i provere akcija/količina. Istorijski snapshot nije menjan. Za objavljivanje prvo primeniti migracije, zatim backend i ažurirane klijente.

Produkcija nije menjana niti je izvršen deployment.

Provere:

- Backend integracioni set: **103 prošla testa, jedan browser test namerno preskočen**. Jedanaest novih proba pokriva ovlašćenja i fizički prijem, neispravne dokaze, istoriju karantina/otpisa, idempotentan popis, obavezne potvrde i rok, farmu/proizvod/jedinicu/status zalihe, istek roka, zastareli popis, dva konkurentna povrata, transakcioni rollback i konkurentnu rezervaciju. Završna proba zastarelog popisa uključuje i serverov istorijski Float zapis sa sitnim decimalnim odstupanjem.
- Mobile `npm run check`: **44 testa prošla**, TypeScript prošao; nakon izdvajanja pojedinačnih fotografija kontrola TypeScript ponovo prošao.
- Backend build i web TypeScript: prošli.
- Nova migracija na praznoj testnoj bazi prošla; Prisma poređenje: **No difference detected**.
- `npm run check:repo` i `git diff --check` za izmenjeni obim: prošli.

Novi ekran nije vizuelno testiran u browseru/iOS simulatoru. HTTP testovi koriste stvarne JWT kontrolere, obradu slika, servise i privremeni PostgreSQL; spoljne notifikacije i generatori dokumenata ostaju test zamene.

Izvori: [servis kontrole](../../backend/src/deliveries/return-disposition.service.ts), [administrativni obrazac](../../web/components/returns/ReturnDisposition.tsx), [mobilni povrati](../../mobile/features/returns/ReturnsScreen.tsx), [servis zalihe](../../backend/src/inventory/inventory.service.ts), [HTTP testovi](../../backend/test/orders.integration-spec.ts).
