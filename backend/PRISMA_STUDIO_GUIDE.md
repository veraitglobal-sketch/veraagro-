# 🎨 Prisma Studio - Vodič

## Šta je Prisma Studio?

Prisma Studio je **vizuelni interfejs** (web aplikacija) za pregled i upravljanje bazom podataka. To je kao "phpMyAdmin" ili "pgAdmin", ali specifično za Prisma.

## 🚀 Kako da Pokreneš

```bash
cd backend
npx prisma studio
```

Studio će se automatski otvoriti u browser-u na: **http://localhost:5555**

## 📋 Osnovne Funkcionalnosti

### 1. Pregled Tabela

- Leva strana: Lista svih tabela u bazi
- Desna strana: Podaci izabrane tabele
- Klikni na bilo koju tabelu da vidiš podatke

### 2. Dodavanje Novih Redova

1. Klikni na tabelu (npr. `User`)
2. Klikni na **"Add record"** dugme (gore desno)
3. Popuni polja
4. Klikni **"Save 1 change"**

### 3. Editovanje Podataka

1. Klikni na red koji želiš da edituješ
2. Klikni na polje koje želiš da promeniš
3. Unesi novu vrednost
4. Klikni **"Save"**

### 4. Brisanje Podataka

1. Klikni na red koji želiš da obrišeš
2. Klikni na **"Delete"** dugme (crveno)
3. Potvrdi brisanje

### 5. Pretraga i Filtriranje

- **Search bar** (gore): Pretraži po bilo kom polju
- **Filter** dugme: Dodaj filtere (npr. `status = ACTIVE`)
- **Sort** dugme: Sortiraj po kolonama

### 6. Pregled Relacija

- Klikni na polje koje ima relaciju (npr. `userId`)
- Videćeš povezane podatke iz druge tabele
- Možeš da naviguješ kroz relacije

## 🎯 Primeri Korišćenja

### Primer 1: Dodaj Novog Korisnika

1. Klikni na tabelu `User`
2. Klikni **"Add record"**
3. Popuni:
   - `email`: `test@example.com`
   - `firstName`: `Test`
   - `lastName`: `User`
   - `passwordHash`: `$2b$10$...` (bcrypt hash)
   - `roles`: Izaberi `[GROWER]`
   - `partnerCode`: `TEST001`
4. Klikni **"Save 1 change"**

### Primer 2: Pregled Batch-ova

1. Klikni na tabelu `Batch`
2. Videćeš sve batch-ove
3. Klikni na bilo koji batch da vidiš detalje
4. Možeš da vidiš povezane podatke (User, Estate, itd.)

### Primer 3: Pretraži po Statusu

1. Klikni na tabelu `Order`
2. Klikni na **"Filter"** dugme
3. Dodaj filter: `status = PENDING`
4. Videćeš samo pending order-e

## ⚠️ Važno

- **Ne briši podatke bez razloga** - ovo je produkcijska baza!
- **Testiraj prvo** - dodaj test podatke pre nego što dodaješ prave
- **Pregledaj relacije** - Prisma Studio automatski prikazuje povezane podatke

## 🛑 Zaustavljanje

Da zaustaviš Prisma Studio:
- Pritisni **Ctrl+C** u terminalu gde je pokrenut

## 💡 Saveti

- Koristi Studio za **brzo testiranje** i **debugging**
- **Ne koristi za masovne operacije** - koristi Prisma Client u kodu
- **Backup pre velikih izmena** - ako brišeš ili menjaš puno podataka

## 🔗 Korisni Linkovi

- [Prisma Studio Docs](https://www.prisma.io/docs/concepts/components/prisma-studio)
- [Prisma Client Docs](https://www.prisma.io/docs/concepts/components/prisma-client)
