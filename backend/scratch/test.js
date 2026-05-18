const axios = require('axios');

async function test() {
  try {
    console.log('Registering...');
    const regRes = await axios.post('https://second-hand-product-seller-website.onrender.com/api/auth/register', {
      name: 'Test Chat User',
      email: `testchat${Date.now()}@test.com`,
      password: 'password123',
      passwordConfirm: 'password123',
      termsAccepted: true,
      privacyAccepted: true
    });
    
    const token = regRes.data.token;
    console.log('Token:', token ? 'Success' : 'Failed');
    
    console.log('Fetching conversations...');
    const convRes = await axios.get('https://second-hand-product-seller-website.onrender.com/api/chat/conversations/all', {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log('Conversations:', convRes.data.length);
  } catch (err) {
    console.error('Error:', err.response ? err.response.data : err.message);
  }
}

test();
