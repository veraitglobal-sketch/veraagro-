# Povezivanje custom domena `api.biovera.app` sa backendom

Ako u Railway-u vidiš **api.biovera.app** kao "Online", ali zahtevi ne stižu do backenda (npr. u browseru greška ili frontend ne može da pozove API), uglavnom je u pitanju **DNS** ili **SSL**.

---

## 1. Proveri status domena u Railway-u

1. **Railway** → projekat → servis **BioVera** (backend).
2. **Settings** → **Networking** / **Domains**.
3. Pored `api.biovera.app` proveri status:
   - **Active** – domen je povezan i trebalo bi da radi.
   - **Waiting for DNS** – DNS još ne pokazuje na Railway (ili nije tačno podešen).
   - **Issuing TLS certificate** – čeka se SSL; ako traje satima, verovatno je problem u DNS-u.

Ako piše "Waiting for DNS" ili dugo "Issuing TLS certificate", prati korake ispod.

---

## 2. Podesi DNS za `api.biovera.app`

Railway za custom domain očekuje **CNAME** koji pokazuje na njihov host (npr. `biovera-production.up.railway.app`).

### A) Gde se menja DNS

- Ako koristiš **Vercel DNS** za `biovera.app`: Vercel Dashboard → projekat → **Settings** → **Domains** → **Edit** za domen → dodaj record za `api`.
- Ako koristiš **IONOS / drugi registrar**: njihov DNS panel za domen `biovera.app`.

### B) Tačan CNAME record

| Tip   | Name (Host) | Vrednost (Target)                          |
|-------|-------------|--------------------------------------------|
| CNAME | `api`       | `biovera-production.up.railway.app`        |

(Umesto `biovera-production.up.railway.app` stavi **tačan** hostname koji Railway prikaže za tvoj servis u **Settings → Networking / Domains**.)

- Za subdomenu `api.biovera.app` obično:
  - **Name**: `api` (ili kako tvoj DNS traži za subdomenu).
- **Bez tačke** na kraju u vrednosti (npr. `biovera-production.up.railway.app`, ne `.up.railway.app`), osim ako DNS panel eksplicitno traži tačku na kraju.
- Sačuvaj i sačekaj 5–30 minuta (ponekad i do 48 h za propagaciju).

---

## 3. Proveri da li DNS sada pokazuje na Railway

U terminalu:

```bash
dig api.biovera.app CNAME +short
```

Očekivano nešto kao: `biovera-production.up.railway.app.`  
Ako nema izlaza ili je drugačiji target, CNAME nije dobro podešen ili još nije propagirao.

---

## 4. Testiraj da li backend odgovara na custom domenu

Kada DNS bude dobar, Railway će izdati SSL i domen bi trebalo da bude "Active". Zatim:

```bash
curl -I https://api.biovera.app/health
```

- **200 OK** (ili slično) → backend je dostupan na `api.biovera.app`, možeš ga koristiti u frontendu.
- **SSL/certificate error** → još uvek nema validan sertifikat; obično znači da DNS još nije korektan za Railway ili da certificate još nije izdat (sačekaj 10–30 min).
- **Timeout / connection refused** → DNS možda ne pokazuje na Railway ili firewall/proxy blokira.

---

## 5. Poveži frontend na backend

Kad `https://api.biovera.app/health` radi:

1. **Vercel** → projekat → **Settings** → **Environment Variables**.
2. Postavi **NEXT_PUBLIC_API_URL** na:
   ```text
   https://api.biovera.app
   ```
3. Označi **Production** (i po želji Preview/Development).
4. **Save** → **Redeploy** (Deployments → ... → Redeploy).

Ako `api.biovera.app` **još uvek ne radi** (npr. dugo "Waiting for DNS" ili SSL greška):

- Ostavi u Vercel-u:
  ```text
  NEXT_PUBLIC_API_URL=https://biovera-production.up.railway.app
  ```
- Kad DNS i SSL budu u redu i `curl https://api.biovera.app/health` bude 200, promeni na `https://api.biovera.app` i uradi redeploy.

---

## 6. Backend CORS

U backendu su već dozvoljeni origin-i za produkciju:

- `https://www.biovera.app`
- `https://biovera.app`

Dakle, kada je **NEXT_PUBLIC_API_URL** postavljen na `https://api.biovera.app` (ili Railway URL), sajt na `www.biovera.app` / `biovera.app` može da šalje zahteve na API bez CORS greške.

---

## Rezime

| Problem                          | Šta proveriti / uraditi                                      |
|----------------------------------|--------------------------------------------------------------|
| Domen "Online" ali ne radi       | DNS: CNAME `api` → Railway hostname; status u Railway-u.     |
| SSL / certificate error          | Čekaj izdavanje TLS-a (minuti do ~30 min); proveri DNS.      |
| Frontend ne zove API              | Vercel: `NEXT_PUBLIC_API_URL` i **Redeploy**.                |
| CORS greška                      | Backend već dozvoljava `www.biovera.app` i `biovera.app`.    |

Kada **api.biovera.app** u Railway-u bude **Active** i `curl https://api.biovera.app/health` vrati 200, custom domen je uspešno povezan na backend.
