import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import {
  UserRole,
  UserStatus,
  SupplierDirectOrderStatus,
  SupplierMaterialBarcodeStatus,
  ApprovedProductCategory,
  SeedStatus,
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
import { AdminLinkCatalogItemDto } from './dto/link-catalog-item.dto';
import { SellSeedBagsDto } from './dto/seed-bags.dto';
import { buildStreetAddressLine, geocodeAddressNominatim } from './address-geocoding';
import { parseSeedSerial } from '../seed-production/seed-serial';

@Injectable()
export class B2bSuppliersService {
  private readonly logger = new Logger(B2bSuppliersService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  /** In-app + push note; a failed notification never undoes the order change. */
  private async notify(userId: string, title: string, message: string, actionUrl: string) {
    try {
      await this.notifications.create({ userId, type: 'SYSTEM', title, message, actionUrl });
    } catch (e) {
      this.logger.warn(`b2b notification failed user=${userId}: ${e instanceof Error ? e.message : e}`);
    }
  }

  private static orderRef(id: string) {
    return `#${id.slice(0, 8).toUpperCase()}`;
  }

  private static itemsSummary(items: unknown) {
    const list = Array.isArray(items) ? items : [];
    const first = list[0] as { label?: string; quantity?: number; unit?: string } | undefined;
    if (!first?.label) return '';
    const head = `${first.label}${first.quantity ? ` × ${first.quantity}${first.unit ? ` ${first.unit}` : ''}` : ''}`;
    return list.length > 1 ? `${head} (+${list.length - 1})` : head;
  }

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
  async getPublicMapPins(query?: { category?: string; bioVeraOnly?: string }) {
    const bioVeraOnly = query?.bioVeraOnly === 'true' || query?.bioVeraOnly === '1';
    const categoryRaw = query?.category?.trim().toUpperCase();
    const category =
      categoryRaw && Object.values(ApprovedProductCategory).includes(categoryRaw as ApprovedProductCategory)
        ? (categoryRaw as ApprovedProductCategory)
        : undefined;

    const profiles = await this.prisma.material_supplier_profiles.findMany({
      where: { mapApproved: true },
      include: { user: { select: { id: true, firstName: true, lastName: true, partnerCode: true, status: true } } },
    });
    const supplierIds = profiles.map((p) => p.userId).filter((id) => {
      const u = profiles.find((p) => p.userId === id)?.user;
      return u?.status === 'ACTIVE';
    });

    const [stockBags, catalogItems] = await Promise.all([
      supplierIds.length
        ? this.prisma.seeds.findMany({
            where: {
              supplierUserId: { in: supplierIds },
              status: 'IN_SUPPLIER_STOCK',
              approvedProductId: { not: null },
            },
            include: {
              approvedProduct: {
                select: { id: true, name: true, category: true, isBioVeraBrand: true, status: true },
              },
            },
          })
        : [],
      supplierIds.length
        ? this.prisma.supplier_catalog_items.findMany({
            where: {
              supplierUserId: { in: supplierIds },
              isActive: true,
              approvedProductId: { not: null },
              approvedProduct: {
                status: 'ACTIVE',
                ...(category ? { category } : {}),
              },
            },
            include: {
              approvedProduct: {
                select: { id: true, name: true, category: true, isBioVeraBrand: true, unit: true, imageUrl: true },
              },
            },
          })
        : [],
    ]);

    const bioVeraSeedInStockBySupplier = new Map<
      string,
      Array<{ approvedProductId: string; name: string; bags: number }>
    >();
    for (const bag of stockBags) {
      if (!bag.supplierUserId || !bag.approvedProduct || bag.approvedProduct.status !== 'ACTIVE') continue;
      if (category && bag.approvedProduct.category !== category) continue;
      const list = bioVeraSeedInStockBySupplier.get(bag.supplierUserId) ?? [];
      const existing = list.find((x) => x.approvedProductId === bag.approvedProductId);
      if (existing) existing.bags += 1;
      else list.push({ approvedProductId: bag.approvedProductId!, name: bag.approvedProduct.name, bags: 1 });
      bioVeraSeedInStockBySupplier.set(bag.supplierUserId, list);
    }

    const catalogBySupplier = new Map<string, typeof catalogItems>();
    for (const item of catalogItems) {
      const list = catalogBySupplier.get(item.supplierUserId) ?? [];
      list.push(item);
      catalogBySupplier.set(item.supplierUserId, list);
    }

    return profiles
      .map((p) => {
        if (p.user?.status !== 'ACTIVE') return null;
        const loc = p.location as { lat?: number; lng?: number; latitude?: number; longitude?: number };
        const lat = loc?.lat ?? loc?.latitude;
        const lng = loc?.lng ?? loc?.longitude;
        if (typeof lat !== 'number' || typeof lng !== 'number' || (lat === 0 && lng === 0)) return null;

        const bioVeraSeedInStock = bioVeraSeedInStockBySupplier.get(p.userId) ?? [];
        const publicCatalog = (catalogBySupplier.get(p.userId) ?? []).map((item) => ({
          id: item.id,
          name: item.approvedProduct!.name,
          description: item.description,
          unit: item.approvedProduct!.unit,
          listPrice: item.listPrice,
          sku: item.sku,
          imageUrl: item.imageUrl ?? item.approvedProduct!.imageUrl,
          approvedProductId: item.approvedProductId,
          category: item.approvedProduct!.category,
          isBioVeraBrand: item.approvedProduct!.isBioVeraBrand,
        }));

        if (bioVeraOnly) {
          const hasSeedStock = bioVeraSeedInStock.some((x) => x.bags > 0);
          const hasSeedCatalog = publicCatalog.some(
            (c) => c.category === 'SEED' && (c.isBioVeraBrand || bioVeraSeedInStock.length > 0),
          );
          if (!hasSeedStock && !hasSeedCatalog) return null;
        }

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
          bioVeraSeedInStock,
          catalog: publicCatalog,
        };
      })
      .filter(Boolean);
  }

  async getPublicSupplier(userId: string) {
    const p = await this.prisma.material_supplier_profiles.findUnique({
      where: { userId },
      include: { user: { select: { id: true, firstName: true, lastName: true, partnerCode: true, email: true, phone: true, status: true, roles: true } } },
    });
    if (!p?.user) throw new NotFoundException('Supplier not found');
    if (p.user.status !== 'ACTIVE') throw new NotFoundException('Supplier not found');
    if (!p.user.roles?.includes('MATERIAL_SUPPLIER' as any)) throw new NotFoundException('Supplier not found');
    const catalogRows = await this.prisma.supplier_catalog_items.findMany({
      where: {
        supplierUserId: userId,
        isActive: true,
        approvedProductId: { not: null },
        approvedProduct: { status: 'ACTIVE' },
      },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      include: {
        approvedProduct: {
          select: { id: true, name: true, unit: true, imageUrl: true, category: true, isBioVeraBrand: true },
        },
      },
    });
    const catalog = catalogRows.map((item) => ({
      id: item.id,
      name: item.approvedProduct?.name ?? item.name,
      description: item.description,
      unit: item.approvedProduct?.unit ?? item.unit,
      listPrice: item.listPrice,
      sku: item.sku,
      imageUrl: item.imageUrl ?? item.approvedProduct?.imageUrl,
      approvedProductId: item.approvedProductId,
      category: item.approvedProduct?.category,
      isBioVeraBrand: item.approvedProduct?.isBioVeraBrand,
    }));
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
      /** Javna mapa “Where to buy” prikazuje samo true; order i direktan link rade i dok čeka odobrenje mape. */
      mapOnPublicDirectory: p.mapApproved,
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
    if (!prof) throw new BadRequestException('Supplier has no store profile');
    if (supplier.status !== 'ACTIVE') throw new BadRequestException('Supplier account is not active');
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
    const toSupplier = userId === t.farmerId;
    const recipient = toSupplier ? t.supplierUserId : t.farmerId;
    const sender = await this.prisma.users.findUnique({
      where: { id: userId },
      select: { firstName: true, lastName: true },
    });
    const who = [sender?.firstName, sender?.lastName].filter(Boolean).join(' ') || (toSupplier ? 'A grower' : 'A supplier');
    const title = 'New message';
    const message = `${who} sent you a message.`;
    // One ping per conversation burst, not one per message.
    if (!(await this.notifications.hasRecentDuplicate(recipient, title, message, 15))) {
      await this.notify(recipient, title, message, toSupplier ? '/supplier/messages' : '/(producer)/partner-orders');
    }
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
    if (!prof) throw new BadRequestException('Invalid supplier');
    if (supplier.status !== 'ACTIVE') throw new BadRequestException('Supplier account is not active');
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
    const order = await this.prisma.supplier_direct_orders.create({
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
    const farmer = await this.prisma.users.findUnique({
      where: { id: farmerId },
      select: { firstName: true, lastName: true },
    });
    const who = [farmer?.firstName, farmer?.lastName].filter(Boolean).join(' ') || 'A grower';
    const what = B2bSuppliersService.itemsSummary(order.items);
    await this.notify(
      data.supplierUserId,
      'New order',
      `${who} placed ${B2bSuppliersService.orderRef(order.id)}${what ? `: ${what}` : ''}. Confirm or reject it.`,
      '/supplier/orders',
    );
    return order;
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
    if (o.status === status) return o;
    const allowed = B2bSuppliersService.NEXT_STATUS[o.status] ?? [];
    if (!allowed.includes(status) || (o.farmerReceivedAt && status !== 'FULFILLED')) {
      throw new BadRequestException(`Order cannot move from ${o.status} to ${status}.`);
    }
    const updated = await this.prisma.supplier_direct_orders.update({
      where: { id: orderId },
      data: { status, noteFromSupplier, updatedAt: new Date() },
    });
    const text = B2bSuppliersService.FARMER_STATUS_TEXT[status];
    if (text) {
      const note = noteFromSupplier?.trim() ? ` Napomena: ${noteFromSupplier.trim()}` : '';
      await this.notify(
        o.farmerId,
        text.title,
        `${B2bSuppliersService.orderRef(o.id)}: ${text.body}${note}`,
        '/(producer)/partner-orders',
      );
    }
    return updated;
  }

  /** Supplier workflow; FULFILLED, REJECTED and CANCELLED are final. */
  private static readonly NEXT_STATUS: Record<string, SupplierDirectOrderStatus[]> = {
    PENDING: ['CONFIRMED', 'REJECTED', 'CANCELLED'] as SupplierDirectOrderStatus[],
    CONFIRMED: ['FULFILLED', 'CANCELLED'] as SupplierDirectOrderStatus[],
  };

  private static readonly FARMER_STATUS_TEXT: Record<string, { title: string; body: string }> = {
    CONFIRMED: { title: 'Order confirmed', body: 'the supplier confirmed the order.' },
    REJECTED: { title: 'Order rejected', body: 'the supplier rejected the order.' },
    FULFILLED: { title: 'Order shipped', body: 'the supplier delivered the goods — confirm receipt at the farm.' },
    CANCELLED: { title: 'Order cancelled', body: 'the supplier cancelled the order.' },
  };

  /**
   * Grower confirms physical receipt at the farm. Does not change `status` (that stays the supplier’s workflow: PENDING → CONFIRMED → FULFILLED…).
   * This timestamp is the “dostupno / received” signal for the grower in the B2B UI.
   */
  async markFarmerReceived(farmerId: string, orderId: string) {
    this.assertGrower((await this.prisma.users.findUniqueOrThrow({ where: { id: farmerId } })).roles);
    const result = await this.prisma.$transaction(async tx => {
      // Serialize repeat receipts and concurrent supplier status changes on this order.
      await tx.$queryRaw`SELECT id FROM supplier_direct_orders WHERE id = ${orderId} AND "farmerId" = ${farmerId} FOR UPDATE`;
      const order = await tx.supplier_direct_orders.findFirst({ where: { id: orderId, farmerId } });
      if (!order) throw new NotFoundException('Order not found');
      if (!['CONFIRMED', 'FULFILLED'].includes(order.status)) {
        throw new BadRequestException('Only a confirmed or fulfilled supplier order can be received.');
      }
      const receivedAt = order.farmerReceivedAt ?? new Date();
      const items = Array.isArray(order.items) ? order.items : [];
      const products = items.flatMap((item, index) => {
        if (!item || typeof item !== 'object' || Array.isArray(item)) return [];
        const name = typeof item.label === 'string' ? item.label.trim() : '';
        const quantity = typeof item.quantity === 'number' ? item.quantity : NaN;
        const unit = typeof item.unit === 'string' ? item.unit : '';
        // Conversation/inquiry placeholders are not physical stock lines.
        if (!name || !Number.isFinite(quantity) || quantity <= 0 || ['order', 'inquiry'].includes(unit)) return [];
        return [{ userId: farmerId, kind: 'PRODUCT', clientReference: `supplier-order:${orderId}:${index}`,
          payload: { source: 'manual', name, contents: '', quantity, unit,
            sourceOrderId: orderId, supplierUserId: order.supplierUserId, timestamp: receivedAt.toISOString() } }];
      });
      if (products.length) await tx.grower_mobile_ingest.createMany({ data: products, skipDuplicates: true });
      if (order.farmerReceivedAt) return { order, firstReceipt: false };
      const saved = await tx.supplier_direct_orders.update({ where: { id: orderId }, data: { farmerReceivedAt: receivedAt } });
      return { order: saved, firstReceipt: true };
    });
    if (result.firstReceipt) {
      await this.notify(
        result.order.supplierUserId,
        'Goods received',
        `${B2bSuppliersService.orderRef(result.order.id)}: the grower confirmed receipt at the farm.`,
        '/supplier/orders',
      );
    }
    return result.order;
  }

  async listApprovedProductsForSupplier() {
    return this.prisma.approved_products.findMany({
      where: { status: 'ACTIVE' },
      orderBy: [{ category: 'asc' }, { name: 'asc' }],
      select: {
        id: true,
        category: true,
        name: true,
        variety: true,
        unit: true,
        packSize: true,
        imageUrl: true,
        isBioVeraBrand: true,
        description: true,
      },
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
    if (!dto.approvedProductId?.trim()) {
      throw new BadRequestException('New catalogue items must be linked to an approved product');
    }
    const approved = await this.prisma.approved_products.findUnique({
      where: { id: dto.approvedProductId.trim() },
    });
    if (!approved || approved.status !== 'ACTIVE') {
      throw new BadRequestException('Approved product not found or not active');
    }
    const count = await this.prisma.supplier_catalog_items.count({ where: { supplierUserId } });
    return this.prisma.supplier_catalog_items.create({
      data: {
        id: crypto.randomUUID(),
        supplierUserId,
        approvedProductId: approved.id,
        name: approved.name,
        description: dto.description?.trim() || approved.description || null,
        unit: approved.unit,
        imageUrl: approved.imageUrl,
        listPrice:
          dto.listPrice != null && !Number.isNaN(Number(dto.listPrice)) ? Number(dto.listPrice) : null,
        sku: dto.sku?.trim() || null,
        sortOrder: count,
        updatedAt: new Date(),
      },
      include: {
        approvedProduct: {
          select: { id: true, name: true, unit: true, imageUrl: true, category: true, isBioVeraBrand: true },
        },
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
    if (dto.name !== undefined && !row.approvedProductId) data.name = dto.name.trim();
    if (dto.description !== undefined) data.description = dto.description?.trim() || null;
    if (dto.unit !== undefined && !row.approvedProductId) data.unit = dto.unit.trim() || 'unit';
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
      catalogItems,
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
      this.prisma.supplier_catalog_items.findMany({
        select: { id: true, supplierUserId: true, name: true, approvedProductId: true, isActive: true },
      }),
    ]);

    const threadCountBy = new Map(threadCountRows.map((r) => [r.supplierUserId, r._count._all]));
    const orderCountBy = new Map(orderCountRows.map((r) => [r.supplierUserId, r._count._all]));

    const catalogBySupplier = new Map<
      string,
      Array<{ id: string; name: string; approvedProductId: string | null; isActive: boolean }>
    >();
    for (const item of catalogItems) {
      const list = catalogBySupplier.get(item.supplierUserId) ?? [];
      list.push(item);
      catalogBySupplier.set(item.supplierUserId, list);
    }

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

      const supplierCatalog = catalogBySupplier.get(sid) ?? [];
      const approvedCatalogCount = supplierCatalog.filter((c) => c.approvedProductId && c.isActive).length;
      const unlinkedCatalogCount = supplierCatalog.filter((c) => !c.approvedProductId && c.isActive).length;

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
          approvedCatalogCount,
          unlinkedCatalogCount,
        },
        catalogItems: supplierCatalog,
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

  async receiveSeedBags(supplierUserId: string, serials: string[]) {
    this.assertSupplier(
      (await this.prisma.users.findUniqueOrThrow({ where: { id: supplierUserId } })).roles,
    );
    const results: { serial: string; ok: boolean; reason?: string }[] = [];

    for (const raw of serials) {
      const parsed = parseSeedSerial(raw);
      if (!parsed.ok) {
        results.push({ serial: raw, ok: false, reason: 'FORMAT' });
        continue;
      }
      const bag = await this.prisma.seeds.findUnique({
        where: { serialNumber: parsed.serial },
        include: { productionRun: true },
      });
      if (!bag?.productionRun) {
        results.push({ serial: parsed.serial, ok: false, reason: 'NOT_FOUND' });
        continue;
      }
      if (bag.supplierUserId !== supplierUserId) {
        results.push({ serial: parsed.serial, ok: false, reason: 'WRONG_SUPPLIER' });
        continue;
      }
      if (bag.status !== 'AVAILABLE') {
        results.push({ serial: parsed.serial, ok: false, reason: bag.status });
        continue;
      }

      await this.prisma.$transaction(async (tx) => {
        await tx.seeds.update({
          where: { id: bag.id },
          data: { status: 'IN_SUPPLIER_STOCK' },
        });
        await tx.seed_custody_events.create({
          data: {
            id: crypto.randomUUID(),
            seedId: bag.id,
            event: 'RECEIVED_BY_SUPPLIER',
            actorId: supplierUserId,
            supplierUserId,
          },
        });
      });
      results.push({ serial: parsed.serial, ok: true });
    }

    return { results };
  }

  async sellSeedBags(supplierUserId: string, dto: SellSeedBagsDto) {
    this.assertSupplier(
      (await this.prisma.users.findUniqueOrThrow({ where: { id: supplierUserId } })).roles,
    );

    let growerId = dto.growerId?.trim();
    if (!growerId && dto.growerPartnerCode?.trim()) {
      const g = await this.prisma.users.findFirst({
        where: { partnerCode: dto.growerPartnerCode.trim().toUpperCase(), status: UserStatus.ACTIVE },
      });
      if (!g) throw new BadRequestException('Grower partner code not found');
      growerId = g.id;
    }
    if (!growerId) throw new BadRequestException('Grower partner code or growerId is required');

    const grower = await this.prisma.users.findFirst({
      where: { id: growerId, status: UserStatus.ACTIVE },
      select: { id: true, roles: true, partnerCode: true, firstName: true, lastName: true },
    });
    if (!grower) throw new BadRequestException('Grower not found or inactive');
    if (!['FARMER', 'GROWER', 'PARTNER'].some((r) => (grower.roles as string[]).includes(r))) {
      throw new BadRequestException('The selected user is not a grower account');
    }

    if (dto.directOrderId) {
      const order = await this.prisma.supplier_direct_orders.findFirst({
        where: { id: dto.directOrderId, supplierUserId, farmerId: grower.id },
      });
      if (!order) throw new BadRequestException('Direct order not found for this grower and store');
    }

    const results: { serial: string; ok: boolean; reason?: string }[] = [];
    const soldBags: Array<{ serial: string; lot: string; productName: string }> = [];

    for (const raw of dto.serials) {
      const parsed = parseSeedSerial(raw);
      if (!parsed.ok) {
        results.push({ serial: raw, ok: false, reason: 'FORMAT' });
        continue;
      }
      const bag = await this.prisma.seeds.findUnique({
        where: { serialNumber: parsed.serial },
        include: {
          productionRun: { include: { approvedProduct: true } },
        },
      });
      if (!bag?.productionRun) {
        results.push({ serial: parsed.serial, ok: false, reason: 'NOT_FOUND' });
        continue;
      }
      if (bag.supplierUserId !== supplierUserId) {
        results.push({ serial: parsed.serial, ok: false, reason: 'WRONG_SUPPLIER' });
        continue;
      }
      if (bag.status !== 'IN_SUPPLIER_STOCK') {
        results.push({ serial: parsed.serial, ok: false, reason: bag.status });
        continue;
      }

      await this.prisma.$transaction(async (tx) => {
        await tx.seeds.update({
          where: { id: bag.id },
          data: {
            status: 'SOLD',
            assignedToUserId: grower.id,
            soldToGrowerId: grower.id,
            soldAt: new Date(),
          },
        });
        await tx.seed_custody_events.create({
          data: {
            id: crypto.randomUUID(),
            seedId: bag.id,
            event: 'SOLD_TO_GROWER',
            actorId: supplierUserId,
            supplierUserId,
            growerId: grower.id,
          },
        });
      });
      results.push({ serial: parsed.serial, ok: true });
      soldBags.push({
        serial: parsed.serial,
        lot: bag.productionRun!.lotNumber,
        productName: bag.productionRun!.approvedProduct.name,
      });
    }

    const okCount = results.filter((r) => r.ok).length;
    if (okCount > 0) {
      const lotSample = soldBags[0]?.lot ?? '';
      const productSample = soldBags[0]?.productName ?? 'Bio Vera seed';
      await this.notify(
        grower.id,
        'Bio Vera seed received',
        `You received ${okCount} bag${okCount === 1 ? '' : 's'} of ${productSample}${lotSample ? ` (lot ${lotSample})` : ''}. Scan each bag when planting.`,
        '/grower/seeds',
      );
    }

    return { growerId: grower.id, results };
  }

  async listMySeedBags(supplierUserId: string, status?: string) {
    this.assertSupplier(
      (await this.prisma.users.findUniqueOrThrow({ where: { id: supplierUserId } })).roles,
    );
    const allowed: SeedStatus[] = [
      'AVAILABLE',
      'IN_SUPPLIER_STOCK',
      'SOLD',
      'ASSIGNED',
      'PLANTED',
      'USED',
      'RECALLED',
      'VOIDED',
    ];
    const statusFilter =
      status && allowed.includes(status as SeedStatus) ? (status as SeedStatus) : undefined;

    const bags = await this.prisma.seeds.findMany({
      where: {
        supplierUserId,
        ...(statusFilter ? { status: statusFilter } : {}),
        productionRunId: { not: null },
      },
      include: {
        approvedProduct: { select: { id: true, name: true, variety: true } },
        productionRun: { select: { lotNumber: true, seedCropYear: true } },
      },
      orderBy: [{ productionRun: { lotNumber: 'asc' } }, { serialNumber: 'asc' }],
    });

    type Group = {
      approvedProductId: string | null;
      productName: string;
      lotNumber: string;
      seedCropYear: number | null;
      bags: typeof bags;
      count: number;
    };
    const groupMap = new Map<string, Group>();
    for (const bag of bags) {
      const key = `${bag.approvedProductId ?? 'none'}|${bag.productionRun?.lotNumber ?? ''}`;
      const existing = groupMap.get(key);
      if (existing) {
        existing.bags.push(bag);
        existing.count += 1;
      } else {
        groupMap.set(key, {
          approvedProductId: bag.approvedProductId,
          productName: bag.approvedProduct?.name ?? bag.name,
          lotNumber: bag.productionRun?.lotNumber ?? '',
          seedCropYear: bag.productionRun?.seedCropYear ?? null,
          bags: [bag],
          count: 1,
        });
      }
    }

    return {
      bags: bags.map((b) => ({
        id: b.id,
        serialNumber: b.serialNumber,
        status: b.status,
        bagNumber: b.bagNumber,
        approvedProductId: b.approvedProductId,
        productName: b.approvedProduct?.name ?? b.name,
        lotNumber: b.productionRun?.lotNumber,
        seedCropYear: b.productionRun?.seedCropYear,
      })),
      grouped: [...groupMap.values()].map((g) => ({
        approvedProductId: g.approvedProductId,
        productName: g.productName,
        lotNumber: g.lotNumber,
        seedCropYear: g.seedCropYear,
        count: g.count,
      })),
    };
  }

  async adminLinkCatalogItem(catalogItemId: string, dto: AdminLinkCatalogItemDto) {
    const row = await this.prisma.supplier_catalog_items.findUnique({ where: { id: catalogItemId } });
    if (!row) throw new NotFoundException('Catalog item not found');

    if (dto.approvedProductId === null || dto.approvedProductId === '') {
      return this.prisma.supplier_catalog_items.update({
        where: { id: catalogItemId },
        data: { approvedProductId: null, updatedAt: new Date() },
      });
    }

    const approved = await this.prisma.approved_products.findUnique({
      where: { id: dto.approvedProductId },
    });
    if (!approved) throw new BadRequestException('Approved product not found');

    return this.prisma.supplier_catalog_items.update({
      where: { id: catalogItemId },
      data: {
        approvedProductId: approved.id,
        name: approved.name,
        unit: approved.unit,
        imageUrl: row.imageUrl ?? approved.imageUrl,
        updatedAt: new Date(),
      },
      include: {
        approvedProduct: {
          select: { id: true, name: true, unit: true, category: true, isBioVeraBrand: true },
        },
      },
    });
  }
}
