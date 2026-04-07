const slugify = (text) => {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
};

const generateSKU = (name) => {
  const prefix = name
    .replace(/[^a-zA-Z]/g, '')
    .slice(0, 3)
    .toUpperCase()
    .padEnd(3, 'X');
  const random = Math.random().toString(36).substring(2, 7).toUpperCase();
  return `${prefix}-${random}`;
};

const getPaginationParams = (page, limit) => {
  const parsedPage = Math.max(1, parseInt(page || '1', 10));
  const parsedLimit = Math.min(100, Math.max(1, parseInt(limit || '12', 10)));
  return {
    skip: (parsedPage - 1) * parsedLimit,
    take: parsedLimit,
    page: parsedPage,
    limit: parsedLimit,
  };
};

const buildPaginationMeta = (total, page, limit) => ({
  total,
  page,
  limit,
  totalPages: Math.ceil(total / limit),
  hasNext: page < Math.ceil(total / limit),
  hasPrev: page > 1,
});

const getAvailability = (stock, threshold = 5) => {
  if (stock === 0) return 'out_of_stock';
  if (stock <= threshold) return 'low_stock';
  return 'in_stock';
};

const computeProductStats = (reviews = []) => {
  // Reviews fetched with `where: { isApproved: true }` won't have the `isApproved` field in `select`.
  // So we only filter out reviews explicitly marked as `isApproved: false`.
  const approved = reviews.filter((r) => r.isApproved !== false);
  if (!approved.length) return { averageRating: 0, totalReviews: 0, ratingBreakdown: {} };

  const sum = approved.reduce((acc, r) => acc + r.rating, 0);
  const breakdown = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  approved.forEach((r) => { breakdown[r.rating] = (breakdown[r.rating] || 0) + 1; });

  return {
    averageRating: Math.round((sum / approved.length) * 10) / 10,
    totalReviews: approved.length, // Will be overridden by formatProduct if _count exists
    ratingBreakdown: breakdown,
  };
};

const formatProduct = (product) => {
  const stats = computeProductStats(product.reviews || []);
  
  // Actually use the true total count from the database if available
  const trueTotalReviews = product._count?.reviews ?? stats.totalReviews;

  return {
    ...product,
    price: parseFloat(product.price),
    compareAtPrice: product.compareAtPrice ? parseFloat(product.compareAtPrice) : null,
    costPrice: product.costPrice ? parseFloat(product.costPrice) : null,
    availability: getAvailability(product.stock, product.lowStockThreshold),
    discount: product.compareAtPrice
      ? Math.round((1 - parseFloat(product.price) / parseFloat(product.compareAtPrice)) * 100)
      : 0,
    ...stats,
    totalReviews: trueTotalReviews,
  };
};

module.exports = {
  slugify,
  generateSKU,
  getPaginationParams,
  buildPaginationMeta,
  getAvailability,
  computeProductStats,
  formatProduct,
};
