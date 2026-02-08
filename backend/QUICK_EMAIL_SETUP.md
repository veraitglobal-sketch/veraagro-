# 🚀 Brzi Setup: Email sa Custom Domenom (BESPLATNO)

## ✅ Najbrža Opcija: Cloudflare Email Routing + Resend

### Korak 1: Cloudflare Email Routing (5 minuta)

1. **Ako domain NIJE na Cloudflare:**
   - Registruj se na https://www.cloudflare.com (besplatno)
   - Dodaj domain
   - Promeni nameservers u domain registrar-u
   - Sačekaj 5-30 minuta

2. **Ako domain VEĆ jeste na Cloudflare:**
   - Idi na Dashboard → Email → Email Routing
   - Klikni "Get Started"
   - Klikni "Create address"
   - Dodaj:
   - `info@biovera.app` → `tvoj-gmail@gmail.com`

**✅ Gotovo!** Sada primaš emailove na `@biovera.app` adrese.

---

### Korak 2: Resend (10 minuta)

1. Registruj se na https://resend.com (besplatno)
2. Klikni "Add Domain"
3. Unesi `biovera.app`
4. Kopiraj DNS records koje ti Resend da
5. Dodaj ih u Cloudflare DNS:
   - Dashboard → DNS → Add record
   - Dodaj sve records (SPF, DKIM, DMARC)
6. Sačekaj verifikaciju (5-10 min)
7. Kada je verifikovan, kreiraj API key:
   - API Keys → Create API Key
   - Kopiraj key

**✅ Gotovo!** Sada možeš slati emailove sa `@biovera.app` adrese.

---

### Korak 3: Backend Konfiguracija (2 minuta)

Dodaj u `backend/.env`:

```env
SMTP_HOST=smtp.resend.com
SMTP_PORT=587
SMTP_USER=resend
SMTP_PASS=re_DK2V8Wuf_LN6rRPUa3D8Jq1VbiisETech
EMAIL_FROM=info@biovera.app
ADMIN_EMAIL=info@biovera.app
```

**✅ Gotovo!** Restart backend i testiraj!

---

## 🎯 Rezultat

- ✅ Primaš emailove na `info@biovera.app` (forward na Gmail)
- ✅ Šalješ emailove sa `info@biovera.app` (preko Resend)
- ✅ **Potpuno besplatno!**
- ✅ Profesionalno izgleda

---

## 📧 Testiranje

1. Pošalji test email preko contact forme na sajtu
2. Proveri Gmail inbox (trebalo bi da stigne)
3. Proveri da li je "From" adresa `info@biovera.app`

---

## 🆘 Problemi?

### "Domain not verified"
- Sačekaj 10-15 minuta (DNS propagation)
- Proveri da li su svi DNS records tačno dodati

### "Email not sending"
- Proveri da li je Resend API key tačan
- Proveri da li je domain verifikovan u Resend dashboard-u

### "Email not receiving"
- Proveri Cloudflare Email Routing settings
- Proveri spam folder u Gmail-u

---

## 💡 Alternativa: Samo Resend (Ako ti ne treba primanje)

Ako ti ne treba da primaš emailove na custom adrese, možeš koristiti samo Resend:

1. Registruj se na Resend
2. Dodaj domain
3. Dodaj DNS records
4. Koristi Resend API za slanje

**Mane**: Ne možeš primati emailove na `@biovera.app` adrese (ali možeš koristiti Gmail direktno).
