import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { EstatesModule } from './estates/estates.module';
import { SeedsModule } from './seeds/seeds.module';
import { ParcelsModule } from './parcels/parcels.module';
import { GrowthLogsModule } from './growth-logs/growth-logs.module';
import { NotificationsModule } from './notifications/notifications.module';
import { DigitalPassportsModule } from './digital-passports/digital-passports.module';
import { SmartLockModule } from './smart-lock/smart-lock.module';
import { AntiFraudModule } from './anti-fraud/anti-fraud.module';
import { OrdersModule } from './orders/orders.module';
import { PaymentsModule } from './payments/payments.module';
import { DeliveriesModule } from './deliveries/deliveries.module';
import { BatchesModule } from './batches/batches.module';
import { InventoryModule } from './inventory/inventory.module';
import { WalletsModule } from './wallets/wallets.module';
import { WaybillsModule } from './waybills/waybills.module';
import { InvoicesModule } from './invoices/invoices.module';
import { MarketPricesModule } from './market-prices/market-prices.module';
import { MissionsModule } from './missions/missions.module';
import { AuditTrailModule } from './audit-trail/audit-trail.module';
import { TemperatureModule } from './temperature/temperature.module';
import { QrModule } from './qr/qr.module';
import { KillSwitchModule } from './kill-switch/kill-switch.module';
import { AeoModule } from './aeo/aeo.module';
import { TrustScoreModule } from './trust-score/trust-score.module';
import { GeofencingModule } from './geofencing/geofencing.module';
import { CommandControlModule } from './command-control/command-control.module';
import { SkuModule } from './sku/sku.module';
import { RoutingModule } from './routing/routing.module';
import { OperationsModule } from './operations/operations.module';
import { QualityEntryModule } from './quality-entry/quality-entry.module';
import { BatchHistoryModule } from './batch-history/batch-history.module';
import { GrowerPortalModule } from './grower-portal/grower-portal.module';
import { MaterialControlModule } from './material-control/material-control.module';
import { FieldEntriesModule } from './field-entries/field-entries.module';
import { ComplianceModule } from './compliance/compliance.module';
import { LogisticsOptimizerModule } from './logistics-optimizer/logistics-optimizer.module';
import { MarketScraperModule } from './market-scraper/market-scraper.module';
import { ExportAutomatorModule } from './export-automator/export-automator.module';
import { HealthModule } from './health/health.module';
import { DistributorsModule } from './distributors/distributors.module';
import { SyncModule } from './sync/sync.module';
import { IntegrityGuardModule } from './integrity-guard/integrity-guard.module';
import { PricingModule } from './pricing/pricing.module';
import { VeraBonusModule } from './vera-bonus/vera-bonus.module';
import { ImageResizeModule } from './common/image/image-resize.module';
import { DigitalHandoverModule } from './digital-handover/digital-handover.module';
import { PlotMapperModule } from './plot-mapper/plot-mapper.module';
import { VeraInsightsModule } from './vera-insights/vera-insights.module';
import { SecurityAlertsModule } from './security-alerts/security-alerts.module';
import { AdminModule } from './admin/admin.module';
import { BuyersModule } from './buyers/buyers.module';
import { VeraTransparencyModule } from './vera-transparency/vera-transparency.module';
import { BuyerTradePanelModule } from './buyer-trade-panel/buyer-trade-panel.module';
import { HarvestAnnouncementsModule } from './harvest-announcements/harvest-announcements.module';
import { StandardEngineModule } from './standard-engine/standard-engine.module';
import { FinancialDashboardModule } from './financial-dashboard/financial-dashboard.module';
import { GroupSyncModule } from './group-sync/group-sync.module';
import { SuppliersModule } from './suppliers/suppliers.module';
import { B2bSuppliersModule } from './b2b-suppliers/b2b-suppliers.module';
import { GrowersModule } from './growers/growers.module';
import { LogisticsPartnerModule } from './logistics-partner/logistics-partner.module';
import { FarmerProfileModule } from './farmer-profile/farmer-profile.module';
import { MissionPassportModule } from './mission-passport/mission-passport.module';
import { EmailModule } from './email/email.module';
import { QualityControlLevelsModule } from './quality-control-levels/quality-control-levels.module';
import { ContactModule } from './contact/contact.module';
import { AiAssistantModule } from './ai-assistant/ai-assistant.module';
import { KycModule } from './kyc/kyc.module';
import { TreatmentLogsModule } from './treatment-logs/treatment-logs.module';
import { HaccpModule } from './haccp/haccp.module';
import { BlockchainModule } from './blockchain/blockchain.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ScheduleModule.forRoot(),
    ThrottlerModule.forRoot([{
      ttl: 60000, // 1 minute
      limit: 100, // PERFORMANCE: 100 requests per minute per user (prevents spam)
    }]),
    PrismaModule,
    AuthModule,
    UsersModule,
    EstatesModule,
    SeedsModule,
    ParcelsModule,
    GrowthLogsModule,
    NotificationsModule,
    DigitalPassportsModule,
    SmartLockModule,
    AntiFraudModule,
    OrdersModule,
    PaymentsModule,
    DeliveriesModule,
    BatchesModule,
    InventoryModule,
    WalletsModule,
    WaybillsModule,
    InvoicesModule,
    MarketPricesModule,
    MissionsModule,
    AuditTrailModule,
    TemperatureModule,
    QrModule,
    KillSwitchModule,
    AeoModule,
    TrustScoreModule,
    GeofencingModule,
    CommandControlModule,
    SkuModule,
    RoutingModule,
    OperationsModule,
    QualityEntryModule,
    BatchHistoryModule,
    GrowerPortalModule,
    MaterialControlModule,
    FieldEntriesModule,
    ComplianceModule,
    LogisticsOptimizerModule,
    MarketScraperModule,
    ExportAutomatorModule,
    HealthModule,
    DistributorsModule,
    SyncModule,
    IntegrityGuardModule,
    PricingModule,
    VeraBonusModule,
    ImageResizeModule,
    DigitalHandoverModule,
    PlotMapperModule,
    VeraInsightsModule,
    SecurityAlertsModule,
    AdminModule,
    BuyersModule,
    BuyerTradePanelModule,
    HarvestAnnouncementsModule,
    StandardEngineModule,
    FinancialDashboardModule,
    GroupSyncModule,
    SuppliersModule,
    B2bSuppliersModule,
    GrowersModule,
    LogisticsPartnerModule,
    FarmerProfileModule,
    MissionPassportModule,
    EmailModule,
    QualityControlLevelsModule,
    ContactModule,
    AiAssistantModule,
    KycModule,
    TreatmentLogsModule,
    HaccpModule,
    BlockchainModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
