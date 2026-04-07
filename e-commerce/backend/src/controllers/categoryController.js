const prisma = require('../config/database');
const { cacheGet, cacheSet, cacheDel, cacheKeys } = require('../config/cache');
const { slugify } = require('../utils/helpers');

// GET /api/categories
const getCategories = async (req, res) => {
  try {
    const cached = await cacheGet(cacheKeys.CATEGORIES);
    if (cached) return res.json({ ...cached, fromCache: true });

    const categories = await prisma.category.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      include: { _count: { select: { products: { where: { isActive: true } } } } },
    });

    const response = {
      success: true,
      data: categories.map((c) => ({ ...c, productCount: c._count.products })),
    };

    await cacheSet(cacheKeys.CATEGORIES, response, 600);
    return res.json(response);
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to fetch categories.' });
  }
};

// GET /api/categories/:slug
const getCategoryBySlug = async (req, res) => {
  try {
    const category = await prisma.category.findUnique({
      where: { slug: req.params.slug },
      include: { _count: { select: { products: { where: { isActive: true } } } } },
    });
    if (!category) return res.status(404).json({ success: false, message: 'Category not found.' });
    return res.json({ success: true, data: { ...category, productCount: category._count.products } });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to fetch category.' });
  }
};

// POST /api/admin/categories
const createCategory = async (req, res) => {
  try {
    const { name, description, imageUrl, sortOrder } = req.body;
    if (!name) return res.status(400).json({ success: false, message: 'Category name is required.' });

    const slug = slugify(name);
    const existing = await prisma.category.findUnique({ where: { slug } });
    if (existing) return res.status(409).json({ success: false, message: 'Category already exists.' });

    const category = await prisma.category.create({
      data: { name, slug, description, imageUrl, sortOrder: sortOrder || 0 },
    });

    await cacheDel(cacheKeys.CATEGORIES);
    return res.status(201).json({ success: true, message: 'Category created.', data: category });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to create category.' });
  }
};

// PUT /api/admin/categories/:id
const updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, imageUrl, isActive, sortOrder } = req.body;

    const updateData = {};
    if (name !== undefined) {
      updateData.name = name;
      updateData.slug = slugify(name);
    }
    if (description !== undefined) updateData.description = description;
    if (imageUrl !== undefined) updateData.imageUrl = imageUrl;
    if (isActive !== undefined) updateData.isActive = isActive;
    if (sortOrder !== undefined) updateData.sortOrder = sortOrder;

    const category = await prisma.category.update({ where: { id }, data: updateData });
    await cacheDel(cacheKeys.CATEGORIES);
    return res.json({ success: true, message: 'Category updated.', data: category });
  } catch (err) {
    if (err.code === 'P2025') return res.status(404).json({ success: false, message: 'Category not found.' });
    return res.status(500).json({ success: false, message: 'Failed to update category.' });
  }
};

// DELETE /api/admin/categories/:id
const deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const productCount = await prisma.product.count({ where: { categoryId: id } });
    if (productCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete. ${productCount} product(s) are using this category.`,
      });
    }
    await prisma.category.delete({ where: { id } });
    await cacheDel(cacheKeys.CATEGORIES);
    return res.json({ success: true, message: 'Category deleted.' });
  } catch (err) {
    if (err.code === 'P2025') return res.status(404).json({ success: false, message: 'Category not found.' });
    return res.status(500).json({ success: false, message: 'Failed to delete category.' });
  }
};

// GET /api/admin/categories
const adminGetCategories = async (req, res) => {
  try {
    const categories = await prisma.category.findMany({
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      include: { _count: { select: { products: true } } },
    });
    return res.json({
      success: true,
      data: categories.map((c) => ({ ...c, productCount: c._count.products })),
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to fetch categories.' });
  }
};

module.exports = { getCategories, getCategoryBySlug, createCategory, updateCategory, deleteCategory, adminGetCategories };
