export type SupplierCatalogLine = {
  id: string;
  name: string;
  description: string | null;
  unit: string;
  listPrice: number | null;
  sku: string | null;
  imageUrl: string | null;
};

export type SupplierPublicStore = {
  id: string;
  businessName: string;
  description: string | null;
  website: string | null;
  address: string;
  postalCode: string | null;
  city: string;
  country: string;
  mapOnPublicDirectory?: boolean;
  partnerCode: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  catalog: SupplierCatalogLine[];
};
