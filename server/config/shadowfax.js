const SHADOWFAX_API_BASE = process.env.SHADOWFAX_API_BASE || 'https://sandbox.shadowfax.in/api/v2';
const SHADOWFAX_TOKEN = process.env.SHADOWFAX_TOKEN; // V2 token or client credentials token

/**
 * Request a rider delivery job from Shadowfax
 */
const createShadowfaxDeliveryJob = async (order) => {
  if (!SHADOWFAX_TOKEN) {
    console.warn('⚠️ Shadowfax API token is missing. Simulating delivery ride.');
    return {
      success: true,
      simulated: true,
      delivery_id: 'SFX-' + Math.random().toString(36).substr(2, 9).toUpperCase(),
      rider_name: 'Rahul Sharma',
      rider_phone: '+91 98765 43210',
      status: 'rider_assigned'
    };
  }

  try {
    const payload = {
      client_order_number: order.order_number || order._id.toString(),
      pickup_details: {
        name: "Bombay Chowpati - Chat Bhandar",
        phone: "+91 72078 36300",
        address_line_1: "MPM Mall, Abids Road",
        address_line_2: "Hanuman Tekdi, Abids",
        city: "Hyderabad",
        state: "Telangana",
        pincode: "500001",
        latitude: 17.3850,
        longitude: 78.4867
      },
      drop_details: {
        name: order.customer_name,
        phone: order.customer_phone,
        address_line_1: order.delivery_address,
        city: "Hyderabad",
        state: "Telangana",
        pincode: "500001" // can parse from address if available
      },
      order_details: {
        order_value: order.total_amount,
        payment_type: order.payment_method === 'cod' ? 'COD' : 'PREPAID',
        cod_amount: order.payment_method === 'cod' ? order.total_amount : 0
      }
    };

    const response = await fetch(`${SHADOWFAX_API_BASE}/jobs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SHADOWFAX_TOKEN}`
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Shadowfax API Error: ${errText}`);
    }

    const data = await response.json();
    return {
      success: true,
      delivery_id: data.sfx_order_id,
      rider_name: data.rider_details?.name || 'Assigning...',
      rider_phone: data.rider_details?.phone || '',
      status: 'rider_assigned'
    };
  } catch (err) {
    console.error('Error creating Shadowfax delivery job:', err.message);
    return { success: false, error: err.message };
  }
};

module.exports = {
  createShadowfaxDeliveryJob
};
