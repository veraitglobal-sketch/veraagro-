# Provera mobilne aplikacije u iOS simulatoru — 26.09.2026.

Okruženje: iPhone 15, iOS 17.0, Expo Go 54.0.6, lokalni Metro; API `https://api.biovera.app`. Korisnik je prijavljen kao proizvođač.

Ekrani su otvarani preko Expo Router putanja i provereni na snimcima simulatora. Privremeni Axios interceptor beležio je samo putanje i HTTP statuse; uklonjen je po završetku. Ovo nije provera fizičkih pritisaka na svako dugme niti kompletan test slanja obrazaca.

| Provera | Rezultat |
| --- | --- |
| Lista lotova | Učitano 10 lotova; API 200. |
| Detalj i sledljivost lota BATCH-2026-1253 | Osnovni podaci i sledljivost učitani; API 200. |
| Veze lota sa berbom i prevozom | **Ne radi:** `/batches/:batchId/workflow` vraća 404 i `Cannot GET`, i za oznaku lota i za UUID. |
| Lista i detalj transporta | Lista od 13 misija i detalj jedne misije učitani; API 200. Putanja, finansijski status i povratne informacije takođe 200. |
| Njive i dnevnik rasta | Četiri gazdinstva, parcele i najave berbe učitani; API 200. Izabrana parcela nema unose dnevnika. |
| Pakovanje | Izbor lota i prvi korak sa uputstvom prikazani; provera materijala 200. Fotografisanje i slanje nisu testirani. |
| Kreiranje transporta | Prosleđeni lot pravilno izabran; slanje onemogućeno bez potrebnih podataka. Obrazac nije poslat. |
| Povrati robe | **Ne radi:** `/delivery-returns` vraća 404; ekran prikazuje `Cannot GET /delivery-returns`. |
| GPS | Dozvola `undetermined`; lokacija nije očitana niti poslata. Tačnost nije potvrđena. |

Zabeležen je 21 API odgovor: 18 sa statusom 200 i tri sa statusom 404 (dve provere workflow rute i jedna povrata). Uspešno učitavanje ne potvrđuje ispravnost celog poslovnog procesa.

Workflow ruta postoji u lokalnom backend kontroleru, ali je testirani server ne izlaže. Sledeći korak je proveriti verziju i registraciju ruta aktivnog backend-a i uskladiti ga sa mobilnom aplikacijom, pa ponoviti ove dve neuspešne provere. Produkcija nije menjana niti je urađen deployment. Nisu slati poslovni obrasci, menjane porudžbine ili uplate. Simulator i Metro ostavljeni su uključeni, aplikacija na listi lotova.
