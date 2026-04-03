const express = require('express');
const Product = require('../models/Product');
const auth = require('../middleware/auth');
const { userAuth } = require('../middleware/auth');
const upload = require('../middleware/upload');
const { v2: cloudinary } = require('cloudinary');
const fs = require('fs');
const Category = require('../models/Category');
const { ensureDefaultCategories } = require('../utils/categoryDefaults');

const router = express.Router();
const allowedSortFields = new Set(['createdAt', 'price', 'title', 'views']);

const parseContactInfo = (value) => {
  if (!value) {
    return {};
  }

  if (typeof value === 'string') {
    return JSON.parse(value);
  }

  return value;
};

const ensureValidCategory = async (category) => {
  await ensureDefaultCategories();
  return Category.findOne({ name: category, isActive: true });
};

// Get all products with pagination and filters
router.get('/', async (req, res) => {
  try {
    const {
      page = 1,
      limit = 12,
      category,
      minPrice,
      maxPrice,
      location,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const query = { isActive: true, isSold: false };

    // Apply filters
    if (category) query.category = category;
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = Number(minPrice);
      if (maxPrice) query.price.$lte = Number(maxPrice);
    }
    if (location) query.location = new RegExp(location, 'i');
    if (search) {
      query.$or = [
        { title: new RegExp(search, 'i') },
        { description: new RegExp(search, 'i') }
      ];
    }

    const safeSortBy = allowedSortFields.has(sortBy) ? sortBy : 'createdAt';
    const sortOptions = {};
    sortOptions[safeSortBy] = sortOrder === 'desc' ? -1 : 1;

    const products = await Product.find(query)
      .populate('seller', 'name phone location')
      .sort(sortOptions)
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Product.countDocuments(query);

    res.json({
      products,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
});

// Get single product
router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate('seller', 'name phone location email');

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Check for user authentication (token in header)
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (token) {
      try {
        const jwt = require('jsonwebtoken');
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const userId = decoded.userId;

        // If user hasn't viewed the product yet
        const hasViewed = product.viewedBy.some((viewerId) => viewerId.toString() === userId);

        if (!hasViewed) {
          product.views += 1;
          product.viewedBy.push(userId);
          await product.save();
        }
      } catch (err) {
        // Invalid token, treat as guest
        console.log("Invalid token for view tracking", err.message);
      }
    }

    res.json(product);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create new product
router.post('/', userAuth, upload.array('images', 5), async (req, res) => {
  const tempFilePaths = (req.files || []).map((file) => file.path).filter(Boolean);

  try {
    const { title, description, category, condition, price, location, contactInfo } = req.body;

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: 'Please upload at least one image' });
    }

    const validCategory = await ensureValidCategory(category);
    if (!validCategory) {
      return res.status(400).json({ message: 'Please choose a valid active category' });
    }

    // Upload each image to Cloudinary
    const uploadedImages = [];
    for (const file of req.files) {
      const result = await cloudinary.uploader.upload(file.path, {
        folder: 'olx-products'
      });
      uploadedImages.push(result.secure_url);
    }

    const productData = {
      title,
      description,
      category,
      condition,
      price,
      location,
      contactInfo: parseContactInfo(contactInfo),
      images: uploadedImages,
      seller: req.user._id
    };

    const product = new Product(productData);
    await product.save();

    const populatedProduct = await Product.findById(product._id)
      .populate('seller', 'name phone location');

    res.status(201).json(populatedProduct);
  } catch (error) {
    console.error('Error creating product:', error);
    res.status(500).json({ message: error.message });
  } finally {
    tempFilePaths.forEach((filePath) => {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    });
  }
});

// Update product
router.put('/:id', userAuth, upload.array('images', 5), async (req, res) => {
  const tempFilePaths = (req.files || []).map((file) => file.path).filter(Boolean);

  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Check if user is the seller
    if (product.seller.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to update this product' });
    }

    let uploadedImages = [];
    if (req.files?.length) {
      for (const file of req.files) {
        const result = await cloudinary.uploader.upload(file.path, {
          folder: 'olx-products'
        });
        uploadedImages.push(result.secure_url);
      }
    }

    let existingImages = req.body.existingImages || [];
    if (!Array.isArray(existingImages)) {
      existingImages = existingImages ? [existingImages] : [];
    }

    const validCategory = await ensureValidCategory(req.body.category);
    if (!validCategory) {
      return res.status(400).json({ message: 'Please choose a valid active category' });
    }

    const contactInfo = parseContactInfo(req.body.contactInfo);

    const nextImages = [...existingImages, ...uploadedImages];

    if (nextImages.length === 0) {
      return res.status(400).json({ message: 'Please keep at least one image' });
    }

    const updatedProduct = await Product.findByIdAndUpdate(
      req.params.id,
      {
        ...req.body,
        contactInfo,
        images: nextImages,
      },
      { new: true, runValidators: true }
    ).populate('seller', 'name phone location');

    res.json(updatedProduct);
  } catch (error) {
    res.status(500).json({ message: error.message });
  } finally {
    tempFilePaths.forEach((filePath) => {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    });
  }
});

// Delete product
router.delete('/:id', userAuth, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Check if user is the seller
    if (product.seller.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to delete this product' });
    }

    await Product.findByIdAndDelete(req.params.id);

    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get user's products
router.get('/user/:userId', async (req, res) => {
  try {
    const products = await Product.find({ seller: req.params.userId })
      .populate('seller', 'name phone location')
      .sort({ createdAt: -1 });

    res.json(products);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
