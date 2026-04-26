import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  UserRole,
  UserStatus,
  SupplierDirectOrderStatus,
  SupplierMaterialBarcodeStatus,
} from '@prisma/client';
import * as crypto from 'crypto';
import * as bcrypt from 'bcrypt';
import {
  AdminCreateSupplierStoreDto,
  CreateB2bSupplierProfileDto,
  CreateCatalogItemDto,
  RegisterSupplierMaterialBarcodeDto,
  UpdateB2bSupplierStoreDto,
  UpdateCatalogItemDto,
  UpdateSupplierMaterialBarcodeDto,
} from './dto/b2b-suppliers.dto';
import { buildStreetAddressLine, geocodeAddressNominatim } from './address-geocoding';

@Injectable()
export class B2bSuppliersService {
  constructor(private readonly prisma: PrismaService) {}

  private normLocationPart(s: string | null | undefined) {
    return (s ?? '').trim().toLowerCase();
  }

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
    const catalog = await this.prisma.supplier_catalog_items.findMany({
      where: { supplierUserId: userId, isActive: true },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      select: {
        id: true,
        name: true,
        description: true,
        unit: true,
        listPrice: true,
        sku: true,
        imageUrl: true,
      },
    });
    return {
      id: p.userId,
      businessName: p.businessName,
      description: p.description,
      website: p.website,
      address: p.address,
      postalCode: p.postalCode,
      city: p.city,
      country: p.country,
      location: p.location,
      partnerCode: p.user?.partnerCode,
      contactEmail: p.user?.email,
      contactPhone: p.user?.phone,
      catalog,
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
          website: dto.website?.trim() || null,
          street: dto.street.trim(),
          houseNumber: dto.houseNumber?.trim() || null,
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
        website: dto.website?.trim() || null,
        street: dto.street.trim(),
        houseNumber: dto.houseNumber?.trim() || null,
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
        website: dto.website?.trim() || null,
        street: dto.street.trim(),
        houseNumber: dto.houseNumber?.trim() || null,
        address: addressLine1,
        postalCode: dto.postalCode.trim(),
        city: dto.city,
        country: dto.country,
        location: { lat, lng } as any,
        updatedAt: new Date(),
      },
    });
  }

  /**
   * Logged-in supplier: public store + own contact. Changing address or coordinates clears map
   * approval until Bio Vera verifies again.
   */
  async updateMyStoreSettings(userId: string, dto: UpdateB2bSupplierStoreDto) {
    this.assertSupplier(
      (await this.prisma.users.findUniqueOrThrow({ where: { id: userId } })).roles,
    );
    const prof = await this.prisma.material_supplier_profiles.findUnique({ where: { userId } });
    if (!prof) {
      throw new BadRequestException('No store profile found.');
    }
    const user = await this.prisma.users.findUniqueOrThrow({ where: { id: userId } });

    if (dto.email !== undefined) {
      const emailNorm = dto.email.trim().toLowerCase();
      if (!emailNorm) {
        throw new BadRequestException('Email cannot be empty');
      }
      if (emailNorm !== (user.email || '').toLowerCase()) {
        const taken = await this.prisma.users.findFirst({
          where: { email: emailNorm, NOT: { id: userId } },
        });
        if (taken) {
          throw new ConflictException('This email is already in use');
        }
      }
    }

    const userData: {
      email?: string;
      phone?: string | null;
      firstName?: string;
      lastName?: string;
      updatedAt: Date;
    } = { updatedAt: new Date() };
    if (dto.email !== undefined) {
      userData.email = dto.email.trim().toLowerCase();
    }
    if (dto.phone !== undefined) {
      userData.phone = dto.phone.trim() || null;
    }
    if (dto.firstName !== undefined) {
      userData.firstName = dto.firstName.trim();
    }
    if (dto.lastName !== undefined) {
      userData.lastName = dto.lastName.trim();
    }
    if (Object.keys(userData).length > 1) {
      await this.prisma.users.update({ where: { id: userId }, data: userData });
    }

    const addressFieldsInRequest =
      dto.street !== undefined ||
      dto.houseNumber !== undefined ||
      dto.postalCode !== undefined ||
      dto.city !== undefined ||
      dto.country !== undefined;
    const coordsTouched = dto.latitude != null && dto.longitude != null;
    const anyAddressUpdateIntent = addressFieldsInRequest || coordsTouched;

    const hasProfileField =
      dto.businessName !== undefined ||
      dto.description !== undefined ||
      dto.website !== undefined ||
      anyAddressUpdateIntent;

    if (!hasProfileField) {
      return this.getMyProfile(userId);
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const profileData: Record<string, any> = { updatedAt: new Date() };

    if (dto.businessName !== undefined) {
      profileData.businessName = dto.businessName.trim();
    }
    if (dto.description !== undefined) {
      profileData.description = dto.description?.trim() || null;
    }
    if (dto.website !== undefined) {
      const w = dto.website.trim();
      if (!w) {
        profileData.website = null;
      } else {
        let u = w;
        if (!/^https?:\/\//i.test(u)) {
          u = `https://${u}`;
        }
        try {
          // eslint-disable-next-line no-new
          new URL(u);
        } catch {
          throw new BadRequestException('Invalid website URL');
        }
        profileData.website = u;
      }
    }

    if (anyAddressUpdateIntent) {
      const streetM = (dto.street !== undefined ? dto.street : prof.street || prof.address).trim();
      if (!streetM) {
        throw new BadRequestException('Street is required');
      }
      const houseM =
        dto.houseNumber !== undefined
          ? dto.houseNumber?.trim() || null
          : prof.houseNumber;
      const postalM = (dto.postalCode !== undefined ? dto.postalCode : prof.postalCode)?.trim() || '';
      if (!postalM) {
        throw new BadRequestException('Postal code is required');
      }
      const cityM = (dto.city !== undefined ? dto.city : prof.city).trim();
      if (!cityM) {
        throw new BadRequestException('City is required');
      }
      const countryM = (dto.country !== undefined ? dto.country : prof.country).trim();
      if (!countryM) {
        throw new BadRequestException('Country is required');
      }

      const keyBefore = [
        this.normLocationPart(prof.street || prof.address),
        this.normLocationPart(prof.houseNumber),
        this.normLocationPart(prof.postalCode),
        this.normLocationPart(prof.city),
        this.normLocationPart(prof.country),
      ].join('|');
      const keyAfter = [
        this.normLocationPart(streetM),
        this.normLocationPart(houseM),
        this.normLocationPart(postalM),
        this.normLocationPart(cityM),
        this.normLocationPart(countryM),
      ].join('|');
      const addressTextChanged = keyBefore !== keyAfter;

      if (addressTextChanged || coordsTouched) {
        const { lat, lng } = await this.resolveMapLocation(
          { street: streetM, houseNumber: houseM || undefined, postalCode: postalM, city: cityM, country: countryM },
          coordsTouched ? { latitude: dto.latitude, longitude: dto.longitude } : undefined,
        );

        profileData.street = streetM;
        profileData.houseNumber = houseM;
        profileData.address = buildStreetAddressLine(streetM, houseM || undefined);
        profileData.postalCode = postalM;
        profileData.city = cityM;
        profileData.country = countryM;
        profileData.location = { lat, lng };
        profileData.mapApproved = false;
        profileData.approvedAt = null;
        profileData.approvedByUserId = null;
      }
    }

    const profileKeys = Object.keys(profileData).filter((k) => k !== 'updatedAt');
    if (profileKeys.length > 0) {
      await this.prisma.material_supplier_profiles.update({ where: { userId }, data: profileData });
    }
    return this.getMyProfile(userId);
  }

  async getMyProfile(userId: string) {
    this.assertSupplier(
      (await this.prisma.users.findUniqueOrThrow({ where: { id: userId } })).roles,
    );
    const p = await this.prisma.material_supplier_profiles.findUnique({ where: { userId } });
    if (!p) {
      return null;
    }
    const u = await this.prisma.users.findUnique({
      where: { id: userId },
      select: { email: true, phone: true, firstName: true, lastName: true },
    });
    return {
      ...p,
      email: u?.email,
      phone: u?.phone,
      firstName: u?.firstName,
      lastName: u?.lastName,
    };
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

  async listMyCatalog(supplierUserId: string) {
    this.assertSupplier(
      (await this.prisma.users.findUniqueOrThrow({ where: { id: supplierUserId } })).roles,
    );
    return this.prisma.supplier_catalog_items.findMany({
      where: { supplierUserId },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    });
  }

  async createCatalogItem(supplierUserId: string, dto: CreateCatalogItemDto) {
    this.assertSupplier(
      (await this.prisma.users.findUniqueOrThrow({ where: { id: supplierUserId } })).roles,
    );
    const count = await this.prisma.supplier_catalog_items.count({ where: { supplierUserId } });
    return this.prisma.supplier_catalog_items.create({
      data: {
        id: crypto.randomUUID(),
        supplierUserId,
        name: dto.name.trim(),
        description: dto.description?.trim() || null,
        unit: (dto.unit || 'unit').trim() || 'unit',
        listPrice:
          dto.listPrice != null && !Number.isNaN(Number(dto.listPrice)) ? Number(dto.listPrice) : null,
        sku: dto.sku?.trim() || null,
        sortOrder: count,
        updatedAt: new Date(),
      },
    });
  }

  async updateCatalogItem(supplierUserId: string, id: string, dto: UpdateCatalogItemDto) {
    this.assertSupplier(
      (await this.prisma.users.findUniqueOrThrow({ where: { id: supplierUserId } })).roles,
    );
    const row = await this.prisma.supplier_catalog_items.findFirst({ where: { id, supplierUserId } });
    if (!row) throw new NotFoundException('Catalog item not found');
    const data: Record<string, unknown> = { updatedAt: new Date() };
    if (dto.name !== undefined) data.name = dto.name.trim();
    if (dto.description !== undefined) data.description = dto.description?.trim() || null;
    if (dto.unit !== undefined) data.unit = dto.unit.trim() || 'unit';
    if (dto.listPrice !== undefined) {
      data.listPrice =
        dto.listPrice != null && !Number.isNaN(Number(dto.listPrice)) ? Number(dto.listPrice) : null;
    }
    if (dto.sku !== undefined) data.sku = dto.sku?.trim() || null;
    if (dto.isActive !== undefined) data.isActive = dto.isActive;
    if (dto.sortOrder !== undefined) data.sortOrder = dto.sortOrder;
    return this.prisma.supplier_catalog_items.update({ where: { id }, data: data as any });
  }

  async deleteCatalogItem(supplierUserId: string, id: string) {
    this.assertSupplier(
      (await this.prisma.users.findUniqueOrThrow({ where: { id: supplierUserId } })).roles,
    );
    const row = await this.prisma.supplier_catalog_items.findFirst({ where: { id, supplierUserId } });
    if (!row) throw new NotFoundException('Catalog item not found');
    await this.prisma.supplier_catalog_items.delete({ where: { id } });
    return { ok: true };
  }

  /**
   * Product photo: Vercel Blob when BLOB_READ_WRITE_TOKEN is set, else data URL in DB.
   */
  async uploadCatalogItemImage(
    supplierUserId: string,
    itemId: string,
    file: { buffer: Buffer; mimetype: string; size: number },
  ) {
    this.assertSupplier(
      (await this.prisma.users.findUniqueOrThrow({ where: { id: supplierUserId } })).roles,
    );
    if (!file?.buffer?.length) {
      throw new BadRequestException('No image file');
    }
    const allowed = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowed.includes(file.mimetype)) {
      throw new BadRequestException('Invalid file type. Only JPEG, PNG, and WebP are allowed.');
    }
    const max = 3 * 1024 * 1024;
    if (file.size > max) {
      throw new BadRequestException('File size exceeds 3MB');
    }
    const item = await this.prisma.supplier_catalog_items.findFirst({
      where: { id: itemId, supplierUserId },
    });
    if (!item) {
      throw new NotFoundException('Catalog item not found');
    }
    const token = (process.env.BLOB_READ_WRITE_TOKEN || '').trim();
    if (token) {
      const { put } = await import('@vercel/blob');
      const ext =
        file.mimetype === 'image/png' ? 'png' : file.mimetype === 'image/webp' ? 'webp' : 'jpg';
      const key = `supplier-catalog/${supplierUserId}/${itemId}-${Date.now()}.${ext}`;
      const out = await put(key, file.buffer, { access: 'public', token });
      return this.prisma.supplier_catalog_items.update({
        where: { id: itemId },
        data: { imageUrl: out.url, updatedAt: new Date() },
      });
    }
    const dataUrl = `data:${file.mimetype};base64,${file.buffer.toString('base64')}`;
    if (dataUrl.length > 2_500_000) {
      throw new BadRequestException(
        'Image is too large for inline storage. Set BLOB_READ_WRITE_TOKEN or use a smaller image.',
      );
    }
    return this.prisma.supplier_catalog_items.update({
      where: { id: itemId },
      data: { imageUrl: dataUrl, updatedAt: new Date() },
    });
  }

  async deleteCatalogItemImage(supplierUserId: string, itemId: string) {
    this.assertSupplier(
      (await this.prisma.users.findUniqueOrThrow({ where: { id: supplierUserId } })).roles,
    );
    const item = await this.prisma.supplier_catalog_items.findFirst({
      where: { id: itemId, supplierUserId },
    });
    if (!item) {
      throw new NotFoundException('Catalog item not found');
    }
    return this.prisma.supplier_catalog_items.update({
      where: { id: itemId },
      data: { imageUrl: null, updatedAt: new Date() },
    });
  }

  /**
   * Admin: snabdevači ↔ proizvođači (niti, porudžbine) na jednom mestu
   */
  async adminGetNetworkOverview() {
    const [
      profiles,
      threadCountRows,
      orderCountRows,
      allThreads,
      orderFarmerLinks,
      recentOrders,
    ] = await Promise.all([
      this.prisma.material_supplier_profiles.findMany({
        include: {
          user: {
            select: {
              id: true,
              partnerCode: true,
              firstName: true,
              lastName: true,
              status: true,
              email: true,
              phone: true,
            },
          },
        },
        orderBy: { businessName: 'asc' },
      }),
      this.prisma.supplier_threads.groupBy({
        by: ['supplierUserId'],
        _count: { _all: true },
      }),
      this.prisma.supplier_direct_orders.groupBy({
        by: ['supplierUserId'],
        _count: { _all: true },
      }),
      this.prisma.supplier_threads.findMany({
        include: {
          farmer: { select: { id: true, firstName: true, lastName: true, partnerCode: true } },
        },
      }),
      this.prisma.supplier_direct_orders.findMany({
        select: { supplierUserId: true, farmerId: true },
      }),
      this.prisma.supplier_direct_orders.findMany({
        take: 50,
        orderBy: { createdAt: 'desc' },
        include: {
          farmer: { select: { id: true, firstName: true, lastName: true, partnerCode: true } },
          supplier: {
            select: {
              id: true,
              partnerCode: true,
              firstName: true,
              lastName: true,
              material_supplier_profile: {
                select: { businessName: true, city: true, country: true },
              },
            },
          },
        },
      }),
    ]);

    const threadCountBy = new Map(threadCountRows.map((r) => [r.supplierUserId, r._count._all]));
    const orderCountBy = new Map(orderCountRows.map((r) => [r.supplierUserId, r._count._all]));

    const supplierToFarmerIds = new Map<string, Set<string>>();
    const hasThread = new Map<string, Set<string>>();
    for (const t of allThreads) {
      if (!supplierToFarmerIds.has(t.supplierUserId)) {
        supplierToFarmerIds.set(t.supplierUserId, new Set());
        hasThread.set(t.supplierUserId, new Set());
      }
      supplierToFarmerIds.get(t.supplierUserId)!.add(t.farmerId);
      hasThread.get(t.supplierUserId)!.add(t.farmerId);
    }
    const hasOrder = new Map<string, Set<string>>();
    for (const o of orderFarmerLinks) {
      if (!supplierToFarmerIds.has(o.supplierUserId)) {
        supplierToFarmerIds.set(o.supplierUserId, new Set());
      }
      supplierToFarmerIds.get(o.supplierUserId)!.add(o.farmerId);
      if (!hasOrder.has(o.supplierUserId)) hasOrder.set(o.supplierUserId, new Set());
      hasOrder.get(o.supplierUserId)!.add(o.farmerId);
    }

    const allFarmerIds = [...new Set([...supplierToFarmerIds.values()].flatMap((s) => [...s]))];
    const farmerRows =
      allFarmerIds.length === 0
        ? []
        : await this.prisma.users.findMany({
            where: { id: { in: allFarmerIds } },
            select: { id: true, firstName: true, lastName: true, partnerCode: true, status: true },
          });
    const farmerById = new Map(farmerRows.map((f) => [f.id, f]));

    const suppliers = profiles.map((p) => {
      const sid = p.userId;
      const fids = supplierToFarmerIds.get(sid) ?? new Set();
      const threadSet = hasThread.get(sid) ?? new Set();
      const orderSet = hasOrder.get(sid) ?? new Set();
      const linkedFarmers = [...fids]
        .map((fid) => {
          const u = farmerById.get(fid);
          if (!u) return null;
          return {
            id: u.id,
            firstName: u.firstName,
            lastName: u.lastName,
            partnerCode: u.partnerCode,
            status: u.status,
            hasMessageThread: threadSet.has(fid),
            hasOrder: orderSet.has(fid),
          };
        })
        .filter((x): x is NonNullable<typeof x> => x != null)
        .sort((a, b) => a.lastName.localeCompare(b.lastName) || a.firstName.localeCompare(b.firstName));

      return {
        userId: sid,
        businessName: p.businessName,
        address: p.address,
        city: p.city,
        country: p.country,
        mapApproved: p.mapApproved,
        user: p.user,
        stats: {
          threadCount: threadCountBy.get(sid) ?? 0,
          orderCount: orderCountBy.get(sid) ?? 0,
          /** Jedinstveni proizvođači povezani (poruke i/ili porudžbina) */
          linkedFarmerCount: fids.size,
        },
        linkedFarmers,
      };
    });

    return {
      suppliers,
      recentOrders: recentOrders.map((o) => ({
        id: o.id,
        status: o.status,
        createdAt: o.createdAt,
        items: o.items,
        noteFromFarmer: o.noteFromFarmer,
        farmer: o.farmer,
        supplier: {
          id: o.supplier.id,
          partnerCode: o.supplier.partnerCode,
          businessName: o.supplier.material_supplier_profile?.businessName ?? null,
          city: o.supplier.material_supplier_profile?.city ?? null,
        },
      })),
    };
  }

  private normMaterialBarcode(s: string) {
    return s.trim().replace(/\s+/g, '');
  }

  /**
   * Public: resolve a physical unit (registered by a supplier) — used by grower app / scanner fallback.
   */
  async publicLookupMaterialBarcode(code: string | undefined) {
    const bar = code ? this.normMaterialBarcode(code) : '';
    if (bar.length < 3) {
      return { registered: false as const, message: 'Code too short' };
    }
    const row = await this.prisma.supplier_material_barcodes.findUnique({
      where: { barcode: bar },
      include: {
        catalogItem: { select: { name: true, unit: true } },
        supplier: {
          select: {
            partnerCode: true,
            material_supplier_profile: { select: { businessName: true } },
          },
        },
      },
    });
    if (!row) {
      return { registered: false as const };
    }
    return {
      registered: true as const,
      status: row.status,
      businessName: row.supplier?.material_supplier_profile?.businessName ?? null,
      partnerCode: row.supplier?.partnerCode ?? null,
      productName: row.catalogItem?.name ?? null,
      unit: row.catalogItem?.unit ?? null,
      lotNumber: row.lotNumber,
    };
  }

  async listMyMaterialBarcodes(supplierUserId: string, status?: string) {
    this.assertSupplier(
      (await this.prisma.users.findUniqueOrThrow({ where: { id: supplierUserId } })).roles,
    );
    const where: {
      supplierUserId: string;
      status?: SupplierMaterialBarcodeStatus;
    } = { supplierUserId };
    if (status && ['IN_STOCK', 'SOLD', 'VOID'].includes(status)) {
      where.status = status as SupplierMaterialBarcodeStatus;
    }
    return this.prisma.supplier_material_barcodes.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        catalogItem: { select: { id: true, name: true, unit: true, sku: true } },
        soldToFarmer: { select: { id: true, firstName: true, lastName: true, partnerCode: true } },
        directOrder: { select: { id: true, status: true, createdAt: true } },
      },
    });
  }

  async registerMaterialBarcode(supplierUserId: string, dto: RegisterSupplierMaterialBarcodeDto) {
    this.assertSupplier(
      (await this.prisma.users.findUniqueOrThrow({ where: { id: supplierUserId } })).roles,
    );
    const bar = this.normMaterialBarcode(dto.barcode);
    if (bar.length < 3) {
      throw new BadRequestException('Barcode is too short');
    }
    const existing = await this.prisma.supplier_material_barcodes.findUnique({ where: { barcode: bar } });
    if (existing) {
      if (existing.supplierUserId === supplierUserId) {
        throw new ConflictException('This barcode is already registered for your store');
      }
      throw new ConflictException('This barcode is already registered in the system');
    }
    if (dto.catalogItemId) {
      const item = await this.prisma.supplier_catalog_items.findFirst({
        where: { id: dto.catalogItemId, supplierUserId },
      });
      if (!item) {
        throw new BadRequestException('Catalog item not found');
      }
    }
    return this.prisma.supplier_material_barcodes.create({
      data: {
        id: crypto.randomUUID(),
        supplierUserId,
        catalogItemId: dto.catalogItemId || null,
        barcode: bar,
        lotNumber: dto.lotNumber?.trim() || null,
        note: dto.note?.trim() || null,
        status: 'IN_STOCK',
        updatedAt: new Date(),
      },
      include: {
        catalogItem: { select: { id: true, name: true, unit: true } },
      },
    });
  }

  async updateMaterialBarcode(
    supplierUserId: string,
    id: string,
    dto: UpdateSupplierMaterialBarcodeDto,
  ) {
    this.assertSupplier(
      (await this.prisma.users.findUniqueOrThrow({ where: { id: supplierUserId } })).roles,
    );
    const row = await this.prisma.supplier_material_barcodes.findFirst({
      where: { id, supplierUserId },
    });
    if (!row) {
      throw new NotFoundException('Barcode record not found');
    }
    if (dto.status === 'VOID') {
      return this.prisma.supplier_material_barcodes.update({
        where: { id },
        data: { status: 'VOID', updatedAt: new Date() },
        include: {
          catalogItem: { select: { name: true } },
          soldToFarmer: { select: { partnerCode: true, firstName: true, lastName: true } },
        },
      });
    }
    if (dto.status === 'SOLD') {
      if (row.status !== 'IN_STOCK') {
        throw new BadRequestException('Only items in stock can be marked SOLD');
      }
      let soldToFarmerId: string | null = dto.soldToFarmerId?.trim() || null;
      let orderId: string | null = null;
      if (dto.directOrderId) {
        const o = await this.prisma.supplier_direct_orders.findFirst({
          where: { id: dto.directOrderId, supplierUserId },
        });
        if (!o) {
          throw new BadRequestException('Direct order not found for this store');
        }
        orderId = o.id;
        if (soldToFarmerId && soldToFarmerId !== o.farmerId) {
          throw new BadRequestException('Selected farmer does not match this order');
        }
        if (!soldToFarmerId) {
          soldToFarmerId = o.farmerId;
        }
      }
      if (soldToFarmerId) {
        const farmer = await this.prisma.users.findFirst({
          where: { id: soldToFarmerId, status: UserStatus.ACTIVE },
          select: { id: true, roles: true },
        });
        if (!farmer) {
          throw new BadRequestException('Farmer not found or inactive');
        }
        if (!['FARMER', 'GROWER', 'PARTNER'].some((r) => (farmer.roles as string[]).includes(r))) {
          throw new BadRequestException('The selected user is not a grower account');
        }
      }
      return this.prisma.supplier_material_barcodes.update({
        where: { id },
        data: {
          status: 'SOLD',
          soldAt: new Date(),
          soldToFarmerId,
          directOrderId: orderId,
          updatedAt: new Date(),
        },
        include: {
          catalogItem: { select: { name: true, unit: true } },
          soldToFarmer: { select: { firstName: true, lastName: true, partnerCode: true } },
        },
      });
    }
    throw new BadRequestException('Invalid status');
  }
}
