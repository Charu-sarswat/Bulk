const SHIPROCKET_EMAIL = process.env.SHIPROCKET_EMAIL || 'shoebalimohammed03@gmail.com';
const SHIPROCKET_PASSWORD = process.env.SHIPROCKET_PASSWORD || 'd27Sg2pbPw3s0CdwxW%igZ5naQ$zpv2B';

let cachedToken = null;
let tokenExpiry = null;

async function getShiprocketToken() {
  if (cachedToken && tokenExpiry && Date.now() < tokenExpiry) {
    return cachedToken;
  }

  try {
    const res = await fetch('https://apiv2.shiprocket.in/v1/external/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: SHIPROCKET_EMAIL, password: SHIPROCKET_PASSWORD })
    });
    if (!res.ok) {
      throw new Error(`Auth failed with status ${res.status}`);
    }
    const data = await res.json();
    cachedToken = data.token;
    tokenExpiry = Date.now() + 9 * 24 * 60 * 60 * 1000; // Cache for 9 days (token valid for 10)
    return cachedToken;
  } catch (err) {
    console.error('Shiprocket Authentication Error:', err.message);
    return null;
  }
}

async function createShiprocketDeliveryJob(order) {
  try {
    const token = await getShiprocketToken();
    if (!token) {
      throw new Error('Failed to retrieve Shiprocket API token');
    }

    const nameParts = (order.customer_name || 'Guest Customer').trim().split(' ');
    const firstName = nameParts[0] || 'Guest';
    const lastName = nameParts.slice(1).join(' ') || 'Customer';

    const payload = {
      order_id: order.order_number || order._id.toString(),
      order_date: new Date(order.created_at || Date.now()).toISOString().slice(0, 16).replace('T', ' '),
      pickup_location: 'work',
      billing_customer_name: firstName,
      billing_last_name: lastName,
      billing_address: order.delivery_address || 'Abids Road',
      billing_city: 'Hyderabad',
      billing_pincode: '500001',
      billing_state: 'Telangana',
      billing_country: 'India',
      billing_email: 'customer@example.com',
      billing_phone: order.customer_phone || '7207836300',
      shipping_is_billing: true,
      order_items: order.items.map(item => ({
        name: item.name,
        sku: item.menu_item_id ? item.menu_item_id.toString() : 'SKU_GENERIC',
        units: item.quantity,
        selling_price: item.price,
        discount: 0,
        tax: 0
      })),
      sub_total: order.total_amount,
      length: 10,
      breadth: 10,
      height: 10,
      weight: 0.5,
      payment_method: order.payment_method === 'cod' ? 'COD' : 'Prepaid',
      cod_amount: order.payment_method === 'cod' ? order.total_amount : 0
    };

    const res = await fetch('https://apiv2.shiprocket.in/v1/external/orders/create/adhoc', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    });

    const data = await res.json();
    if (!res.ok || (data.message && data.message.includes('Wrong Pickup'))) {
      console.log('Sending payload:', JSON.stringify(payload, null, 2));
      console.log('Shiprocket error response:', JSON.stringify(data, null, 2));
      throw new Error(data.message || `Shiprocket API status ${res.status}`);
    }

    console.log('Shiprocket success response:', JSON.stringify(data, null, 2));

    return {
      success: true,
      delivery_id: data.shipment_id || data.order_id,
      rider_name: 'Assigning (Shiprocket)',
      rider_phone: '',
      status: 'assigning'
    };
  } catch (err) {
    console.error('Shiprocket Job Creation Error:', err.message);
    return { success: false, error: err.message };
  }
}

module.exports = {
  createShiprocketDeliveryJob
};
