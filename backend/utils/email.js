// Placeholder email utility functions
// In a real application, these would be implemented with a proper email service

const sendEmail = async (to, subject, text) => {
  console.log(`[Email] Would send email to ${to} with subject "${subject}"`);
  console.log(`[Email] Content: ${text}`);
  return { success: true };
};

const sendBulkEmails = async (emails) => {
  console.log(`[Email] Would send ${emails.length} emails`);
  emails.forEach(email => {
    console.log(`[Email] To: ${email.to}, Subject: ${email.subject}`);
  });
  return { success: true };
};

module.exports = {
  sendEmail,
  sendBulkEmails
}; 