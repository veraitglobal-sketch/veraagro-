# Push obaveštenja (FCM + APNs)

Bio Vera mobilna aplikacija koristi **native FCM/APNs tokene** i **Firebase Admin** na NestJS API-ju. In-app zvonce (`notifications` tabela) i Socket.io ostaju; push stiže i kad app nije otvorena.

## Arhitektura

```
Mobilna (expo-notifications)
  → getDevicePushTokenAsync()
  → POST /notifications/push/register (JWT)

API (firebase-admin)
  → user_push_devices
  → notifications.create() → FCM send

Firebase FCM ──► Android
           └──► APNs (iOS, preko Firebase)
```

## 1. Firebase Console

1. Kreiraj projekat (npr. `biovera-prod`).
2. Dodaj **Android** app: package `com.biovera.app`.
3. Dodaj **iOS** app: bundle `com.biovera.app`.
4. **Project settings → Cloud Messaging** — uključeno.
5. **iOS**: upload **APNs Authentication Key (.p8)** (Apple Developer → Keys → Apple Push Notifications).
6. Preuzmi:
   - `google-services.json` → `mobile/google-services.json`
   - `GoogleService-Info.plist` → `mobile/GoogleService-Info.plist`
7. **Service account** (JSON) za backend — env varijable (vidi `.env.example`).

Primer fajlova u repou: `mobile/google-services.json.example`, `mobile/GoogleService-Info.plist.example`.

## 2. Backend (Railway / lokalno)

```bash
cd backend
npx prisma migrate deploy   # tabela user_push_devices
```

U `.env`:

```env
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxx@your-project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

Bez ovih varijabli API radi normalno; u logu: `FCM disabled`.

## 3. EAS build (obavezno za pravi push)

Push **ne testiraj u Expo Go** za produkciju.

1. [expo.dev](https://expo.dev) → projekat `bio-vera` → **Credentials**:
   - Android: **FCM V1** (upload service account JSON iz Firebase).
   - iOS: Push key / certifikat.
2. Lokalno imaj `google-services.json` i `GoogleService-Info.plist` (gitignored).
3. Build:

```bash
cd mobile
eas build --platform android --profile preview
eas build --platform ios --profile preview
```

Konfiguracija: `mobile/app.config.ts` (referencira Firebase fajlove).

## 4. Mobilna aplikacija

- Dozvola: jednom posle prijave (`PostLoginPermissions`) + Podešavanja.
- Token: `lib/push-service.ts` → `POST /notifications/push/register`.
- Tap na notifikaciju: `PushNotificationHandler` → `resolve-notification-action.ts`.

## 5. Testiranje

### A) Samo tvoj nalog (JWT)

```http
POST /notifications/push/test
Authorization: Bearer <token>
```

Šalje test push na sve tvoje registrovane uređaje.

### B) Firebase Console

Cloud Messaging → **Send test message** → paste FCM token iz loga mobilne app (posle prijave) ili iz baze:

```sql
SELECT token, platform, "appSurface", "updatedAt"
FROM user_push_devices
WHERE "userId" = '<user-uuid>';
```

### C) Poslovni događaj

Bilo koja akcija koja zove `NotificationsService.create()` (npr. nova porudžbina adminu) automatski šalje push ako korisnik ima token.

## 6. Operativa

| Problem | Rešenje |
|--------|---------|
| Nema tokena u bazi | Fizički uređaj, EAS build, dozvola odobrena, ponovo prijavi se |
| `FCM disabled` u API logu | Postavi Firebase env na serveru |
| iOS ne prima | APNs ključ u Firebase + EAS iOS push credentials |
| Android ne prima | `google-services.json` + FCM V1 u Expo credentials |
| Stari token | API briše `invalid-registration-token` automatski |

## API reference

| Metoda | Putanja | Opis |
|--------|---------|------|
| POST | `/notifications/push/register` | Upsert device token |
| DELETE | `/notifications/push/register` | Ukloni token (logout) |
| POST | `/notifications/push/test` | Test push na trenutnog korisnika |
| POST | `/notifications/push/test-user` | Admin: test push na `userId` u body-ju |

U mobilnoj app: **Podešavanja → Pošalji test push** (samo ako su obaveštenja uključena).

## Povezani fajlovi

- `backend/src/notifications/push-notification.service.ts`
- `mobile/lib/push-service.ts`
- `mobile/components/PushNotificationHandler.tsx`
