const emailService = require('../services/emailService');

const subscribeNewsletter = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ success: false, message: 'Please provide a valid email address' });
    }

    const emailData = {
      to: [{ email, name: 'Newsletter Subscriber' }],
      sender: { email: process.env.FROM_EMAIL || 'bhanurajput5965@gmail.com', name: process.env.FROM_NAME || 'Attend-Ease Newsletter' },
      subject: 'Welcome to Attend-Ease Newsletter!',
      htmlContent: generateNewsletterWelcomeTemplate(email),
      textContent: generateNewsletterWelcomeText(email)
    };

    const emailResult = await emailService.sendEmailWithRetry(emailData);

    if (emailResult.success) {
      const adminEmailData = {
        to: [{ email: process.env.ADMIN_EMAIL || 'bhanurajput5965@gmail.com', name: 'Attend-Ease Admin' }],
        sender: { email: process.env.FROM_EMAIL || 'bhanurajput5965@gmail.com', name: process.env.FROM_NAME || 'Attend-Ease Newsletter System' },
        subject: 'New Newsletter Subscription',
        htmlContent: generateAdminNotificationTemplate(email),
        textContent: generateAdminNotificationText(email)
      };
      await emailService.sendEmailWithRetry(adminEmailData);
      res.status(200).json({ success: true, message: 'Successfully subscribed to our newsletter! Check your email for confirmation.' });
    } else {
      console.error('Failed to send newsletter subscription email:', emailResult.error);
      res.status(500).json({ success: false, message: 'Failed to subscribe. Please try again later.' });
    }
  } catch (error) {
    console.error('Newsletter subscription error:', error);
    res.status(500).json({ success: false, message: 'An error occurred while processing your subscription. Please try again later.' });
  }
};

const generateNewsletterWelcomeTemplate = (email) => `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Welcome to Attend-Ease Newsletter</title>
    <style>
      body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f4f4f4; }
      .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; box-shadow: 0 0 10px rgba(0,0,0,0.1); }
      .header { background: linear-gradient(135deg, #2196F3 0%, #1976D2 100%); color: white; padding: 40px 20px; text-align: center; }
      .content { padding: 40px 20px; }
      .welcome-message { font-size: 18px; margin-bottom: 30px; color: #1976D2; }
      .features-list { background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; }
      .features-list h3 { color: #1976D2; margin-top: 0; }
      .features-list ul { list-style: none; padding: 0; }
      .features-list li { padding: 8px 0; border-bottom: 1px solid #e9ecef; }
      .features-list li:before { content: "✓"; color: #28a745; font-weight: bold; margin-right: 10px; }
      .footer { background-color: #f8f9fa; padding: 20px; text-align: center; color: #666; font-size: 14px; }
      .unsubscribe { margin-top: 20px; font-size: 12px; color: #999; }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <h1>Welcome to Attend-Ease!</h1>
        <p>You're now subscribed to our newsletter</p>
      </div>
      <div class="content">
        <div class="welcome-message">
          <p>Thank you for subscribing to our newsletter! We're excited to keep you updated with the latest features, tips, and news about Attend-Ease.</p>
        </div>
        <div class="features-list">
          <h3>What you'll receive:</h3>
          <ul>
            <li>Product updates and new features</li>
            <li>Tips for better attendance management</li>
            <li>Success stories from other institutions</li>
            <li>Exclusive offers and promotions</li>
            <li>Industry insights and best practices</li>
          </ul>
        </div>
        <p>We'll send you valuable content that helps you make the most of your attendance management system. Stay tuned for our next update!</p>
        <p>Best regards,<br>The Attend-Ease Team</p>
      </div>
      <div class="footer">
        <p>© 2024 Attend-Ease. All rights reserved.</p>
        <div class="unsubscribe">
          <p>If you no longer wish to receive these emails, you can unsubscribe at any time.</p>
        </div>
      </div>
    </div>
  </body>
</html>`;

const generateNewsletterWelcomeText = (email) => `
Welcome to Attend-Ease Newsletter!

Thank you for subscribing to our newsletter! We're excited to keep you updated with the latest features, tips, and news about Attend-Ease.

What you'll receive:
✓ Product updates and new features
✓ Tips for better attendance management
✓ Success stories from other institutions
✓ Exclusive offers and promotions
✓ Industry insights and best practices

We'll send you valuable content that helps you make the most of your attendance management system. Stay tuned for our next update!

Best regards,
The Attend-Ease Team

© 2024 Attend-Ease. All rights reserved.
If you no longer wish to receive these emails, you can unsubscribe at any time.`;

const generateAdminNotificationTemplate = (email) => `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>New Newsletter Subscription</title>
    <style>
      body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f4f4f4; }
      .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; box-shadow: 0 0 10px rgba(0,0,0,0.1); }
      .header { background: linear-gradient(135deg, #28a745 0%, #20c997 100%); color: white; padding: 30px 20px; text-align: center; }
      .content { padding: 30px 20px; }
      .subscription-info { background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #28a745; }
      .footer { background-color: #f8f9fa; padding: 20px; text-align: center; color: #666; font-size: 14px; }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <h1>New Newsletter Subscription</h1>
        <p>Someone has subscribed to your newsletter</p>
      </div>
      <div class="content">
        <p>A new subscriber has joined your Attend-Ease newsletter!</p>
        <div class="subscription-info">
          <h3>Subscription Details:</h3>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
          <p><strong>Time:</strong> ${new Date().toLocaleTimeString()}</p>
        </div>
        <p>This subscriber will now receive your newsletter updates and product announcements.</p>
      </div>
      <div class="footer">
        <p>© 2024 Attend-Ease. All rights reserved.</p>
      </div>
    </div>
  </body>
</html>`;

const generateAdminNotificationText = (email) => `
New Newsletter Subscription

A new subscriber has joined your Attend-Ease newsletter!

Subscription Details:
Email: ${email}
Date: ${new Date().toLocaleDateString()}
Time: ${new Date().toLocaleTimeString()}

This subscriber will now receive your newsletter updates and product announcements.

© 2024 Attend-Ease. All rights reserved.`;

module.exports = { subscribeNewsletter }; 