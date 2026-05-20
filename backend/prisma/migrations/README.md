# Prisma migracije (PostgreSQL)

Ovaj folder je **izvor istine u gitu** za šemu baze: svaka podfolder-migracija ima `migration.sql` koja se primeni **jednom** po okruženju, redom po imenu foldera (timestamp prefiks).

## Šta je „squash“ baseline?

| Folder | Značenje |
|--------|----------|
| `20260426200000_squash_baseline` | **Jedan veliki SQL** koji podiže kompletan početni šemu (enums, tabele, indeksi, FK). Istorija *pre* squash-a **nije** kao niz malih fajlova u ovom repou — to je namera squasha (manje šuma, jedan „ground zero“). |

Sve migracije **posle** squash-a su **małe, imenovane** i vidi se tačno šta se menja ako otvoriš `migration.sql`.

## Redosled svih migracija (primena = leksikografski po imenu foldera)

| Folder | Kratak opis (iz imena + sadržaja) |
|--------|-----------------------------------|
| `20260203120000_logistics_drivers_pickup_proof` | Logistika — dokaz preuzimanja za vozače |
| `20260426120000_supplier_material_barcodes` | B2B barkodovi materijala dobavljača |
| `20260426200000_squash_baseline` | Početni puni šema snapshot |
| `20260427120000_order_fulfilling_estate` | Porudžbine — povezivanje sa njivom (fulfillment) |
| `20260427140000_growth_log_harvest_announcement` | Growth log ↔ harvest announcement |
| `20260428100000_order_status_approved` | Status porudžbine APPROVED |
| `20260428120000_logistics_handover_photos` | Fotografije logistics handover-a |
| `20260429090000_b2b_material_suppliers` | B2B dobavljači materijala |
| `20260430120000_partner_applications` | Partner aplikacije |
| `20260501100000_supplier_address_postal` | Poštanski podaci adrese dobavljača |
| `20260502120000_commercial_agent_assignment` | Dodela komercijalnog agenta |
| `20260502140000_wallet_transaction_platform_fee` | Wallet transakcije — platformska naknada |
| `20260502180000_ensure_handover_pickup_columns` | Handover — osiguravanje kolona pickup |
| `20260502190000_ensure_logistics_handover_status_enum` | Handover status enum usklađivanje |
| `20260503120000_supplier_catalog_items` | Stavke kataloga dobavljača |
| `20260503140000_supplier_catalog_image` | Slike u katalogu dobavljača |
| `20260503180000_buyer_delivery_issues` | Kupac — problemi isporuke |
| `20260504120000_supplier_store_self_service_fields` | Self-service polja prodavnice dobavljača |
| `20260505120000_grower_mobile_ingest` | Mobilni ingest za grower |
| `20260505130000_missions_harvest_announcement` | Misije ↔ `harvestAnnouncementId` na `missions` |
| `20260526200000_quality_entries_score` | Quality entries — skor |
| `20260527120000_supplier_order_farmer_received` | Porudžbina dobavljača — farmer „primio“ |
| `20260528140000_parcels_public_code` | Parcele — javni kod |
| `20260601120000_missions_destination_fields` | Misije — destinacija (adresa / grad) |
| `20260602120000_package_badges_handover_receiver` | Package badges — primalac pri predaji |
| `20260626120000_badge_print_orders_lifecycle` | Badge print orders — životni ciklus |
| `20260702120000_missions_order_id` | Misije ↔ `orderId` |
| `20260703120000_bio_white_list_material_type` | Bio whitelist — tip materijala |
| `20260704120000_align_logistics_handover_status_column` | Usklađivanje kolone statusa handover-a |
| `20260705120000_deliveries_buyer_pickup_confirmed_at` | Dostave — potvrda pickup-a kupca |
| `20260718120000_ensure_harvest_announcements_table` | Idempotentno kreira `harvest_announcements` + missions FK ako nedostaju |
| `20260720120000_ensure_bio_white_list_columns` | `bio_white_list`: `phiDays`, `mrlLimit`, `materialType` (legacy/Railway drift) |

## Kako proveriti šta je zaista primenjeno na serveru

U bazi (PostgreSQL):

```sql
SELECT migration_name, finished_at, rolled_back_at
FROM "_prisma_migrations"
ORDER BY finished_at NULLS LAST, migration_name;
```

Uporedi sa folderima u ovom direktorijumu — ako na serveru nedostaje red, treba `prisma migrate deploy`.

## Kako dodati novo (da „znaš šta si dodao“)

1. Menjaš `schema.prisma` u `backend/prisma/`.
2. Lokalno generišeš migraciju:

   ```bash
   cd backend && npx prisma migrate dev --name kratak_opis_promene
   ```

3. Obavezno:
   - **Deskriptivno ime** u `--name` (generiše folder `YYYYMMDD..._ime`).
   - Na vrh `migration.sql` dodaj **1–3 reda komentara** `-- šta i zašto` (posebno za produkciju / idempotent blokove).
4. Commit: `schema.prisma` + novi folder pod `migrations/` + ažuriraj **ovu tabelu u README** jednim redom.

## Deploy na Railway / produkciju

Migracije se **ne** pokreću iz Postgres servisa kao „Post-deploy“. Pokreću ih iz **API servisa** (Nest), npr. start komanda koja uključuje:

`npx prisma migrate deploy`

…sa `DATABASE_URL` koji pokazuje na Railway Postgres.

## Konvencija za idempotent / „ensure“ migracije

Migracije čiji naziv počinje sa `ensure_` često sadrže SQL koji proverava postojanje kolone/tipa pre `ALTER` — pogodno kad produkcija zaostaje ili je delimično ručno menjana.
