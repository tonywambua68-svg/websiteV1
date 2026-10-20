import express from 'express';
import mongoose from 'mongoose';
import Product from '../models/Product.js';

const router = express.Router();

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.DATABASE_URL || 'mongodb://localhost:27017/imara-tech');
    console.log('MongoDB connected');
  } catch (error) {
    console.error('MongoDB connection error:', error);
  }
};

connectDB();

// GET /api/products - Get all products with filtering and pagination
router.get('/', async (req, res) => {
  try {
    const {
      limit = 20,
      offset = 0,
      category,
      search,
      minPrice,
      maxPrice,
      brand,
      inStock,
      sort = 'date',
      order = 'desc'
    } = req.query;

    let query = {};

    // Apply filters
    if (category) query.category = category;
    if (brand) query.brand = brand;
    if (inStock === 'true') query.stock = { $gt: 0 };
    if (minPrice) query.price = { ...query.price, $gte: Number(minPrice) };
    if (maxPrice) query.price = { ...query.price, $lte: Number(maxPrice) };
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { brand: { $regex: search, $options: 'i' } }
      ];
    }

    // Apply sorting
    const sortOptions = {};
    if (sort === 'name') sortOptions.name = order === 'asc' ? 1 : -1;
    else if (sort === 'price') sortOptions.price = order === 'asc' ? 1 : -1;
    else sortOptions.createdAt = order === 'asc' ? 1 : -1;

    const products = await Product.find(query)
      .sort(sortOptions)
      .limit(Number(limit))
      .skip(Number(offset));

    const total = await Product.countDocuments(query);

    res.json({
      success: true,
      data: {
        data: products,
        total,
        limit: Number(limit),
        offset: Number(offset),
        hasMore: Number(offset) + Number(limit) < total
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch products'
    });
  }
});

// GET /api/products/:id - Get single product
router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    
    if (!product) {
      return res.status(404).json({
        success: false,
        error: 'Product not found'
      });
    }

    res.json({
      success: true,
      data: product
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch product'
    });
  }
});

// POST /api/products - Create new product (admin only)
router.post('/', async (req, res) => {
  try {
    // TODO: Add authentication check for admin role
    const product = new Product(req.body);
    await product.save();

    res.status(201).json({
      success: true,
      data: product,
      message: 'Product created successfully'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: 'Failed to create product'
    });
  }
});

// PUT /api/products/:id - Update product (admin only)
router.put('/:id', async (req, res) => {
  try {
    // TODO: Add authentication check for admin role
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!product) {
      return res.status(404).json({
        success: false,
        error: 'Product not found'
      });
    }

    res.json({
      success: true,
      data: product,
      message: 'Product updated successfully'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: 'Failed to update product'
    });
  }
});

// DELETE /api/products/:id - Delete product (admin only)
router.delete('/:id', async (req, res) => {
  try {
    // TODO: Add authentication check for admin role
    const product = await Product.findByIdAndDelete(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        error: 'Product not found'
      });
    }

    res.json({
      success: true,
      message: 'Product deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to delete product'
    });
  }
});

export default router;
