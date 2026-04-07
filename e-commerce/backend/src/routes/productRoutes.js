const express = require('express');
const router = express.Router();
const {
  getProducts, getProductByIdentifier, getFeaturedProducts,
} = require('../controllers/productController');
const { createReview, getProductReviews } = require('../controllers/reviewController');

/**
 * @swagger
 * /api/products:
 *   get:
 *     tags: [Search]
 *     summary: Search & list products with filters and pagination
 *     parameters:
 *       - in: query
 *         name: q
 *         schema: { type: string }
 *         description: Search keyword (searches name, description, brand, tags, SKU)
 *         example: nike
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 12, maximum: 100 }
 *       - in: query
 *         name: category
 *         schema: { type: string }
 *         description: Category slug
 *         example: footwear
 *       - in: query
 *         name: minPrice
 *         schema: { type: number }
 *         example: 500
 *       - in: query
 *         name: maxPrice
 *         schema: { type: number }
 *         example: 5000
 *       - in: query
 *         name: brand
 *         schema: { type: string }
 *         example: Nike
 *       - in: query
 *         name: inStock
 *         schema: { type: boolean }
 *       - in: query
 *         name: featured
 *         schema: { type: boolean }
 *       - in: query
 *         name: sortBy
 *         schema: { type: string, enum: [newest, price_asc, price_desc, name_asc, popular] }
 *     responses:
 *       200:
 *         description: Product listing with pagination
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data:
 *                   type: array
 *                   items: { $ref: '#/components/schemas/Product' }
 *                 meta: { $ref: '#/components/schemas/PaginationMeta' }
 *                 fromCache: { type: boolean }
 */
router.get('/', getProducts);

/**
 * @swagger
 * /api/products/featured:
 *   get:
 *     tags: [Products]
 *     summary: Get featured products (top 8)
 *     responses:
 *       200:
 *         description: Featured product list
 */
router.get('/featured', getFeaturedProducts);

/**
 * @swagger
 * /api/products/{identifier}:
 *   get:
 *     tags: [Products]
 *     summary: Get full product detail by slug, SKU, or UUID
 *     parameters:
 *       - in: path
 *         name: identifier
 *         required: true
 *         schema: { type: string }
 *         description: Product slug, SKU, or UUID
 *         example: nike-air-max-270
 *     responses:
 *       200:
 *         description: Full product detail with reviews, variants, images
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data: { $ref: '#/components/schemas/Product' }
 *       404:
 *         description: Product not found
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ApiError' }
 */
router.get('/:identifier', getProductByIdentifier);

/**
 * @swagger
 * /api/products/{productId}/reviews:
 *   get:
 *     tags: [Reviews]
 *     summary: Get paginated reviews for a product
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema: { type: string }
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10 }
 *     responses:
 *       200:
 *         description: Review list with pagination
 *   post:
 *     tags: [Reviews]
 *     summary: Submit a product review
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [rating, comment, authorName, authorEmail]
 *             properties:
 *               rating: { type: integer, minimum: 1, maximum: 5, example: 5 }
 *               title: { type: string, example: "Excellent product!" }
 *               comment: { type: string, example: "Really happy with this purchase." }
 *               authorName: { type: string, example: "Ravi K." }
 *               authorEmail: { type: string, example: "ravi@gmail.com" }
 *     responses:
 *       201:
 *         description: Review submitted
 *       400:
 *         description: Validation error
 */
router.get('/:productId/reviews', getProductReviews);
router.post('/:productId/reviews', createReview);

module.exports = router;
