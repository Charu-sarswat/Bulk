const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const MenuItem = require('../models/MenuItem');
const InventoryLog = require('../models/InventoryLog');
const auth = require('../middleware/auth');
const authorizeRoles = require('../middleware/role');

// Helper to generate readable order numbers (e.g. ORD-20260731-001)
const generateOrderNumber = async () => {
  const now = new Date();
  const options = { timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit' };
  const formatter = new Intl.DateTimeFormat('en-IN', options);
  const parts = formatter.formatToParts(now);
  
  let year = '', month = '', day = '';
  for (const part of parts) {
    if (part.type === 'year') year = part.value;
    if (part.type === 'month') month = part.value;
    if (part.type === 'day') day = part.value;
  }
  
  const dateStr = `${year}${month}${day}`;

  // Count existing orders placed today matching prefix ORD-YYYYMMDD-
  const todayCount = await Order.countDocuments({
    order_number: { $regex: `^ORD-${dateStr}-` }
  });

  const seqNumber = String(todayCount + 1).padStart(3, '0');
  return `ORD-${dateStr}-${seqNumber}`;
};

// @route   GET /api/orders/reports/dashboard
// @desc    Get dashboard analytics reports (Private - Admin/Staff)
router.get('/reports/dashboard', auth, authorizeRoles('admin', 'staff', 'kitchen'), async (req, res) => {
  try {
    const { period } = req.query;
    
    // Define date boundary matching period
    let startDate = new Date();
    let prevStartDate = new Date();
    let prevEndDate = new Date();

    const now = new Date();

    if (period === 'today') {
      startDate.setHours(0, 0, 0, 0);
      prevStartDate.setDate(prevStartDate.getDate() - 1);
      prevStartDate.setHours(0, 0, 0, 0);
      prevEndDate.setDate(prevEndDate.getDate() - 1);
      prevEndDate.setHours(23, 59, 59, 999);
    } else if (period === 'yesterday') {
      startDate.setDate(startDate.getDate() - 1);
      startDate.setHours(0, 0, 0, 0);
      const endDate = new Date(startDate);
      endDate.setHours(23, 59, 59, 999);

      prevStartDate.setDate(prevStartDate.getDate() - 2);
      prevStartDate.setHours(0, 0, 0, 0);
      prevEndDate.setDate(prevEndDate.getDate() - 2);
      prevEndDate.setHours(23, 59, 59, 999);
    } else if (period === '7days') {
      startDate.setDate(startDate.getDate() - 7);
      prevStartDate.setDate(prevStartDate.getDate() - 14);
      prevEndDate.setDate(prevEndDate.getDate() - 7);
    } else if (period === '30days') {
      startDate.setDate(startDate.getDate() - 30);
      prevStartDate.setDate(prevStartDate.getDate() - 60);
      prevEndDate.setDate(prevEndDate.getDate() - 30);
    } else {
      // all time
      startDate = new Date(0);
      prevStartDate = new Date(0);
      prevEndDate = new Date(0);
    }

    // Fetch current period orders
    const filter = { created_at: { $gte: startDate } };
    if (period === 'yesterday') {
      const yesterdayEnd = new Date();
      yesterdayEnd.setDate(yesterdayEnd.getDate() - 1);
      yesterdayEnd.setHours(23, 59, 59, 999);
      filter.created_at.$lte = yesterdayEnd;
    }
    const orders = await Order.find(filter);

    // Fetch previous period orders for sales growth comparison
    let prevOrders = [];
    if (period !== 'all') {
      prevOrders = await Order.find({
        created_at: { $gte: prevStartDate, $lte: prevEndDate }
      });
    }

    // Calculate aggregated stats
    const totalSales = orders.reduce((sum, o) => o.payment_status === 'paid' ? sum + o.total_amount : sum, 0);
    const prevSales = prevOrders.reduce((sum, o) => o.payment_status === 'paid' ? sum + o.total_amount : sum, 0);

    let salesGrowth = 0;
    if (period !== 'all') {
      if (prevSales === 0) {
        salesGrowth = totalSales > 0 ? 100 : 0;
      } else {
        salesGrowth = Math.round(((totalSales - prevSales) / prevSales) * 100);
      }
    }

    const totalOrders = orders.length;
    const paidOrders = orders.filter(o => o.payment_status === 'paid');
    const avgTicket = paidOrders.length > 0 ? Math.round(totalSales / paidOrders.length) : 0;

    // Unique customers by phone number
    const uniquePhones = new Set(orders.map(o => o.customer_phone).filter(Boolean));
    const totalCustomers = uniquePhones.size;

    // Daily Sales analytics array
    const salesMap = {};
    orders.forEach(o => {
      if (o.payment_status === 'paid') {
        const day = new Date(o.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
        salesMap[day] = (salesMap[day] || 0) + o.total_amount;
      }
    });

    const salesOverTime = Object.keys(salesMap).map(day => ({
      name: day,
      sales: salesMap[day]
    })).sort((a, b) => new Date(a.name) - new Date(b.name));

    // Category distribution from actual items ordered
    const categoryRevenue = {};
    orders.forEach(o => {
      if (o.payment_status === 'paid') {
        o.items.forEach(item => {
          const cat = item.category || 'General';
          categoryRevenue[cat] = (categoryRevenue[cat] || 0) + (item.price * item.quantity);
        });
      }
    });

    const categoryStats = Object.keys(categoryRevenue).map(cat => ({
      name: cat,
      value: categoryRevenue[cat]
    }));

    // If category stats is empty, provide default mock format
    if (categoryStats.length === 0) {
      categoryStats.push({ name: 'Chaat', value: 0 });
    }

    // Payment methods aggregation (actual revenue weights)
    const paymentMethods = {};
    orders.forEach(o => {
      if (o.payment_status === 'paid') {
        const method = (o.payment_method || 'COUNTER').toUpperCase();
        paymentMethods[method] = (paymentMethods[method] || 0) + o.total_amount;
      }
    });

    const paymentSplit = Object.keys(paymentMethods).map(method => ({
      method,
      amount: paymentMethods[method]
    }));

    if (paymentSplit.length === 0) {
      paymentSplit.push({ method: 'COUNTER', amount: 0 });
    }

    // Fetch best selling dishes
    const popularDishes = [];
    orders.forEach(o => {
      o.items.forEach(item => {
        const existing = popularDishes.find(d => d.name === item.name);
        if (existing) {
          existing.total_sold += item.quantity;
          existing.revenue += (item.price * item.quantity);
        } else {
          popularDishes.push({
            name: item.name,
            total_sold: item.quantity,
            revenue: (item.price * item.quantity)
          });
        }
      });
    });
    popularDishes.sort((a, b) => b.total_sold - a.total_sold);

    // Calculate hourly peak trends
    const hourlyMap = {};
    orders.forEach(o => {
      const hour = new Date(o.created_at).getHours();
      let label = `${hour % 12 || 12} ${hour >= 12 ? 'PM' : 'AM'}`;
      hourlyMap[label] = (hourlyMap[label] || 0) + 1;
    });

    const peakHours = Object.keys(hourlyMap).map(hour => ({
      hour,
      orders: hourlyMap[hour]
    })).slice(0, 8);

    res.json({
      metrics: {
        totalSales,
        salesGrowth,
        totalOrders,
        avgTicket,
        totalCustomers
      },
      salesTrend: salesOverTime.length > 0 ? salesOverTime : [{ name: 'Today', sales: 0 }],
      peakHours: peakHours.length > 0 ? peakHours : [{ hour: '12 PM', orders: 0 }],
      categoryShare: categoryStats,
      paymentSplit,
      popularDishes: popularDishes.slice(0, 5)
    });
  } catch (err) {
    console.error('Fetch dashboard reports error:', err.message);
    res.status(500).json({ message: 'Server Error' });
  }
});

// @route   GET /api/orders/reports/customers
// @desc    Get registered and guest customers overview for directory (Private - Admin/Staff)
router.get('/reports/customers', auth, authorizeRoles('admin', 'staff'), async (req, res) => {
  try {
    const Customer = require('../models/Customer');
    
    // Fetch registered customer base
    const registeredUsers = await Customer.find().sort({ created_at: -1 });

    // Fetch guest checkouts list from orders
    const orders = await Order.find().sort({ created_at: -1 });

    const registeredList = await Promise.all(registeredUsers.map(async (u) => {
      const userOrders = orders.filter(o => o.customer_phone === u.phone);
      const totalSpent = userOrders.reduce((sum, o) => sum + o.total_amount, 0);
      return {
        id: u._id,
        name: u.name,
        phone: u.phone,
        email: u.email || '',
        created_at: u.created_at,
        last_order_at: userOrders.length > 0 ? userOrders[0].created_at : u.created_at,
        total_orders: userOrders.length,
        total_spent: totalSpent
      };
    }));

    // Group guest checkouts (exclude those that match registered customer phone numbers)
    const registeredPhones = new Set(registeredUsers.map(u => u.phone));
    const guestMap = {};
    orders.forEach(o => {
      if (!o.customer_phone || registeredPhones.has(o.customer_phone)) return;
      
      const phone = o.customer_phone;
      if (!guestMap[phone]) {
        guestMap[phone] = {
          name: o.customer_name || 'Guest Customer',
          phone: phone,
          created_at: o.created_at,
          last_order_at: o.created_at,
          total_orders: 0,
          total_spent: 0
        };
      }
      
      guestMap[phone].total_orders += 1;
      guestMap[phone].total_spent += o.total_amount;
      if (new Date(o.created_at) > new Date(guestMap[phone].last_order_at)) {
        guestMap[phone].last_order_at = o.created_at;
      }
      if (new Date(o.created_at) < new Date(guestMap[phone].created_at)) {
        guestMap[phone].created_at = o.created_at;
      }
    });

    const guestList = Object.values(guestMap);

    res.json({
      registered: registeredList,
      guests: guestList
    });
  } catch (err) {
    console.error('Fetch customer reports error:', err.message);
    res.status(500).json({ message: 'Server Error' });
  }
});

// @route   GET /api/orders
// @desc    Get all orders (with RBAC date filter for Staff)
// @access  Private (Admin/Staff/Kitchen)
router.get('/', auth, authorizeRoles('admin', 'staff', 'kitchen'), async (req, res) => {
  try {
    const { status, date } = req.query;
    const filter = {};

    if (status) {
      filter.status = status;
    }

    // RBAC Date Protection: Staff can ONLY see today's orders
    if (req.user.role === 'staff') {
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date();
      endOfDay.setHours(23, 59, 59, 999);

      filter.created_at = { $gte: startOfDay, $lte: endOfDay };
    } else if (date) {
      const selectedDate = new Date(date);
      const startOfDay = new Date(selectedDate);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(selectedDate);
      endOfDay.setHours(23, 59, 59, 999);

      filter.created_at = { $gte: startOfDay, $lte: endOfDay };
    }

    const orders = await Order.find(filter).sort({ created_at: -1 });

    const formatted = orders.map(o => ({
      id: o.order_number || o._id,
      _id: o._id,
      order_number: o.order_number,
      table_id: o.table_id,
      table_number: o.table_snapshot || 'Takeaway',
      customer_id: o.customer_id,
      customer_name: o.customer_name,
      customer_phone: o.customer_phone,
      order_channel: o.order_channel,
      scheduled_time: o.scheduled_time,
      status: o.status,
      payment_status: o.payment_status,
      payment_method: o.payment_method,
      payment_utr: o.payment_utr,
      total_amount: o.total_amount,
      notes: o.notes,
      delivery_address: o.delivery_address || '',
      items: o.items.map(item => ({
        id: item._id,
        menu_item_id: item.menu_item_id,
        name: item.name,
        quantity: item.quantity,
        price: item.price,
        notes: item.notes
      })),
      created_at: o.created_at,
      updated_at: o.updated_at
    }));

    res.json(formatted);
  } catch (err) {
    console.error('Get orders error:', err.message);
    res.status(500).json({ message: 'Server Error' });
  }
});

// @route   GET /api/orders/:id
// @desc    Get single order by ID or order_number (Public - for tracking)
router.get('/:id', async (req, res) => {
  try {
    let o = null;
    const mongoose = require('mongoose');
    if (mongoose.Types.ObjectId.isValid(req.params.id)) {
      o = await Order.findById(req.params.id);
    }
    if (!o) {
      o = await Order.findOne({ order_number: req.params.id });
    }
    if (!o) return res.status(404).json({ message: 'Order not found' });

    res.json({
      id: o.order_number || o._id,
      _id: o._id,
      order_number: o.order_number,
      table_id: o.table_id,
      table_number: o.table_snapshot || 'Takeaway',
      customer_name: o.customer_name,
      customer_phone: o.customer_phone,
      order_channel: o.order_channel,
      scheduled_time: o.scheduled_time,
      status: o.status,
      payment_status: o.payment_status,
      payment_method: o.payment_method,
      payment_utr: o.payment_utr,
      total_amount: o.total_amount,
      notes: o.notes,
      delivery_address: o.delivery_address || '',
      items: o.items.map(item => ({
        id: item._id,
        menu_item_id: item.menu_item_id,
        name: item.name,
        quantity: item.quantity,
        price: item.price,
        notes: item.notes
      })),
      created_at: o.created_at,
      updated_at: o.updated_at
    });
  } catch (err) {
    console.error('Get single order error:', err.message);
    res.status(500).json({ message: 'Server Error' });
  }
});

// @route   POST /api/orders
// @desc    Create new order (Public/Customer)
router.post('/', async (req, res) => {
  const { 
    table_id, table_snapshot, customer_id, customer_name, customer_phone,
    order_channel, scheduled_time, payment_method, payment_utr, notes, items, delivery_address 
  } = req.body;

  if (!customer_name || !customer_name.trim()) {
    return res.status(400).json({ message: 'Customer name is compulsory' });
  }

  if (!customer_phone || customer_phone.trim().length < 10) {
    return res.status(400).json({ message: 'Customer phone number is compulsory and must be at least 10 digits' });
  }

  if (order_channel === 'delivery' && (!delivery_address || !delivery_address.trim())) {
    return res.status(400).json({ message: 'Delivery address is compulsory for delivery orders' });
  }

  if (order_channel === 'delivery' && payment_method === 'cod') {
    return res.status(400).json({ message: 'Cash on Delivery payment method is disabled for home delivery orders.' });
  }

  if (!items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ message: 'Order must contain at least one item' });
  }

  try {
    const order_number = await generateOrderNumber();
    let total_amount = 0;
    const orderItems = [];

    for (const item of items) {
      let itemPrice = Number(item.price);
      let itemName = item.name;

      if (item.menu_item_id) {
        const menuItem = await MenuItem.findById(item.menu_item_id);
        if (menuItem) {
          itemName = menuItem.name;
          // Apply pricing tier based on channel
          if (order_channel === 'delivery' && menuItem.delivery_price > 0) {
            itemPrice = menuItem.delivery_price;
          } else {
            itemPrice = menuItem.price;
          }

          // Deduct stock quantity automatically
          const prevStock = menuItem.stock_quantity;
          const newStock = Math.max(0, prevStock - item.quantity);
          menuItem.stock_quantity = newStock;
          if (menuItem.auto_out_of_stock && newStock === 0) {
            menuItem.is_available = false;
          }
          await menuItem.save();

          // Log inventory audit
          await InventoryLog.create({
            menu_item_id: menuItem._id,
            change_type: 'ORDER_DEDUCT',
            quantity_change: -item.quantity,
            previous_stock: prevStock,
            new_stock: newStock,
            reason: `Auto deduction for new order`,
            recorded_by: customer_name || 'System'
          });

          // Process raw materials recipe deduction
          if (menuItem.recipe && menuItem.recipe.length > 0) {
            const RawMaterial = require('../models/RawMaterial');
            for (const ingredient of menuItem.recipe) {
              if (ingredient.raw_material_id) {
                const rawMat = await RawMaterial.findById(ingredient.raw_material_id);
                if (rawMat) {
                  const requiredQty = Number(ingredient.quantity_required) * Number(item.quantity);
                  const prevRawStock = rawMat.stock_quantity;
                  const newRawStock = Math.max(0, prevRawStock - requiredQty);
                  
                  rawMat.stock_quantity = newRawStock;
                  await rawMat.save();
                  
                  // Log raw material inventory audit
                  await InventoryLog.create({
                    raw_material_id: rawMat._id,
                    change_type: 'ORDER_DEDUCT',
                    quantity_change: -requiredQty,
                    previous_stock: prevRawStock,
                    new_stock: newRawStock,
                    reason: `Auto deduction for Order #${order_number}`,
                    recorded_by: customer_name || 'System'
                  });

                  // If this raw material ran out, auto mark any linked menu items as Sold Out
                  if (newRawStock === 0) {
                    const linkedItems = await MenuItem.find({ 
                      'recipe.raw_material_id': rawMat._id 
                    });
                    for (const lItem of linkedItems) {
                      if (lItem.auto_out_of_stock) {
                        lItem.is_available = false;
                        await lItem.save();
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }

      const lineTotal = itemPrice * Number(item.quantity);
      total_amount += lineTotal;

      orderItems.push({
        menu_item_id: item.menu_item_id || null,
        name: itemName,
        quantity: Number(item.quantity),
        price: itemPrice,
        notes: item.notes || ''
      });
    }

    const newOrder = new Order({
      order_number,
      table_id: table_id || null,
      table_snapshot: table_snapshot || req.body.table_number_override || 'Takeaway',
      customer_id: customer_id || null,
      customer_name: customer_name || 'Guest Customer',
      customer_phone: customer_phone.trim(),
      order_channel: order_channel || 'dine_in',
      scheduled_time: scheduled_time ? new Date(scheduled_time) : null,
      status: 'received',
      payment_status: 'pending',
      payment_method: payment_method || 'upi',
      payment_utr: payment_utr || '',
      total_amount,
      notes: notes || '',
      items: orderItems,
      delivery_address: delivery_address || ''
    });

    await newOrder.save();

    // Broadcast socket event for real-time kitchen & admin screens
    const io = req.app.get('socketio');
    if (io) {
      io.emit('order_created', {
        id: newOrder.order_number || newOrder._id,
        _id: newOrder._id,
        order_number: newOrder.order_number,
        table_number: newOrder.table_snapshot,
        customer_name: newOrder.customer_name,
        customer_phone: newOrder.customer_phone,
        order_channel: newOrder.order_channel,
        scheduled_time: newOrder.scheduled_time,
        total_amount: newOrder.total_amount,
        status: newOrder.status,
        payment_status: newOrder.payment_status,
        payment_method: newOrder.payment_method,
        delivery_address: newOrder.delivery_address,
        items: newOrder.items.map(item => ({
          id: item._id,
          menu_item_id: item.menu_item_id,
          name: item.name,
          quantity: item.quantity,
          price: item.price,
          notes: item.notes
        })),
        created_at: newOrder.created_at
      });
    }

    // Send Web Push notification to registered administrators
    try {
      const PushSubscription = require('../models/PushSubscription');
      const { sendPushNotification } = require('../config/webPush');
      
      const adminSubscriptions = await PushSubscription.find();
      const payload = {
        title: 'New Order Placed! 🍽️',
        body: `${newOrder.customer_name} placed a ${newOrder.order_channel.toUpperCase().replace('_', ' ')} order (${newOrder.order_number}) for ₹${newOrder.total_amount}.`,
        url: `/admin/live-orders`,
        icon: '/logo.png',
        badge: '/logo.png'
      };

      for (const sub of adminSubscriptions) {
        const isExpired = await sendPushNotification(sub.subscription, payload);
        if (isExpired) {
          await PushSubscription.deleteOne({ _id: sub._id });
        }
      }
    } catch (pushErr) {
      console.error('Error broadcasting push notifications:', pushErr.message);
    }

    res.status(201).json({
      id: newOrder.order_number || newOrder._id,
      _id: newOrder._id,
      order_number: newOrder.order_number,
      total_amount: newOrder.total_amount,
      status: newOrder.status,
      message: 'Order placed successfully!'
    });

  } catch (err) {
    console.error('Create order error:', err.message);
    res.status(500).json({ message: 'Server Error' });
  }
});

// @route   PUT /api/orders/:id/status
// @desc    Update order status / payment status (Admin/Staff/Kitchen)
router.put('/:id/status', auth, authorizeRoles('admin', 'staff', 'kitchen'), async (req, res) => {
  const { status, payment_status, payment_utr } = req.body;

  try {
    let order = null;
    const mongoose = require('mongoose');
    if (mongoose.Types.ObjectId.isValid(req.params.id)) {
      order = await Order.findById(req.params.id);
    }
    if (!order) {
      order = await Order.findOne({ order_number: req.params.id });
    }
    if (!order) return res.status(404).json({ message: 'Order not found' });

    if (status) {
      order.status = status;
      
      // If status is updated to ready AND it is a delivery order, trigger Shadowfax ride booking
      if (status === 'ready' && order.order_channel === 'delivery' && !order.delivery_job_id) {
        try {
          const { createShadowfaxDeliveryJob } = require('../config/shadowfax');
          const job = await createShadowfaxDeliveryJob(order);
          if (job.success) {
            order.delivery_job_id = job.delivery_id;
            order.delivery_status = job.status; // e.g. 'rider_assigned'
            order.delivery_rider_name = job.rider_name;
            order.delivery_rider_phone = job.rider_phone;
          }
        } catch (deliveryErr) {
          console.error('Shadowfax scheduling error:', deliveryErr.message);
        }
      }
    }
    if (payment_status) order.payment_status = payment_status;
    if (payment_utr !== undefined) order.payment_utr = payment_utr;

    await order.save();

    // Broadcast socket update
    const io = req.app.get('socketio');
    if (io) {
      const payload = {
        id: order.order_number || order._id,
        _id: order._id,
        order_number: order.order_number,
        status: order.status,
        payment_status: order.payment_status,
        delivery_status: order.delivery_status,
        delivery_rider_name: order.delivery_rider_name,
        delivery_rider_phone: order.delivery_rider_phone,
        updated_at: order.updated_at
      };
      io.emit('order_status_updated', payload);
      io.to(`order_${order._id}`).emit('order_status_change', payload);
      if (order.order_number) {
        io.to(`order_${order.order_number}`).emit('order_status_change', payload);
      }
    }

    res.json({
      id: order._id,
      status: order.status,
      payment_status: order.payment_status,
      delivery_status: order.delivery_status,
      delivery_rider_name: order.delivery_rider_name,
      delivery_rider_phone: order.delivery_rider_phone,
      message: 'Order updated'
    });
  } catch (err) {
    console.error('Update order status error:', err.message);
    res.status(500).json({ message: 'Server Error' });
  }
});

// @route   PUT /api/orders/:id/payment
// @desc    Settle order payment status (Admin/Staff)
// @access  Private (Admin/Staff)
router.put('/:id/payment', auth, authorizeRoles('admin', 'staff'), async (req, res) => {
  const { payment_status, payment_utr } = req.body;
  
  try {
    let order = null;
    const mongoose = require('mongoose');
    if (mongoose.Types.ObjectId.isValid(req.params.id)) {
      order = await Order.findById(req.params.id);
    }
    if (!order) {
      order = await Order.findOne({ order_number: req.params.id });
    }
    if (!order) return res.status(404).json({ message: 'Order not found' });

    if (payment_status) order.payment_status = payment_status;
    if (payment_utr !== undefined) order.payment_utr = payment_utr;

    await order.save();

    // Broadcast socket update
    const io = req.app.get('socketio');
    if (io) {
      const payload = {
        id: order.order_number || order._id,
        _id: order._id,
        order_number: order.order_number,
        status: order.status,
        payment_status: order.payment_status,
        updated_at: order.updated_at
      };
      io.emit('order_status_updated', payload);
      io.to(`order_${order._id}`).emit('order_status_change', payload);
      if (order.order_number) {
        io.to(`order_${order.order_number}`).emit('order_status_change', payload);
      }
    }

    res.json({
      id: order._id,
      status: order.status,
      payment_status: order.payment_status,
      message: 'Payment settled successfully'
    });
  } catch (err) {
    console.error('Settle payment error:', err.message);
    res.status(500).json({ message: 'Server Error' });
  }
});

// @route   POST /api/orders/delivery/webhook
// @desc    Receive live delivery status updates from Shadowfax (Public)
// @access  Public
router.post('/delivery/webhook', async (req, res) => {
  try {
    const { client_order_number, sfx_order_id, status, rider_details } = req.body;

    const order = await Order.findOne({ 
      $or: [
        { order_number: client_order_number },
        { delivery_job_id: sfx_order_id }
      ]
    });

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Map Shadowfax status to our local delivery/order states
    if (status) {
      order.delivery_status = status; // e.g. 'at_store', 'out_for_delivery', 'delivered'
      if (status === 'out_for_delivery') {
        order.status = 'out_for_delivery';
      } else if (status === 'delivered') {
        order.status = 'delivered';
        order.payment_status = 'paid'; // delivery confirmed
      }
    }

    if (rider_details) {
      if (rider_details.name) order.delivery_rider_name = rider_details.name;
      if (rider_details.phone) order.delivery_rider_phone = rider_details.phone;
    }

    await order.save();

    // Broadcast update via Socket.IO
    const io = req.app.get('socketio');
    if (io) {
      const payload = {
        id: order.order_number || order._id,
        _id: order._id,
        order_number: order.order_number,
        status: order.status,
        payment_status: order.payment_status,
        delivery_status: order.delivery_status,
        delivery_rider_name: order.delivery_rider_name,
        delivery_rider_phone: order.delivery_rider_phone,
        updated_at: order.updated_at
      };
      io.emit('order_status_updated', payload);
      io.to(`order_${order._id}`).emit('order_status_change', payload);
      if (order.order_number) {
        io.to(`order_${order.order_number}`).emit('order_status_change', payload);
      }
    }

    res.json({ success: true, message: 'Status updated successfully' });
  } catch (err) {
    console.error('Shadowfax webhook processing error:', err.message);
    res.status(500).json({ message: 'Server Error' });
  }
});

module.exports = router;
