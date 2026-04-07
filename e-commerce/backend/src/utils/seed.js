require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

const categories = [
  { name: 'Footwear', slug: 'footwear', description: 'Shoes, sneakers, sandals and more', imageUrl: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400', sortOrder: 1 },
  { name: 'Electronics', slug: 'electronics', description: 'Gadgets, devices and accessories', imageUrl: 'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=400', sortOrder: 2 },
  { name: 'Clothing', slug: 'clothing', description: 'Fashion for all occasions', imageUrl: 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=400', sortOrder: 3 },
  { name: 'Accessories', slug: 'accessories', description: 'Watches, bags, jewellery', imageUrl: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400', sortOrder: 4 },
  { name: 'Home & Living', slug: 'home-living', description: 'Furniture, decor and kitchenware', imageUrl: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=400', sortOrder: 5 },
  { name: 'Sports', slug: 'sports', description: 'Sports equipment and activewear', imageUrl: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400', sortOrder: 6 },
];

const productData = [
  // ─── FOOTWEAR ───────────────────────────────────────────────────────────────
  {
    name: 'Nike Air Max 270', sku: 'NIK-AM270-001', slug: 'nike-air-max-270',
    shortDescription: 'Lightweight running shoe with Air cushioning',
    description: 'The Nike Air Max 270 delivers visible cushioning under every step. The design draws inspiration from the Air Max 93 and Air Max 180, featuring the biggest heel Air unit yet at 270 degrees of visibility. The upper uses a combination of mesh and TPU materials for breathability and support. Perfect for running, gym or casual wear.',
    price: 10999, compareAtPrice: 12999, costPrice: 5500, stock: 120, lowStockThreshold: 10,
    brand: 'Nike', isFeatured: true,
    tags: ['running', 'nike', 'shoes', 'air-max', 'sports'],
    metaTitle: 'Nike Air Max 270 - Running Shoes | ShopZone',
    metaDescription: 'Buy Nike Air Max 270 online. Lightweight running shoe with Max Air cushioning. Free delivery available.',
    metaKeywords: 'nike air max 270, running shoes, nike shoes, sports shoes',
    catSlug: 'footwear',
    images: [
      { url: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600', altText: 'Nike Air Max 270 side view', isPrimary: true, sortOrder: 0 },
      { url: 'https://images.unsplash.com/photo-1600185365483-26d7a4cc7519?w=600', altText: 'Nike Air Max 270 top view', isPrimary: false, sortOrder: 1 },
    ],
  },
  {
    name: 'Adidas Ultraboost 22', sku: 'ADI-UB22-001', slug: 'adidas-ultraboost-22',
    shortDescription: 'Premium running shoe with Boost midsole technology',
    description: 'The Adidas Ultraboost 22 is built for long-distance runs with maximum energy return. Features Primeknit+ upper for a sock-like fit, Continental rubber outsole for superior grip, and Boost midsole that returns energy with every step. Designed for serious runners who demand performance and comfort.',
    price: 14999, compareAtPrice: 17999, costPrice: 7500, stock: 85, lowStockThreshold: 8,
    brand: 'Adidas', isFeatured: true,
    tags: ['running', 'adidas', 'ultraboost', 'premium'],
    metaTitle: 'Adidas Ultraboost 22 - Premium Running Shoes | ShopZone',
    metaDescription: 'Buy Adidas Ultraboost 22 with Boost technology. Maximum energy return for runners.',
    metaKeywords: 'adidas ultraboost, running shoes, boost technology',
    catSlug: 'footwear',
    images: [
      { url: 'https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=600', altText: 'Adidas Ultraboost 22', isPrimary: true, sortOrder: 0 },
    ],
  },
  {
    name: 'Puma RS-X Sneakers', sku: 'PUM-RSX-001', slug: 'puma-rs-x-sneakers',
    shortDescription: 'Bold retro-inspired chunky sneakers',
    description: 'The Puma RS-X is a bold reimagining of the RS Running System from the 80s. Featuring a chunky, multi-layered sole and a daring color palette. The RS-X has multi-layer construction giving the shoe extra volume, and the RS cushioning technology ensures superior comfort all day long.',
    price: 7499, compareAtPrice: 8999, costPrice: 3750, stock: 200, lowStockThreshold: 15,
    brand: 'Puma', isFeatured: false,
    tags: ['sneakers', 'puma', 'casual', 'retro'],
    metaTitle: 'Puma RS-X Chunky Sneakers | ShopZone',
    metaDescription: 'Shop Puma RS-X retro chunky sneakers. Bold design with RS cushioning.',
    metaKeywords: 'puma rs-x, chunky sneakers, casual shoes',
    catSlug: 'footwear',
    images: [
      { url: 'https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=600', altText: 'Puma RS-X Sneakers', isPrimary: true, sortOrder: 0 },
    ],
  },
  // ─── ELECTRONICS ───────────────────────────────────────────────────────────
  {
    name: 'Apple AirPods Pro (2nd Gen)', sku: 'APL-APP2-001', slug: 'apple-airpods-pro-2nd-gen',
    shortDescription: 'Active noise cancelling wireless earbuds with H2 chip',
    description: 'AirPods Pro (2nd generation) feature the Apple H2 chip for next-level Active Noise Cancellation that blocks up to 2x more noise. Transparency mode lets you hear the world around you naturally. Adaptive Audio dynamically tailors the listening experience to the conditions. Up to 6 hours of listening time (30 hours with case). MagSafe charging case with built-in speaker.',
    price: 24999, compareAtPrice: 26900, costPrice: 14000, stock: 60, lowStockThreshold: 5,
    brand: 'Apple', isFeatured: true,
    tags: ['apple', 'airpods', 'earbuds', 'wireless', 'anc', 'electronics'],
    metaTitle: 'Apple AirPods Pro 2nd Gen | ShopZone',
    metaDescription: 'Buy Apple AirPods Pro 2nd Gen with Active Noise Cancellation and H2 chip. Best wireless earbuds.',
    metaKeywords: 'apple airpods pro, wireless earbuds, noise cancelling, anc earbuds',
    catSlug: 'electronics',
    images: [
      { url: 'https://images.unsplash.com/photo-1588423771073-b8903fbbe85d?w=600', altText: 'Apple AirPods Pro', isPrimary: true, sortOrder: 0 },
    ],
  },
  {
    name: 'Samsung Galaxy Watch 6', sku: 'SAM-GW6-001', slug: 'samsung-galaxy-watch-6',
    shortDescription: 'Advanced smartwatch with health monitoring',
    description: 'Samsung Galaxy Watch 6 features a larger, brighter display with a sleek, slimmer design. Advanced health monitoring includes body composition analysis, sleep coaching, and cycle tracking. Track your fitness with automatic workout detection for 90+ exercises. Powerful Exynos W930 processor delivers faster performance. Water resistant up to 5ATM + IP68.',
    price: 32999, compareAtPrice: 36999, costPrice: 18000, stock: 45, lowStockThreshold: 5,
    brand: 'Samsung', isFeatured: true,
    tags: ['samsung', 'smartwatch', 'galaxy', 'health', 'wearable'],
    metaTitle: 'Samsung Galaxy Watch 6 Smartwatch | ShopZone',
    metaDescription: 'Buy Samsung Galaxy Watch 6 with advanced health tracking and sleek design.',
    metaKeywords: 'samsung galaxy watch, smartwatch, wearable tech',
    catSlug: 'electronics',
    images: [
      { url: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600', altText: 'Samsung Galaxy Watch 6', isPrimary: true, sortOrder: 0 },
    ],
  },
  {
    name: 'Sony WH-1000XM5 Headphones', sku: 'SNY-WH5-001', slug: 'sony-wh-1000xm5',
    shortDescription: 'Industry-leading noise cancelling over-ear headphones',
    description: 'Industry-leading noise canceling with two chips and eight microphones. 30-hour battery life with quick charging (3 min for 3 hours). Crystal clear hands-free calling with precise voice pickup. Ultra-comfortable design with soft fit leather. Multipoint connection allows pairing with two Bluetooth devices simultaneously. Hi-Res Audio supported.',
    price: 29999, compareAtPrice: 34999, costPrice: 16000, stock: 38, lowStockThreshold: 5,
    brand: 'Sony', isFeatured: false,
    tags: ['sony', 'headphones', 'anc', 'wireless', 'premium-audio'],
    metaTitle: 'Sony WH-1000XM5 Noise Cancelling Headphones | ShopZone',
    metaDescription: 'Buy Sony WH-1000XM5 with industry-leading noise cancellation. 30-hour battery life.',
    metaKeywords: 'sony headphones, noise cancelling headphones, wh1000xm5',
    catSlug: 'electronics',
    images: [
      { url: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600', altText: 'Sony WH-1000XM5', isPrimary: true, sortOrder: 0 },
    ],
  },
  // ─── CLOTHING ──────────────────────────────────────────────────────────────
  {
    name: 'Levi\'s 511 Slim Fit Jeans', sku: 'LEV-511-001', slug: 'levis-511-slim-fit-jeans',
    shortDescription: 'Classic slim fit jeans for everyday wear',
    description: 'The Levi\'s 511 Slim Fit Jeans are the perfect balance of slim and comfortable. Made with 98% cotton and 2% elastane for stretch and comfort. Sits below waist, slim through hip and thigh, narrow leg opening. Available in multiple washes. Machine washable. A wardrobe essential for every man.',
    price: 3999, compareAtPrice: 4999, costPrice: 1800, stock: 300, lowStockThreshold: 20,
    brand: "Levi's", isFeatured: false,
    tags: ['jeans', 'levis', 'denim', 'slim-fit', 'casual'],
    metaTitle: "Levi's 511 Slim Fit Jeans | ShopZone",
    metaDescription: "Buy Levi's 511 Slim Fit Jeans online. Classic denim with stretch comfort.",
    metaKeywords: "levis jeans, slim fit jeans, denim jeans",
    catSlug: 'clothing',
    images: [
      { url: 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=600', altText: "Levi's 511 Slim Fit Jeans", isPrimary: true, sortOrder: 0 },
    ],
  },
  {
    name: 'Allen Solly Formal Shirt', sku: 'ALS-FS-001', slug: 'allen-solly-formal-shirt',
    shortDescription: 'Premium cotton formal shirt for office wear',
    description: 'Allen Solly\'s formal shirt crafted from premium cotton poplin fabric. Features a regular fit with a classic collar. Full button placket with mother-of-pearl buttons. Machine washable. Perfect for office and formal occasions. Available in multiple colors.',
    price: 1299, compareAtPrice: 1799, costPrice: 600, stock: 450, lowStockThreshold: 30,
    brand: 'Allen Solly', isFeatured: false,
    tags: ['shirt', 'formal', 'office-wear', 'cotton'],
    metaTitle: 'Allen Solly Formal Shirt | ShopZone',
    metaDescription: 'Buy Allen Solly premium cotton formal shirts for office. Great fit and quality.',
    metaKeywords: 'allen solly shirt, formal shirt, office shirt',
    catSlug: 'clothing',
    images: [
      { url: 'https://images.unsplash.com/photo-1598033129183-c4f50c736f10?w=600', altText: 'Allen Solly Formal Shirt', isPrimary: true, sortOrder: 0 },
    ],
  },
  // ─── ACCESSORIES ──────────────────────────────────────────────────────────
  {
    name: 'Fossil Gen 6 Smartwatch', sku: 'FOS-G6-001', slug: 'fossil-gen-6-smartwatch',
    shortDescription: 'Wear OS smartwatch with fitness and notification features',
    description: 'The Fossil Gen 6 smartwatch runs on Wear OS by Google with Qualcomm Snapdragon 4100+ chip. Tracks SpO2 levels, heart rate, activity and sleep. 1.28" AMOLED always-on display. 3ATM water resistance. Fast charging - gets to 80% in about 30 min. Works with both Android and iOS.',
    price: 18999, compareAtPrice: 22999, costPrice: 10000, stock: 30, lowStockThreshold: 5,
    brand: 'Fossil', isFeatured: true,
    tags: ['fossil', 'smartwatch', 'wear-os', 'watch'],
    metaTitle: 'Fossil Gen 6 Smartwatch | ShopZone',
    metaDescription: 'Buy Fossil Gen 6 Wear OS smartwatch with health tracking and AMOLED display.',
    metaKeywords: 'fossil smartwatch, wear os watch, smartwatch india',
    catSlug: 'accessories',
    images: [
      { url: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600', altText: 'Fossil Gen 6 Smartwatch', isPrimary: true, sortOrder: 0 },
    ],
  },
  {
    name: 'Wildcraft Unisex Backpack 30L', sku: 'WLD-BK30-001', slug: 'wildcraft-backpack-30l',
    shortDescription: 'Durable 30L backpack for travel and everyday use',
    description: 'Wildcraft 30L backpack built for everyday commute and weekend travel. Features water-resistant polyester fabric, padded laptop compartment (fits up to 15.6"), multiple organization pockets, and padded shoulder straps for comfort. Raincover included. Suitable for college, office, gym and travel.',
    price: 2499, compareAtPrice: 3499, costPrice: 1100, stock: 180, lowStockThreshold: 20,
    brand: 'Wildcraft', isFeatured: false,
    tags: ['backpack', 'wildcraft', 'travel', 'bag', 'laptop-bag'],
    metaTitle: 'Wildcraft 30L Backpack for Travel | ShopZone',
    metaDescription: 'Buy Wildcraft 30L backpack online. Water-resistant, laptop compartment, raincover included.',
    metaKeywords: 'wildcraft backpack, travel backpack, laptop bag',
    catSlug: 'accessories',
    images: [
      { url: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600', altText: 'Wildcraft 30L Backpack', isPrimary: true, sortOrder: 0 },
    ],
  },
  // ─── HOME & LIVING ────────────────────────────────────────────────────────
  {
    name: 'Instant Pot Duo 7-in-1', sku: 'INP-DUO7-001', slug: 'instant-pot-duo-7-in-1',
    shortDescription: '7-in-1 electric pressure cooker for fast healthy cooking',
    description: 'The Instant Pot Duo 7-in-1 replaces 7 kitchen appliances: pressure cooker, slow cooker, rice cooker, steamer, sauté pan, yogurt maker and warmer. Cook up to 70% faster than traditional cooking methods. 13 one-touch cooking programs. Delay start and keep warm. Dishwasher-safe parts. 6-litre capacity.',
    price: 7999, compareAtPrice: 9999, costPrice: 4000, stock: 75, lowStockThreshold: 10,
    brand: 'Instant Pot', isFeatured: true,
    tags: ['kitchen', 'pressure-cooker', 'instant-pot', 'cooking'],
    metaTitle: 'Instant Pot Duo 7-in-1 Pressure Cooker | ShopZone',
    metaDescription: 'Buy Instant Pot Duo 7-in-1 electric pressure cooker. Cook 70% faster.',
    metaKeywords: 'instant pot, pressure cooker, electric cooker',
    catSlug: 'home-living',
    images: [
      { url: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=600', altText: 'Instant Pot Duo', isPrimary: true, sortOrder: 0 },
    ],
  },
  {
    name: 'IKEA POÄNG Armchair', sku: 'IKE-POA-001', slug: 'ikea-poang-armchair',
    shortDescription: 'Ergonomic armchair with layered-glued bent birch frame',
    description: 'The POÄNG armchair has a layer-glued bent birch frame which gives it a comfortable flexibility. It\'s a hardwearing and durable chair that is lightweight and easy to move. The cover is easy to keep clean since it can be removed and washed. Available in multiple cushion colors to match your interior.',
    price: 12999, compareAtPrice: null, costPrice: 7000, stock: 25, lowStockThreshold: 5,
    brand: 'IKEA', isFeatured: false,
    tags: ['furniture', 'ikea', 'armchair', 'living-room'],
    metaTitle: 'IKEA POÄNG Armchair | ShopZone',
    metaDescription: 'Buy IKEA POÄNG Armchair online. Ergonomic birch frame with washable cover.',
    metaKeywords: 'ikea poang, armchair, living room furniture',
    catSlug: 'home-living',
    images: [
      { url: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=600', altText: 'IKEA POÄNG Armchair', isPrimary: true, sortOrder: 0 },
    ],
  },
  // ─── SPORTS ───────────────────────────────────────────────────────────────
  {
    name: 'Yonex Badminton Racket Astrox 99', sku: 'YON-AX99-001', slug: 'yonex-astrox-99',
    shortDescription: 'Professional badminton racket for aggressive players',
    description: 'The Yonex Astrox 99 is designed for aggressive attacking players. Rotational Generator System shifts the balance point closer to the handle and top of the frame, creating a new smash with greater power. Namd graphite technology allows the slim shaft to flex and snap back powerfully. Weight: 83g. Recommended string tension: 24-28 lbs.',
    price: 14999, compareAtPrice: 17500, costPrice: 7500, stock: 40, lowStockThreshold: 5,
    brand: 'Yonex', isFeatured: true,
    tags: ['badminton', 'yonex', 'racket', 'sports'],
    metaTitle: 'Yonex Astrox 99 Badminton Racket | ShopZone',
    metaDescription: 'Buy Yonex Astrox 99 professional badminton racket. Maximum smash power.',
    metaKeywords: 'yonex astrox, badminton racket, professional racket',
    catSlug: 'sports',
    images: [
      { url: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=600', altText: 'Yonex Astrox 99', isPrimary: true, sortOrder: 0 },
    ],
  },
  {
    name: 'Nivia Storm Football', sku: 'NIV-STF-001', slug: 'nivia-storm-football',
    shortDescription: 'Official size 5 football for practice and matches',
    description: 'Nivia Storm Football is a machine-stitched football made with PU material for durability. Size 5 as per FIFA standards. 32 panel construction for accurate flight. Butyl bladder for excellent air retention. Suitable for training and recreational play on grass and artificial turf. Weight: 410-450g.',
    price: 899, compareAtPrice: 1199, costPrice: 400, stock: 500, lowStockThreshold: 50,
    brand: 'Nivia', isFeatured: false,
    tags: ['football', 'nivia', 'sports', 'outdoor'],
    metaTitle: 'Nivia Storm Football Size 5 | ShopZone',
    metaDescription: 'Buy Nivia Storm Football online. FIFA size 5, machine-stitched PU material.',
    metaKeywords: 'nivia football, size 5 football, football india',
    catSlug: 'sports',
    images: [
      { url: 'https://images.unsplash.com/photo-1575361204480-aadea25e6e68?w=600', altText: 'Nivia Storm Football', isPrimary: true, sortOrder: 0 },
    ],
  },
];

const reviewData = [
  { rating: 5, title: 'Absolutely love it!', comment: 'Best purchase this year. Quality is top-notch and delivery was fast. Highly recommend!', authorName: 'Ramesh K.', authorEmail: 'ramesh@gmail.com', isVerified: true },
  { rating: 4, title: 'Great value for money', comment: 'Good product overall. Fits well and looks exactly like the photos. Shipping took 3 days.', authorName: 'Priya S.', authorEmail: 'priya@gmail.com', isVerified: true },
  { rating: 5, title: 'Exceeded expectations', comment: 'I was skeptical at first but this product blew me away. Already recommended to 3 friends!', authorName: 'Arun M.', authorEmail: 'arun@gmail.com', isVerified: false },
  { rating: 3, title: 'Decent but could be better', comment: 'Product is okay. Not as premium as I expected at this price point but does the job.', authorName: 'Deepa R.', authorEmail: 'deepa@gmail.com', isVerified: true },
  { rating: 5, title: 'Perfect!', comment: 'Super fast delivery and packaging was excellent. Product quality is amazing!', authorName: 'Karthik V.', authorEmail: 'karthik@gmail.com', isVerified: true },
];

async function seed() {
  console.log('🌱 Starting database seed...');

  // Clear existing data
  console.log('🗑️  Clearing existing data...');
  await prisma.review.deleteMany();
  await prisma.productImage.deleteMany();
  await prisma.productVariant.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  await prisma.user.deleteMany();

  // Create admin user
  console.log('👤 Creating admin user...');
  const hashedPassword = await bcrypt.hash(process.env.ADMIN_PASSWORD || 'Admin@123', 12);
  await prisma.user.create({
    data: {
      email: process.env.ADMIN_EMAIL || 'admin@shop.com',
      password: hashedPassword,
      name: 'Shop Admin',
      role: 'SUPER_ADMIN',
    },
  });

  // Create categories
  console.log('📁 Creating categories...');
  const createdCategories = {};
  for (const cat of categories) {
    const created = await prisma.category.create({ data: cat });
    createdCategories[cat.slug] = created;
  }

  // Create products
  console.log('📦 Creating products...');
  for (const product of productData) {
    const { catSlug, images, ...productFields } = product;
    const category = createdCategories[catSlug];

    const created = await prisma.product.create({
      data: {
        ...productFields,
        categoryId: category.id,
        images: { create: images },
      },
    });

    // Add 2-5 random reviews to each product
    const reviewCount = Math.floor(Math.random() * 4) + 2;
    const selectedReviews = [...reviewData].sort(() => Math.random() - 0.5).slice(0, reviewCount);
    for (const review of selectedReviews) {
      await prisma.review.create({ data: { ...review, productId: created.id } });
    }
  }

  const [totalProducts, totalCategories, totalReviews, totalUsers] = await Promise.all([
    prisma.product.count(),
    prisma.category.count(),
    prisma.review.count(),
    prisma.user.count(),
  ]);

  console.log(`
✅ Database seeded successfully!
━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Users      : ${totalUsers}
  Categories : ${totalCategories}
  Products   : ${totalProducts}
  Reviews    : ${totalReviews}
━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔐 Admin Login:
  Email    : ${process.env.ADMIN_EMAIL || 'admin@shop.com'}
  Password : ${process.env.ADMIN_PASSWORD || 'Admin@123'}
  `);
}

seed()
  .catch((e) => { console.error('❌ Seed failed:', e); process.exit(1); })
  .finally(() => prisma.$disconnect());
