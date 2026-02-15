# BioVera – Registracija i Wallet – Specifikacija

## 1. Pregled flow-a

```
[Welcome] → [Faza 1: Registracija] → [Faza 2: Dodaj zasađe] → [Faza 3: Vidi dobavljače na mapi] ✓ Završeno
     ↓              ↓                        ↓                              ↓
  Novi user    Ime, prezime,          Njive, parcele,                  Mapa sa
               hektari, email         šta sadi                          prodavnicama
```

**Wallet nije faza** – bankovni račun i zahtev za isplatu dodaje tek kad zahteva isplatu (on-demand).

**Stanja naloga:**
- `PENDING_EMAIL` – registrovao se, čeka potvrdu mejla
- `PENDING_IDENTITY` – potvrdio mejl, čeka verifikaciju identiteta  
- `ACTIVE` – sve prošlo, može da koristi aplikaciju
- `SUSPENDED` – blokiran (postojeći)

---

## 2. Welcome screen (početak)

- Za nove korisnike: **„Registruj se”** (odmah na vrh)
- Za postojeće Vera farmere: **„Već imam nalog – prijavi se”** (ispod)

Registracija = novi flow od nule, ne Grower Journey.

---

## 3. Registracija (Step-by-step)

### Korak 1: Osnovni podaci
- **Ime**
- **Prezime**
- **Email** (obavezno – za aktivaciju)
- **Telefon** (opciono)
- Lozinka (ili: prvi put se postavlja nakon email potvrde – lakše)

### Korak 2: Imovina
- **Ukupno hektara** – polje broj
  - Placeholder: „Ako ne znate tačno, unesite procenu”
  - Validacija: > 0, npr. max 10 000
- Možda kasnije: lokacija / opština (za mapu dobavljača)

### Korak 3: Potvrda
- Kratak rezime: Ime, Prezime, Email, Hektari
- Checkbox: „Saglasan sam sa uslovima” (link na Terms)
- Dugme: **„Registruj se”**

### Nakon registracije
- Poruka: „Poslali smo vam mejl. Kliknite na link da aktivirate nalog.”
- User dobija status `PENDING_EMAIL`, ne može da se uloguje dok ne potvrdi mejl.

---

## 4. Email potvrda

- Backend šalje email sa linkom (token), npr.  
  `https://biovera.app/verify-email?token=...`
- Link otvara app (deep link) ili web stranicu koja:
  - Validira token
  - Postavlja `emailVerified: true` (ili ekvivalent)
  - Mijenja status u `PENDING_IDENTITY`
  - Redirect u app na ekran verifikacije identiteta

Bez email potvrde nalog ostaje neaktivan.

---

## 5. Verifikacija identiteta

- Zahtev: korisnik mora da potvrdi identitet da bi nalog bio aktivan.
- Moguće opcije:
  - Selfie + slika dokumenta (lična karta / pasoš) – obično kroz eksterni provider (SumSub, Onfido, Veriff, itd.)
  - Ručna verifikacija – admin pregleda podatke
  - Integracija sa državnim sistemom (ako postoji API)

Implementacija:
- Ako će se koristiti eksterni softver: integracija SDK-a (npr. SumSub u React Native)
- Ako ne – privremeno: ekran „Vaša prijava je u obradi. Kontaktiraćemo vas uskoro.” + admin panel za ručno odobravanje

Status prelazi u `ACTIVE` tek kad je identitet verifikovan.

---

## 6. Faze registracije – tok

### Faza 1: Registracija
- Ime, prezime, email, hektari, lozinka
- Email potvrda (link u mejlu)
- Verifikacija identiteta (možda kasnije / eksterni softver)

### Faza 2: Dodaj zasađe
- Korisnik dodaje njive/parcele na nalog
- Šta sadi, gde, granice (mapa)
- Bez ovoga ne može dalje

### Faza 3: Vidi dobavljače – ZAVRŠNI KORAK
- Mapa sa dobavljačima (gde da kupi semena)
- Kad vidi mapu i dobavljače = registracija završena ✓
- Zatim pun pristup aplikaciji

---

## 7. Kada je sve gotovo

- User može da se uloguje (email + lozinka ili partnerCode)
- Pristup svim funkcijama: njive, berba, proizvodi, itd.

---

## 8. Wallet – SAMO pri isplati (ne faza)

Wallet nije deo registracije. Korisnik dodaje račun i traži isplatu tek kad zaželi da podigne novac.

### Šta treba

1. **Obaveštavanje kada novac legne**
   - Push notifikacija: „Na vaš račun je leglo X EUR”
   - U listi transakcija jasno prikazati tip (npr. „Payout” / „Primljeno”)

2. **Zahtev za isplatu**
   - Korisnik pritisne **„Isplati na račun”**
   - Ako nema unet bankovni račun → prvo forma za unos IBAN-a
   - Tek onda može da zatraži isplatu
   - Bankovni račun se dodaje **samo u tom trenutku** (ne u fazama registracije)

3. **Unos bankovnog računa** (samo pri zahtevu isplate)
   - Polja:
     - IBAN (validacija formata)
     - Ime banke (opciono)
     - Ime vlasnika računa (može da se auto-popuni iz profila)
   - Čuvanje u `wallets.bankAccount` (JSON) – već postoji u schema
   - Payout nije moguć dok nije unet IBAN

### Struktura `bankAccount` (JSON)
```json
{
  "iban": "DE89370400440532013000",
  "bankName": "Commerzbank",
  "accountHolderName": "Petar Petrović"
}
```

### Flow u app (samo kad zahteva isplatu)
1. Korisnik ide u Wallet → vidi stanje
2. Pritisne „Isplati na račun”
3. Ako nema IBAN → otvara se forma: IBAN, ime banke (opciono), ime vlasnika
4. Nakon čuvanja → može da zatraži isplatu
5. Payout: bira iznos (max = availableBalance) → potvrda → zahtev na backend
6. Backend: kreira transakciju (PENDING), kasnije integracija sa platnim provajderom

---

## 8. Šema – potrebne izmene

### User model
- `emailVerified` (Boolean, default false)
- `identityVerified` (Boolean, default false) – ili status enum
- `totalHectares` (Float, optional) – za brzi pregled bez računanja iz estates
- Možda: `identityVerifiedAt` (DateTime)

### UserStatus enum (proširenje)
- `PENDING_EMAIL` – čeka email potvrdu
- `PENDING_IDENTITY` – čeka verifikaciju identiteta
- `ACTIVE` – sve ok
- `SUSPENDED` – blokiran

### Notifications
- Tabela/kolona za tip: `PAYOUT_RECEIVED`, `MONEY_CREDITED`, itd.
- Push notifikacije kada novac legne

---

## 10. Implementirano (2025)

### Backend
- `POST /auth/register/grower` – registracija farmera (ime, prezime, email, lozinka, hektari)
- `GET /auth/verify-email?token=...` – verifikacija email-a, aktivacija naloga, vraća JWT
- Tabela `email_verification_tokens` za token-e
- Slanje verification email-a (link na web stranicu)

### Mobile
- Registracija šalje podatke na API
- Poruka „Proverite email“ nakon registracije

### Web
- Stranica `/verify-email?token=...` – validira token, čuva JWT, prikazuje uspeh

### Env varijable (backend)
- `FRONTEND_URL` ili `WEB_URL` – base URL za verification link (npr. https://biovera.app)
- SMTP/Resend za slanje email-a

---

## 11. Prioritet implementacije (ostalo)

1. **Faza 1 – Registracija i email** ✅ ZAVRŠENO
   - Welcome screen sa „Registruj se”
   - Registracioni flow (ime, prezime, email, hektari, lozinka)
   - Email slanje + verifikacioni link
   - Status `PENDING_EMAIL` → `PENDING_IDENTITY` (ili `ACTIVE` ako identity preskočimo privremeno)

2. **Faza 2 – Dodaj zasađe**
   - Korisnik dodaje njive/parcele (šta sadi, gde)
   - Obavezan korak pre Faze 3

3. **Faza 3 – Mapa dobavljača = završni korak**
   - Prikaz mape sa dobavljačima (gde kupiti semena)
   - Kad vidi mapu = registracija gotova ✓

4. **Wallet** (posebno – samo pri isplati)
   - Forma za IBAN se otvara tek kad pritisne „Isplati”
   - Payout dugme, obaveštavanje kad novac legne

---

## 11. Bezbednost

- Hash lozinke (bcrypt/argon2) – verovatno već postoji
- Email token: jednokratan, kratak rok važenja (npr. 24h)
- IBAN čuvanje: možda šifrovano u DB; provajder plaćanja obično drži IBAN
- Rate limiting na registraciju i login
