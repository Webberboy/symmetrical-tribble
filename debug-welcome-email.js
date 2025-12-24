// Debug script to test welcome email integration
async function testWelcomeEmail() {
  console.log('=== Testing Welcome Email Integration ===');
  
  // Test the edge function directly
  try {
    console.log('1. Testing edge function directly...');
    const response = await fetch('https://jovrfejbutfrzvclchuf.supabase.co/functions/v1/newsend-welcome-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpvdnJmZWpidXRmcnp2Y2xjaHVmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzM5MjM1ODAsImV4cCI6MTczNjUxNTU4MH0.7Y3X3D3X3D3X3D3X3D3X3D3X3D3X3D3X3D3X3D3D', // Mock anon token
      },
      body: JSON.stringify({
        email: 'test@example.com',
        accountNumber: '401251234567',
        firstName: 'Test User'
      })
    });

    const result = await response.json();
    console.log('Edge function response:', result);
  } catch (error) {
    console.error('Edge function error:', error);
  }

  // Test account number generation
  console.log('\n2. Testing account number format...');
  const accountNumber = '401251234567';
  const accountNumberRegex = /^\d{12}$/;
  console.log('Account number:', accountNumber);
  console.log('Valid format:', accountNumberRegex.test(accountNumber));

  // Test email validation
  console.log('\n3. Testing email validation...');
  const email = 'test@example.com';
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  console.log('Email:', email);
  console.log('Valid format:', emailRegex.test(email));
}

// Run the test
testWelcomeEmail();