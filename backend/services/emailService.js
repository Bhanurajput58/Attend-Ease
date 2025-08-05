const Brevo = require('@getbrevo/brevo');

class EmailService {
  constructor() {
    if (process.env.BREVO_API_KEY) {
      this.apiInstance = new Brevo.TransactionalEmailsApi();
      this.apiInstance.setApiKey(Brevo.TransactionalEmailsApiApiKeys.apiKey, process.env.BREVO_API_KEY);
    } else {
      console.warn('BREVO_API_KEY not found. Email service disabled.');
    }
  }

  async sendLowAttendanceNotification(student, course, faculty, customMessage) {
    if (!this.apiInstance) {
      return { success: false, error: 'Email service not configured' };
    }

    if (!student.email) {
      return { success: false, error: 'No email address available' };
    }
    
    const emailData = {
      to: [{ email: student.email, name: student.name }],
      sender: {
        email: process.env.FROM_EMAIL || 'bhanurajput5965@gmail.com',
        name: process.env.FROM_NAME || 'Bhanu Pratap Singh'
      },
      subject: `Low Attendance Alert - ${course.courseName || course.name}`,
      htmlContent: this.generateEmailTemplate(student, course, faculty, customMessage),
      textContent: this.generatePlainTextVersion(student, course, faculty, customMessage)
    };

    try {
      return await this.sendEmailWithRetry(emailData);
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async sendEmailWithRetry(emailData, maxRetries = 3) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const result = await this.apiInstance.sendTransacEmail(emailData);
        return { success: true, attempt, messageId: result.messageId };
      } catch (error) {
        if (attempt === maxRetries) {
          return { success: false, error: error.message, attempts: attempt };
        }
        const delay = 1000 * Math.pow(2, attempt - 1);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  generateEmailTemplate(student, course, faculty, customMessage) {
    const attendanceColor = this.getAttendanceColor(student.attendance);
    const attendanceStatus = this.getAttendanceStatus(student.attendance);
    
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Low Attendance Alert</title>
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f4f4f4; }
            .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; box-shadow: 0 0 10px rgba(0,0,0,0.1); }
            .header { background: linear-gradient(135deg, #f44336 0%, #d32f2f 100%); color: white; padding: 30px 20px; text-align: center; }
            .header h1 { margin: 0; font-size: 28px; font-weight: 600; }
            .content { padding: 30px 20px; }
            .student-info { background: #f8f9fa; border-left: 4px solid #007bff; padding: 20px; margin: 20px 0; border-radius: 0 8px 8px 0; }
            .attendance-section { background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 8px; padding: 20px; margin: 20px 0; }
            .attendance-bar { background: #e9ecef; height: 25px; border-radius: 12px; overflow: hidden; margin: 15px 0; position: relative; }
            .attendance-fill { height: 100%; border-radius: 12px; transition: width 0.3s ease; position: relative; }
            .attendance-text { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); color: #333; font-weight: bold; font-size: 14px; text-shadow: 0 0 2px rgba(255,255,255,0.8); }
            .status-badge { display: inline-block; padding: 8px 16px; border-radius: 20px; font-weight: bold; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px; }
            .action-list { background: #e8f5e8; border: 1px solid #c8e6c9; border-radius: 8px; padding: 20px; margin: 20px 0; }
            .action-list h3 { color: #2e7d32; margin-top: 0; }
            .action-list ul { margin: 0; padding-left: 20px; }
            .action-list li { margin: 8px 0; color: #1b5e20; }
            .footer { background: #f8f9fa; padding: 20px; text-align: center; border-top: 1px solid #dee2e6; color: #6c757d; font-size: 14px; }
            .course-details { background: #e3f2fd; border: 1px solid #bbdefb; border-radius: 8px; padding: 15px; margin: 15px 0; }
            .custom-message { background: #fff3e0; border: 1px solid #ffcc02; border-radius: 8px; padding: 15px; margin: 15px 0; font-style: italic; }
            @media (max-width: 600px) { .container { margin: 0; } .header h1 { font-size: 24px; } .content { padding: 20px 15px; } }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>⚠️ Low Attendance Alert</h1>
              <p style="margin: 10px 0 0 0; opacity: 0.9;">Action Required - Please Review</p>
            </div>
            
            <div class="content">
              <div class="student-info">
                <h2 style="margin: 0 0 10px 0; color: #007bff;">Dear ${student.name || 'Student'},</h2>
                <p style="margin: 0;">This is an important notification regarding your academic attendance.</p>
              </div>
              
              <div class="attendance-section">
                <h3 style="margin: 0 0 15px 0; color: #856404;">📊 Your Attendance Status</h3>
                <p><strong>Course:</strong> ${course.courseName || course.name} (${course.courseCode || course.code})</p>
                <p><strong>Current Attendance:</strong> 
                  <span class="status-badge" style="background-color: ${attendanceColor}; color: white;">
                    ${student.attendance || 0}%
                  </span>
                </p>
                <p><strong>Classes Attended:</strong> ${student.classesAttended || 0} out of ${student.totalClasses || 0} classes</p>
                
                <div class="attendance-bar">
                  <div class="attendance-fill" style="width: ${student.attendance || 0}%; background-color: ${attendanceColor};"></div>
                  <div class="attendance-text">${student.attendance || 0}%</div>
                </div>
                
                <p><strong>Status:</strong> 
                  <span class="status-badge" style="background-color: ${attendanceColor}; color: white;">
                    ${attendanceStatus}
                  </span>
                </p>
              </div>
              
              ${customMessage ? `
                <div class="custom-message">
                  <h4 style="margin: 0 0 10px 0; color: #e65100;">📝 Additional Message from Faculty:</h4>
                  <p style="margin: 0;">"${customMessage}"</p>
                </div>
              ` : ''}
              
              <div class="action-list">
                <h3>🎯 Recommended Actions</h3>
                <ul>
                  <li><strong>Attend all upcoming classes</strong> - Regular attendance is crucial for academic success</li>
                  <li><strong>Contact your faculty</strong> - Discuss any valid reasons for previous absences</li>
                  <li><strong>Monitor your attendance</strong> - Check the portal regularly to track your progress</li>
                  <li><strong>Seek academic support</strong> - Consider tutoring or study groups if needed</li>
                  <li><strong>Plan ahead</strong> - Avoid scheduling conflicts with class times</li>
                </ul>
              </div>
              
              <div class="course-details">
                <h4 style="margin: 0 0 10px 0; color: #1565c0;">📚 Course Information</h4>
                <p><strong>Course Name:</strong> ${course.courseName || course.name}</p>
                <p><strong>Course Code:</strong> ${course.courseCode || course.code}</p>
                <p><strong>Semester:</strong> ${course.semester || 'Not specified'}</p>
                <p><strong>Faculty:</strong> ${faculty.name || 'Not specified'}</p>
                ${faculty.email ? `<p><strong>Faculty Email:</strong> ${faculty.email}</p>` : ''}
              </div>
              
              <div style="background: #f8f9fa; border-radius: 8px; padding: 15px; margin: 20px 0; text-align: center;">
                <p style="margin: 0; font-weight: bold; color: #495057;">
                  💡 Remember: Consistent attendance is key to academic success!
                </p>
              </div>
            </div>
            
            <div class="footer">
              <p style="margin: 0 0 5px 0;"><strong>AttendEase System</strong></p>
              <p style="margin: 0 0 10px 0; font-size: 12px;">Automated attendance management system</p>
              <p style="margin: 0; font-size: 12px; color: #adb5bd;">
                This is an automated message. Please do not reply to this email.<br>
                For questions, contact your faculty directly.
              </p>
            </div>
          </div>
        </body>
      </html>
    `;
  }

  generatePlainTextVersion(student, course, faculty, customMessage) {
    const attendanceStatus = this.getAttendanceStatus(student.attendance);
    
    return `
LOW ATTENDANCE ALERT!

Dear ${student.name || 'Student'},

This is an important notification regarding your academic attendance.

YOUR ATTENDANCE STATUS:
- Course: ${course.courseName || course.name} (${course.courseCode || course.code})
- Current Attendance: ${student.attendance || 0}%
- Classes Attended: ${student.classesAttended || 0} out of ${student.totalClasses || 0} classes
- Status: ${attendanceStatus}

${customMessage ? `
ADDITIONAL MESSAGE FROM FACULTY:
"${customMessage}"
` : ''}

RECOMMENDED ACTIONS:
1. Attend all upcoming classes regularly
2. Contact your faculty if you have valid reasons for absences
3. Monitor your attendance on the portal
4. Seek academic support if needed
5. Plan ahead to avoid scheduling conflicts

COURSE INFORMATION:
- Course Name: ${course.courseName || course.name}
- Course Code: ${course.courseCode || course.code}
- Semester: ${course.semester || 'Not specified'}
- Faculty: ${faculty.name || 'Not specified'}
${faculty.email ? `- Faculty Email: ${faculty.email}` : ''}

Remember: Consistent attendance is key to academic success!

---
AttendEase System
Automated attendance management system

This is an automated message. Please do not reply to this email.
For questions, contact your faculty directly.
    `;
  }

  getAttendanceColor(attendance) {
    if (attendance === null || attendance === undefined) return '#6c757d';
    if (attendance < 50) return '#dc3545';
    if (attendance < 65) return '#fd7e14';
    if (attendance < 75) return '#ffc107';
    return '#28a745';
  }

  getAttendanceStatus(attendance) {
    if (attendance === null || attendance === undefined) return 'Unknown';
    if (attendance < 50) return 'Critical';
    if (attendance < 65) return 'Warning';
    if (attendance < 75) return 'At Risk';
    return 'Good';
  }

  async sendBulkEmails(emails, batchSize = 50) {
    if (!process.env.BREVO_API_KEY) {
      return { success: false, error: 'Email service not configured' };
    }

    const batches = [];
    for (let i = 0; i < emails.length; i += batchSize) {
      batches.push(emails.slice(i, i + batchSize));
    }
    
    const results = [];
    
    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i];
      
      try {
        const batchResults = await Promise.allSettled(
          batch.map(email => this.sendEmailWithRetry(email))
        );
        
        results.push(...batchResults.map((result, index) => ({
          email: batch[index].to[0].email,
          success: result.status === 'fulfilled' && result.value.success,
          error: result.status === 'rejected' ? result.reason : result.value.error,
          attempt: result.status === 'fulfilled' ? result.value.attempt : null
        })));
        
        if (i < batches.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      } catch (error) {
        results.push(...batch.map(email => ({
          email: email.to[0].email,
          success: false,
          error: error.message,
          attempt: null
        })));
      }
    }
    
    return {
      success: true,
      totalEmails: emails.length,
      successfulEmails: results.filter(r => r.success).length,
      failedEmails: results.filter(r => !r.success).length,
      results
    };
  }
}

module.exports = new EmailService(); 