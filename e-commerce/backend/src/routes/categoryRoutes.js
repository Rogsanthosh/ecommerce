const express = require('express');
const router = express.Router();
const { getCategories, getCategoryBySlug } = require('../controllers/categoryController');

/**
 * @swagger
 * /api/categories:
 *   get:
 *     tags: [Categories]
 *     summary: Get all active categories with product count
 *     responses:
 *       200:
 *         description: List of categories
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data:
 *                   type: array
 *                   items: { $ref: '#/components/schemas/Category' }
 */
router.get('/', getCategories);

/**
 * @swagger
 * /api/categories/{slug}:
 *   get:
 *     tags: [Categories]
 *     summary: Get category detail by slug
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         schema: { type: string }
 *         example: footwear
 *     responses:
 *       200:
 *         description: Category detail
 *       404:
 *         description: Not found
 */
router.get('/:slug', getCategoryBySlug);

module.exports = router;
