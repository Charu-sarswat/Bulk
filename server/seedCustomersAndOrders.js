require('dotenv').config();
const mongoose = require('mongoose');
const Customer = require('./models/Customer');
const Order = require('./models/Order');

const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/Bombay-Chowpati';

const demoCustomers = [
  { name: 'Aarav Sharma', phone: '9876543210', email: 'aarav.sharma@gmail.com' },
  { name: 'Priya Patel', phone: '9876543211', email: 'priya.p@yahoo.com' },
  { name: 'Rohan Mehta', phone: '9876543212', email: 'rohan.mehta@outlook.com' },
  { name: 'Ananya Gupta', phone: '9876543213', email: 'ananya.g@gmail.com' },
  { name: 'Vikram Singh', phone: '9876543214', email: 'vikram.singh@hotmail.com' },
  { name: 'Sneha Reddy', phone: '9876543215', email: 'sneha.reddy@gmail.com' },
  { name: 'Aditya Joshi', phone: '9876543216', email: 'aditya.j@gmail.com' },
  { name: 'Kavya Nair', phone: '9876543217', email: 'kavya.nair@yahoo.com' },
  { name: 'Rahul Verma', phone: '9876543218', email: 'rahul.v@gmail.com' },
  { name: 'Pooja Agarwal', phone: '9876543219', email: 'pooja.a@gmail.com' },
  { name: 'Karan Shah', phone: '9876543220', email: 'karan.shah@gmail.com' },
  { name: 'Diya Malhotra', phone: '9876543221', email: 'diya.m@gmail.com' },
  { name: 'Siddharth Deshmukh', phone: '9876543222', email: 'siddharth.d@gmail.com' },
  { name: 'Isha Kulkarni', phone: '9876543223', email: 'isha.k@gmail.com' },
  { name: 'Amitabh Roy', phone: '9876543224', email: 'amitabh.r@gmail.com' },
  { name: 'Neha Bansal', phone: '9876543225', email: 'neha.b@gmail.com' },
  { name: 'Gaurav Chaudhari', phone: '9876543226', email: 'gaurav.c@gmail.com' },
  { name: 'Tanvi Saxena', phone: '9876543227', email: 'tanvi.s@gmail.com' },
  { name: 'Varun Kapoor', phone: '9876543228', email: 'varun.k@gmail.com' },
  { name: 'Riya Trivedi', phone: '9876543229', email: 'riya.t@gmail.com' },
  { name: 'Manish Pandey', phone: '9876543230', email: 'manish.p@gmail.com' },
  { name: 'Shweta Iyer', phone: '9876543231', email: 'shweta.i@gmail.com' },
  { name: 'Nikhil Rathi', phone: '9876543232', email: 'nikhil.r@gmail.com' },
  { name: 'Meera Rao', phone: '9876543233', email: 'meera.rao@gmail.com' },
  { name: 'Deepak Bhatt', phone: '9876543234', email: 'deepak.b@gmail.com' },
];

const sampleDishes = [
  { name: 'Samosa Chat', price: 90 },
  { name: 'Pani Puri (5 Piece)', price: 60 },
  { name: 'Papdi Chat', price: 80 },
  { name: 'Bhel Puri', price: 80 },
  { name: 'Spl Pav Bhaji', price: 140 },
  { name: 'Cheese Pav Bhaji', price: 170 },
  { name: 'Bombay Veg Grilled Sandwich', price: 130 },
  { name: 'Cheese Burst Veg Burger', price: 110 }
];

async function seedData() {
  try {
    await mongoose.connect(mongoURI);
    console.log('Connected to MongoDB for seeding customer directory & order history...');

    // Save customers
    const createdCustomers = [];
    for (const c of demoCustomers) {
      let cust = await Customer.findOne({ phone: c.phone });
      if (!cust) {
        cust = await Customer.create(c);
      }
      createdCustomers.push(cust);
    }
    console.log(`Seeded ${createdCustomers.length} registered customer accounts.`);

    // Create 35 demo orders across dates
    const statuses = ['served', 'served', 'served', 'served', 'cancelled', 'preparing', 'ready'];
    const channels = ['dine_in', 'takeaway', 'dine_in', 'dine_in'];
    const paymentMethods = ['upi', 'counter', 'card', 'upi'];
    const paymentStatuses = ['paid', 'paid', 'paid', 'pending'];

    const now = new Date();

    for (let i = 0; i < 35; i++) {
      const cust = createdCustomers[i % createdCustomers.length];
      const orderDate = new Date(now.getTime() - (35 - i) * 6 * 3600 * 1000);

      const year = orderDate.getFullYear();
      const month = String(orderDate.getMonth() + 1).padStart(2, '0');
      const day = String(orderDate.getDate()).padStart(2, '0');
      const dateStr = `${year}${month}${day}`;
      const orderNumber = `ORD-${dateStr}-${String((i % 10) + 1).padStart(3, '0')}`;

      const dish1 = sampleDishes[i % sampleDishes.length];
      const dish2 = sampleDishes[(i + 3) % sampleDishes.length];

      const items = [
        { name: dish1.name, quantity: (i % 3) + 1, price: dish1.price },
        { name: dish2.name, quantity: 1, price: dish2.price }
      ];

      const total_amount = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

      await Order.create({
        order_number: orderNumber,
        customer_id: cust._id,
        customer_name: cust.name,
        customer_phone: cust.phone,
        table_snapshot: i % 2 === 0 ? `Table ${(i % 5) + 1}` : 'Takeaway',
        order_channel: channels[i % channels.length],
        status: statuses[i % statuses.length],
        payment_status: paymentStatuses[i % paymentStatuses.length],
        payment_method: paymentMethods[i % paymentMethods.length],
        payment_utr: paymentMethods[i % paymentMethods.length] === 'upi' ? `UTR99887766${i}` : '',
        total_amount,
        notes: i % 4 === 0 ? 'Extra chutney and spicy' : '',
        items,
        created_at: orderDate,
        updated_at: orderDate
      });
    }

    console.log('Successfully seeded 35 demo orders with customer records!');
    process.exit(0);
  } catch (err) {
    console.error('Seeding error:', err);
    process.exit(1);
  }
}

seedData();
