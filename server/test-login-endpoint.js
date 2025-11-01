// Test rápido de endpoint login
const testLogin = async () => {
  try {
    const res = await fetch('http://localhost:4000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        email: 'func.seguridad1@jantetelco.gob.mx', 
        password: 'admin123' 
      })
    });

    console.log('Status:', res.status);
    console.log('Headers:', Object.fromEntries(res.headers.entries()));
    
    const text = await res.text();
    console.log('Response body (text):', text);
    
    try {
      const json = JSON.parse(text);
      console.log('Parsed JSON:', json);
    } catch (e) {
      console.error('Error parsing JSON:', e.message);
    }
  } catch (err) {
    console.error('Fetch error:', err);
  }
};

testLogin();
