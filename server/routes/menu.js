const express = require('express');
const router = express.Router();
const Category = require('../models/Category');
const MenuItem = require('../models/MenuItem');
const Order = require('../models/Order');
const auth = require('../middleware/auth');
const authorizeRoles = require('../middleware/role');

// Helper to get order counts per menu item
async function getMenuItemOrderCounts() {
  try {
    const orderCounts = await Order.aggregate([
      { $unwind: '$items' },
      { $match: { status: { $ne: 'cancelled' } } },
      {
        $group: {
          _id: '$items.menu_item_id',
          count: { $sum: '$items.quantity' }
        }
      }
    ]);
    const countMap = {};
    orderCounts.forEach(oc => {
      if (oc._id) {
        countMap[oc._id.toString()] = oc.count;
      }
    });
    return countMap;
  } catch (err) {
    console.error('Error fetching order counts:', err);
    return {};
  }
}

// @route   GET /api/menu/categories
// @desc    Get all categories with their menu items
router.get('/categories', async (req, res) => {
  try {
    const categories = await Category.find().sort({ sort_order: 1, created_at: 1 });
    const menuItems = await MenuItem.find().sort({ created_at: -1 });
    const countMap = await getMenuItemOrderCounts();

    const sortedMenuItems = [...menuItems].sort((a, b) => {
      const countA = countMap[a._id.toString()] || 0;
      const countB = countMap[b._id.toString()] || 0;
      if (countB !== countA) return countB - countA;
      return b.created_at - a.created_at; // fallback to creation date
    });

    const result = categories.map(cat => {
      const items = sortedMenuItems.filter(item => 
        (item.category_id && item.category_id.toString() === cat._id.toString()) ||
        (item.category_ids && item.category_ids.some(id => id && id.toString() === cat._id.toString()))
      );
      return {
        id: cat._id,
        name: cat.name,
        description: cat.description,
        sort_order: cat.sort_order,
        image_url: cat.image_url,
        items: items.map(i => ({
          id: i._id,
          category_id: i.category_id,
          name: i.name,
          description: i.description,
          price: i.price,
          delivery_price: i.delivery_price || i.price,
          image_url: i.image_url,
          image_urls: i.image_urls,
          is_veg: i.is_veg,
          is_featured: i.is_featured || false,
          is_available: i.is_available,
          is_unlimited_stock: Boolean(i.is_unlimited_stock),
          stock_quantity: i.stock_quantity,
          min_stock_level: i.min_stock_level,
          daily_prepared_quantity: i.daily_prepared_quantity,
          unit: i.unit,
          auto_out_of_stock: i.auto_out_of_stock,
          variants: i.variants,
          addons: i.addons,
          is_combo: i.is_combo,
          combo_items: i.combo_items,
          category_ids: i.category_ids || [],
          recipe: i.recipe || []
        }))
      };
    });

    res.json(result);
  } catch (err) {
    console.error('Get categories error:', err.message);
    res.status(500).json({ message: 'Server Error' });
  }
});

// @route   GET /api/menu/items
// @desc    Get all menu items
router.get('/items', async (req, res) => {
  try {
    const items = await MenuItem.find().populate('category_id', 'name');
    const countMap = await getMenuItemOrderCounts();
    
    const sortedItems = [...items].sort((a, b) => {
      const countA = countMap[a._id.toString()] || 0;
      const countB = countMap[b._id.toString()] || 0;
      if (countB !== countA) return countB - countA;
      return a.name.localeCompare(b.name); // fallback to alphabetical
    });

    const formatted = sortedItems.map(i => ({
      id: i._id,
      category_id: i.category_id ? i.category_id._id : null,
      category_name: i.category_id ? i.category_id.name : 'Unassigned',
      name: i.name,
      description: i.description,
      price: i.price,
      delivery_price: i.delivery_price || i.price,
      image_url: i.image_url,
      image_urls: i.image_urls,
      is_veg: i.is_veg,
      is_featured: i.is_featured || false,
      is_available: i.is_available,
      is_unlimited_stock: Boolean(i.is_unlimited_stock),
      stock_quantity: i.stock_quantity,
      min_stock_level: i.min_stock_level,
      daily_prepared_quantity: i.daily_prepared_quantity,
      unit: i.unit,
      auto_out_of_stock: i.auto_out_of_stock,
      variants: i.variants,
      addons: i.addons,
      is_combo: i.is_combo,
      combo_items: i.combo_items,
      category_ids: i.category_ids || [],
      recipe: i.recipe || []
    }));
    res.json(formatted);
  } catch (err) {
    console.error('Get items error:', err.message);
    res.status(500).json({ message: 'Server Error' });
  }
});

// @route   POST /api/menu/items
// @desc    Create new menu item (Admin/Staff)
router.post('/items', auth, authorizeRoles('admin', 'staff'), async (req, res) => {
  try {
    const { 
      category_id, name, description, price, delivery_price,
      image_url, image_urls, is_veg, is_featured, is_available, is_unlimited_stock, stock_quantity, variants, addons,
      is_combo, combo_items, category_ids, recipe
    } = req.body;

    if (!name || price === undefined) {
      return res.status(400).json({ message: 'Name and price are required' });
    }

    const newItem = new MenuItem({
      category_id: category_id || null,
      name: typeof name === 'string' ? name.toUpperCase() : name,
      description: description || '',
      price: Number(price),
      delivery_price: delivery_price ? Number(delivery_price) : Number(price),
      image_url: image_url || '',
      image_urls: image_urls || (image_url ? [image_url] : []),
      is_veg: is_veg !== undefined ? Boolean(is_veg) : true,
      is_featured: is_featured !== undefined ? Boolean(is_featured) : false,
      is_available: is_available !== undefined ? Boolean(is_available) : true,
      is_unlimited_stock: is_unlimited_stock !== undefined ? Boolean(is_unlimited_stock) : false,
      stock_quantity: stock_quantity !== undefined ? Number(stock_quantity) : 50,
      variants: variants || [],
      addons: addons || [],
      is_combo: is_combo !== undefined ? Boolean(is_combo) : false,
      combo_items: combo_items || [],
      category_ids: category_ids || [],
      recipe: recipe || []
    });

    await newItem.save();

    res.status(201).json({
      id: newItem._id,
      ...newItem.toObject()
    });
  } catch (err) {
    console.error('Create item error:', err.message);
    res.status(500).json({ message: 'Server Error' });
  }
});

// @route   PUT /api/menu/items/:id
// @desc    Update menu item
router.put('/items/:id', auth, authorizeRoles('admin', 'staff'), async (req, res) => {
  try {
    const updateData = { ...req.body };
    if (updateData.price !== undefined) updateData.price = Number(updateData.price);
    if (updateData.delivery_price !== undefined) updateData.delivery_price = Number(updateData.delivery_price);
    if (updateData.is_featured !== undefined) updateData.is_featured = Boolean(updateData.is_featured);

    const updated = await MenuItem.findByIdAndUpdate(req.params.id, updateData, { new: true });
    if (!updated) return res.status(404).json({ message: 'Menu item not found' });

    res.json({
      id: updated._id,
      ...updated.toObject()
    });
  } catch (err) {
    console.error('Update item error:', err.message);
    res.status(500).json({ message: 'Server Error' });
  }
});

// @route   PUT /api/menu/items/:id/availability
// @desc    Toggle item availability (Admin/Staff)
router.put('/items/:id/availability', auth, authorizeRoles('admin', 'staff'), async (req, res) => {
  try {
    const { is_available } = req.body;
    const item = await MenuItem.findByIdAndUpdate(req.params.id, { is_available }, { new: true });
    if (!item) return res.status(404).json({ message: 'Menu item not found' });

    res.json({ id: item._id, is_available: item.is_available });
  } catch (err) {
    console.error('Toggle availability error:', err.message);
    res.status(500).json({ message: 'Server Error' });
  }
});

// @route   POST /api/menu/categories
// @desc    Create new category (Admin/Staff)
router.post('/categories', auth, authorizeRoles('admin', 'staff'), async (req, res) => {
  try {
    const { name, description, sort_order, image_url } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ message: 'Category name is required' });
    }

    const newCategory = new Category({
      name: name.trim(),
      description: description || '',
      sort_order: sort_order !== undefined ? Number(sort_order) : 0,
      image_url: image_url || ''
    });

    await newCategory.save();
    res.status(201).json({
      id: newCategory._id,
      name: newCategory.name,
      description: newCategory.description,
      sort_order: newCategory.sort_order,
      image_url: newCategory.image_url
    });
  } catch (err) {
    console.error('Create category error:', err.message);
    res.status(500).json({ message: 'Server Error' });
  }
});

// @route   PUT /api/menu/categories/:id
// @desc    Update category (Admin/Staff)
router.put('/categories/:id', auth, authorizeRoles('admin', 'staff'), async (req, res) => {
  try {
    const { name, description, sort_order, image_url } = req.body;
    const category = await Category.findById(req.params.id);
    if (!category) return res.status(404).json({ message: 'Category not found' });

    if (name !== undefined) category.name = name.trim();
    if (description !== undefined) category.description = description;
    if (sort_order !== undefined) category.sort_order = Number(sort_order);
    if (image_url !== undefined) category.image_url = image_url;

    await category.save();
    res.json({
      id: category._id,
      name: category.name,
      description: category.description,
      sort_order: category.sort_order,
      image_url: category.image_url
    });
  } catch (err) {
    console.error('Update category error:', err.message);
    res.status(500).json({ message: 'Server Error' });
  }
});

// @route   DELETE /api/menu/categories/:id
// @desc    Delete category and all its menu items (Admin/Staff)
router.delete('/categories/:id', auth, authorizeRoles('admin', 'staff'), async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) return res.status(404).json({ message: 'Category not found' });

    // Delete associated menu items
    await MenuItem.deleteMany({ category_id: req.params.id });
    
    // Delete the category itself
    await Category.findByIdAndDelete(req.params.id);

    res.json({ message: 'Category and all associated items deleted successfully' });
  } catch (err) {
    console.error('Delete category error:', err.message);
    res.status(500).json({ message: 'Server Error' });
  }
});

// @route   DELETE /api/menu/items/:id
// @desc    Delete menu item (Admin/Staff)
router.delete('/items/:id', auth, authorizeRoles('admin', 'staff'), async (req, res) => {
  try {
    const deletedItem = await MenuItem.findByIdAndDelete(req.params.id);
    if (!deletedItem) {
      return res.status(404).json({ message: 'Menu item not found' });
    }
    res.json({ message: 'Menu item deleted successfully' });
  } catch (err) {
    console.error('Delete item error:', err.message);
    res.status(500).json({ message: 'Server Error' });
  }
});

module.exports = router;
