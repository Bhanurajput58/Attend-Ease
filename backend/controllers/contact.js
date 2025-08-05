const emailService = require('../services/emailService');

const submitContactForm = async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;

    if (!name || !email || !subject || !message) {
      return res.status(400).json({ success: false, message: 'Please fill in all fields' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ success: false, message: 'Please enter a valid email address' });
    }

    const emailData = {
      to: [{ email: process.env.ADMIN_EMAIL || 'bhanurajput5965@gmail.com', name: 'Attend-Ease Admin' }],
      sender: { email: process.env.FROM_EMAIL || 'bhanurajput5965@gmail.com', name: process.env.FROM_NAME || 'Attend-Ease Contact Form' },
      subject: `New Contact Form Submission: ${subject}`,
      htmlContent: generateContactEmailTemplate(name, email, subject, message),
      textContent: generateContactEmailText(name, email, subject, message)
    };

    const emailResult = await emailService.sendEmailWithRetry(emailData);

    if (emailResult.success) {
      const confirmationEmailData = {
        to: [{ email, name }],
        sender: { email: process.env.FROM_EMAIL || 'bhanurajput5965@gmail.com', name: process.env.FROM_NAME || 'Attend-Ease Team' },
        subject: 'Thanks for reaching out to Attend-Ease',
        htmlContent: generateConfirmationEmailTemplate(name),
        textContent: generateConfirmationEmailText(name)
      };
      await emailService.sendEmailWithRetry(confirmationEmailData);
      res.status(200).json({ success: true, message: 'Message sent! We\'ll get back to you soon.' });
    } else {
      console.error('Failed to send contact form email:', emailResult.error);
      res.status(500).json({ success: false, message: 'Something went wrong. Please try again.' });
    }
  } catch (error) {
    console.error('Contact form submission error:', error);
    res.status(500).json({ success: false, message: 'Sorry, something went wrong. Please try again.' });
  }
};

const generateContactEmailTemplate = (name, email, subject, message) => `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>New Contact Form Submission</title>
    <style>
      body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f4f4f4; }
      .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; box-shadow: 0 0 10px rgba(0,0,0,0.1); }
      .header { background: linear-gradient(135deg, #2196F3 0%, #1976D2 100%); color: white; padding: 30px 20px; text-align: center; }
      .content { padding: 30px 20px; }
      .field { margin-bottom: 20px; }
      .field-label { font-weight: bold; color: #1976D2; margin-bottom: 5px; }
      .field-value { background-color: #f8f9fa; padding: 10px; border-radius: 5px; border-left: 4px solid #2196F3; }
      .message-content { white-space: pre-wrap; line-height: 1.8; }
      .footer { background-color: #f8f9fa; padding: 20px; text-align: center; color: #666; font-size: 14px; }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <h1>New Contact Form Message</h1>
        <p>Someone sent you a message from Attend-Ease</p>
      </div>
      <div class="content">
        <div class="field">
          <div class="field-label">From:</div>
          <div class="field-value">${name} (${email})</div>
        </div>
        <div class="field">
          <div class="field-label">Subject:</div>
          <div class="field-value">${subject}</div>
        </div>
        <div class="field">
          <div class="field-label">Message:</div>
          <div class="field-value message-content">${message}</div>
        </div>
      </div>
      <div class="footer">
        <p>Sent from Attend-Ease contact form</p>
        <p>${new Date().toLocaleString()}</p>
      </div>
    </div>
  </body>
</html>`;

const generateContactEmailText = (name, email, subject, message) => `
New Contact Form Message

From: ${name} (${email})
Subject: ${subject}

Message:
${message}

---
Sent from Attend-Ease contact form
${new Date().toLocaleString()}`;

const generateConfirmationEmailTemplate = (name) => `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Thanks for contacting Attend-Ease</title>
    <style>
      body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f4f4f4; }
      .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; box-shadow: 0 0 10px rgba(0,0,0,0.1); }
      .header { background: linear-gradient(135deg, #4CAF50 0%, #388E3C 100%); color: white; padding: 30px 20px; text-align: center; }
      .content { padding: 30px 20px; }
      .footer { background-color: #f8f9fa; padding: 20px; text-align: center; color: #666; font-size: 14px; }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <h1>Thanks for reaching out!</h1>
        <p>We got your message</p>
      </div>
      <div class="content">
        <p>Hi ${name},</p>
        <p>Thanks for contacting Attend-Ease. We got your message and will reply within 1-2 business days.</p>
        <p>Need help right away? Contact us at:</p>
        <ul>
          <li>Email: bhanurajput5965@gmail.com</li>
          <li>Phone: +91 9826000000</li>
        </ul>
        <p>Best,<br>The Attend-Ease Team</p>
      </div>
      <div class="footer">
        <p>Auto-generated email</p>
        <p>${new Date().toLocaleString()}</p>
      </div>
    </div>
  </body>
</html>`;

const generateConfirmationEmailText = (name) => `
Thanks for reaching out!

Hi ${name},

Thanks for contacting Attend-Ease. We got your message and will reply within 1-2 business days.

Need help right away? Contact us at:
- Email: bhanurajput5965@gmail.com
- Phone: +91 9826000000

Best,
The Attend-Ease Team

---
Auto-generated email
${new Date().toLocaleString()}`;

module.exports = { submitContactForm }; 