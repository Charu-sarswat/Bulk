/**
 * seedMenu.js  –  Bombay Chowpati Menu Seeder
 *
 * Usage:  node seedMenu.js
 *
 * This script clears all existing Categories + MenuItems from MongoDB
 * and inserts the full Bombay Chowpati menu.
 * All other data (users, tables, orders, customers) is left untouched.
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Category = require('./models/Category');
const MenuItem  = require('./models/MenuItem');

const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/Bombay-Chowpati';

// ─── Menu Data ────────────────────────────────────────────────────────────────

const categories = [
  { name: 'Chat',               description: 'Tangy & spicy Mumbai street chaat favourites',   sort_order: 1, image_url: 'https://images.unsplash.com/photo-1601050690597-df056fb4ce78?w=600' },
  { name: 'Dahi (Curd) Items',  description: 'Refreshing curd-based chaat delights',            sort_order: 2, image_url: 'https://images.unsplash.com/photo-1601050690597-df056fb4ce78?w=600' },
  { name: 'Pav Bhaji',          description: 'Hot buttery pav bhaji and special snacks',        sort_order: 3, image_url: 'https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?w=600' },
  { name: "Sandwich's",         description: 'Grilled and fresh sandwiches',                    sort_order: 4, image_url: 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=600' },
  { name: 'Pizza / Burger',     description: 'Cheesy pizzas and flavourful veg burgers',        sort_order: 5, image_url: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=600' },
];

// Items keyed by category name
const itemsByCategory = {

  'Chat': [
    { name: 'Samosa Chat',    description: 'Crispy samosas topped with chole, tamarind & mint chutney, yogurt and sev.',  price: 90  },
    { name: 'Pani Puri (5 Piece)', description: '5 crispy puris filled with spiced potato & sprouts served with tangy mint water.', price: 60  },
    { name: 'Papdi Chat',     description: 'Crunchy papdi topped with potato, curd, tamarind & mint chutney and fine sev.', price: 80  },
    { name: 'Bhel Puri',      description: 'Puffed rice tossed with onions, tomatoes, papdi, and tangy chutneys.',          price: 80  },
    { name: 'Cutlet Chat',    description: 'Spiced vegetable cutlets served with chaat toppings.',                          price: 100 },
    { name: 'Spl Ragda Chat', description: 'Special ragda pattice chat loaded with chole, chutneys, sev and onions.',      price: 120 },
  ],

  'Dahi (Curd) Items': [
    { name: 'Dahi Puri',     description: 'Crispy puris filled with potato & chickpeas, smothered in sweet yogurt, chutneys and sev.', price: 100 },
    { name: 'Dahi Papdi',    description: 'Papdi topped with potato, sweet curd, tamarind and mint chutney.',                          price: 90  },
    { name: 'Dahi Bhelpuri', description: 'Bhel puri enriched with creamy fresh curd and tangy chutneys.',                             price: 90  },
    { name: 'Spl Dahi Chat', description: 'Chef\'s special dahi chaat with a blend of toppings and secret masala.',                    price: 130 },
    { name: 'Dahi Samosa',   description: 'Crispy samosas dunked in sweet curd, topped with tamarind and mint chutneys.',              price: 100 },
  ],

  'Pav Bhaji': [
    { name: 'Pav Bhaji',             description: 'Classic Mumbai pav bhaji served with 2 butter-toasted pavs.',                      price: 120 },
    { name: 'Spl Chole Kulchey',     description: 'Spicy Punjabi chole served with 2 soft kulchas.',                                  price: 150 },
    { name: 'Extra Pav',             description: 'Additional butter-toasted pav (2 pieces).',                                        price: 20  },
    { name: 'Butter Pav Bhaji',      description: 'Rich pav bhaji loaded with extra Amul butter, served with 2 pavs.',               price: 150 },
    { name: 'Extra Kulcha (Single)', description: 'Single extra kulcha served plain or with butter.',                                 price: 20  },
    { name: 'Masala Pav Bhaji',      description: 'Pav bhaji spiced up with extra masala for those who love it hot.',                price: 140 },
  ],

  "Sandwich's": [
    { name: 'Cheese Grill Sandwich',   description: 'Grilled sandwich loaded with cheese, veggies and grilled to golden perfection.',  price: 120 },
    { name: 'Veg Grill Sandwich',      description: 'Classic grilled veg sandwich with cucumber, tomato, potato and green chutney.',    price: 100 },
    { name: 'Spl Spicy Cheese Grill',  description: 'Special spicy cheese grilled sandwich with jalapeños and extra hot sauce.',        price: 140 },
    { name: 'Alu Toast',               description: 'Buttery toast layered with spiced potato mixture, grilled to crisp.',             price: 80  },
    { name: 'Plain Veg Sandwich',      description: 'Fresh and light veg sandwich with cucumber, tomato and mint chutney.',            price: 70  },
    { name: 'Veg Cheese Sandwich',     description: 'Fresh veg sandwich topped with a generous layer of cheese.',                     price: 110 },
  ],

  'Pizza / Burger': [
    { name: 'Veg Cheese Pizza',    description: 'Classic veg pizza loaded with colourful veggies and melted cheese on a crispy base.',  price: 180 },
    { name: 'Plain Cheese Pizza',  description: 'Simple and delicious cheese pizza on a golden crispy base.',                           price: 150 },
    { name: 'Spicy Cheese Pizza',  description: 'Pizza loaded with spicy red sauce, jalapeños, onions and melted cheese.',             price: 190 },
    { name: 'Veg Pizza',           description: 'Light veg pizza with tomato sauce, capsicum, onion, olives and herbs.',               price: 160 },
    { name: 'Veg Burger',          description: 'Crispy veggie patty with lettuce, tomato, onion and house sauce in a soft bun.',       price: 100 },
    { name: 'Spicy Cheese Burger', description: 'Loaded cheese burger with a spicy patty, extra cheese and jalapeño sauce.',           price: 130 },
  ],
};

// ─── Seed Function ────────────────────────────────────────────────────────────

async function seed() {
  try {
    console.log('Connecting to MongoDB…');
    await mongoose.connect(mongoURI);
    console.log('Connected!\n');

    // 1. Clear existing menu data
    const deletedItems = await MenuItem.deleteMany({});
    const deletedCats  = await Category.deleteMany({});
    console.log(`Cleared ${deletedCats.deletedCount} categories and ${deletedItems.deletedCount} menu items.\n`);

    // 2. Insert categories
    console.log('Inserting categories…');
    const insertedCats = await Category.insertMany(categories);
    const catMap = {};
    insertedCats.forEach(c => { catMap[c.name] = c._id; });
    console.log(`Inserted ${insertedCats.length} categories.\n`);

    // 3. Build menu items array
    const menuItemsData = [];
    for (const [catName, items] of Object.entries(itemsByCategory)) {
      const catId = catMap[catName];
      if (!catId) {
        console.warn(`WARNING: Category "${catName}" not found – skipping its items.`);
        continue;
      }
      items.forEach(item => {
        menuItemsData.push({
          category_id: catId,
          name: item.name,
          description: item.description,
          price: item.price,
          delivery_price: Math.round(item.price * 1.15),  // ~15% delivery markup
          swiggy_price:   Math.round(item.price * 1.20),  // ~20% Swiggy markup
          zomato_price:   Math.round(item.price * 1.20),  // ~20% Zomato markup
          is_veg: true,
          is_available: true,
          stock_quantity: 50,
          min_stock_level: 10,
          daily_prepared_quantity: 25,
          unit: 'servings',
          auto_out_of_stock: true,
          variants: [],
          addons: [],
          is_combo: false,
          combo_items: []
        });
      });
    }

    // 4. Insert menu items
    console.log('Inserting menu items…');
    const insertedItems = await MenuItem.insertMany(menuItemsData);
    console.log(`Inserted ${insertedItems.length} menu items.\n`);

    // 5. Summary
    console.log('✅  Menu seeded successfully!\n');
    console.log('Category summary:');
    for (const [catName, items] of Object.entries(itemsByCategory)) {
      console.log(`  ${catName}: ${items.length} items`);
    }

    await mongoose.disconnect();
    console.log('\nDisconnected. Done!');
    process.exit(0);
  } catch (err) {
    console.error('❌  Seed error:', err);
    process.exit(1);
  }
}

seed();
