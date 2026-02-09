# 🔑 OpenAI API Key Setup

## 📍 Gde Dodati OpenAI API Key

### ✅ Railway (Backend) - OVDE TREBA DA DODAŠ!

**Zašto Railway?**
- Backend je hostovan na Railway (`biovera-production.up.railway.app`)
- OpenAI API key se koristi u backend-u (`backend/src/ai-assistant/ai-assistant.service.ts`)
- Environment variables u Railway se prosleđuju backend-u

**Kako dodati u Railway:**

1. **Otvori Railway Dashboard**
   - Idi na: https://railway.app/dashboard
   - Klikni na projekat "BioVera"
   - Klikni na service (backend)

2. **Otvori Variables Tab**
   - Klikni na **"Variables"** tab (gore u meniju)
   - Ili idi na **"Settings"** → **"Variables"**

3. **Dodaj OpenAI API Key**
   - Klikni **"+ New Variable"**
   - **Key**: `OPENAI_API_KEY`
   - **Value**: `sk-your-openai-api-key-here`
   - Klikni **"Add"**

4. **Redeploy Backend**
   - Railway će automatski redeploy-ovati backend kada dodaš novi variable
   - Ili klikni **"Redeploy"** u Deployments tab-u

---

### ❌ NE u Vercel!

**Zašto ne Vercel?**
- Vercel je samo za frontend (Next.js)
- OpenAI API key se ne koristi u frontend-u (security risk!)
- Frontend samo šalje upite na backend, backend poziva OpenAI

---

## 🔐 Kako Dobiti OpenAI API Key

1. **Otvori OpenAI Platform**
   - Idi na: https://platform.openai.com/
   - Uloguj se ili kreiraj account

2. **API Keys Sekcija**
   - Klikni na **"API keys"** u sidebar-u
   - Ili idi na: https://platform.openai.com/api-keys

3. **Kreiraj Novi Key**
   - Klikni **"+ Create new secret key"**
   - Daj mu ime (npr. "BioVera Production")
   - Klikni **"Create secret key"**
   - **VAŽNO**: Kopiraj key odmah! Nećeš moći da ga vidiš ponovo.

4. **Kopiraj Key**
   - Primer: `sk-proj-abc123def456ghi789...`
   - Kopiraj ceo key

5. **Dodaj u Railway**
   - Vrati se u Railway
   - Dodaj kao `OPENAI_API_KEY` variable (kao što je objašnjeno gore)

---

## ✅ Provera da li Radi

### 1. Proveri Railway Logs
- Otvori Railway Dashboard
- Klikni na service → **"Deployments"** tab
- Klikni na najnoviji deployment
- Proveri logs - ne bi trebalo da vidiš grešku o `OPENAI_API_KEY`

### 2. Test AI Widget
- Otvori `https://biovera.app`
- Klikni na AI widget (HelpCircle ikona)
- Postavi pitanje
- Trebalo bi da dobiješ odgovor od AI-a

### 3. Proveri Backend Health
```bash
curl https://biovera-production.up.railway.app/health
```

---

## 🎯 Checklist

- [ ] OpenAI account kreiran
- [ ] API key kreiran na OpenAI platformi
- [ ] API key dodat u Railway kao `OPENAI_API_KEY`
- [ ] Backend redeploy-ovan
- [ ] AI widget testiran na sajtu

---

## 💰 Cost Considerations

**OpenAI API Costs:**
- Model: `gpt-4o-mini` (cost-effective)
- Average cost: ~$0.01-0.02 per query
- Monthly estimate: $10-50 (depending on usage)

**Optimization:**
- Quick responses za česta pitanja (bypass AI)
- Rate limiting (već implementirano)
- Error handling (već implementirano)

---

## 🆘 Troubleshooting

### Problem: "OPENAI_API_KEY environment variable is missing"
**Rešenje:**
- Proveri da li si dodao variable u Railway
- Proveri da li je ime tačno `OPENAI_API_KEY` (case-sensitive!)
- Redeploy backend

### Problem: "Invalid API key"
**Rešenje:**
- Proveri da li si kopirao ceo key (počinje sa `sk-`)
- Proveri da li imaš dovoljno kredita na OpenAI account-u
- Proveri da li je key aktiviran

### Problem: AI ne odgovara
**Rešenje:**
- Proveri Railway logs za greške
- Proveri da li je backend redeploy-ovan
- Proveri da li je `NEXT_PUBLIC_API_URL` tačno postavljen u Vercel-u

---

**Created:** 2026-02-09  
**Status:** ✅ Ready for Setup
