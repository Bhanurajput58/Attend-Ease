const PDFDocument = require('pdfkit');
const XLSX = require('xlsx');
const ExcelJS = require('exceljs');
const fs = require('fs-extra');
const fsSync = require('fs');
const path = require('path');

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
      const doc = new PDFDocument({ 
        margin: 50, 
        size: 'A4',
        info: {
          Title: 'Attendance Report',
          Author: 'Attendance Management System',
          Subject: `${data.courseName} - ${data.period}`,
          Keywords: 'attendance, report, education',
          CreationDate: new Date()
        }
      });
      
      // Pipe output to file
      const stream = fsSync.createWriteStream(filePath);
      doc.pipe(stream);
      
      // Add header with logo/icon
      doc.rect(50, 50, 495, 60).fill('#2E5BBA');
      doc.fontSize(24).fillColor('white').text('Attendance Report', 60, 70, { align: 'center', width: 475 });
      doc.fontSize(12).text('Attendance Management System', 60, 100, { align: 'center', width: 475 });
      
      // Reset to normal colors
      doc.fillColor('black');
      
      // Add report metadata section
      doc.moveDown(2);
      doc.fontSize(14).fillColor('#2E5BBA').text('Report Information', { underline: true });
      doc.fillColor('black').fontSize(10);
      doc.moveDown(0.5);
      
      const metadata = [
        ['Course:', data.courseName],
        ['Period:', data.period],
        ['Generated on:', new Date().toLocaleDateString()],
        ['Generated at:', new Date().toLocaleTimeString()],
        ['Total Records:', data.attendanceRecords?.length || 0]
      ];
      
      metadata.forEach(([label, value]) => {
        doc.text(`${label} ${value}`, { continued: false });
        doc.moveDown(0.3);
      });
      
      doc.moveDown();
      
      // Add statistics section if we have data
      if (data.attendanceRecords && data.attendanceRecords.length > 0) {
        doc.fontSize(14).fillColor('#2E5BBA').text('Summary Statistics', { underline: true });
        doc.fillColor('black').fontSize(10);
        doc.moveDown(0.5);
        
        // Calculate statistics
        const totalPresent = data.attendanceRecords.reduce((sum, record) => sum + record.present, 0);
        const totalAbsent = data.attendanceRecords.reduce((sum, record) => sum + record.absent, 0);
        const totalStudents = data.attendanceRecords.reduce((sum, record) => sum + record.total, 0);
        const avgPercentage = data.attendanceRecords.reduce((sum, record) => sum + record.percentage, 0) / data.attendanceRecords.length;
        const maxPercentage = Math.max(...data.attendanceRecords.map(record => record.percentage));
        const minPercentage = Math.min(...data.attendanceRecords.map(record => record.percentage));
        
        const stats = [
          ['Total Sessions:', data.attendanceRecords.length],
          ['Total Present:', totalPresent],
          ['Total Absent:', totalAbsent],
          ['Average Attendance:', `${avgPercentage.toFixed(1)}%`],
          ['Highest Attendance:', `${maxPercentage}%`],
          ['Lowest Attendance:', `${minPercentage}%`],
          ['Overall Rate:', `${((totalPresent / totalStudents) * 100).toFixed(1)}%`]
        ];
        
        stats.forEach(([label, value]) => {
          doc.text(`${label} ${value}`, { continued: false });
          doc.moveDown(0.3);
        });
        
        doc.moveDown();
      }
      
      // Add attendance summary table
      doc.fontSize(14).fillColor('#2E5BBA').text('Attendance Summary', { underline: true });
      doc.fillColor('black').fontSize(10);
      doc.moveDown(0.5);
      
      // Define table properties
      const tableTop = doc.y + 20;
      const tableLeft = 50;
      const colWidths = [80, 60, 60, 60, 80, 80]; // Date, Present, Absent, Total, Percentage, Status
      const rowHeight = 25;
      
      // Draw table header
      doc.fillColor('#2E5BBA');
      doc.rect(tableLeft, tableTop, colWidths.reduce((a, b) => a + b, 0), rowHeight).fill();
      doc.fillColor('white');
      doc.fontSize(10).font('Helvetica-Bold');
      
      let currentX = tableLeft;
      const headers = ['Date', 'Present', 'Absent', 'Total', 'Percentage', 'Status'];
      headers.forEach((header, index) => {
        doc.text(header, currentX + 5, tableTop + 8, { width: colWidths[index] - 10, align: 'center' });
        currentX += colWidths[index];
      });
      
      // Reset colors and font
      doc.fillColor('black');
      doc.font('Helvetica');
      
      // Add attendance records
      if (data.attendanceRecords && data.attendanceRecords.length > 0) {
        console.log('Adding attendance records to PDF');
        let currentY = tableTop + rowHeight;
        
        data.attendanceRecords.forEach((record, index) => {
          console.log(`Processing record ${index + 1}/${data.attendanceRecords.length}`);
          
          // Check if we need a new page
          if (currentY > 700) {
            doc.addPage();
            currentY = 50;
          }
          
          const status = record.percentage >= 90 ? 'Excellent' : 
                        record.percentage >= 80 ? 'Good' : 
                        record.percentage >= 70 ? 'Fair' : 'Poor';
          
          // Draw row background
          if (index % 2 === 0) {
            doc.fillColor('#F8F9FA');
            doc.rect(tableLeft, currentY, colWidths.reduce((a, b) => a + b, 0), rowHeight).fill();
            doc.fillColor('black');
          }
          
          // Draw row border
          doc.strokeColor('#DEE2E6');
          doc.rect(tableLeft, currentY, colWidths.reduce((a, b) => a + b, 0), rowHeight).stroke();
          
          // Add row data
          let x = tableLeft;
          const rowData = [
            record.date,
            record.present.toString(),
            record.absent.toString(),
            record.total.toString(),
            `${record.percentage}%`,
            status
          ];
          
          rowData.forEach((text, colIndex) => {
            // Color code the status
            if (colIndex === 5) { // Status column
              if (status === 'Excellent') {
                doc.fillColor('#006600');
              } else if (status === 'Good') {
                doc.fillColor('#008800');
              } else if (status === 'Fair') {
                doc.fillColor('#CC6600');
              } else {
                doc.fillColor('#CC0000');
              }
            } else {
              doc.fillColor('black');
            }
            
            doc.text(text, x + 5, currentY + 8, { width: colWidths[colIndex] - 10, align: 'center' });
            x += colWidths[colIndex];
          });
          
          currentY += rowHeight;
        });
      } else {
        console.log('No attendance records to add to PDF');
        doc.text('No attendance records found for the selected period.', tableLeft, tableTop + rowHeight + 10);
      }
      
      // Add footer
      doc.moveDown(2);
      doc.fontSize(8).fillColor('#666666');
      doc.text('Generated by Attendance Management System', { align: 'center' });
      doc.text(`Page ${doc.bufferedPageRange().count}`, { align: 'center' });
      
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
    
    // Create workbook with ExcelJS for better formatting
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Attendance Management System';
    workbook.created = new Date();
    workbook.modified = new Date();
    
    // Add Report Info sheet
    const infoSheet = workbook.addWorksheet('Report Info');
    
    // Title
    infoSheet.mergeCells('A1:B1');
    const titleCell = infoSheet.getCell('A1');
    titleCell.value = 'Attendance Report';
    titleCell.font = { size: 18, bold: true, color: { argb: 'FF2E5BBA' } };
    titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
    
    // Add some spacing
    infoSheet.addRow([]);
    infoSheet.addRow([]);
    
    // Report details
    const details = [
      ['Course', data.courseName],
      ['Period', data.period],
      ['Generated on', new Date().toLocaleDateString()],
      ['Generated at', new Date().toLocaleTimeString()],
      ['Total Records', data.attendanceRecords?.length || 0]
    ];
    
    details.forEach(([label, value]) => {
      const row = infoSheet.addRow([label, value]);
      const labelCell = row.getCell(1);
      const valueCell = row.getCell(2);
      
      labelCell.font = { bold: true, color: { argb: 'FF2E5BBA' } };
      labelCell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFF0F0F0' }
      };
      
      valueCell.font = { color: { argb: 'FF333333' } };
    });
    
    // Set column widths
    infoSheet.getColumn(1).width = 20;
    infoSheet.getColumn(2).width = 40;
    
    // Add borders to the details section
    const detailsRange = `A3:B${3 + details.length - 1}`;
    infoSheet.getCell('A3').border = {
      top: { style: 'thin' },
      left: { style: 'thin' },
      bottom: { style: 'thin' },
      right: { style: 'thin' }
    };
    infoSheet.getCell('B3').border = {
      top: { style: 'thin' },
      left: { style: 'thin' },
      bottom: { style: 'thin' },
      right: { style: 'thin' }
    };
    
    // Add Attendance Summary sheet
    const summarySheet = workbook.addWorksheet('Attendance Summary');
    
    // Title
    summarySheet.mergeCells('A1:F1');
    const summaryTitleCell = summarySheet.getCell('A1');
    summaryTitleCell.value = 'Attendance Summary';
    summaryTitleCell.font = { size: 16, bold: true, color: { argb: 'FF2E5BBA' } };
    summaryTitleCell.alignment = { horizontal: 'center', vertical: 'middle' };
    summaryTitleCell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE8F2FF' }
    };
    
    summarySheet.addRow([]);
    
    // Headers
    const headers = ['Date', 'Present', 'Absent', 'Total', 'Percentage', 'Status'];
    const headerRow = summarySheet.addRow(headers);
    
    // Style headers
    headerRow.eachCell((cell, colNumber) => {
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF2E5BBA' }
      };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      };
    });
    
    // Add attendance data
    if (data.attendanceRecords && data.attendanceRecords.length > 0) {
      console.log('Adding attendance records to Excel');
      
      data.attendanceRecords.forEach((record, index) => {
        console.log(`Processing record ${index + 1}/${data.attendanceRecords.length}`);
        
        const status = record.percentage >= 90 ? 'Excellent' : 
                      record.percentage >= 80 ? 'Good' : 
                      record.percentage >= 70 ? 'Fair' : 'Poor';
        
        const row = summarySheet.addRow([
          record.date,
          record.present,
          record.absent,
          record.total,
          `${record.percentage}%`,
          status
        ]);
        
        // Style the row
        row.eachCell((cell, colNumber) => {
          cell.alignment = { horizontal: 'center', vertical: 'middle' };
          cell.border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' }
          };
          
          // Color code the status
          if (colNumber === 6) { // Status column
            if (status === 'Excellent') {
              cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD5F5D5' } };
              cell.font = { color: { argb: 'FF006600' } };
            } else if (status === 'Good') {
              cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE8F5E8' } };
              cell.font = { color: { argb: 'FF008800' } };
            } else if (status === 'Fair') {
              cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFF2CC' } };
              cell.font = { color: { argb: 'FFCC6600' } };
            } else {
              cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF5D5D5' } };
              cell.font = { color: { argb: 'FFCC0000' } };
            }
          }
          
          // Color code the percentage
          if (colNumber === 5) { // Percentage column
            const percentage = record.percentage;
            if (percentage >= 90) {
              cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD5F5D5' } };
            } else if (percentage >= 80) {
              cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE8F5E8' } };
            } else if (percentage >= 70) {
              cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFF2CC' } };
            } else {
              cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF5D5D5' } };
            }
          }
        });
      });
    } else {
      console.log('No attendance records to add to Excel');
      const noDataRow = summarySheet.addRow(['No attendance records found for the selected period.']);
      summarySheet.mergeCells(`A${noDataRow.number}:F${noDataRow.number}`);
      noDataRow.getCell(1).alignment = { horizontal: 'center' };
      noDataRow.getCell(1).font = { italic: true, color: { argb: 'FF666666' } };
    }
    
    // Set column widths
    summarySheet.getColumn(1).width = 15; // Date
    summarySheet.getColumn(2).width = 12; // Present
    summarySheet.getColumn(3).width = 12; // Absent
    summarySheet.getColumn(4).width = 12; // Total
    summarySheet.getColumn(5).width = 15; // Percentage
    summarySheet.getColumn(6).width = 15; // Status
    
    // Add Statistics sheet
    const statsSheet = workbook.addWorksheet('Statistics');
    
    // Title
    statsSheet.mergeCells('A1:C1');
    const statsTitleCell = statsSheet.getCell('A1');
    statsTitleCell.value = 'Attendance Statistics';
    statsTitleCell.font = { size: 16, bold: true, color: { argb: 'FF2E5BBA' } };
    statsTitleCell.alignment = { horizontal: 'center', vertical: 'middle' };
    statsTitleCell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE8F2FF' }
    };
    
    statsSheet.addRow([]);
    
    if (data.attendanceRecords && data.attendanceRecords.length > 0) {
      // Calculate statistics
      const totalPresent = data.attendanceRecords.reduce((sum, record) => sum + record.present, 0);
      const totalAbsent = data.attendanceRecords.reduce((sum, record) => sum + record.absent, 0);
      const totalStudents = data.attendanceRecords.reduce((sum, record) => sum + record.total, 0);
      const avgPercentage = data.attendanceRecords.reduce((sum, record) => sum + record.percentage, 0) / data.attendanceRecords.length;
      const maxPercentage = Math.max(...data.attendanceRecords.map(record => record.percentage));
      const minPercentage = Math.min(...data.attendanceRecords.map(record => record.percentage));
      
      const statistics = [
        ['Metric', 'Value', 'Description'],
        ['Total Sessions', data.attendanceRecords.length, 'Number of attendance sessions recorded'],
        ['Total Present', totalPresent, 'Total number of present students across all sessions'],
        ['Total Absent', totalAbsent, 'Total number of absent students across all sessions'],
        ['Total Students', totalStudents, 'Total student count across all sessions'],
        ['Average Attendance', `${avgPercentage.toFixed(1)}%`, 'Average attendance percentage'],
        ['Highest Attendance', `${maxPercentage}%`, 'Highest attendance percentage recorded'],
        ['Lowest Attendance', `${minPercentage}%`, 'Lowest attendance percentage recorded'],
        ['Overall Attendance Rate', `${((totalPresent / totalStudents) * 100).toFixed(1)}%`, 'Overall attendance rate across all sessions']
      ];
      
      statistics.forEach(([metric, value, description], index) => {
        const row = statsSheet.addRow([metric, value, description]);
        
        if (index === 0) { // Header row
          row.eachCell((cell) => {
            cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
            cell.fill = {
              type: 'pattern',
              pattern: 'solid',
              fgColor: { argb: 'FF2E5BBA' }
            };
            cell.alignment = { horizontal: 'center', vertical: 'middle' };
            cell.border = {
              top: { style: 'thin' },
              left: { style: 'thin' },
              bottom: { style: 'thin' },
              right: { style: 'thin' }
            };
          });
        } else {
          row.eachCell((cell, colNumber) => {
            cell.alignment = { horizontal: 'center', vertical: 'middle' };
            cell.border = {
              top: { style: 'thin' },
              left: { style: 'thin' },
              bottom: { style: 'thin' },
              right: { style: 'thin' }
            };
            
            if (colNumber === 1) { // Metric column
              cell.font = { bold: true, color: { argb: 'FF2E5BBA' } };
            }
          });
        }
      });
      
      // Set column widths
      statsSheet.getColumn(1).width = 25;
      statsSheet.getColumn(2).width = 20;
      statsSheet.getColumn(3).width = 50;
    } else {
      const noDataRow = statsSheet.addRow(['No data available for statistics']);
      statsSheet.mergeCells(`A${noDataRow.number}:C${noDataRow.number}`);
      noDataRow.getCell(1).alignment = { horizontal: 'center' };
      noDataRow.getCell(1).font = { italic: true, color: { argb: 'FF666666' } };
    }
    
    // Add Chart sheet if we have data
    if (data.attendanceRecords && data.attendanceRecords.length > 0) {
      const chartSheet = workbook.addWorksheet('Attendance Chart');
      
      // Title
      chartSheet.mergeCells('A1:D1');
      const chartTitleCell = chartSheet.getCell('A1');
      chartTitleCell.value = 'Attendance Trends';
      chartTitleCell.font = { size: 16, bold: true, color: { argb: 'FF2E5BBA' } };
      chartTitleCell.alignment = { horizontal: 'center', vertical: 'middle' };
      chartTitleCell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE8F2FF' }
      };
      
      chartSheet.addRow([]);
      
      // Add chart data
      const chartHeaders = ['Date', 'Present', 'Absent', 'Percentage'];
      const chartHeaderRow = chartSheet.addRow(chartHeaders);
      
      // Style chart headers
      chartHeaderRow.eachCell((cell) => {
        cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FF2E5BBA' }
        };
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        };
      });
      
      // Add chart data rows
      data.attendanceRecords.forEach((record) => {
        const row = chartSheet.addRow([
          record.date,
          record.present,
          record.absent,
          record.percentage
        ]);
        
        row.eachCell((cell, colNumber) => {
          cell.alignment = { horizontal: 'center', vertical: 'middle' };
          cell.border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' }
          };
          
          // Color code the percentage
          if (colNumber === 4) { // Percentage column
            const percentage = record.percentage;
            if (percentage >= 90) {
              cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD5F5D5' } };
            } else if (percentage >= 80) {
              cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE8F5E8' } };
            } else if (percentage >= 70) {
              cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFF2CC' } };
            } else {
              cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF5D5D5' } };
            }
          }
        });
      });
      
      // Set column widths
      chartSheet.getColumn(1).width = 15;
      chartSheet.getColumn(2).width = 12;
      chartSheet.getColumn(3).width = 12;
      chartSheet.getColumn(4).width = 15;
      
      // Add a note about the chart
      chartSheet.addRow([]);
      const noteRow = chartSheet.addRow(['Note: This data can be used to create charts in Excel. Select the data and insert a line chart to visualize attendance trends.']);
      chartSheet.mergeCells(`A${noteRow.number}:D${noteRow.number}`);
      noteRow.getCell(1).font = { italic: true, color: { argb: 'FF666666' } };
      noteRow.getCell(1).alignment = { horizontal: 'left' };
    }
    
    // Write to file
    await workbook.xlsx.writeFile(filePath);
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