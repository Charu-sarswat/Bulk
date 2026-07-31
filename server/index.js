const express = require('express');
const cors = require('cors');
const http = require('http');
const socketIo = require('socket.io');
const db = require('./config/db');
require('dotenv').config();

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

// Mount API Routers
app.use('/api/auth', require('./routes/auth'));
app.use('/api/auth/customer', require('./routes/customerAuth'));
app.use('/api/menu', require('./routes/menu'));
app.use('/api/tables', require('./routes/tables'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/inventory', require('./routes/inventory'));
app.use('/api/catering', require('./routes/catering'));
app.use('/api/customers', require('./routes/customers'));
app.use('/api/upload', require('./routes/upload'));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date() });
});

// Socket.io connection logic
io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);

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

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`CORS allowed client origin: ${clientUrl}`);
});
