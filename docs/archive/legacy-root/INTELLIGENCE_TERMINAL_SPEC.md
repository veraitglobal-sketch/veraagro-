# 🖥️ Bio Vera Intelligence Terminal - Specifikacija

## 📐 Dizajn Specifikacije

### Stil
- **Glassmorphism**: Bela pozadina sa `backdrop-blur-md` i `bg-white/95`
- **Zelena boja**: `#2D5A27` za akcente
- **Širina**: Max 350px
- **Visina**: 650px
- **Border**: `border-[#2D5A27]/20` (20% opacity)
- **Shadow**: `shadow-2xl` sa zelenim akcentom

### Live Ticker
- **Pozicija**: Vrh prozora
- **Pozadina**: Gradient `from-[#2D5A27]/10 to-[#2D5A27]/5`
- **Podaci**: 
  - Fuel saved (liters)
  - Routes optimized (count)
  - CO2 reduced (kg)
  - Efficiency percentage
- **Update**: Svake 2 sekunde
- **Font**: Monospaced (`font-mono`)
- **Ikone**: Fuel, Route, TrendingDown

### AI Persona
- **Nije asistent** - Logistički Analitičar
- **Tehnički termini**: 
  - "load optimization"
  - "empty mile reduction"
  - "packaging integrity"
  - "truck fill percentage"
  - "CO2 footprint"
  - "fuel consumption rate"
  - "void space elimination"

### Formatiranje
- **Monospaced font** za sve brojeve, procente, tabele
- **Code blocks** za tabele i izračune
- **Zelena boja** (`#2D5A27`) za brojeve i metrike

## 🎯 Funkcionalnosti

### Quick Options (Brze Opcije)
1. **Load Optimization** - Izračun optimalne popunjenosti kamiona
2. **Route Efficiency** - Prikaz optimizacije rute i uštede goriva
3. **Packaging Integrity** - Tehničke specifikacije pakovanja
4. **Cost Analysis** - Izračun cene transporta po kutiji

### Live Ticker
- Simulirani podaci u realnom vremenu
- Prikazuje:
  - Fuel saved (L)
  - Routes optimized (count)
  - CO2 reduced (kg)
  - Efficiency (%)

### Matematički Dokazi
Svaki odgovor mora sadržati:
- **Formule** (npr. `(Order quantity / 1,980 boxes) × 100`)
- **Rezultate** u monospaced formatu
- **Poređenja** (optimized vs standard)
- **Uštede** (fuel, CO2, cost)

## 📊 Primer Odgovora

**Korisnik pita:** "I need 1200 boxes to Hamburg"

**AI odgovara:**
```
LOAD OPTIMIZATION ANALYSIS

```
Truck Fill:     60.6%
Cost/Box:       €0.75
Total Cost:     €900.00
CO2 Emissions:   3060.0 kg
Fuel Consumed:   258.4 L
Distance:         850 km
```

WASTE ELIMINATION ANALYSIS

Current fill: 60.6% | Waste: 480 boxes (2.4 pallets)

```
Action:         Add 480 boxes to eliminate waste
New Fill:       85.0%
Cost/Box:       €0.62 (savings: €156.00)
CO2 Optimized:   3060.0 kg (reduction: 0.0 kg)
Fuel Optimized:  258.4 L (savings: 0.0 L)
```

Resource waste eliminated: 480 boxes = 24.2% capacity recovered.
```

## 🎨 UI Komponente

### Header
- **Title**: "INTELLIGENCE TERMINAL"
- **Subtitle**: "Logistics Analytics v2.1"
- **Ikone**: WhatsApp (Zap), Close (X)

### Quick Options
- **Layout**: 2x2 grid
- **Stil**: Bela pozadina, zelena border na hover
- **Ikone**: Package, Route, Package, Calculator

### Messages
- **User**: Tamna pozadina (`bg-[#2D5A27]`), beli tekst
- **Assistant**: Bela pozadina sa border, monospaced za brojeve
- **Code blocks**: Svetlo zelena pozadina (`bg-[#2D5A27]/5`)

### Input
- **Placeholder**: "Query optimization parameters..."
- **Ikona**: Search (levo)
- **Button**: Send (zelena pozadina)

## 🔧 Backend Promene

### System Prompt
- Promenjen iz "Assistant" u "Intelligence Terminal"
- Fokus na matematičke dokaze
- Tehnički termini umesto friendly jezika

### Calculations
- Formatirane u monospaced stilu
- Code blocks za tabele
- Formule prikazane eksplicitno

## ✅ Checklist

- [x] Glassmorphism stil (bela sa blur)
- [x] Zelena boja `#2D5A27` za akcente
- [x] Max 350px širina
- [x] Live ticker sa simuliranim podacima
- [x] Quick options (4 opcije)
- [x] Monospaced font za brojeve
- [x] Code blocks za tabele
- [x] AI persona kao Logistički Analitičar
- [x] Matematički dokazi u odgovorima
- [x] Tehnički termini

---

**Created:** 2026-02-09  
**Status:** ✅ Implemented  
**Version:** 2.1.0
