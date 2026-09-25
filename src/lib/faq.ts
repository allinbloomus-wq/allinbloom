// Shared FAQ content: rendered on /faq and teased on the home page.
export type Faq = { q: string; a: string[] };
export type FaqGroup = {
  id: string;
  title: string;
  links: { href: string; label: string }[];
  items: Faq[];
};

export const FAQ_GROUPS: FaqGroup[] = [
  {
    id: "studio",
    title: "About our studio",
    links: [{ href: "/contact", label: "Address & hours" }],
    items: [
      {
        q: "Is All in Bloom a local florist in Wheeling, Illinois?",
        a: [
          "Yes. All in Bloom Floral Studio is a local flower and gift studio located at 224 S Milwaukee Ave, Wheeling, IL 60090. We create modern bouquets, custom floral arrangements, personalized balloons, gifts, and floral designs for events throughout Wheeling and nearby Chicago suburbs.",
        ],
      },
      {
        q: "Why choose a local florist instead of a national flower delivery website?",
        a: [
          "When you order from All in Bloom, your flowers are designed by a local florist at our Wheeling studio. We can work with your preferences, create custom designs, combine flowers with personalized balloons and gifts, and help with local delivery rather than simply offering a standardized shipped product.",
        ],
      },
      {
        q: "What makes All in Bloom different?",
        a: [
          "All in Bloom combines modern floral design with personalized gifting. Along with fresh bouquets and custom arrangements, we offer personalized balloons, Bubble Balloons, gifts, wedding and event florals, corporate flowers, local delivery, and creative experiences at our floral studio.",
        ],
      },
    ],
  },
  {
    id: "delivery",
    title: "Delivery & pickup",
    links: [{ href: "/catalog", label: "Order flowers" }],
    items: [
      {
        q: "Do you offer same-day flower delivery?",
        a: [
          "Yes. Same-day flower delivery is available for many orders, depending on flower availability, delivery location, and our schedule for the day. For the best selection and delivery options, we recommend ordering as early as possible.",
        ],
      },
      {
        q: "What areas do you deliver to?",
        a: [
          "We deliver throughout Wheeling and nearby Northwest Chicago suburbs, including areas such as Rolling Meadows, Arlington Heights, Buffalo Grove, and surrounding communities. Delivery to other Chicago-area locations may also be available. Contact us or enter the delivery address when ordering to confirm availability.",
        ],
      },
      {
        q: "How much does flower delivery cost?",
        a: [
          "Delivery pricing depends on the destination and order. Enter the recipient’s delivery address when ordering or contact our studio for the current delivery cost.",
        ],
      },
      {
        q: "Can I pick up flowers directly from your studio?",
        a: [
          "Yes. Local pickup is available from our Wheeling floral studio. You can order ahead online or contact us if you need something prepared for pickup the same day.",
        ],
      },
      {
        q: "Do you deliver flowers to hospitals, hotels, offices, and restaurants?",
        a: [
          "Yes, when the destination accepts deliveries. We can deliver flowers and gifts to homes, businesses, hotels, hospitals, restaurants, and other local locations. Please provide as much recipient information as possible, including the full name, room or suite number when applicable, and a contact phone number.",
        ],
      },
      {
        q: "How far in advance should I order flowers?",
        a: [
          "For everyday bouquets, we can often accommodate same-day or next-day orders. For weddings, large events, custom installations, or larger balloon arrangements, we recommend contacting us as early as possible so we can confirm availability and plan the design.",
        ],
      },
    ],
  },
  {
    id: "bouquets",
    title: "Bouquets & custom design",
    links: [{ href: "/catalog", label: "Browse bouquets" }],
    items: [
      {
        q: "Can you create a custom bouquet?",
        a: [
          "Absolutely. Custom floral design is one of our specialties. Tell us your preferred colors, flowers, style, occasion, and budget, and our florists will create something specifically for you.",
        ],
      },
      {
        q: "Can I send you an inspiration photo?",
        a: [
          "Yes. Inspiration photos are always welcome. We can use the photo to understand the style, color palette, and overall feeling you are looking for. Because flowers are seasonal and natural products, the final design may not be an exact copy, but we will create something with a similar look and character.",
        ],
      },
      {
        q: "Will my bouquet look exactly like the photo on the website?",
        a: [
          "We try to stay as close as possible to the design shown. However, flower varieties and shades can change with season and availability. When necessary, our florists may make thoughtful substitutions while maintaining the overall style, color palette, quality, and value of the arrangement.",
        ],
      },
      {
        q: "What is a Designer’s Choice bouquet?",
        a: [
          "Designer’s Choice gives our florist creative freedom to select the freshest and most beautiful flowers available that day. You can still tell us your preferred colors, mood, occasion, and budget. It is often one of the best options when you want something unique rather than a standard arrangement.",
        ],
      },
      {
        q: "Can I order flowers for someone if I don’t know what to choose?",
        a: [
          "Of course. Tell us who the flowers are for, the occasion, your approximate budget, and anything you know about the recipient’s preferences. Our florists can recommend an arrangement or create a custom Designer’s Choice bouquet for you.",
        ],
      },
      {
        q: "Can you add a personal message to my order?",
        a: [
          "Yes. A personal card or handwritten message can be added to your floral gift. Simply include your message while placing the order.",
        ],
      },
    ],
  },
  {
    id: "balloons",
    title: "Balloons & gifts",
    links: [
      { href: "/balloons", label: "Shop balloons" },
      { href: "/gifts", label: "Gift boxes" },
    ],
    items: [
      {
        q: "Can I order flowers and balloons together?",
        a: [
          "Yes. All in Bloom offers both flowers and balloons, so we can create a complete gift with a bouquet, floral arrangement, personalized balloon, or balloon arrangement.",
        ],
      },
      {
        q: "Do you make personalized Bubble Balloons?",
        a: [
          "Yes. Personalized Bubble Balloons are one of our popular celebration options. They can include custom lettering and can be combined with coordinating balloons, flowers, numbers, hearts, bows, and other decorative elements.",
        ],
      },
      {
        q: "Can I order balloons without flowers?",
        a: [
          "Yes. Balloon arrangements can be ordered separately. We create designs for birthdays, baby showers, welcome-home celebrations, anniversaries, surprises, and other special occasions.",
        ],
      },
    ],
  },
  {
    id: "events",
    title: "Weddings, events & business",
    links: [{ href: "/event-space", label: "Event space" }],
    items: [
      {
        q: "Do you create flowers for weddings and events?",
        a: [
          "Yes. All in Bloom provides custom floral design for weddings, private celebrations, corporate events, and other special occasions. Designs can include bouquets, centerpieces, ceremony flowers, table arrangements, and custom floral décor.",
        ],
      },
      {
        q: "Do you offer corporate flowers or recurring flower service?",
        a: [
          "Yes. We can create floral arrangements for offices, reception areas, restaurants, dealerships, client gifts, and other businesses.",
          "Recurring floral service and custom corporate orders can be arranged directly with our studio.",
        ],
      },
    ],
  },
  {
    id: "ordering",
    title: "Ordering",
    links: [{ href: "/contact", label: "Contact us" }],
    items: [
      {
        q: "How can I place an order?",
        a: [
          "You can order through allinbloom.us, call our studio at (224) 213-3823, visit us in Wheeling, or contact All in Bloom through our social media.",
        ],
      },
    ],
  },
];

export const FAQ_ITEMS = FAQ_GROUPS.flatMap((group) =>
  group.items.map(({ q, a }) => ({ q, a: a.join(" ") }))
);
