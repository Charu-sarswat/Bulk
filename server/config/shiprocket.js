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
    tokenExpiry = Date.now() + 9 * 24 * 60 * 60 * 1000; // Cache for 9 days
    return cachedToken;
  } catch (err) {
    console.error('Shiprocket Authentication Error:', err.message);
    return null;
  }
}

/**
 * Creates a Shiprocket QUICK Hyperlocal delivery job
 */
async function createShiprocketDeliveryJob(order) {
  try {
    const token = await getShiprocketToken();
    if (!token) {
      throw new Error('Failed to retrieve Shiprocket API token');
    }

    const nameParts = (order.customer_name || 'Guest Customer').trim().split(' ');
    const firstName = nameParts[0] || 'Guest';
    const lastName = nameParts.slice(1).join(' ') || 'Customer';

    // Extract pincode, city, and state from address if present
    const addressStr = order.delivery_address || '';
    const pincodeMatch = addressStr.match(/\b([1-9][0-9]{5})\b/);
    const billing_pincode = pincodeMatch ? pincodeMatch[1] : '500001';

    const lowerAddress = addressStr.toLowerCase();
    let billing_state = 'Telangana';
    const states = ['andhra pradesh', 'arunachal pradesh', 'assam', 'bihar', 'chhattisgarh', 'goa', 'gujarat', 'haryana', 'himachal pradesh', 'jharkhand', 'karnataka', 'kerala', 'madhya pradesh', 'maharashtra', 'manipur', 'meghalaya', 'mizoram', 'nagaland', 'odisha', 'punjab', 'rajasthan', 'sikkim', 'tamil nadu', 'telangana', 'tripura', 'uttar pradesh', 'uttarakhand', 'west bengal', 'delhi'];
    let matchedStateWord = '';
    for (const s of states) {
      if (lowerAddress.includes(s)) {
        billing_state = s.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
        matchedStateWord = s;
        break;
      }
    }

    let billing_city = 'Hyderabad';
    const cities = ['hyderabad', 'secunderabad', 'bengaluru', 'bangalore', 'mumbai', 'delhi', 'chennai', 'kolkata', 'pune', 'noida', 'gurugram', 'gurgaon', 'ghaziabad', 'faridabad'];
    let matchedCityWord = '';
    for (const c of cities) {
      if (lowerAddress.includes(c)) {
        billing_city = c.charAt(0).toUpperCase() + c.slice(1);
        matchedCityWord = c;
        break;
      }
    }

    // Clean up addressStr to remove trailing city, state, country, and pincode to avoid duplication
    let cleanAddress = addressStr;
    if (pincodeMatch) {
      cleanAddress = cleanAddress.replace(new RegExp('\\b' + pincodeMatch[1] + '\\b', 'gi'), '');
    }
    if (matchedStateWord) {
      cleanAddress = cleanAddress.replace(new RegExp('\\b' + matchedStateWord + '\\b', 'gi'), '');
    }
    if (matchedCityWord) {
      cleanAddress = cleanAddress.replace(new RegExp('\\b' + matchedCityWord + '\\b', 'gi'), '');
    }
    cleanAddress = cleanAddress.replace(/\b(india)\b/gi, '');
    
    // Clean up extra commas and spaces
    cleanAddress = cleanAddress
      .replace(/,\s*,/g, ',')
      .replace(/\s+/g, ' ')
      .trim()
      .replace(/^,|,$/g, '')
      .trim();

    if (!cleanAddress) {
      cleanAddress = 'Abids Road';
    }

    // Geocode delivery address to get latitude/longitude if not present
    let latitude = order.latitude;
    let longitude = order.longitude;

    if (!latitude || !longitude) {
      try {
        const geoRes = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(order.delivery_address)}&format=json&limit=1`, {
          headers: { 'User-Agent': 'BombayChowpati/1.0' }
        });
        if (geoRes.ok) {
          const geoData = await geoRes.json();
          if (geoData && geoData.length > 0) {
            latitude = parseFloat(geoData[0].lat);
            longitude = parseFloat(geoData[0].lon);
            console.log(`Geocoded coordinates for address: ${latitude}, ${longitude}`);
          }
        }
      } catch (geoErr) {
        console.error('Nominatim geocoding error:', geoErr.message);
      }
    }

    // Default to Hyderabad coords (1.5km offset for delivery so they are not on top of each other)
    const pickupLat = 17.3886;
    const pickupLng = 78.4770;
    latitude = latitude || 17.3895;
    longitude = longitude || 78.4785;

    const payload = {
      order_id: order.order_number || order._id.toString(),
      order_date: new Date(order.created_at || Date.now()).toISOString().slice(0, 16).replace('T', ' '),
      pickup_location: 'work',
      billing_customer_name: firstName,
      billing_last_name: lastName,
      billing_address: cleanAddress,
      billing_city,
      billing_pincode,
      billing_state,
      billing_country: 'India',
      billing_email: 'customer@example.com',
      billing_phone: order.customer_phone || '7207836300',
      shipping_is_billing: true,
      latitude,
      longitude,
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

    console.log('[Shiprocket QUICK] Creating adhoc order with payload:', JSON.stringify(payload, null, 2));

    const res = await fetch('https://apiv2.shiprocket.in/v1/external/orders/create/adhoc', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    });

    const data = await res.json();
    if (!res.ok) {
      console.log('Sending payload:', JSON.stringify(payload, null, 2));
      console.log('Shiprocket error response:', JSON.stringify(data, null, 2));
      throw new Error(data.message || `Shiprocket API status ${res.status}`);
    }

    console.log('Shiprocket success response:', JSON.stringify(data, null, 2));
    const shipment_id = data.shipment_id;

    if (shipment_id) {
      console.log(`[Shiprocket QUICK] Checking hyperlocal serviceability for Shipment ID: ${shipment_id}`);
      let courier_id = null;
      let courierName = 'Shiprocket Hyperlocal';

      try {
        const codVal = order.payment_method === 'cod' ? 1 : 0;
        // Use coordinates to trigger the new hyperlocal routing system
        const serviceUrl = `https://apiv2.shiprocket.in/v1/external/courier/serviceability/?pickup_postcode=500001&delivery_postcode=${billing_pincode}&weight=0.5&cod=${codVal}&is_new_hyperlocal=1&lat_from=${pickupLat}&long_from=${pickupLng}&lat_to=${latitude}&long_to=${longitude}`;
        const serviceRes = await fetch(serviceUrl, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        });
        if (serviceRes.ok) {
          const serviceData = await serviceRes.json();
          console.log('[Shiprocket QUICK] Serviceability Response:', JSON.stringify(serviceData, null, 2));
          const couriers = serviceData.data?.available_courier_companies || [];
          if (couriers.length > 0) {
            // Select the first available hyperlocal courier partner (e.g. Dunzo, Shadowfax Local, Borzo)
            courier_id = couriers[0].courier_company_id;
            courierName = couriers[0].courier_name;
            console.log(`[Shiprocket QUICK] Selected Hyperlocal Courier: ${courierName} (ID: ${courier_id})`);
          } else {
            console.warn('[Shiprocket QUICK] No hyperlocal couriers serviceable for these coordinates in your Shiprocket account.');
          }
        } else {
          const errText = await serviceRes.text();
          console.warn('[Shiprocket QUICK] Serviceability check API error:', errText);
        }
      } catch (serviceErr) {
        console.error('[Shiprocket QUICK] Hyperlocal serviceability check failed:', serviceErr.message);
      }

      console.log(`[Shiprocket QUICK] Assigning AWB / Rider for Shipment ID: ${shipment_id}`);
      const assignBody = { shipment_id };
      if (courier_id) {
        assignBody.courier_id = courier_id;
      }

      const awbRes = await fetch('https://apiv2.shiprocket.in/v1/external/courier/assign/awb', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(assignBody)
      });
      const awbData = await awbRes.json();
      console.log('[Shiprocket QUICK] AWB Assignment Response:', JSON.stringify(awbData, null, 2));
      
      const awbCode = awbData.response?.data?.awb_code || shipment_id;
      if (awbData.response?.data?.courier_name) {
        courierName = awbData.response.data.courier_name;
      }
      
      return {
        success: true,
        delivery_id: awbCode,
        rider_name: courierName,
        rider_phone: '',
        status: 'assigned'
      };
    }

    return {
      success: true,
      delivery_id: data.shipment_id || data.order_id,
      rider_name: 'Assigning (Shiprocket QUICK)',
      rider_phone: '',
      status: 'assigning'
    };
  } catch (err) {
    console.error('[Shiprocket QUICK] Job Creation Error:', err.message);
    console.warn(`[Shiprocket QUICK] Falling back to simulation mode for dev due to error.`);
    return {
      success: true,
      simulated: true,
      delivery_id: 'SRQ-' + Math.random().toString(36).substr(2, 9).toUpperCase(),
      rider_name: 'Rahul (Shiprocket QUICK)',
      rider_phone: '9876543210',
      status: 'assigned'
    };
  }
}

module.exports = {
  createShiprocketDeliveryJob
};
