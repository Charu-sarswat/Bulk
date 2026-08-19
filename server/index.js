const express = require('express');
const cors = require('cors');
const http = require('http');
const socketIo = require('socket.io');
const db = require('./config/db');
require('dotenv').config();
const { initWebPush } = require('./config/webPush');

// Initialize Web Push
initWebPush();

const app = express();
const server = http.createServer(app);

// Configure CORS dynamic checker
const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
const corsOptions = {
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    const isLocal = origin.startsWith('http://localhost') || 
                    origin.startsWith('http://127.0.0.1') || 
                    origin.startsWith('http://192.168.') || 
                    origin.startsWith('http://10.') || 
                    origin.startsWith('http://172.');
    if (isLocal || origin === clientUrl || origin.includes('bombaychowpati.com') || origin.includes('onrender.com')) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true
};

app.use(cors(corsOptions));

// Body parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Initialize Database with fresh simple Indian categories, soups, and chaat items
db.initDB();

// Initialize Socket.io
const io = socketIo(server, {
  cors: {
    origin: corsOptions.origin,
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Save socket.io instance to app context so routers can access it
app.set('socketio', io);

// Mount API Routers (public auth routes)
app.use('/api/auth', require('./routes/auth'));
app.use('/api/auth/customer', require('./routes/customerAuth'));

// Public restaurant list for selection page
// Availability is controlled by restaurant.status and restaurant.isActive (set by Super Admin)
app.get('/api/customer/restaurants', async (req, res) => {
  try {
    const Restaurant = require('./models/Restaurant');
    const list = await Restaurant.find({ status: 'active', isActive: true });
    const activeList = list.map(r => ({
      id: r._id,
      name: r.name,
      slug: r.slug,
      logo: r.logo,
      city: r.city,
      state: r.state
    }));
    res.json(activeList);
  } catch (err) {
    res.status(500).json({ message: 'Server Error' });
  }
});

// Public restaurant lookup by slug
app.get('/api/customer/restaurant-by-slug/:slug', async (req, res) => {
  try {
    const Restaurant = require('./models/Restaurant');
    const restaurant = await Restaurant.findOne({ slug: req.params.slug.toLowerCase(), status: 'active', isActive: true });
    if (!restaurant) {
      return res.status(404).json({ message: 'Restaurant not found or is currently inactive.' });
    }
    res.json(restaurant);
  } catch (err) {
    res.status(500).json({ message: 'Server Error' });
  }
});

// Public QR Code validation endpoint
app.get('/api/customer/validate-qr', async (req, res) => {
  const { restaurant: restaurantParam, table: tableParam } = req.query;
  if (!restaurantParam || !tableParam) {
    return res.status(400).json({ message: 'Restaurant and table parameters are required.' });
  }

  try {
    const Restaurant = require('./models/Restaurant');
    const Table = require('./models/Table');
    const mongoose = require('mongoose');

    let restaurant;
    if (mongoose.Types.ObjectId.isValid(restaurantParam)) {
      restaurant = await Restaurant.findOne({ _id: restaurantParam, status: 'active', isActive: true });
    } else {
      restaurant = await Restaurant.findOne({ slug: restaurantParam.toLowerCase(), status: 'active', isActive: true });
    }

    if (!restaurant) {
      return res.status(404).json({ message: 'Restaurant not found or is currently inactive.' });
    }

    let table;
    if (mongoose.Types.ObjectId.isValid(tableParam)) {
      table = await Table.findOne({ _id: tableParam, restaurantId: restaurant._id });
    } else {
      table = await Table.findOne({ table_number: String(tableParam), restaurantId: restaurant._id });
    }

    if (!table) {
      return res.status(404).json({ message: 'Table not found in this restaurant.' });
    }

    res.json({
      restaurant: {
        id: restaurant._id,
        slug: restaurant.slug,
        name: restaurant.name,
        logo: restaurant.logo
      },
      table: {
        id: table._id,
        tableNumber: table.table_number
      }
    });
  } catch (err) {
    console.error('QR Validation error:', err);
    res.status(500).json({ message: 'Server Error' });
  }
});

// Inject SaaS multi-tenancy and subscription billing control globally
const tenantMiddleware = require('./middleware/tenant');
const subscriptionMiddleware = require('./middleware/subscription');
app.use(tenantMiddleware);
app.use(subscriptionMiddleware);

app.use('/api/superadmin', require('./routes/superadmin'));
app.use('/api/restaurant', require('./routes/tenantBilling'));
app.use('/api/restaurant/mess-plans', require('./routes/messPlans'));
app.use('/api/student', require('./routes/studentSubscriptions'));
app.use('/api/menu', require('./routes/menu'));
app.use('/api/tables', require('./routes/tables'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/inventory/raw', require('./routes/inventoryRaw'));
app.use('/api/inventory', require('./routes/inventory'));
app.use('/api/catering', require('./routes/catering'));
app.use('/api/customers', require('./routes/customers'));
app.use('/api/upload', require('./routes/upload'));
app.use('/api/settings', require('./routes/settings'));
app.use('/api/wallet-topups', require('./routes/walletTopups'));
app.use('/api/discounts', require('./routes/discounts'));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date() });
});

// Socket.io connection logic
io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);

  // Client joining room for their specific restaurant
  socket.on('join_restaurant_room', (restaurantId) => {
    const roomName = `restaurant_${restaurantId}`;
    socket.join(roomName);
    console.log(`Socket ${socket.id} joined restaurant room: ${roomName}`);
  });

  // Client joining room for their specific order tracker
  socket.on('join_order_room', (orderId) => {
    const roomName = `order_${orderId}`;
    socket.join(roomName);
    console.log(`Socket ${socket.id} joined room: ${roomName}`);
  });

  // Client leaving order room
  socket.on('leave_order_room', (orderId) => {
    const roomName = `order_${orderId}`;
    socket.leave(roomName);
    console.log(`Socket ${socket.id} left room: ${roomName}`);
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Global error handling middleware to capture and log 500 errors
app.use((err, req, res, next) => {
  console.error('🔥 GLOBAL EXCEPTION CAPTURED:', err);
  res.status(500).json({ message: 'Internal Server Error', error: err.message, stack: err.stack });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`CORS allowed client origin: ${clientUrl}`);
});
