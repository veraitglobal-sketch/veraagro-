# 🤖 Vera AI Assistant Widget - Setup Guide

## 📋 Overview

Vera AI Assistant je inteligentni chatbot widget koji pruža kompletnu podršku korisnicima BioVera platforme. Widget je dizajniran u BioVera stilu (minimalistički, zelena boja, font-light) i nudi brze odgovore na česta pitanja.

## ✨ Features

### Za Proizvođače (Growers):
- ✅ Kompletne informacije o tome kako postati poljoprivrednik
- ✅ Objašnjenje svih resursa i podrške koju pružamo
- ✅ Informacije o osiguranju (weather, crop failure, price, transport)
- ✅ Detalji o plaćanju (escrow sistem, 70% farmer, automatsko)
- ✅ Mobile app features
- ✅ Protocol 360 objašnjenje

### Za Logistiku:
- 🚛 **Empty Mile Reduction** - Automatsko uparivanje povratnih putovanja
- 🌍 **Eco-Route Planning** - AI-powered optimizacija ruta
- 💰 Informacije o plaćanju i benefitima
- 📱 Mobile app features za vozače

### Za Buyers/Distributors:
- 📝 Registracija proces
- 🛒 Pre-order sistem
- 📦 Kako kupiti proizvode
- 🔍 QR code verifikacija

### Opšte Informacije:
- Protocol 360 quality system
- Product traceability
- Payment system
- Mobile app features
- Contact & support

## 🚀 Setup Instructions

### 1. Backend Setup

#### Install Dependencies
```bash
cd backend
npm install openai
```

#### Environment Variables
Dodajte u `backend/.env`:
```bash
OPENAI_API_KEY=sk-your-openai-api-key-here
```

**Kako dobiti OpenAI API Key:**
1. Idite na https://platform.openai.com/
2. Kreirajte account ili se ulogujte
3. Idite na API Keys sekciju
4. Kliknite "Create new secret key"
5. Kopirajte key i dodajte u `.env` fajl

**Napomena:** Ako `OPENAI_API_KEY` nije setovan, AI Assistant će prikazati poruku da kontaktira support tim umesto da padne aplikacija.

#### Backend Module
Modul je već kreiran i integrisan:
- `backend/src/ai-assistant/ai-assistant.service.ts`
- `backend/src/ai-assistant/ai-assistant.controller.ts`
- `backend/src/ai-assistant/ai-assistant.module.ts`

Modul je već dodat u `app.module.ts`.

### 2. Frontend Setup

#### Widget Component
Widget komponenta je kreirana:
- `web/components/VeraAIChatbot.tsx`

Widget je već integrisan u `web/app/layout.tsx`.

#### Environment Variables
Proverite da li postoji `NEXT_PUBLIC_API_URL` u `web/.env.local`:
```bash
NEXT_PUBLIC_API_URL=https://biovera-production.up.railway.app
```

## 🎨 Design Features

### BioVera Style:
- ✅ Minimalistički dizajn
- ✅ Zelena boja (#2D5A27 / green-600)
- ✅ Font-light za tekst
- ✅ Smooth animacije (framer-motion)
- ✅ Ne-intruzivan (može se minimize)
- ✅ Responsive (mobile-friendly)

### UI Elements:
- Floating button sa pulse animacijom
- Chat window sa minimize/maximize
- Quick action buttons
- Suggested action links
- Loading states
- Error handling

## 📝 Usage

### Quick Actions
Widget automatski nudi quick action buttons za:
- 🌱 Postani Poljoprivrednik
- 🚛 Logistika (Empty Mile, Eco-Route)
- 🛡️ Osiguranje
- 💰 Plaćanje

### Multi-Language Support
AI automatski detektuje jezik korisnika i odgovara na:
- Srpski (Latinica)
- English
- Deutsch
- I više jezika

### Context-Aware
AI prepoznaje kontekst i nudi relevantne odgovore:
- Ako korisnik pita o proizvođačima → fokus na podršku i olakšavanje
- Ako korisnik pita o logistici → fokus na Empty Mile i Eco-Route
- Ako korisnik pita o osiguranju → sve opcije osiguranja

## 🔧 API Endpoints

### POST /ai-assistant/query
```json
{
  "query": "Kako postati poljoprivrednik?",
  "language": "sr" // optional
}
```

**Response:**
```json
{
  "answer": "Da postanete poljoprivrednik...",
  "suggestedActions": [
    {
      "label": "Visit Growers Page",
      "url": "/growers"
    }
  ],
  "quickActions": [
    {
      "label": "📋 Application Process",
      "query": "Kako se prijaviti kao poljoprivrednik?"
    }
  ]
}
```

### GET /ai-assistant/health
Health check endpoint.

## 🎯 Key Features Highlighted

### For Producers:
- **"We Take Care of Everything"** - Emphasizes complete support
- **Insurance Options** - Weather, crop failure, price, transport
- **Fair Payment** - 70% to farmer, automatic processing
- **Complete Support** - Mobile app, training, resources

### For Logistics:
- **Empty Mile Reduction** - Up to 40% fuel savings
- **Eco-Route Planning** - AI-powered optimization
- **Automatic Matching** - Return trip optimization

### For Buyers:
- **Pre-Order System** - Plan ahead for seasons
- **QR Verification** - Complete traceability
- **Direct Access** - To verified growers

## 🐛 Troubleshooting

### Widget se ne pojavljuje
1. Proverite da li je komponenta dodata u `layout.tsx`
2. Proverite console za greške
3. Proverite da li je `NEXT_PUBLIC_API_URL` postavljen

### AI ne odgovara
1. Proverite da li je `OPENAI_API_KEY` postavljen u backend `.env`
2. Proverite backend logs za greške
3. Proverite da li je backend pokrenut

### API Error
1. Proverite da li je backend dostupan
2. Proverite CORS settings
3. Proverite network tab u browser dev tools

## 📊 Cost Considerations

### OpenAI API Costs
- Model: `gpt-4o-mini` (cost-effective)
- Average cost: ~$0.01-0.02 per query
- Monthly estimate: $10-50 (depending on usage)

### Optimization Tips
- Quick responses za česta pitanja (bypass AI)
- Caching odgovora za identične queries
- Rate limiting (već implementirano)

## 🚀 Next Steps

### Potential Enhancements:
1. **Voice Input/Output** - Za starije korisnike
2. **Image Recognition** - Upload slike za analizu
3. **QR Scanner** - Direktno u widget-u
4. **Context Memory** - Pamti prethodne razgovore
5. **Proactive Suggestions** - Based on user location/page

## 📞 Support

Za pitanja ili probleme:
- Contact: info@biovera.app
- Help Center: /help-center
- FAQ: /faq

---

**Created:** 2026-02-08  
**Status:** ✅ Ready for Production  
**Version:** 1.0.0
