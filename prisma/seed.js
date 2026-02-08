const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

const bouquets = [
  {
    name: "Blush Sonata",
    description:
      "Garden roses, ranunculus, and lisianthus in blush and ivory tones.",
    priceCents: 9800,
    flowerType: "ROSE",
    style: "ROMANTIC",
    colors: "blush,ivory,champagne",
    isMixed: true,
    isFeatured: true,
    image: "/images/bouquet-1.png",
  },
  {
    name: "Velvet Tulip Reverie",
    description:
      "Velvety tulips and anemones wrapped in satin ribbon for modern romance.",
    priceCents: 7600,
    flowerType: "TULIP",
    style: "MODERN",
    colors: "ruby,blush,peach",
    isMixed: false,
    isFeatured: true,
    image: "/images/bouquet-2.png",
  },
  {
    name: "Lily Champagne Cloud",
    description:
      "Oriental lilies, cream roses, and eucalyptus in a soft airy silhouette.",
    priceCents: 11200,
    flowerType: "LILY",
    style: "GARDEN",
    colors: "ivory,champagne,sage",
    isMixed: true,
    isFeatured: true,
    image: "/images/bouquet-3.png",
  },
  {
    name: "Peony Muse",
    description:
      "Peonies with delicate spray roses and textured grasses, light and lush.",
    priceCents: 13400,
    flowerType: "PEONY",
    style: "ROMANTIC",
    colors: "blush,peach,champagne",
    isMixed: true,
    isFeatured: false,
    image: "/images/bouquet-4.png",
  },
  {
    name: "Sage Orchid Mist",
    description:
      "Minimal orchid stems with sage greens and matte wrap in a sleek form.",
    priceCents: 8800,
    flowerType: "ORCHID",
    style: "MINIMAL",
    colors: "sage,ivory",
    isMixed: false,
    isFeatured: false,
    image: "/images/bouquet-5.png",
  },
  {
    name: "Sunlit Garden",
    description:
      "Seasonal mixed blooms in peach, buttercream, and warm blush shades.",
    priceCents: 6900,
    flowerType: "MIXED",
    style: "GARDEN",
    colors: "peach,blush,champagne",
    isMixed: true,
    isFeatured: false,
    image: "/images/bouquet-6.png",
  },
  {
    name: "Ivory Poem",
    description:
      "White roses, lisianthus, and soft greens for a timeless statement.",
    priceCents: 9400,
    flowerType: "ROSE",
    style: "MINIMAL",
    colors: "ivory,sage",
    isMixed: false,
    isFeatured: false,
    image: "/images/bouquet-7.png",
  },
  {
    name: "Lavender Haze",
    description:
      "Lavender and lilac blooms with a misty texture and feather-light wrap.",
    priceCents: 10100,
    flowerType: "MIXED",
    style: "ROMANTIC",
    colors: "lavender,blush,ivory",
    isMixed: true,
    isFeatured: false,
    image: "/images/bouquet-8.png",
  },
];

const promoSlides = [
  {
    title: "",
    subtitle: "",
    image: "/images/promo-1.png",
    link: "",
    position: 1,
  },
  {
    title: "",
    subtitle: "",
    image: "/images/promo-2.png",
    link: "",
    position: 2,
  },
  {
    title: "Gift-ready wraps",
    subtitle: "Signature satin ribbon and handwritten note included.",
    image: "/images/promo-3.png",
    link: "/catalog?filter=featured",
    position: 3,
  },
];

async function main() {
  const adminEmail = process.env.ADMIN_EMAIL || "admin@allinbloom.com";

  await prisma.user.upsert({
    where: { email: adminEmail },
    update: { role: "ADMIN" },
    create: { email: adminEmail, role: "ADMIN" },
  });

  await prisma.bouquet.deleteMany();
  await prisma.bouquet.createMany({ data: bouquets });

  await prisma.promoSlide.deleteMany();
  await prisma.promoSlide.createMany({ data: promoSlides });
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
