const prisma = require('../config/database');
const { cacheGet, cacheSet, cacheKeys, invalidateProductCache } = require('../config/cache');
const { slugify, generateSKU, getPaginationParams, buildPaginationMeta, formatProduct } = require('../utils/helpers');

const productInclude = {
  category: { select: { id: true, name: true, slug: true, imageUrl: true } },
  images: { orderBy: { sortOrder: 'asc' } },
  reviews: {
    where: { isApproved: true },
    orderBy: { createdAt: 'desc' },
    take: 10,
    select: {
      id: true, rating: true, title: true, comment: true,
      authorName: true, isVerified: true, helpfulCount: true, createdAt: true,
    },
  },
  variants: { orderBy: { price: 'asc' } },
  _count: { select: { reviews: { where: { isApproved: true } } } },
};

// GET /api/products?q=keyword&page=1&limit=12&category=slug&minPrice=&maxPrice=&brand=&sortBy=
const getProducts = async (req, res) => {
  try {
    const { q, category, minPrice, maxPrice, brand, inStock, featured, sortBy } = req.query;
    const { skip, take, page, limit } = getPaginationParams(req.query.page, req.query.limit);

    // Cache key based on all query params
    const cacheKey = cacheKeys.PRODUCTS_LIST(req.query);
    const cached = await cacheGet(cacheKey);
    if (cached) {
      return res.json({ ...cached, fromCache: true });
    }

    const where = { isActive: true };

    // Full-text search across multiple fields
    if (q && q.trim()) {
      const keyword = q.trim();
      where.OR = [
        { name: { contains: keyword, mode: 'insensitive' } },
        { description: { contains: keyword, mode: 'insensitive' } },
        { shortDescription: { contains: keyword, mode: 'insensitive' } },
        { brand: { contains: keyword, mode: 'insensitive' } },
        { sku: { contains: keyword, mode: 'insensitive' } },
        { tags: { has: keyword.toLowerCase() } },
        { category: { name: { contains: keyword, mode: 'insensitive' } } },
      ];
    }

    if (category) where.category = { slug: category };
    if (brand) where.brand = { contains: brand, mode: 'insensitive' };
    if (inStock === 'true') where.stock = { gt: 0 };
    if (featured === 'true') where.isFeatured = true;

    if (minPrice || maxPrice) {
      where.price = {
        ...(minPrice && { gte: parseFloat(minPrice) }),
        ...(maxPrice && { lte: parseFloat(maxPrice) }),
      };
    }

    const orderByMap = {
      price_asc: { price: 'asc' },
      price_desc: { price: 'desc' },
      name_asc: { name: 'asc' },
      newest: { createdAt: 'desc' },
      popular: { viewCount: 'desc' },
    };
    const orderBy = orderByMap[sortBy] || { createdAt: 'desc' };

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: {
          category: { select: { id: true, name: true, slug: true } },
          images: { where: { isPrimary: true }, take: 1 },
          _count: { select: { reviews: { where: { isApproved: true } } } },
        },
        skip,
        take,
        orderBy,
      }),
      prisma.product.count({ where }),
    ]);

    // Fast format for listing (no full reviews needed)
    const formattedProducts = products.map((p) => ({
      id: p.id,
      sku: p.sku,
      name: p.name,
      slug: p.slug,
      shortDescription: p.shortDescription,
      price: parseFloat(p.price),
      compareAtPrice: p.compareAtPrice ? parseFloat(p.compareAtPrice) : null,
      discount: p.compareAtPrice
        ? Math.round((1 - parseFloat(p.price) / parseFloat(p.compareAtPrice)) * 100)
        : 0,
      stock: p.stock,
      brand: p.brand,
      tags: p.tags,
      isFeatured: p.isFeatured,
      availability: p.stock === 0 ? 'out_of_stock' : p.stock <= p.lowStockThreshold ? 'low_stock' : 'in_stock',
      primaryImage: p.images[0] || null,
      category: p.category,
      totalReviews: p._count.reviews,
      createdAt: p.createdAt,
    }));

    const response = {
      success: true,
      data: formattedProducts,
      meta: buildPaginationMeta(total, page, limit),
    };

    await cacheSet(cacheKey, response, 120); // cache 2 min for list
    return res.json(response);
  } catch (err) {
    console.error('getProducts error:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch products.' });
  }
};

// GET /api/products/:identifier (slug, SKU, or UUID)
const getProductByIdentifier = async (req, res) => {
  try {
    const { identifier } = req.params;

    const cacheKey = cacheKeys.PRODUCT_DETAIL(identifier);
    const cached = await cacheGet(cacheKey);
    if (cached) return res.json({ ...cached, fromCache: true });

    // Try slug first, then SKU, then ID
    let product = await prisma.product.findFirst({
      where: {
        isActive: true,
        OR: [{ slug: identifier }, { sku: identifier }, { id: identifier }],
      },
      include: productInclude,
    });

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found.' });
    }

    // Increment view count (fire and forget)
    prisma.product.update({
      where: { id: product.id },
      data: { viewCount: { increment: 1 } },
    }).catch(() => {});

    const response = { success: true, data: formatProduct(product) };
    await cacheSet(cacheKey, response, 300); // cache 5 min for detail

    return res.json(response);
  } catch (err) {
    console.error('getProductByIdentifier error:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch product.' });
  }
};

// GET /api/products/featured
const getFeaturedProducts = async (req, res) => {
  try {
    const cached = await cacheGet(cacheKeys.FEATURED);
    if (cached) return res.json({ ...cached, fromCache: true });

    const products = await prisma.product.findMany({
      where: { isActive: true, isFeatured: true },
      include: {
        category: { select: { id: true, name: true, slug: true } },
        images: { where: { isPrimary: true }, take: 1 },
        _count: { select: { reviews: { where: { isApproved: true } } } },
      },
      orderBy: { viewCount: 'desc' },
      take: 8,
    });

    const response = {
      success: true,
      data: products.map((p) => ({
        id: p.id, sku: p.sku, name: p.name, slug: p.slug,
        price: parseFloat(p.price),
        compareAtPrice: p.compareAtPrice ? parseFloat(p.compareAtPrice) : null,
        discount: p.compareAtPrice ? Math.round((1 - parseFloat(p.price) / parseFloat(p.compareAtPrice)) * 100) : 0,
        stock: p.stock, brand: p.brand,
        availability: p.stock === 0 ? 'out_of_stock' : p.stock <= p.lowStockThreshold ? 'low_stock' : 'in_stock',
        primaryImage: p.images[0] || null,
        category: p.category, totalReviews: p._count.reviews,
      })),
    };

    await cacheSet(cacheKeys.FEATURED, response, 600);
    return res.json(response);
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to fetch featured products.' });
  }
};

// ─── ADMIN CONTROLLERS ─────────────────────────────────────────────────────

// POST /api/admin/products
const createProduct = async (req, res) => {
  try {
    const {
      name, description, shortDescription, price, compareAtPrice, costPrice,
      stock, lowStockThreshold, brand, tags, categoryId, isActive, isFeatured,
      metaTitle, metaDescription, metaKeywords, images, variants,
    } = req.body;

    // Check category exists
    const category = await prisma.category.findUnique({ where: { id: categoryId } });
    if (!category) {
      return res.status(400).json({ success: false, message: 'Category not found.' });
    }

    let slug = slugify(name);
    // Ensure unique slug
    const existing = await prisma.product.findUnique({ where: { slug } });
    if (existing) slug = `${slug}-${Date.now()}`;

    const sku = req.body.sku || generateSKU(name);

    const product = await prisma.product.create({
      data: {
        sku,
        name,
        slug,
        description,
        shortDescription,
        price: parseFloat(price),
        compareAtPrice: compareAtPrice ? parseFloat(compareAtPrice) : null,
        costPrice: costPrice ? parseFloat(costPrice) : null,
        stock: parseInt(stock) || 0,
        lowStockThreshold: parseInt(lowStockThreshold) || 5,
        brand,
        tags: tags || [],
        categoryId,
        isActive: isActive !== undefined ? isActive : true,
        isFeatured: isFeatured || false,
        metaTitle: metaTitle || name,
        metaDescription: metaDescription || shortDescription || description?.slice(0, 160),
        metaKeywords,
        images: images?.length
          ? { create: images.map((img, idx) => ({ 
              url: img.url, 
              altText: img.altText || '', 
              isPrimary: img.isPrimary || false, 
              sortOrder: idx 
            })) }
          : undefined,
        variants: variants?.length
          ? { create: variants.map((v) => ({ ...v, sku: v.sku || generateSKU(v.name) })) }
          : undefined,
      },
      include: productInclude,
    });

    await invalidateProductCache(product.id);
    return res.status(201).json({ success: true, message: 'Product created.', data: formatProduct(product) });
  } catch (err) {
    if (err.code === 'P2002') {
      return res.status(409).json({ success: false, message: `Duplicate value for: ${err.meta?.target?.join(', ')}` });
    }
    console.error('createProduct error:', err);
    return res.status(500).json({ success: false, message: 'Failed to create product.' });
  }
};

// PUT /api/admin/products/:id
const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;

    const exists = await prisma.product.findUnique({ where: { id } });
    if (!exists) return res.status(404).json({ success: false, message: 'Product not found.' });

    const {
      name, description, shortDescription, price, compareAtPrice, costPrice,
      stock, lowStockThreshold, brand, tags, categoryId, isActive, isFeatured,
      metaTitle, metaDescription, metaKeywords, images,
    } = req.body;

    const updateData = {};
    if (name !== undefined) {
      updateData.name = name;
      const newSlug = slugify(name);
      const slugExists = await prisma.product.findFirst({ where: { slug: newSlug, NOT: { id } } });
      updateData.slug = slugExists ? `${newSlug}-${Date.now()}` : newSlug;
    }
    if (description !== undefined) updateData.description = description;
    if (shortDescription !== undefined) updateData.shortDescription = shortDescription;
    if (price !== undefined) updateData.price = parseFloat(price);
    if (compareAtPrice !== undefined) updateData.compareAtPrice = compareAtPrice ? parseFloat(compareAtPrice) : null;
    if (costPrice !== undefined) updateData.costPrice = costPrice ? parseFloat(costPrice) : null;
    if (stock !== undefined) updateData.stock = parseInt(stock);
    if (lowStockThreshold !== undefined) updateData.lowStockThreshold = parseInt(lowStockThreshold);
    if (brand !== undefined) updateData.brand = brand;
    if (tags !== undefined) updateData.tags = tags;
    if (categoryId !== undefined) updateData.categoryId = categoryId;
    if (isActive !== undefined) updateData.isActive = isActive;
    if (isFeatured !== undefined) updateData.isFeatured = isFeatured;
    if (metaTitle !== undefined) updateData.metaTitle = metaTitle;
    if (metaDescription !== undefined) updateData.metaDescription = metaDescription;
    if (metaKeywords !== undefined) updateData.metaKeywords = metaKeywords;

    // Handle images update
    if (images !== undefined) {
      await prisma.productImage.deleteMany({ where: { productId: id } });
      updateData.images = { 
        create: images.map((img, idx) => ({ 
          url: img.url, 
          altText: img.altText || '', 
          isPrimary: img.isPrimary || false, 
          sortOrder: idx 
        })) 
      };
    }

    const product = await prisma.product.update({
      where: { id },
      data: updateData,
      include: productInclude,
    });

    await invalidateProductCache(id);
    return res.json({ success: true, message: 'Product updated.', data: formatProduct(product) });
  } catch (err) {
    console.error('updateProduct error:', err);
    return res.status(500).json({ success: false, message: 'Failed to update product.' });
  }
};

// DELETE /api/admin/products/:id
const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;

    const exists = await prisma.product.findUnique({ where: { id } });
    if (!exists) return res.status(404).json({ success: false, message: 'Product not found.' });

    // Soft delete (set isActive = false) vs hard delete
    const { hard } = req.query;
    if (hard === 'true') {
      await prisma.product.delete({ where: { id } });
    } else {
      await prisma.product.update({ where: { id }, data: { isActive: false } });
    }

    await invalidateProductCache(id);
    return res.json({ success: true, message: `Product ${hard === 'true' ? 'permanently deleted' : 'deactivated'}.` });
  } catch (err) {
    console.error('deleteProduct error:', err);
    return res.status(500).json({ success: false, message: 'Failed to delete product.' });
  }
};

// GET /api/admin/products (with inactive ones too)
const adminGetProducts = async (req, res) => {
  try {
    const { q, category, isActive, sortBy } = req.query;
    const { skip, take, page, limit } = getPaginationParams(req.query.page, req.query.limit);

    const where = {};
    if (q) {
      where.OR = [
        { name: { contains: q, mode: 'insensitive' } },
        { sku: { contains: q, mode: 'insensitive' } },
        { brand: { contains: q, mode: 'insensitive' } },
      ];
    }
    if (category) where.categoryId = category;
    if (isActive !== undefined) where.isActive = isActive === 'true';

    const orderByMap = {
      price_asc: { price: 'asc' },
      price_desc: { price: 'desc' },
      name_asc: { name: 'asc' },
      newest: { createdAt: 'desc' },
      oldest: { createdAt: 'asc' },
    };

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: {
          category: { select: { id: true, name: true, slug: true } },
          images: { where: { isPrimary: true }, take: 1 },
          _count: { select: { reviews: true } },
        },
        skip,
        take,
        orderBy: orderByMap[sortBy] || { createdAt: 'desc' },
      }),
      prisma.product.count({ where }),
    ]);

    return res.json({
      success: true,
      data: products.map((p) => ({
        ...p,
        price: parseFloat(p.price),
        compareAtPrice: p.compareAtPrice ? parseFloat(p.compareAtPrice) : null,
        totalReviews: p._count.reviews,
        primaryImage: p.images[0] || null,
      })),
      meta: buildPaginationMeta(total, page, limit),
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to fetch products.' });
  }
};

// GET /api/admin/products/:id
const adminGetProduct = async (req, res) => {
  try {
    const product = await prisma.product.findUnique({
      where: { id: req.params.id },
      include: productInclude,
    });
    if (!product) return res.status(404).json({ success: false, message: 'Product not found.' });
    return res.json({ success: true, data: formatProduct(product) });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to fetch product.' });
  }
};

// GET /api/admin/stats
const getAdminStats = async (req, res) => {
  try {
    const [totalProducts, activeProducts, totalCategories, totalReviews, lowStockProducts, featuredCount] =
      await Promise.all([
        prisma.product.count(),
        prisma.product.count({ where: { isActive: true } }),
        prisma.category.count({ where: { isActive: true } }),
        prisma.review.count({ where: { isApproved: true } }),
        prisma.product.count({ where: { isActive: true, stock: { lte: 5, gt: 0 } } }),
        prisma.product.count({ where: { isFeatured: true, isActive: true } }),
      ]);

    return res.json({
      success: true,
      data: {
        totalProducts, activeProducts, totalCategories,
        totalReviews, lowStockProducts, featuredCount,
        inactiveProducts: totalProducts - activeProducts,
      },
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to fetch stats.' });
  }
};

module.exports = {
  getProducts, getProductByIdentifier, getFeaturedProducts,
  createProduct, updateProduct, deleteProduct,
  adminGetProducts, adminGetProduct, getAdminStats,
};
