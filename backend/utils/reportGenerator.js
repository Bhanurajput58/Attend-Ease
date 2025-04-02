const PDFDocument = require('pdfkit');
const XLSX = require('xlsx');
const fs = require('fs-extra');
const path = require('path');

// Create temporary directory for reports if it doesn't exist
const tempDir = path.join(__dirname, '../temp');
console.log('Temp directory path:', tempDir);
fs.ensureDirSync(tempDir);

// Create a test file to verify permissions
try {
  const testFilePath = path.join(tempDir, 'test_file.txt');
  fs.writeFileSync(testFilePath, 'Test file content');
  console.log('Test file created at:', testFilePath);
} catch (error) {
  console.error('Error creating test file:', error);
}

/**
 * Generate a PDF report for attendance data
 * @param {Object} data Report data
 * @param {String} data.courseName Course name
 * @param {String} data.period Report period
 * @param {Array} data.attendanceRecords Attendance records
 * @returns {Promise<String>} Path to the generated PDF file
 */
const generatePDF = async (data) => {
  return new Promise((resolve, reject) => {
    try {
      console.log('Starting PDF generation with data:', {
        courseName: data.courseName,
        period: data.period,
        recordCount: data.attendanceRecords?.length || 0
      });

      const timestamp = Date.now();
      const filePath = path.join(tempDir, `attendance_report_${timestamp}.pdf`);
      console.log('PDF file will be created at:', filePath);
      
      // Create PDF document
      const doc = new PDFDocument({ margin: 50, size: 'A4' });
      
      // Pipe output to file
      const stream = fs.createWriteStream(filePath);
      doc.pipe(stream);
      
      // Add report title
      doc.fontSize(25).text('Attendance Report', { align: 'center' });
      doc.moveDown();
      
      // Add report metadata
      doc.fontSize(12);
      doc.text(`Course: ${data.courseName}`);
      doc.text(`Period: ${data.period}`);
      doc.text(`Generated on: ${new Date().toLocaleDateString()}`);
      doc.moveDown();
      
      // Add table header
      doc.fontSize(14).text('Attendance Summary', { underline: true });
      doc.moveDown();
      
      // Define table columns
      const tableTop = 200;
      const tableColumnWidth = 100;
      doc.fontSize(10);
      
      // Draw table header
      doc.font('Helvetica-Bold');
      doc.text('Date', 50, tableTop);
      doc.text('Present', 50 + tableColumnWidth, tableTop);
      doc.text('Absent', 50 + tableColumnWidth * 2, tableTop);
      doc.font('Helvetica');
      
      // Add attendance records
      if (data.attendanceRecords && data.attendanceRecords.length > 0) {
        console.log('Adding attendance records to PDF');
        let currentY = tableTop + 30;
        
        data.attendanceRecords.forEach((record, index) => {
          console.log(`Processing record ${index + 1}/${data.attendanceRecords.length}`);
          
          // Check if we need a new page
          if (currentY > 700) {
            doc.addPage();
            currentY = 50;
          }
          
          doc.text(record.date, 50, currentY);
          doc.text(record.present.toString(), 50 + tableColumnWidth, currentY);
          doc.text(record.absent.toString(), 50 + tableColumnWidth * 2, currentY);
          
          currentY += 20;
        });
      } else {
        console.log('No attendance records to add to PDF');
        doc.text('No attendance records found for the selected period.', 50, tableTop + 30);
      }
      
      // Finalize the PDF
      doc.end();
      
      // Wait for the stream to finish
      stream.on('finish', () => {
        console.log('PDF generation completed successfully');
        resolve(filePath);
      });
      
      stream.on('error', (error) => {
        console.error('Error writing PDF file:', error);
        reject(error);
      });
    } catch (error) {
      console.error('Error generating PDF:', error);
      reject(error);
    }
  });
};

/**
 * Generate an Excel report for attendance data
 * @param {Object} data Report data
 * @param {String} data.courseName Course name
 * @param {String} data.period Report period
 * @param {Array} data.attendanceRecords Attendance records
 * @returns {Promise<String>} Path to the generated Excel file
 */
const generateExcel = async (data) => {
  try {
    console.log('Starting Excel generation with data:', {
      courseName: data.courseName,
      period: data.period,
      recordCount: data.attendanceRecords?.length || 0
    });

    const timestamp = Date.now();
    const filePath = path.join(tempDir, `attendance_report_${timestamp}.xlsx`);
    console.log('Excel file will be created at:', filePath);
    
    // Create workbook and worksheet
    const wb = XLSX.utils.book_new();
    
    // Add metadata sheet
    const metadataWs = XLSX.utils.aoa_to_sheet([
      ['Attendance Report'],
      [''],
      ['Course', data.courseName],
      ['Period', data.period],
      ['Generated on', new Date().toLocaleDateString()]
    ]);
    XLSX.utils.book_append_sheet(wb, metadataWs, 'Report Info');
    
    // Add attendance data sheet
    const headers = ['Date', 'Present', 'Absent', 'Total', 'Percentage'];
    let attendanceData = [];
    
    if (data.attendanceRecords && data.attendanceRecords.length > 0) {
      console.log('Adding attendance records to Excel');
      attendanceData = data.attendanceRecords.map((record, index) => {
        console.log(`Processing record ${index + 1}/${data.attendanceRecords.length}`);
        return [
          record.date,
          record.present,
          record.absent,
          record.total,
          `${record.percentage}%`
        ];
      });
    } else {
      console.log('No attendance records to add to Excel');
      attendanceData = [['No attendance records found for the selected period.']];
    }
    
    // Insert headers at the top of the data
    attendanceData.unshift(headers);
    
    const attendanceWs = XLSX.utils.aoa_to_sheet(attendanceData);
    XLSX.utils.book_append_sheet(wb, attendanceWs, 'Attendance Data');
    
    // Write to file
    XLSX.writeFile(wb, filePath);
    console.log('Excel generation completed successfully');
    
    return filePath;
  } catch (error) {
    console.error('Error generating Excel:', error);
    throw error;
  }
};

/**
 * Clean up temporary report files
 * @param {String} filePath Path to the file to delete
 */
const cleanupReport = async (filePath) => {
  try {
    console.log('Cleaning up report file:', filePath);
    const exists = await fs.pathExists(filePath);
    if (exists) {
      await fs.remove(filePath);
      console.log('Successfully cleaned up file:', filePath);
    } else {
      console.log('File does not exist, nothing to clean up:', filePath);
    }
  } catch (error) {
    console.error('Error cleaning up report file:', error);
  }
};

module.exports = {
  generatePDF,
  generateExcel,
  cleanupReport
}; 