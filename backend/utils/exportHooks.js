const Attendance = require('../models/Attendance');
const PDFDocument = require('pdfkit');
const ExcelJS = require('exceljs');
const fs = require('fs');
const path = require('path');
const { format } = require('date-fns');
const os = require('os');

exports.validateExportParams = (format, startDate, endDate) => {
  if (!['pdf', 'excel'].includes(format)) {
    throw new Error('Invalid format specified. Must be pdf or excel.');
  }
  
  if (!startDate || !endDate) {
    throw new Error('Start date and end date are required');
  }
  
  return {
    start: new Date(startDate),
    end: new Date(endDate)
  };
};

exports.buildExportQuery = (startDate, endDate, facultyId, courseId) => {
  const query = {
    date: { $gte: startDate, $lte: endDate },
    faculty: facultyId
  };
  
  if (courseId && courseId !== 'all') {
    query.course = courseId;
  }
  
  return query;
};

exports.getAttendanceRecordsForExport = async (query) => {
  const attendanceRecords = await Attendance.find(query)
    .populate('course', 'courseName courseCode')
    .populate({
      path: 'students.student',
      select: 'name rollNumber discipline'
    })
    .sort({ date: 1 });
  
  if (attendanceRecords.length === 0) {
    throw new Error('No attendance records found for the specified criteria');
  }
  
  return attendanceRecords;
};

exports.createTempFilePath = (format) => {
  const tempDir = os.tmpdir();
  const timestamp = new Date().getTime();
  const exportFileName = `attendance_export_${timestamp}.${format === 'pdf' ? 'pdf' : 'xlsx'}`;
  return path.join(tempDir, exportFileName);
};

exports.groupRecordsByCourse = (records) => {
  const courseGroups = {};
  
  records.forEach(record => {
    const courseId = record.course._id.toString();
    const courseName = record.course.courseName || record.course.courseCode || 'Unknown Course';
    
    if (!courseGroups[courseId]) {
      courseGroups[courseId] = {
        name: courseName,
        records: []
      };
    }
    
    courseGroups[courseId].records.push(record);
  });
  
  return courseGroups;
};

exports.calculateExportStats = (record) => {
  const totalStudents = record.students.length;
  const presentStudents = record.students.filter(s => 
    s.status === 'present' || s.status === 'Present'
  ).length;
  const attendanceRate = totalStudents > 0 
    ? Math.round((presentStudents / totalStudents) * 100) 
    : 0;
  
  return {
    totalStudents,
    presentStudents,
    attendanceRate
  };
};

exports.sortStudentsByRollNumber = (students) => {
  return [...students].sort((a, b) => {
    const aRoll = a.student?.rollNumber || '';
    const bRoll = b.student?.rollNumber || '';
    return aRoll.localeCompare(bRoll);
  });
};

exports.getStudentDisplayData = (student) => {
  const studentObj = student.student;
  const studentName = studentObj && typeof studentObj === 'object' ? (studentObj.name || 'No Name') : 'Student Object Missing';
  const rollNumber = studentObj && typeof studentObj === 'object' ? (studentObj.rollNumber || 'No Roll') : 'N/A';
  const status = student.status === 'present' || student.status === 'Present' 
    ? 'Present' 
    : 'Absent';
  
  return { studentName, rollNumber, status };
};

exports.generatePDFReport = async (records, filePath, startDate, endDate) => {
  return new Promise((resolve, reject) => {
    try {
      console.log("Generating PDF report with", records.length, "records");
      
      const doc = new PDFDocument({ margin: 50 });
      const stream = fs.createWriteStream(filePath);
      doc.pipe(stream);
      
      doc.info.Title = 'Attendance Report';
      doc.info.Author = 'Attendance Management System';
      
      doc.fontSize(20).text('Attendance Report', { align: 'center' });
      doc.moveDown();
      
      doc.fontSize(12).text(
        `Period: ${format(startDate, 'PPP')} to ${format(endDate, 'PPP')}`, 
        { align: 'center' }
      );
      doc.moveDown(2);
      
      const courseGroups = exports.groupRecordsByCourse(records);
      
      Object.values(courseGroups).forEach(course => {
        doc.fontSize(16).text(course.name, { underline: true });
        doc.moveDown();
        
        course.records.forEach(record => {
          const date = format(new Date(record.date), 'PPP');
          const stats = exports.calculateExportStats(record);
          
          doc.fontSize(12).text(`Date: ${date}`);
          doc.fontSize(12).text(`Attendance: ${stats.presentStudents}/${stats.totalStudents} (${stats.attendanceRate}%)`);
          doc.moveDown();
          
          const tableTop = doc.y;
          const tableLeft = 50;
          const colWidth = 150;
          const rowHeight = 20;
          
          doc.fontSize(10)
            .text('Roll Number', tableLeft, tableTop)
            .text('Name', tableLeft + colWidth, tableTop)
            .text('Status', tableLeft + colWidth * 2, tableTop);
          
          doc.moveTo(tableLeft, tableTop + rowHeight)
            .lineTo(tableLeft + colWidth * 3, tableTop + rowHeight)
            .stroke();
          
          let rowTop = tableTop + rowHeight;
          const sortedStudents = exports.sortStudentsByRollNumber(record.students);
          
          sortedStudents.forEach((student, i) => {
            const y = rowTop + i * rowHeight;
            
            if (y > doc.page.height - 100) {
              doc.addPage();
              rowTop = 50;
              
              doc.fontSize(10)
                .text('Roll Number', tableLeft, rowTop)
                .text('Name', tableLeft + colWidth, rowTop)
                .text('Status', tableLeft + colWidth * 2, rowTop);
              
              doc.moveTo(tableLeft, rowTop + rowHeight)
                .lineTo(tableLeft + colWidth * 3, rowTop + rowHeight)
                .stroke();
              
              rowTop += rowHeight;
            }

            const { studentName, rollNumber, status } = exports.getStudentDisplayData(student);
            const rowY = rowTop + i * rowHeight;
            
            doc.fontSize(10)
              .text(rollNumber, tableLeft, rowY)
              .text(studentName, tableLeft + colWidth, rowY)
              .text(status, tableLeft + colWidth * 2, rowY);
            
            doc.moveTo(tableLeft, rowY + rowHeight)
              .lineTo(tableLeft + colWidth * 3, rowY + rowHeight)
              .stroke();
          });
          
          doc.moveDown(2);
        });
        
        doc.addPage();
      });
      
      doc.fontSize(18).text('Attendance Summary', { align: 'center' });
      doc.moveDown();
      
      const summaryTableTop = doc.y;
      const summaryTableLeft = 50;
      const summaryColWidth = 120;
      const summaryRowHeight = 25;
      
      doc.fontSize(12)
        .text('Course', summaryTableLeft, summaryTableTop)
        .text('Sessions', summaryTableLeft + summaryColWidth, summaryTableTop)
        .text('Avg. Attendance', summaryTableLeft + summaryColWidth * 2, summaryTableTop);
      
      doc.moveTo(summaryTableLeft, summaryTableTop + summaryRowHeight)
        .lineTo(summaryTableLeft + summaryColWidth * 3, summaryTableTop + summaryRowHeight)
        .stroke();
      
      let summaryRowTop = summaryTableTop + summaryRowHeight;
      Object.values(courseGroups).forEach((course, i) => {
        const y = summaryRowTop + i * summaryRowHeight;
        
        let totalRate = 0;
        course.records.forEach(record => {
          const stats = exports.calculateExportStats(record);
          if (stats.totalStudents > 0) {
            totalRate += stats.attendanceRate;
          }
        });
        
        const avgAttendance = course.records.length > 0 
          ? Math.round(totalRate / course.records.length) 
          : 0;
        
        doc.fontSize(12)
          .text(course.name, summaryTableLeft, y)
          .text(course.records.length.toString(), summaryTableLeft + summaryColWidth, y)
          .text(`${avgAttendance}%`, summaryTableLeft + summaryColWidth * 2, y);
        
        doc.moveTo(summaryTableLeft, y + summaryRowHeight)
          .lineTo(summaryTableLeft + summaryColWidth * 3, y + summaryRowHeight)
          .stroke();
      });
      
      doc.end();
      
      stream.on('finish', () => {
        resolve(filePath);
      });
      
      stream.on('error', (err) => {
        reject(err);
      });
    } catch (err) {
      reject(err);
    }
  });
};

exports.generateExcelReport = async (records, filePath, startDate, endDate) => {
  try {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Attendance Management System';
    workbook.created = new Date();
    
    const summarySheet = workbook.addWorksheet('Summary');
    
    summarySheet.mergeCells('A1:D1');
    const titleCell = summarySheet.getCell('A1');
    titleCell.value = 'Attendance Report';
    titleCell.font = { size: 16, bold: true };
    titleCell.alignment = { horizontal: 'center' };
    
    summarySheet.mergeCells('A2:D2');
    const dateRangeCell = summarySheet.getCell('A2');
    dateRangeCell.value = `Period: ${format(startDate, 'PPP')} to ${format(endDate, 'PPP')}`;
    dateRangeCell.alignment = { horizontal: 'center' };
    
    summarySheet.addRow(['Course', 'Sessions', 'Students', 'Avg. Attendance']);
    const headerRow = summarySheet.lastRow;
    headerRow.eachCell(cell => {
      cell.font = { bold: true };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE0E0E0' }
      };
    });
    
    const courseGroups = exports.groupRecordsByCourse(records);
    
    Object.values(courseGroups).forEach(course => {
      let totalStudents = 0;
      let totalRate = 0;
      
      course.records.forEach(record => {
        const stats = exports.calculateExportStats(record);
        totalStudents = Math.max(totalStudents, stats.totalStudents);
        totalRate += stats.attendanceRate;
      });
      
      const avgAttendance = course.records.length > 0 
        ? Math.round(totalRate / course.records.length) 
        : 0;
      
      summarySheet.addRow([
        course.name,
        course.records.length,
        totalStudents,
        `${avgAttendance}%`
      ]);
    });
    
    summarySheet.columns.forEach(column => {
      column.width = 20;
    });
    
    Object.values(courseGroups).forEach(course => {
      const sheet = workbook.addWorksheet(course.name.substring(0, 31));
      
      sheet.mergeCells('A1:E1');
      const courseTitleCell = sheet.getCell('A1');
      courseTitleCell.value = course.name;
      courseTitleCell.font = { size: 14, bold: true };
      courseTitleCell.alignment = { horizontal: 'center' };
      
      let rowIndex = 3;
      
      course.records.forEach(record => {
        const date = format(new Date(record.date), 'PPP');
        const stats = exports.calculateExportStats(record);
        
        sheet.mergeCells(`A${rowIndex}:E${rowIndex}`);
        const sessionHeaderCell = sheet.getCell(`A${rowIndex}`);
        sessionHeaderCell.value = `Date: ${date} - Attendance: ${stats.presentStudents}/${stats.totalStudents} (${stats.attendanceRate}%)`;
        sessionHeaderCell.font = { bold: true };
        sessionHeaderCell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFF0F0F0' }
        };
        
        rowIndex++;
        
        const studentHeaderRow = sheet.addRow(['No.', 'Roll Number', 'Name', 'Status', 'Remarks']);
        studentHeaderRow.eachCell(cell => {
          cell.font = { bold: true };
        });
        
        rowIndex++;
        
        const sortedStudents = exports.sortStudentsByRollNumber(record.students);
        
        sortedStudents.forEach((student, i) => {
          const { studentName, rollNumber, status } = exports.getStudentDisplayData(student);
          
          sheet.addRow([
            i + 1,
            rollNumber,
            studentName,
            status,
            student.remarks || ''
          ]);
          
          rowIndex++;
        });
        
        sheet.addRow([]);
        rowIndex += 2;
      });
      
      sheet.columns.forEach(column => {
        column.width = 18;
      });
    });
    
    const studentSheet = workbook.addWorksheet('Student Overview');
    
    studentSheet.mergeCells('A1:E1');
    const studentTitleCell = studentSheet.getCell('A1');
    studentTitleCell.value = 'Student Attendance Overview';
    studentTitleCell.font = { size: 16, bold: true };
    studentTitleCell.alignment = { horizontal: 'center' };
    
    studentSheet.addRow(['Roll Number', 'Name', 'Course', 'Attendance Rate', 'Present/Total']);
    const studentHeaderRow = studentSheet.lastRow;
    studentHeaderRow.eachCell(cell => {
      cell.font = { bold: true };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE0E0E0' }
      };
    });
    
    const studentAttendanceMap = new Map();
    
    records.forEach(record => {
      const courseName = record.course.courseName || record.course.courseCode || 'Unknown Course';
      
      record.students.forEach(student => {
        const studentId = student.student?._id.toString() || 'unknown';
        const rollNumber = student.student?.rollNumber || 'N/A';
        const studentName = student.student?.name || 'Unknown';
        const status = student.status === 'present' || student.status === 'Present';
        
        if (!studentAttendanceMap.has(studentId)) {
          studentAttendanceMap.set(studentId, {
            rollNumber,
            name: studentName,
            courses: {}
          });
        }
        
        const studentData = studentAttendanceMap.get(studentId);
        
        if (!studentData.courses[courseName]) {
          studentData.courses[courseName] = {
            present: 0,
            total: 0
          };
        }
        
        studentData.courses[courseName].total++;
        if (status) {
          studentData.courses[courseName].present++;
        }
      });
    });
    
    for (const [_, studentData] of studentAttendanceMap) {
      for (const [courseName, stats] of Object.entries(studentData.courses)) {
        const attendanceRate = stats.total > 0 
          ? Math.round((stats.present / stats.total) * 100) 
          : 0;
        
        studentSheet.addRow([
          studentData.rollNumber,
          studentData.name,
          courseName,
          `${attendanceRate}%`,
          `${stats.present}/${stats.total}`
        ]);
        
        const row = studentSheet.lastRow;
        const rateCell = row.getCell(4);
        if (attendanceRate >= 90) {
          rateCell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFD5F5D5' }
          };
        } else if (attendanceRate < 75) {
          rateCell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFF5D5D5' }
          };
        }
      }
    }
    
    studentSheet.columns.forEach(column => {
      column.width = 20;
    });
    
    await workbook.xlsx.writeFile(filePath);
    return filePath;
  } catch (err) {
    console.error('Error generating Excel report:', err);
    throw err;
  }
}; 