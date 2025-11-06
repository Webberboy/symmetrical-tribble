# Email Sending Feature

## Overview
The Email Sending feature allows administrators to send custom HTML emails to users directly from the admin dashboard. It uses the Resend API to deliver professional, beautifully designed emails.

## Access
Navigate to `/emailsending` or click the "Send Emails" button in the Admin Dashboard header.

## Features

### 1. **Custom HTML Email Templates**
- Full HTML email editor with syntax highlighting
- Live preview of email design
- Pre-built templates for quick use
- Support for inline CSS styling

### 2. **Pre-built Templates**
- **Welcome Email**: Professional welcome message for new users
- **Notification**: General notification template with info styling
- **Security Alert**: Important security notifications with alert styling

### 3. **Email Composer**
- **From Name**: Customize the sender name (e.g., "Heritage Bank")
- **From Email**: Set the sender email (e.g., "admin@heritagebk.org")
- **To Email**: Recipient email address
- **Subject**: Email subject line
- **HTML Template**: Full HTML email template editor

### 4. **Preview Mode**
- Switch between Edit and Preview modes
- See exactly how your email will look before sending
- Real-time rendering of HTML content

## Setup Instructions

### 1. Get Resend API Key
1. Go to [https://resend.com](https://resend.com)
2. Sign up or log in to your account
3. Navigate to API Keys section
4. Click "Create API Key"
5. Give it a name (e.g., "Bank Weave UI")
6. Copy the generated API key

### 2. Configure Environment Variables
1. Create a `.env` file in the root directory if it doesn't exist
2. Add your Resend API key:
```bash
VITE_RESEND_API_KEY=re_your_actual_api_key_here
```

### 3. Verify Domain (Optional but Recommended)
For better deliverability and to avoid spam folders:
1. In Resend dashboard, go to "Domains"
2. Click "Add Domain"
3. Enter your domain (e.g., `heritagebk.org`)
4. Follow the DNS configuration instructions
5. Once verified, update the `fromEmail` to use your verified domain

## Usage Guide

### Sending a Simple Email
1. Navigate to `/emailsending`
2. Fill in the recipient email
3. Enter the subject line
4. Use one of the pre-built templates or write your own HTML
5. Click "Preview" to see how it looks
6. Click "Send Email" when ready

### Creating Custom HTML Templates

#### Best Practices for Email HTML:
- **Use inline CSS styles** instead of external stylesheets
- **Use table-based layouts** for better compatibility
- **Keep width around 600px** for optimal viewing
- **Use web-safe fonts** (Arial, Helvetica, Times New Roman, Georgia)
- **Avoid JavaScript** - it's blocked by email clients
- **Include alt text** for all images
- **Test across different email clients**

#### Basic Email Template Structure:
```html
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Email Title</title>
  </head>
  <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f3f4f6;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; padding: 40px 0;">
      <tr>
        <td align="center">
          <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px;">
            <!-- Header -->
            <tr>
              <td style="background-color: #1f2937; padding: 30px; text-align: center;">
                <h1 style="color: #ffffff; margin: 0;">Your Brand</h1>
              </td>
            </tr>
            
            <!-- Content -->
            <tr>
              <td style="padding: 40px 30px;">
                <h2 style="color: #1f2937; margin: 0 0 20px 0;">Email Content</h2>
                <p style="color: #4b5563; line-height: 1.6;">Your message here.</p>
              </td>
            </tr>
            
            <!-- Footer -->
            <tr>
              <td style="background-color: #f9fafb; padding: 20px 30px; text-align: center;">
                <p style="color: #6b7280; font-size: 14px; margin: 0;">
                  © 2025 Your Brand. All rights reserved.
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>
```

### Adding Dynamic Content
You can manually replace placeholders in your template before sending:
- `{{name}}` - Recipient's name
- `{{amount}}` - Transaction amount
- `{{date}}` - Current date
- `{{account_number}}` - Account number

Example:
```html
<p>Dear {{name}},</p>
<p>Your transaction of ${{amount}} was processed on {{date}}.</p>
```

## Common Use Cases

### 1. Welcome New Users
```
Subject: Welcome to Heritage Bank!
Template: Use the "Welcome" template
Customize: Add personalized greeting and account details
```

### 2. Transaction Notifications
```
Subject: Transaction Receipt - [Transaction ID]
Template: Create custom template with transaction details table
Include: Amount, recipient, date, transaction ID
```

### 3. Security Alerts
```
Subject: Security Alert - Important Notice
Template: Use the "Security Alert" template
Customize: Add specific security concern details
```

### 4. Marketing Campaigns
```
Subject: Exclusive Offer for You!
Template: Create custom branded template
Include: CTA buttons, promotional content, terms
```

### 5. Account Updates
```
Subject: Your Account Update
Template: Use "Notification" template
Customize: Add specific update details
```

## Troubleshooting

### Email Not Sending
1. **Check API Key**: Verify `VITE_RESEND_API_KEY` is set correctly in `.env`
2. **Check Browser Console**: Look for error messages
3. **Verify Email Format**: Ensure recipient email is valid
4. **Check Resend Dashboard**: Look for any delivery issues or errors

### Email Goes to Spam
1. **Verify Your Domain**: Use a verified domain in Resend
2. **Avoid Spam Triggers**: Don't use ALL CAPS, excessive exclamation marks!!!
3. **Include Plain Text**: Some email clients prefer plain text alternatives
4. **Test First**: Send test emails to yourself before bulk sending

### Template Looks Broken
1. **Use Inline CSS**: External stylesheets don't work in emails
2. **Use Tables**: Flexbox and Grid don't work reliably in emails
3. **Test in Preview**: Always preview before sending
4. **Test Multiple Clients**: Check Gmail, Outlook, Apple Mail

## API Rate Limits
- Resend Free Tier: 100 emails/day
- Resend Pro Tier: 50,000 emails/month
- Consider rate limiting for bulk sends

## Security Considerations
1. **Protect API Key**: Never commit `.env` to version control
2. **Validate Recipients**: Ensure email addresses are valid
3. **Admin Only**: Only allow admin access to email sending
4. **Audit Logs**: Keep track of who sends what emails
5. **Rate Limiting**: Prevent abuse with rate limits

## Future Enhancements
- [ ] Batch email sending to multiple recipients
- [ ] Email templates library/management
- [ ] Email scheduling
- [ ] Email analytics and tracking
- [ ] Attachment support
- [ ] Variable substitution system
- [ ] Email queue system
- [ ] A/B testing capabilities

## Support
For issues or questions:
- Check Resend documentation: https://resend.com/docs
- Review email HTML best practices
- Test in different email clients
- Contact support if delivery issues persist

## Example Emails

### Professional Welcome Email
```html
Subject: Welcome to Heritage Bank - Your Account is Ready!

Use the welcome template and customize with:
- User's first name
- Account number
- Link to dashboard
- Getting started tips
```

### Transaction Receipt
```html
Subject: Transaction Confirmation - $500.00

Custom template with:
- Transaction ID
- Amount with currency
- Recipient details
- Date and time
- Transaction type
```

### Password Reset
```html
Subject: Reset Your Password

Simple template with:
- Reset link
- Expiration time
- Security notice
- Contact support info
```

---

**Last Updated**: November 2025
**Version**: 1.0.0
