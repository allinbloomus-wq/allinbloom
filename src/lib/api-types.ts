import { BOUQUET_STYLES, FLOWER_TYPES } from "@/lib/constants";

export type FlowerType = (typeof FLOWER_TYPES)[number];
export type BouquetStyle = (typeof BOUQUET_STYLES)[number];
export type OrderStatus = "PENDING" | "PAID" | "FAILED" | "CANCELED";

export type Bouquet = {
  id: string;
  name: string;
  description: string;
  priceCents: number;
  currency: string;
  flowerType: FlowerType;
  style: BouquetStyle;
  colors: string;
  isMixed: boolean;
  isFeatured: boolean;
  isActive: boolean;
  discountPercent: number;
  discountNote: string | null;
  image: string;
};

export type PromoSlide = {
  id: string;
  title: string;
  subtitle: string | null;
  image: string;
  link: string | null;
  isActive: boolean;
  position: number;
};

export type Review = {
  id: string;
  name: string;
  rating: number;
  text: string;
  image: string | null;
  createdAt: string;
};

export type AdminReview = Review & {
  email: string;
  isActive: boolean;
  isRead: boolean;
  updatedAt: string;
};

export type OrderItem = {
  id: string;
  orderId: string;
  bouquetId: string | null;
  name: string;
  priceCents: number;
  quantity: number;
  image: string;
  details: string | null;
};

export type Order = {
  id: string;
  email: string | null;
  phone: string | null;
  stripeSessionId: string | null;
  paypalOrderId: string | null;
  paypalCaptureId: string | null;
  totalCents: number;
  currency: string;
  status: OrderStatus;
  isRead: boolean;
  deliveryAddress: string | null;
  deliveryAddressLine1: string | null;
  deliveryAddressLine2: string | null;
  deliveryCity: string | null;
  deliveryState: string | null;
  deliveryPostalCode: string | null;
  deliveryCountry: string | null;
  deliveryFloor: string | null;
  orderComment: string | null;
  deliveryMiles: string | null;
  deliveryFeeCents: number | null;
  firstOrderDiscountPercent: number | null;
  createdAt: string;
  items: OrderItem[];
};

export type StoreSettings = {
  id: string;
  globalDiscountPercent: number;
  globalDiscountNote: string | null;
  categoryDiscountPercent: number;
  categoryDiscountNote: string | null;
  categoryFlowerType: string | null;
  categoryStyle: string | null;
  categoryMixed: string | null;
  categoryColor: string | null;
  categoryMinPriceCents: number | null;
  categoryMaxPriceCents: number | null;
  firstOrderDiscountPercent: number;
  firstOrderDiscountNote: string | null;
  homeHeroImage: string;
  homeGalleryImage1: string;
  homeGalleryImage2: string;
  homeGalleryImage3: string;
  homeGalleryImage4: string;
  homeGalleryImage5: string;
  homeGalleryImage6: string;
  catalogCategoryImageMono: string;
  catalogCategoryImageMixed: string;
  catalogCategoryImageSeason: string;
  catalogCategoryImageAll: string;
};

export type DiscountInfo = {
  percent: number;
  note: string;
  source: "bouquet" | "category" | "global";
};

export type BouquetPricing = {
  originalPriceCents: number;
  finalPriceCents: number;
  discount: DiscountInfo | null;
};

export type CatalogItem = {
  bouquet: Bouquet;
  pricing: BouquetPricing;
};

export type CatalogResponse = {
  items: CatalogItem[];
  nextCursor: string | null;
};

export type OrderStripeAddress = {
  line1: string | null;
  line2: string | null;
  city: string | null;
  state: string | null;
  postalCode: string | null;
  country: string | null;
};

export type OrderStripeShipping = {
  name: string | null;
  phone: string | null;
  address: OrderStripeAddress | null;
};

export type OrderStripeSession = {
  paymentStatus: string | null;
  status: string | null;
  shipping: OrderStripeShipping | null;
  deliveryAddress: string | null;
  deliveryMiles: string | null;
  deliveryFeeCents: number | null;
  firstOrderDiscountPercent: number | null;
};
