// Test the edge function with anon key
async function testEdgeFunction() {
  console.log('Testing edge function with anon key...');
  
  try {
    const response = await fetch('https://jovrfejbutfrzvclchuf.supabase.co/functions/v1/newsend-welcome-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpvdnJmZWpidXRmcnp2Y2xjaHVmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYwNjgwOTksImV4cCI6MjA4MTY0NDA5OX0.torsxZlwh29SHD6iBp6dn-n3y_ZLhWe9Pqk4iFM_SX8', // This is the anon key from your .env
      },
      body: JSON.stringify({
        email: 'test@example.com',
        accountNumber: '401251234567',
        firstName: 'Test User'
      })
    });

    const result = await response.json();
    console.log('Response status:', response.status);
    console.log('Response:', result);
  } catch (error) {
    console.error('Error:', error);
  }
}

testEdgeFunction();