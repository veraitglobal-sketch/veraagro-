# 🔧 Resend Domain Verification - API Check

## ❓ Problem

Domain `biovera.app` nije potvrđen u Resend, iako su DNS zapisi dodati.

---

## 🔍 Korak 1: Proveri Status Domena preko API-ja

### 1.1. Instaliraj Resend SDK (ako nije instaliran)

```bash
cd backend
npm install resend
```

### 1.2. Kreiraj Test Script

Kreiraj `backend/scripts/check-resend-domain.ts`:

```typescript
import { Resend } from 'resend';

const resend = new Resend('re_DK2V8Wuf_LN6rRPUa3D8Jq1VbiisETech');

async function checkDomain() {
  try {
    // List all domains
    const domains = await resend.domains.list();
    console.log('All domains:', JSON.stringify(domains, null, 2));
    
    // Get specific domain
    const domain = await resend.domains.get('83a470f8-71ff-471d-8afa-1b908dfee254');
    console.log('Domain status:', JSON.stringify(domain, null, 2));
    
    // Check verification status
    if (domain.data) {
      console.log('Domain name:', domain.data.name);
      console.log('Status:', domain.data.status);
      console.log('Region:', domain.data.region);
      console.log('Created at:', domain.data.createdAt);
      
      // Check DNS records
      if (domain.data.records) {
        console.log('\nDNS Records:');
        domain.data.records.forEach((record: any) => {
          console.log(`- ${record.type} ${record.name}: ${record.value} (Status: ${record.status})`);
        });
      }
    }
  } catch (error: any) {
    console.error('Error:', error.message);
    console.error('Full error:', error);
  }
}

checkDomain();
```

### 1.3. Pokreni Script

```bash
cd backend
npx ts-node scripts/check-resend-domain.ts
```

---

## 🔧 Korak 2: Pokušaj Verify Domain preko API-ja

### 2.1. Kreiraj Verify Script

Kreiraj `backend/scripts/verify-resend-domain.ts`:

```typescript
import { Resend } from 'resend';

const resend = new Resend('re_DK2V8Wuf_LN6rRPUa3D8Jq1VbiisETech');

async function verifyDomain() {
  try {
    const result = await resend.domains.verify('83a470f8-71ff-471d-8afa-1b908dfee254');
    console.log('Verify result:', JSON.stringify(result, null, 2));
  } catch (error: any) {
    console.error('Error:', error.message);
    console.error('Full error:', error);
  }
}

verifyDomain();
```

### 2.2. Pokreni Script

```bash
cd backend
npx ts-node scripts/verify-resend-domain.ts
```

---

## 🔍 Korak 3: Proveri DNS Propagaciju

### 3.1. Online DNS Checker

1. Idi na: https://mxtoolbox.com/TXTLookup.aspx
2. Unesi: `resend._domainkey.biovera.app`
3. Klikni "TXT Lookup"
4. Trebalo bi da vidiš: `p=MIGfMA...`

**Ako ne vidiš:**
- ⏳ DNS propagacija još nije završena
- Sačekaj još 10-15 minuta

### 3.2. Proveri SPF

1. Idi na: https://mxtoolbox.com/TXTLookup.aspx
2. Unesi: `send.biovera.app`
3. Klikni "TXT Lookup"
4. Trebalo bi da vidiš: `v=spf1 include:amazonses.com -all`

**Ako ne vidiš:**
- ⏳ DNS propagacija još nije završena
- Proveri IONOS DNS panel ponovo

---

## 🆘 Troubleshooting

### Problem 1: "Domain not found"

**Rešenje:**
- Proveri da li je domain ID tačan: `83a470f8-71ff-471d-8afa-1b908dfee254`
- Proveri da li je domain dodat u Resend dashboard-u

### Problem 2: "DNS records not found"

**Rešenje:**
- Proveri IONOS DNS panel - da li su svi zapisi dodati
- Proveri online (mxtoolbox.com) - da li se zapisi vide
- Sačekaj 10-15 minuta (DNS propagacija)

### Problem 3: "Verification failed"

**Rešenje:**
- Proveri da li su DNS zapisi tačno dodati
- Proveri da li nema grešaka u formatu
- Kontaktiraj Resend support

---

## 📋 Checklist

- [ ] DNS zapisi dodati u IONOS
- [ ] Sačekao 10-15 minuta (DNS propagacija)
- [ ] Proverio online (mxtoolbox.com) da li se zapisi vide
- [ ] Pokrenuo `check-resend-domain.ts` script
- [ ] Proverio status domena u Resend API
- [ ] Pokušao `verify-resend-domain.ts` script
- [ ] Proverio da li je domain verified

---

## 💡 Napomena

**DNS propagacija može potrajati 24-48 sati!**

Čak i kada su DNS zapisi tačno dodati, može potrajati nekoliko sati ili dana dok se propagiraju globalno. Strpljenje je ključno! 😊

---

## 🔧 Quick Fix

Ako žuriš, probaj:

1. **Proveri DNS online** (mxtoolbox.com)
2. **Pokušaj verify preko API-ja** (možda dashboard ima cache)
3. **Kontaktiraj Resend support** - ako problem traje više od 48h
