import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UserRole, UserStatus, SupplierDirectOrderStatus } from '@prisma/client';
import * as crypto from 'crypto';
import * as bcrypt from 'bcrypt';
import { AdminCreateSupplierStoreDto, CreateB2bSupplierProfileDto } from './dto/b2b-suppliers.dto';
import { buildStreetAddressLine, geocodeAddressNominatim } from './address-geocoding';

@Injectable()
export class B2bSuppliersService {
  constructor(private readonly prisma: PrismaService) {}

  /** Ručne koordinate ili geokodiranje ulice + poštanski broj + grad + država */
  private async resolveMapLocation(
    input: { street: string; houseNumber?: string; postalCode: string; city: string; country: string },
    override?: { latitude?: number; longitude?: number },
  ): Promise<{ lat: number; lng: number }> {
    if (
      override?.latitude != null &&
      override?.longitude != null &&
      !Number.isNaN(Number(override.latitude)) &&
      !Number.isNaN(Number(override.longitude))
    ) {
      return { lat: Number(override.latitude), lng: Number(override.longitude) };
    }
    const addressLine1 = buildStreetAddressLine(input.street, input.houseNumber);
    const g = await geocodeAddressNominatim({
      addressLine1,
      postalCode: input.postalCode,
      city: input.city,
      country: input.country,
    });
    if (!g) {
      throw new BadRequestException(
        'Could not find coordinates for this address. Check street, postal code, city, country — or set latitude and longitude manually.',
      );
    }
    return g;
  }

  /** Javna mapa: snabdevači sa odobrenom lokacijom i validnim koordinatama */
  async getPublicMapPins() {
    const profiles = await this.prisma.material_supplier_profiles.findMany({
      where: { mapApproved: true },
      include: { user: { select: { id: true, firstName: true, lastName: true, partnerCode: true, status: true } } },
    });
    return profiles
      .map((p) => {
        const loc = p.location as { lat?: number; lng?: number; latitude?: number; longitude?: number };
        const lat = loc?.lat ?? loc?.latitude;
        const lng = loc?.lng ?? loc?.longitude;
        if (typeof lat !== 'number' || typeof lng !== 'number' || (lat === 0 && lng === 0)) return null;
        return {
          id: p.userId,
          profileId: p.id,
          name: p.businessName,
          city: p.city,
          country: p.country,
          address: p.address,
          latitude: lat,
          longitude: lng,
          type: 'MATERIAL_SUPPLIER',
          kind: 'supplier' as const,
          description: p.description,
          partnerCode: p.user?.partnerCode,
        };
      })
      .filter(Boolean);
  }

  async getPublicSupplier(userId: string) {
    const p = await this.prisma.material_supplier_profiles.findUnique({
      where: { userId },
      include: { user: { select: { id: true, firstName: true, lastName: true, partnerCode: true, email: true, phone: true, status: true, roles: true } } },
    });
    if (!p || !p.mapApproved) throw new NotFoundException('Supplier not found');
    const loc = p.location as { lat?: number; lng?: number };
    return {
      id: p.userId,
      businessName: p.businessName,
      description: p.description,
      address: p.address,
      postalCode: p.postalCode,
      city: p.city,
      country: p.country,
      location: p.location,
      partnerCode: p.user?.partnerCode,
      contactEmail: p.user?.email,
      contactPhone: p.user?.phone,
    };
  }

  private assertGrower(roles: UserRole[] | string[]) {
    const r = roles as string[];
    if (!r.some((x) => ['GROWER', 'FARMER', 'PARTNER', 'SUPER_ADMIN', 'ADMIN'].includes(x)))
      throw new ForbiddenException('Only growers (farmers) can use this action');
  }

  private assertSupplier(roles: UserRole[] | string[]) {
    if (!(roles as string[]).includes('MATERIAL_SUPPLIER')) throw new ForbiddenException('Supplier role required');
  }

  /**
   * Admin: create a partner “supplier store” account — one login + material_supplier_profiles row.
   * No public registration; e.g. agricultural pharmacies you contract as Vera partners.
   */
  async adminCreateSupplierStore(adminUserId: string, dto: AdminCreateSupplierStoreDto) {
    const emailNorm = dto.email.trim().toLowerCase();
    const emailTaken = await this.prisma.users.findFirst({ where: { email: emailNorm } });
    if (emailTaken) throw new ConflictException('Email already in use');

    let partnerCode = dto.partnerCode?.trim();
    if (partnerCode) {
      const taken = await this.prisma.users.findUnique({ where: { partnerCode } });
      if (taken) throw new ConflictException('Partner code already in use');
    } else {
      for (let attempt = 0; attempt < 40; attempt++) {
        const candidate = `SUP-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
        const t = await this.prisma.users.findUnique({ where: { partnerCode: candidate } });
        if (!t) {
          partnerCode = candidate;
          break;
        }
      }
      if (!partnerCode) throw new BadRequestException('Could not assign a unique partner code');
    }

    let password = dto.password;
    let passwordGenerated = false;
    if (dto.autoGeneratePassword || !password) {
      const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
      password = '';
      for (let i = 0; i < 12; i++) {
        password += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      passwordGenerated = true;
    }
    const passwordHash = await bcrypt.hash(password!, 10);

    const mapApproved = dto.mapApproved === true;
    const now = new Date();

    const addressLine1 = buildStreetAddressLine(dto.street, dto.houseNumber);
    const { lat, lng } = await this.resolveMapLocation(
      {
        street: dto.street,
        houseNumber: dto.houseNumber,
        postalCode: dto.postalCode,
        city: dto.city,
        country: dto.country,
      },
      { latitude: dto.latitude, longitude: dto.longitude },
    );

    const { user, profile } = await this.prisma.$transaction(async (tx) => {
      const user = await tx.users.create({
        data: {
          id: crypto.randomUUID(),
          partnerCode: partnerCode!,
          email: emailNorm,
          phone: dto.phone?.trim() || null,
          firstName: dto.firstName.trim(),
          lastName: dto.lastName.trim(),
          passwordHash,
          roles: [UserRole.MATERIAL_SUPPLIER],
          status: UserStatus.ACTIVE,
          isVeraPartner: dto.isVeraPartner !== false,
          updatedAt: now,
        },
      });

      const profile = await tx.material_supplier_profiles.create({
        data: {
          id: crypto.randomUUID(),
          userId: user.id,
          businessName: dto.businessName.trim(),
          description: dto.description?.trim() || null,
          address: addressLine1,
          postalCode: dto.postalCode.trim(),
          city: dto.city.trim(),
          country: dto.country.trim(),
          location: { lat, lng } as any,
          mapApproved,
          approvedAt: mapApproved ? now : null,
          approvedByUserId: mapApproved ? adminUserId : null,
          updatedAt: now,
        },
      });

      return { user, profile };
    });

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { passwordHash: _omit, ...userWithoutPassword } = user;
    return {
      user: userWithoutPassword,
      profile,
      password: passwordGenerated ? password : undefined,
      passwordGenerated,
    };
  }

  async upsertMyProfile(userId: string, dto: CreateB2bSupplierProfileDto) {
    this.assertSupplier((await this.prisma.users.findUniqueOrThrow({ where: { id: userId } })).roles);
    const addressLine1 = buildStreetAddressLine(dto.street, dto.houseNumber);
    const { lat, lng } = await this.resolveMapLocation(
      { street: dto.street, houseNumber: dto.houseNumber, postalCode: dto.postalCode, city: dto.city, country: dto.country },
      { latitude: dto.latitude, longitude: dto.longitude },
    );
    return this.prisma.material_supplier_profiles.upsert({
      where: { userId },
      create: {
        id: crypto.randomUUID(),
        userId,
        businessName: dto.businessName,
        description: dto.description,
        address: addressLine1,
        postalCode: dto.postalCode.trim(),
        city: dto.city,
        country: dto.country,
        location: { lat, lng } as any,
        updatedAt: new Date(),
      },
      update: {
        businessName: dto.businessName,
        description: dto.description,
        address: addressLine1,
        postalCode: dto.postalCode.trim(),
        city: dto.city,
        country: dto.country,
        location: { lat, lng } as any,
        updatedAt: new Date(),
      },
    });
  }

  async getMyProfile(userId: string) {
    return this.prisma.material_supplier_profiles.findUnique({ where: { userId } });
  }

  async approveMap(adminUserId: string, supplierUserId: string) {
    const u = await this.prisma.users.findUnique({ where: { id: supplierUserId } });
    if (!u) throw new NotFoundException('User not found');
    if (!u.roles.includes('MATERIAL_SUPPLIER' as any)) {
      throw new BadRequestException('User is not a MATERIAL_SUPPLIER');
    }
    const p = await this.prisma.material_supplier_profiles.findUnique({ where: { userId: supplierUserId } });
    if (!p) throw new BadRequestException('Supplier must create a profile first');
    return this.prisma.material_supplier_profiles.update({
      where: { userId: supplierUserId },
      data: { mapApproved: true, approvedAt: new Date(), approvedByUserId: adminUserId, updatedAt: new Date() },
    });
  }

  async getOrCreateThread(farmerId: string, supplierUserId: string) {
    this.assertGrower(
      (await this.prisma.users.findUniqueOrThrow({ where: { id: farmerId } })).roles,
    );
    const supplier = await this.prisma.users.findUnique({ where: { id: supplierUserId } });
    if (!supplier || !supplier.roles.includes('MATERIAL_SUPPLIER' as any)) {
      throw new BadRequestException('Not a material supplier');
    }
    const prof = await this.prisma.material_supplier_profiles.findUnique({ where: { userId: supplierUserId } });
    if (!prof || !prof.mapApproved) throw new BadRequestException('Supplier is not visible on the map');
    return this.prisma.supplier_threads.upsert({
      where: { farmerId_supplierUserId: { farmerId, supplierUserId } },
      create: {
        id: crypto.randomUUID(),
        farmerId,
        supplierUserId,
        lastMessageAt: new Date(),
        updatedAt: new Date(),
      },
      update: { updatedAt: new Date() },
    });
  }

  async listMyThreadsAsFarmer(farmerId: string) {
    return this.prisma.supplier_threads.findMany({
      where: { farmerId },
      include: {
        supplier: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            partnerCode: true,
            material_supplier_profile: { select: { businessName: true, city: true, country: true } },
          },
        },
      },
      orderBy: { lastMessageAt: 'desc' },
    });
  }

  async listMyThreadsAsSupplier(supplierUserId: string) {
    this.assertSupplier((await this.prisma.users.findUniqueOrThrow({ where: { id: supplierUserId } })).roles);
    return this.prisma.supplier_threads.findMany({
      where: { supplierUserId },
      include: { farmer: { select: { id: true, firstName: true, lastName: true, partnerCode: true } } },
      orderBy: { lastMessageAt: 'desc' },
    });
  }

  async listMessages(userId: string, threadId: string) {
    const t = await this.prisma.supplier_threads.findUnique({ where: { id: threadId } });
    if (!t) throw new NotFoundException('Thread not found');
    if (t.farmerId !== userId && t.supplierUserId !== userId) throw new ForbiddenException();
    return this.prisma.supplier_thread_messages.findMany({
      where: { threadId },
      orderBy: { createdAt: 'asc' },
      include: { sender: { select: { id: true, firstName: true, lastName: true, partnerCode: true } } },
    });
  }

  async postMessage(userId: string, threadId: string, body: string) {
    if (!body?.trim()) throw new BadRequestException('Message body required');
    const t = await this.prisma.supplier_threads.findUnique({ where: { id: threadId } });
    if (!t) throw new NotFoundException('Thread not found');
    if (t.farmerId !== userId && t.supplierUserId !== userId) throw new ForbiddenException();
    const msg = await this.prisma.supplier_thread_messages.create({
      data: {
        id: crypto.randomUUID(),
        threadId,
        senderId: userId,
        body: body.trim(),
      },
    });
    await this.prisma.supplier_threads.update({
      where: { id: threadId },
      data: { lastMessageAt: new Date(), updatedAt: new Date() },
    });
    return msg;
  }

  async createDirectOrder(
    farmerId: string,
    data: { supplierUserId: string; items: { label: string; quantity: number; unit?: string }[]; note?: string; threadId?: string },
  ) {
    this.assertGrower((await this.prisma.users.findUniqueOrThrow({ where: { id: farmerId } })).roles);
    const supplier = await this.prisma.users.findUnique({ where: { id: data.supplierUserId } });
    if (!supplier?.roles.includes('MATERIAL_SUPPLIER' as any)) throw new BadRequestException('Invalid supplier');
    const prof = await this.prisma.material_supplier_profiles.findUnique({ where: { userId: data.supplierUserId } });
    if (!prof?.mapApproved) throw new BadRequestException('Supplier not on map');
    let threadId = data.threadId ?? null;
    if (threadId) {
      const th = await this.prisma.supplier_threads.findFirst({
        where: { id: threadId, farmerId, supplierUserId: data.supplierUserId },
      });
      if (!th) throw new BadRequestException('Invalid thread');
    } else {
      const th = await this.getOrCreateThread(farmerId, data.supplierUserId);
      threadId = th.id;
    }
    return this.prisma.supplier_direct_orders.create({
      data: {
        id: crypto.randomUUID(),
        farmerId,
        supplierUserId: data.supplierUserId,
        threadId,
        status: 'PENDING',
        items: data.items as any,
        noteFromFarmer: data.note,
        updatedAt: new Date(),
      },
    });
  }

  async listOrdersForFarmer(farmerId: string) {
    return this.prisma.supplier_direct_orders.findMany({
      where: { farmerId },
      orderBy: { createdAt: 'desc' },
      include: { supplier: { select: { firstName: true, lastName: true, partnerCode: true } } },
    });
  }

  async listOrdersForSupplier(supplierUserId: string) {
    this.assertSupplier(
      (await this.prisma.users.findUniqueOrThrow({ where: { id: supplierUserId } })).roles,
    );
    return this.prisma.supplier_direct_orders.findMany({
      where: { supplierUserId },
      orderBy: { createdAt: 'desc' },
      include: { farmer: { select: { firstName: true, lastName: true, partnerCode: true } } },
    });
  }

  async updateOrderStatus(
    supplierUserId: string,
    orderId: string,
    status: SupplierDirectOrderStatus,
    noteFromSupplier?: string,
  ) {
    this.assertSupplier(
      (await this.prisma.users.findUniqueOrThrow({ where: { id: supplierUserId } })).roles,
    );
    const o = await this.prisma.supplier_direct_orders.findFirst({
      where: { id: orderId, supplierUserId },
    });
    if (!o) throw new NotFoundException();
    return this.prisma.supplier_direct_orders.update({
      where: { id: orderId },
      data: { status, noteFromSupplier, updatedAt: new Date() },
    });
  }
}
