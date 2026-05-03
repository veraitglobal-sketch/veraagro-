# BioVera mobilna aplikacija — rad sa agentom u Cursor-u

Ovaj fajl je **trajni sidro** kad otvaraš novi chat: jedna linija „nastavi iz `mobile/BIOVERA_WORKING.md`“ ili traži od agenta da ga prvi pročita kad radite na `mobile/`.

---

## Aktuelni prioritet (zameni svojim tekstom)

- **Šta je na redu:** _(npr. buyer Stack + swipe nazad za detalj narudžbine)_
- **Do kada / zašto bitno:**

---

## U toku / blokatori

| Tema | Status | Dokaz / sledeći korak |
|------|--------|------------------------|
| _primer: transport POST /missions_ | _(blokiran na prod / u toku)_ | _(paste status kod + poruka API-ja ili ref log)_ |

---

## „Gotovo“ za ovaj paket radova

- **Tipovi:** `cd mobile && npx tsc --noEmit`
- Ručni prolaz _(navedi konkretno):_ ekran A → B → povratak, offline scenarijo, …

---

## Poznati ograničenja (ne gubiti vreme u novom četu)

- **Buyer `(buyer)`:** trenutno je uglavnom **Tabs** bez unutrašnjeg Stack-a — ivični iOS swipe „kao sistemski stek“ nije jednak svuda kao na **`(producer)`** Stack-u. Ako prioritet zahteva paritet navigation-a, radi se refaktor (Stack iznad tabs grupe).
- **Proizvođač `(producer)`:** glavni stek ima `BioVeraSubpageHeader` ili custom `ArrowLeft` na pojedinim formama — kada se doda novi fullscreen ekran, obavezno back ili eksplicitni `left="none"` sa razlogom.
- **Korenski `app/_layout.tsx`:** za autentifikovane **grupe** `(producer)`, `(buyer)`, `(supplier)`, `(logistics)` **ne vraćati** `gestureEnabled: false` na ceo ekran grupe — to gasi povlačenje nazad na unutrašnjim Stack-ovima. Na login rutama ostaviti ono što je namerno bez edge-swipe.

---

## Brzi štafetaški šablon (kopiraj u svaki novi čet)

```
Kontekst: čitaj mobile/BIOVERA_WORKING.md — ažuriraj sekcije posle izmene.

Cilj:
Obim: (samo mobile / mobile + backend / …)
Gotovo kad: (tsc + ručno: …)

Dodatak ako ima bug u produkciji: HTTP status + body iz Network ili 1 linija server log-a.
```

---

## Skorašnje istaknute izmene _(ručno dopunjavaj po commitima, kratak trag)_

| Datum | Kratak opis |
|-------|--------------|
| _YYYY-MM-DD_ | _(npr. gestures na producer/logistics stack; materijali web redizajn u drugom paketu)_ |
