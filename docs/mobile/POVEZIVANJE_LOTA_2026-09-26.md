# Povezivanje lota sa pakovanjem, kvalitetom i transportom — 26.09.2026.

Implementiran je navigacioni deo nalaza A06 iz [funkcionalne analize](FUNKCIONALNA_MAPA_2026-09-26.md), uz čitanje sačuvanog zapisa pakovanja. Ovo nije potvrda da je ceo poslovni lanac aplikacije završen.

## Šta je promenjeno

- Detalj lota ima direktne ulaze u pakovanje, kvalitet, nalepnice/kontrolne fotografije i zahtev za transport. Svaki ulaz prenosi isti interni ID lota.
- Pakovanje otvoreno iz menija prvo traži izbor lota. Link sa javnim BATCH kodom razrešava se u interni ID. Nepostojeći ili trenutno nedostupan lot prikazuje poruku; drugi lot se ne bira prećutno.
- Sačuvano pakovanje nudi nastavak u kvalitet ili povratak na detalj. Server u traceability odgovoru vraća interni ID i datum poslednjeg zapisa pakovanja iz audit evidencije. Detalj se ponovo učitava kada dobije fokus.
- Sačuvan kvalitet vodi u nalepnice i kontrolne fotografije istog lota. Postojeći završen/verifikovan unos ima isti nastavak. Greška čitanja kvaliteta blokira uređivanje i nudi ponovni pokušaj.
- Završene kontrolne fotografije nude zahtev za transport istog lota. Povratak iz transporta radi dopune fotografija takođe nosi ID. Posle kreiranja zahteva otvara se detalj dobijene misije.
- Zakasneli odgovori za kvalitet i kontrolne fotografije, kao i rezultat kamere za prethodni lot, ne popunjavaju novi lot. Detalj ne prikazuje prethodni lot pod novom rutom.
- Greška `batchesAPI.getAll` više nije pretvorena u uspešnu praznu listu; ekran pakovanja može ponuditi ponovni pokušaj, a postojeći cache čitači mogu ući u svoju granu oporavka. Ostali slučajevi iz A16 ostaju otvoreni.

## Gde informacija ide

| Korak | Postojeći zapis i čitanje | Nastavak uveden ovom izmenom |
|---|---|---|
| Izbor lota | `GET /batches`; interni `batches.id` i javni `batchId` | Isti interni ID kroz naredne ekrane |
| Provera pakovanja | `POST /batches/:id/packing-flow` → `audit_trails`, izvor `mobile_packing_flow`; fotografije čuva postojeći mehanizam | Kvalitet; datum zapisa ponovo dostupan kroz `GET /batches/:id/traceability` |
| Kvalitet | `POST /quality-entry` → `quality_entries` i postojeći audit/status; `GET /quality-entry/batch/:id` | Nalepnice i kontrolne fotografije istog lota |
| Kontrolne fotografije | `POST /material-control/compliance-photos` → `compliance_photos` i postojeća obrada nalepnica; `GET /material-control/compliance-status/:id` | Zahtev za transport istog lota |
| Transport | `POST /missions` → postojeća misija, koju preuzima logistički tok | Detalj vraćenog `mission.id` |

Pravila odobravanja kvaliteta, materijala i transporta ostaju na postojećem backendu. Zapis pakovanja nije nova potvrda odobrenja kvaliteta. Nema promene šeme baze ni migracije; traceability dobija dodatna polja.

## Izvršene provere

- `npm run check --prefix mobile`: **28 testova prošlo**, zatim TypeScript provera prošla. Deset novih testova pokriva izbor lota, javni kod, promenu rute, nedostupan lot, stvarne callback funkcije navigacionih dugmadi, propagaciju mrežne greške, zakasnele odgovore i prikaz sačuvanog pakovanja.
- `npm test --prefix backend -- --runInBand batches.workflow.spec.ts`: **4 testa prošla**. Upis/čitanje zapisa sa oba identifikatora, odsustvo zapisa, poslednji zapis odvojen od drugih kvalitetnih provera i zabrana upisa za tuđeg proizvođača/nepoznat lot.
- `npm run build --prefix backend`: prošao.

Mobilni testovi izvršavaju aplikacione module uz zamene za native UI, rutiranje i API. Serverski testovi koriste zamenu za Prisma skladište. To nisu HTTP/PostgreSQL integracioni testovi niti E2E proba na uređaju. Kamera, GPS, stvarni upload fotografija, Expo navigacija i dalji rad logistike nisu ponovo provereni ovom izmenom. Produkcija nije menjana.

## Šta ostaje otvoreno

Naknadno je implementiran [nastavak A07](PLAN_LOT_MISIJA_2026-09-26.md). Istorijski sledeći prekid pri pisanju ovog izveštaja bio je A07: plan berbe nije trajno vezan za nov lot, a neuspeh kreiranja pripadajuće misije može ostati samo u logu. Potrebno je povezati plan → lot → misiju i obezbediti vidljiv, ponovljiv oporavak. Današnja izmena rešava prenos konteksta već postojećeg lota, ne ovu vezu nastanka lota. Nalazi A01–A05 i A08–A15 ostaju zasebni poslovi.

Izvori: [izbor lota](../../mobile/hooks/useWorkflowBatchSelection.ts), [navigacija](../../mobile/lib/batch-workflow.ts), [pakovanje](../../mobile/features/grower/packing-flow/PackingFlowScreen.tsx), [server](../../backend/src/batches/batches.service.ts), [mobilni testovi](../../mobile/test/batch-workflow.test.cjs), [serverski testovi](../../backend/src/batches/batches.workflow.spec.ts).
