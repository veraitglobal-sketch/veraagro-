import { ValidationPipe } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import { ConfigService } from "@nestjs/config";
import { PassportModule } from "@nestjs/passport";
import { JwtService } from "@nestjs/jwt";
import { UserRole } from "@prisma/client";
import { PrismaService } from "../src/prisma/prisma.service";
import { JwtStrategy } from "../src/auth/strategies/jwt.strategy";
import { OrdersController } from "../src/orders/orders.controller";
import { OrdersService } from "../src/orders/orders.service";
import { PaymentsController } from "../src/payments/payments.controller";
import { PaymentsService } from "../src/payments/payments.service";
import { WalletsService } from "../src/wallets/wallets.service";
import { EmailService } from "../src/email/email.service";
import { NotificationsService } from "../src/notifications/notifications.service";
import { InvoicesService } from "../src/invoices/invoices.service";
import { DeliveriesController } from "../src/deliveries/deliveries.controller";
import { DeliveriesService } from "../src/deliveries/deliveries.service";
import { WaybillsService } from "../src/waybills/waybills.service";
import { InventoryController } from "../src/inventory/inventory.controller";
import { InventoryService } from "../src/inventory/inventory.service";
import { AuthController } from "../src/auth/auth.controller";
import { AuthService } from "../src/auth/auth.service";
import { LocalStrategy } from "../src/auth/strategies/local.strategy";
import { UsersService } from "../src/users/users.service";
import { NotificationsController } from "../src/notifications/notifications.controller";
import { PushNotificationService } from "../src/notifications/push-notification.service";
import { NotificationsGateway } from "../src/notifications/notifications.gateway";
import * as path from "node:path";
import * as bcrypt from "bcrypt";

import { writeFileSync, mkdirSync } from "node:fs";
import { BuyersController } from "../src/buyers/buyers.controller";
import { BuyersService } from "../src/buyers/buyers.service";
import { UsersController } from "../src/users/users.controller";

// Only the isolated runner can start this local simulator fixture.
const testUrl = process.env.BIOVERA_TEST_DATABASE_URL;
if (
  !testUrl ||
  process.env.DATABASE_URL !== testUrl ||
  process.env.NODE_ENV !== "test" ||
  new URL(testUrl).hostname !== "127.0.0.1" ||
  new URL(testUrl).pathname !== "/biovera_test"
)
  throw new Error("Use npm run test:mobile:api");

async function main() {
  const jwt = new JwtService({ secret: "isolated-integration-test-secret" });
  const values = {
    JWT_SECRET: "isolated-integration-test-secret",
    PLATFORM_WALLET_USER_ID: "admin",
  };
  const module = await Test.createTestingModule({
    imports: [PassportModule],
    controllers: [
      OrdersController,
      PaymentsController,
      DeliveriesController,
      InventoryController,
      AuthController,
      NotificationsController,
      BuyersController,
      UsersController,
    ],
    providers: [
      PrismaService,
      JwtStrategy,
      OrdersService,
      PaymentsService,
      WalletsService,
      DeliveriesService,
      InventoryService,
      AuthService,
      LocalStrategy,
      UsersService,
      BuyersService,
      { provide: JwtService, useValue: jwt },
      {
        provide: PushNotificationService,
        useValue: { sendToUser: async () => undefined, isEnabled: () => false },
      },
      {
        provide: ConfigService,
        useValue: {
          get: (key: string, fallback?: unknown) => values[key] ?? fallback,
        },
      },
      {
        provide: EmailService,
        useValue: { sendNewOrderAdminNotification: async () => undefined },
      },
      NotificationsService,
      NotificationsGateway,
      {
        provide: InvoicesService,
        useValue: { generateInvoice: async () => ({}) },
      },
      {
        provide: WaybillsService,
        useValue: { generateWaybill: async () => ({}) },
      },
    ],
  }).compile();

  const app = module.createNestApplication();
  app.useLogger(false);
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );
  const prisma = app.get(PrismaService);
  await prisma.$connect();
  const passwordHash = await bcrypt.hash("Buyer-test-2026!", 10);
  for (const [id, role] of Object.entries({
    admin: UserRole.SUPER_ADMIN,
    buyer: UserRole.BUYER,
    outsider: UserRole.BUYER,
    farmer: UserRole.GROWER,
    driver: UserRole.DRIVER,
  })) {
    await prisma.users.create({
      data: {
        id,
        partnerCode: id,
        firstName: id,
        lastName: "Test",
        passwordHash,
        roles: [role],
        status: "ACTIVE",
        updatedAt: new Date(),
      },
    });
  }
  await prisma.estates.create({
    data: {
      id: "farm",
      ownerId: "farmer",
      name: "Test farm",
      polygonCoordinates: {},
      calculatedArea: 1,
      status: "ACTIVE",
      updatedAt: new Date(),
    },
  });
  await prisma.estates.create({
    data: {
      id: "biov-vera-platform",
      ownerId: "admin",
      name: "Test platform",
      polygonCoordinates: {},
      calculatedArea: 0,
      status: "ACTIVE",
      updatedAt: new Date(),
    },
  });
  await prisma.hubs.create({
    data: {
      id: "hub",
      name: "Test hub",
      city: "Test City",
      address: "Test",
      location: {},
      updatedAt: new Date(),
    },
  });
  await prisma.inventory.create({
    data: {
      id: "stock",
      estateId: "farm",
      hubId: "hub",
      productName: "Tomato",
      quantity: 100,
      unit: "kg",
      unitPrice: 2.5,
      availableCities: [],
      updatedAt: new Date(),
    },
  });
  // Android emulator reaches this host-only listener through 10.0.2.2.
  await app.listen(0, "127.0.0.1");
  const port = app.getHttpServer().address().port;
  const output = path.resolve(__dirname, "../test-results/mobile");
  mkdirSync(output, { recursive: true });
  writeFileSync(
    path.join(output, "api.json"),
    JSON.stringify({ pid: process.pid, port, api: `http://127.0.0.1:${port}` }),
  );
  console.log(
    `MOBILE_TEST_API_READY http://127.0.0.1:${port}; test buyer: buyer`,
  );
  let closing = false;
  const stop = async () => {
    if (closing) return;
    closing = true;
    const orders = await prisma.orders.findMany({
      where: { buyerId: "buyer" },
      select: {
        id: true,
        productName: true,
        quantity: true,
        unitPrice: true,
        totalAmount: true,
        status: true,
        deliveryAddress: true,
      },
    });
    writeFileSync(
      path.join(output, "database-orders.json"),
      JSON.stringify(orders, null, 2),
    );
    await app.close();
  };
  process.once("SIGTERM", () => {
    void stop();
  });
  process.once("SIGINT", () => {
    void stop();
  });
}
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
