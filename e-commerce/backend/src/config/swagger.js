const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: '🛍️ ShopZone eCommerce API',
      version: '1.0.0',
      description: `
## eCommerce Product Service REST API

Full-featured product management API with search, filtering, admin CRUD, and JWT authentication.

### Quick Start
1. Login via **POST /api/auth/login** → copy the \`token\`
2. Click **Authorize** button above → paste \`Bearer <token>\`
3. Now admin endpoints are unlocked!

**Default Admin:** \`admin@shop.com\` / \`Admin@123\`
      `,
    },
    servers: [
      {
        url: '/',
        description: 'Current Server',
      },
    ],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Paste your JWT token here (without Bearer prefix)',
        },
      },
      schemas: {
        Product: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            sku: { type: 'string', example: 'NIK-123456' },
            name: { type: 'string', example: 'Nike Air Max 270' },
            slug: { type: 'string', example: 'nike-air-max-270' },
            description: { type: 'string' },
            shortDescription: { type: 'string' },
            price: { type: 'number', example: 4999.99 },
            compareAtPrice: { type: 'number', example: 5999.99 },
            stock: { type: 'integer', example: 150 },
            brand: { type: 'string', example: 'Nike' },
            tags: { type: 'array', items: { type: 'string' } },
            isActive: { type: 'boolean' },
            isFeatured: { type: 'boolean' },
            availability: { type: 'string', enum: ['in_stock', 'low_stock', 'out_of_stock'] },
            averageRating: { type: 'number', example: 4.5 },
            totalReviews: { type: 'integer', example: 24 },
            discount: { type: 'integer', example: 17 },
            metaTitle: { type: 'string' },
            metaDescription: { type: 'string' },
            metaKeywords: { type: 'string' },
            category: { $ref: '#/components/schemas/Category' },
            images: { type: 'array', items: { $ref: '#/components/schemas/ProductImage' } },
            reviews: { type: 'array', items: { $ref: '#/components/schemas/Review' } },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        ProductInput: {
          type: 'object',
          required: ['name', 'description', 'price', 'stock', 'categoryId'],
          properties: {
            name: { type: 'string', example: 'Nike Air Max 270' },
            description: { type: 'string', example: 'Premium running shoe...' },
            shortDescription: { type: 'string' },
            price: { type: 'number', example: 4999.99 },
            compareAtPrice: { type: 'number', example: 5999.99 },
            costPrice: { type: 'number', example: 2500.00 },
            stock: { type: 'integer', example: 100 },
            lowStockThreshold: { type: 'integer', example: 10 },
            brand: { type: 'string', example: 'Nike' },
            tags: { type: 'array', items: { type: 'string' } },
            categoryId: { type: 'string', format: 'uuid' },
            isActive: { type: 'boolean', default: true },
            isFeatured: { type: 'boolean', default: false },
            metaTitle: { type: 'string' },
            metaDescription: { type: 'string' },
            metaKeywords: { type: 'string' },
            images: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  url: { type: 'string' },
                  altText: { type: 'string' },
                  isPrimary: { type: 'boolean' },
                },
              },
            },
          },
        },
        Category: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            name: { type: 'string', example: 'Footwear' },
            slug: { type: 'string', example: 'footwear' },
            description: { type: 'string' },
            imageUrl: { type: 'string' },
          },
        },
        ProductImage: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            url: { type: 'string', example: 'https://example.com/img.jpg' },
            altText: { type: 'string' },
            isPrimary: { type: 'boolean' },
            sortOrder: { type: 'integer' },
          },
        },
        Review: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            rating: { type: 'integer', minimum: 1, maximum: 5 },
            title: { type: 'string' },
            comment: { type: 'string' },
            authorName: { type: 'string' },
            isVerified: { type: 'boolean' },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        PaginationMeta: {
          type: 'object',
          properties: {
            total: { type: 'integer' },
            page: { type: 'integer' },
            limit: { type: 'integer' },
            totalPages: { type: 'integer' },
            hasNext: { type: 'boolean' },
            hasPrev: { type: 'boolean' },
          },
        },
        ApiError: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            message: { type: 'string' },
            errors: { type: 'array', items: { type: 'object' } },
          },
        },
      },
    },
    tags: [
      { name: 'Products', description: 'Public product listing & detail endpoints' },
      { name: 'Search', description: 'Product search with filters & pagination' },
      { name: 'Categories', description: 'Product categories' },
      { name: 'Reviews', description: 'Product reviews' },
      { name: 'Auth', description: 'Admin authentication' },
      { name: 'Admin - Products', description: '🔐 Admin product management (JWT required)' },
      { name: 'Admin - Categories', description: '🔐 Admin category management (JWT required)' },
    ],
  },
  apis: ['./src/routes/*.js'],
};

const swaggerSpec = swaggerJsdoc(options);
module.exports = { swaggerSpec };
