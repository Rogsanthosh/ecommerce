const prisma = require('../config/database');
const { invalidateProductCache } = require('../config/cache');

// POST /api/products/:productId/reviews
const createReview = async (req, res) => {
  try {
    const { productId } = req.params;
    const { rating, title, comment, authorName, authorEmail } = req.body;

    if (!rating || !comment || !authorName || !authorEmail) {
      return res.status(400).json({ success: false, message: 'rating, comment, authorName, authorEmail are required.' });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({ success: false, message: 'Rating must be between 1 and 5.' });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(authorEmail)) {
      return res.status(400).json({ success: false, message: 'Please provide a valid email address.' });
    }

    const product = await prisma.product.findUnique({ where: { id: productId, isActive: true } });
    if (!product) return res.status(404).json({ success: false, message: 'Product not found.' });

    // ── ANTI-SPAM: one review per email per product ────────────────────────────
    const existingReview = await prisma.review.findFirst({
      where: { productId, authorEmail: authorEmail.toLowerCase().trim() },
    });
    if (existingReview) {
      return res.status(409).json({
        success: false,
        message: 'You have already submitted a review for this product.',
      });
    }

    const review = await prisma.review.create({
      data: {
        rating: parseInt(rating),
        title,
        comment,
        authorName: authorName.trim(),
        authorEmail: authorEmail.toLowerCase().trim(),
        productId,
        isApproved: true,
      },
    });

    await invalidateProductCache(productId);
    return res.status(201).json({ success: true, message: 'Review submitted!', data: review });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to submit review.' });
  }
};

// GET /api/products/:productId/reviews
const getProductReviews = async (req, res) => {
  try {
    const { productId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(50, parseInt(req.query.limit) || 10);

    const [reviews, total] = await Promise.all([
      prisma.review.findMany({
        where: { productId, isApproved: true },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true, rating: true, title: true, comment: true,
          authorName: true, isVerified: true, helpfulCount: true, createdAt: true,
        },
      }),
      prisma.review.count({ where: { productId, isApproved: true } }),
    ]);

    return res.json({
      success: true,
      data: reviews,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to fetch reviews.' });
  }
};

// PATCH /api/admin/reviews/:id/approve
const approveReview = async (req, res) => {
  try {
    const review = await prisma.review.update({
      where: { id: req.params.id },
      data: { isApproved: req.body.isApproved !== false },
    });
    await invalidateProductCache(review.productId);
    return res.json({ success: true, message: 'Review updated.', data: review });
  } catch (err) {
    if (err.code === 'P2025') return res.status(404).json({ success: false, message: 'Review not found.' });
    return res.status(500).json({ success: false, message: 'Failed to update review.' });
  }
};

// DELETE /api/admin/reviews/:id
const deleteReview = async (req, res) => {
  try {
    const review = await prisma.review.delete({ where: { id: req.params.id } });
    await invalidateProductCache(review.productId);
    return res.json({ success: true, message: 'Review deleted.' });
  } catch (err) {
    if (err.code === 'P2025') return res.status(404).json({ success: false, message: 'Review not found.' });
    return res.status(500).json({ success: false, message: 'Failed to delete review.' });
  }
};

module.exports = { createReview, getProductReviews, approveReview, deleteReview };
