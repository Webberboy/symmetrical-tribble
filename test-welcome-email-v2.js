// Test the updated welcome email function
const { sendWelcomeEmail } = require('./src/lib/emailService.ts');

async function testWelcomeEmail() {
  console.log('Testing welcome email with service role key...');
  
  try {
    // Test with a valid account number format
    const result = await sendWelcomeEmail(
      'test@example.com',
      '401251234567',
      'Test User'
    );
    
    console.log('Result:', result);
  } catch (error) {
    console.error('Error:', error);
  }
}

testWelcomeEmail();