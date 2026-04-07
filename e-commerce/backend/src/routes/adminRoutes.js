const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { authenticate } = require('../middleware/auth');
const { validate } = require('../middleware/errorHandler');
const {
  createProduct, updateProduct, deleteProduct,
  adminGetProducts, adminGetProduct, getAdminStats,
} = require('../controllers/productController');
const {
  createCategory, updateCategory, deleteCategory, adminGetCategories,
} = require('../controllers/categoryController');
const { approveReview, deleteReview } = require('../controllers/reviewController');

// All admin routes require authentication
router.use(authenticate);

// ─── STATS ──────────────────────────────────────────────────────────────────
/**
 * @swagger
 * /api/admin/stats:
 *   get:
 *     tags: [Admin - Products]
 *     summary: 🔐 Dashboard stats
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard statistics
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data:
 *                   type: object
 *                   properties:
 *                     totalProducts: { type: integer }
 *                     activeProducts: { type: integer }
 *                     totalCategories: { type: integer }
 *                     totalReviews: { type: integer }
 *                     lowStockProducts: { type: integer }
 *                     featuredCount: { type: integer }
 */
router.get('/stats', getAdminStats);

// ─── PRODUCTS ────────────────────────────────────────────────────────────────
/**
 * @swagger
 * /api/admin/products:
 *   get:
 *     tags: [Admin - Products]
 *     summary: 🔐 List all products (including inactive)
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: q
 *         schema: { type: string }
 *       - in: query
 *         name: category
 *         schema: { type: string }
 *         description: Category UUID
 *       - in: query
 *         name: isActive
 *         schema: { type: boolean }
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 12 }
 *       - in: query
 *         name: sortBy
 *         schema: { type: string, enum: [newest, oldest, price_asc, price_desc, name_asc] }
 *     responses:
 *       200:
 *         description: Admin product list with meta
 *   post:
 *     tags: [Admin - Products]
 *     summary: 🔐 Create a new product
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/ProductInput' }
 *     responses:
 *       201:
 *         description: Product created
 *       400:
 *         description: Validation error
 *       409:
 *         description: Duplicate SKU/slug
 */
// Validation rules for product create
const productCreateRules = [
  body('name').trim().notEmpty().withMessage('Product name is required'),
  body('description').trim().notEmpty().withMessage('Description is required'),
  body('price').isFloat({ min: 0 }).withMessage('Price must be a positive number'),
  body('stock').isInt({ min: 0 }).withMessage('Stock must be a non-negative integer'),
  body('categoryId').isUUID().withMessage('Valid category ID is required'),
  body('compareAtPrice').optional({ nullable: true }).isFloat({ min: 0 }).withMessage('Compare price must be positive'),
];

// Validation rules for product update (all fields optional)
const productUpdateRules = [
  body('name').optional().trim().notEmpty().withMessage('Name cannot be empty'),
  body('price').optional().isFloat({ min: 0 }).withMessage('Price must be positive'),
  body('stock').optional().isInt({ min: 0 }).withMessage('Stock must be non-negative'),
  body('categoryId').optional().isUUID().withMessage('Valid category ID required'),
];

router.get('/products', adminGetProducts);
router.post('/products', productCreateRules, validate, createProduct);

/**
 * @swagger
 * /api/admin/products/{id}:
 *   get:
 *     tags: [Admin - Products]
 *     summary: 🔐 Get single product by UUID (for edit form)
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Full product detail
 *       404:
 *         description: Not found
 *   put:
 *     tags: [Admin - Products]
 *     summary: 🔐 Update product
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/ProductInput' }
 *     responses:
 *       200:
 *         description: Product updated
 *       404:
 *         description: Not found
 *   delete:
 *     tags: [Admin - Products]
 *     summary: 🔐 Soft-delete (deactivate) or hard-delete product
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *       - in: query
 *         name: hard
 *         schema: { type: boolean }
 *         description: Pass hard=true for permanent deletion
 *     responses:
 *       200:
 *         description: Product deleted/deactivated
 *       404:
 *         description: Not found
 */
router.get('/products/:id', adminGetProduct);
router.put('/products/:id', productUpdateRules, validate, updateProduct);
router.delete('/products/:id', deleteProduct);

// ─── CATEGORIES ──────────────────────────────────────────────────────────────
/**
 * @swagger
 * /api/admin/categories:
 *   get:
 *     tags: [Admin - Categories]
 *     summary: 🔐 List all categories
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: All categories (including inactive)
 *   post:
 *     tags: [Admin - Categories]
 *     summary: 🔐 Create category
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name]
 *             properties:
 *               name: { type: string, example: Footwear }
 *               description: { type: string }
 *               imageUrl: { type: string }
 *               sortOrder: { type: integer, default: 0 }
 *     responses:
 *       201:
 *         description: Category created
 *       409:
 *         description: Already exists
 */
router.get('/categories', adminGetCategories);
router.post('/categories', createCategory);

/**
 * @swagger
 * /api/admin/categories/{id}:
 *   put:
 *     tags: [Admin - Categories]
 *     summary: 🔐 Update category
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name: { type: string }
 *               description: { type: string }
 *               imageUrl: { type: string }
 *               isActive: { type: boolean }
 *               sortOrder: { type: integer }
 *     responses:
 *       200:
 *         description: Updated
 *   delete:
 *     tags: [Admin - Categories]
 *     summary: 🔐 Delete category (fails if products exist)
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Deleted
 *       400:
 *         description: Has products, cannot delete
 */
router.put('/categories/:id', updateCategory);
router.delete('/categories/:id', deleteCategory);

// ─── REVIEWS ─────────────────────────────────────────────────────────────────
/**
 * @swagger
 * /api/admin/reviews/{id}/approve:
 *   patch:
 *     tags: [Admin - Products]
 *     summary: 🔐 Approve or reject a review
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               isApproved: { type: boolean }
 *     responses:
 *       200:
 *         description: Review status updated
 */
router.patch('/reviews/:id/approve', approveReview);

/**
 * @swagger
 * /api/admin/reviews/{id}:
 *   delete:
 *     tags: [Admin - Products]
 *     summary: 🔐 Delete a review
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Review deleted
 *       404:
 *         description: Not found
 */
router.delete('/reviews/:id', deleteReview);

module.exports = router;
