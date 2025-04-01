const Attendance = require('../models/Attendance');
const Course = require('../models/Course');
const ImportedStudent = require('../models/ImportedStudent');
const PDFDocument = require('pdfkit');
const ExcelJS = require('exceljs');
const fs = require('fs');
const path = require('path');
const { format } = require('date-fns');
const os = require('os');

// @desc    Create attendance record for a course
// @route   POST /api/attendance
// @access  Private/Faculty,Admin
exports.createAttendance = async (req, res) => {
  try {
    console.log('Creating attendance with data:', req.body);
    console.log('User in request:', req.user ? `${req.user.name} (${req.user.role})` : 'No user found');
    
    const { course, date, students } = req.body;
    
    // Check if course ID is valid MongoDB ObjectId format
    const mongoose = require('mongoose');
    if (!mongoose.Types.ObjectId.isValid(course)) {
      console.error('Invalid course ID format:', course);
      return res.status(400).json({
        success: false,
        message: 'Invalid course ID format. Please use valid MongoDB ObjectId.'
      });
    }
    
    // Verify course exists
    const courseExists = await Course.findById(course);
    if (!courseExists) {
      console.log('Course not found with ID:', course);
      // Additional debug info
      const allCourses = await Course.find({}).select('_id courseCode courseName');
      console.log('Available courses in database:', JSON.stringify(allCourses));
      
      return res.status(404).json({ 
        success: false,
        message: 'Course not found' 
      });
    }
    
    console.log('Course found:', courseExists._id, courseExists.courseCode, courseExists.courseName);
    
    // Check if user is instructor of the course or admin
    const userId = req.user.id || req.user._id;
    console.log('User ID:', userId);
    console.log('Course faculty:', courseExists.faculty);
    console.log('Course instructor:', courseExists.instructor);
    
    // Check against both faculty and instructor fields for compatibility
    const isInstructor = (courseExists.faculty && courseExists.faculty.toString() === userId.toString()) || 
                        (courseExists.instructor && courseExists.instructor.toString() === userId.toString());
    
    if (req.user.role !== 'admin' && !isInstructor) {
      // More lenient check during development
      console.log('User is not the instructor of this course, but proceeding anyway for testing');
      // In production, you would return an error here
    }
    
    // Format the date correctly
    const formattedDate = new Date(date);
    
    // Check for existing attendance on same date
    console.log(`Checking for existing attendance on date: ${formattedDate}`);
    const startOfDay = new Date(formattedDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(formattedDate);
    endOfDay.setHours(23, 59, 59, 999);

    console.log(`Date range: ${startOfDay.toISOString()} to ${endOfDay.toISOString()}`);

    const existingAttendance = await Attendance.findOne({
      course,
      date: {
        $gte: startOfDay,
        $lt: endOfDay
      }
    });

    console.log(`Existing attendance found: ${existingAttendance ? 'Yes' : 'No'}`);
    if (existingAttendance) {
      console.log(`Existing attendance ID: ${existingAttendance._id}`);
    }
    
    // If attendance exists, update it instead of creating a new one
    if (existingAttendance) {
      console.log('Attendance exists for this date, updating instead');
      
      // Process the student records
      const studentRecords = [];
      
      for (const studentData of students) {
        try {
          // Validate the student ID is a valid ObjectId
          if (!mongoose.Types.ObjectId.isValid(studentData.student)) {
            console.log('Invalid student ID, checking if student exists by roll number:', studentData);
            
            // Get roll number, name and discipline from student data
            const rollNumber = studentData.rollNumber || `AUTO-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
            const name = studentData.name || 'Unknown';
            const discipline = studentData.discipline || 'Not Specified';
            
            console.log(`Processing student with complete details - name: ${name}, roll: ${rollNumber}, discipline: ${discipline} for course: ${course}`);
            
            // Try to find student by roll number first
            let student = null;
            try {
              student = await ImportedStudent.findOne({ rollNumber: rollNumber });
              
              if (student) {
                console.log(`Found existing student with roll number: ${rollNumber}, ID: ${student._id}`);
                
                // Only update if the existing data is placeholder and new data is better
                let needsUpdate = false;
                
                // Update name if existing is a placeholder
                if (name && name !== 'Unknown' && 
                    (student.name === 'Unknown' || student.name === 'Student')) {
                  student.name = name;
                  needsUpdate = true;
                  console.log(`Updating student name to: ${name}`);
                }
                
                // Update discipline if existing is default
                if (discipline && discipline !== 'Not Specified' && 
                    student.discipline === 'Not Specified') {
                  student.discipline = discipline;
                  needsUpdate = true;
                  console.log(`Updating student discipline to: ${discipline}`);
                }
                
                // Make sure student is associated with this course
                if (!student.courses.includes(course)) {
                  student.courses.push(course);
                  needsUpdate = true;
                  console.log(`Adding course ${course} to student ${student._id}`);
                }
                
                // Save updates if needed
                if (needsUpdate) {
                  await student.save();
                  console.log(`Updated student data for ${student._id}`);
                }
              } else {
                // Create a new student with complete details
                student = await ImportedStudent.create({
                  name: name,
                  rollNumber: rollNumber,
                  discipline: discipline,
                  courses: [course]
                });
                console.log(`Created new student with roll number: ${rollNumber}, ID: ${student._id}`);
              }
              
              const studentRecord = {
                student: student._id,
                studentModel: 'ImportedStudent',
                status: studentData.status.toLowerCase(),
                remarks: studentData.remarks || ''
              };
              
              studentRecords.push(studentRecord);
              
              // Update attendance stats
              await ImportedStudent.updateAttendanceStats(
                student._id,
                course,
                studentData.status.toLowerCase()
              );
            } catch (error) {
              console.error('Error finding/creating student by roll number:', error);
              
              // Fallback to creating a new student
              const newStudentId = new mongoose.Types.ObjectId();
              
              // Update studentRecord with valid ID
              const studentRecord = {
                student: newStudentId,
                studentModel: 'ImportedStudent',
                status: studentData.status.toLowerCase(),
                remarks: studentData.remarks || ''
              };
              
              studentRecords.push(studentRecord);
              
              // Create a new student in the database with proper details
              try {
                // Create new student with all available details
                const newStudent = await ImportedStudent.create({
                  _id: newStudentId,
                  name: name,
                  rollNumber: rollNumber,
                  discipline: discipline,
                  courses: [course]
                });
                
                console.log('Created student with ID:', newStudentId);
                
                // Update attendance stats
                await ImportedStudent.updateAttendanceStats(
                  newStudentId,
                  course,
                  studentData.status.toLowerCase()
                );
              } catch (error) {
                console.error('Error creating student:', error);
              }
            }
          } else {
            // ID is a valid ObjectId, proceed normally
            const studentRecord = {
              student: studentData.student,
              studentModel: 'ImportedStudent',
              status: studentData.status.toLowerCase(),
              remarks: studentData.remarks || ''
            };
            
            studentRecords.push(studentRecord);
            
            // Ensure real student data is stored in the database
            try {
              // Look up existing student by ID first
              let student = await ImportedStudent.findById(studentData.student);
              
              if (!student) {
                // If student ID isn't found, try to find by roll number if provided
                if (studentData.rollNumber && studentData.rollNumber !== 'Unknown') {
                  student = await ImportedStudent.findOne({ rollNumber: studentData.rollNumber });
                  
                  if (student) {
                    console.log(`Found student by roll number: ${studentData.rollNumber} instead of ID: ${studentData.student}`);
                    // Update the student record to use the correct ID
                    studentRecord.student = student._id;
                  }
                }
                
                // If still no student found, check if it's a User object
                if (!student) {
                  const User = require('../models/User');
                  const userStudent = await User.findById(studentData.student);
                  
                  if (userStudent) {
                    console.log('Student found in User collection:', userStudent.name);
                    // Update the record to use User model
                    studentRecord.studentModel = 'User';
                  } else {
                    // Create a new student record with the provided details
                    const name = studentData.name || 'Unknown';
                    const rollNumber = studentData.rollNumber || `AUTO-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
                    const discipline = studentData.discipline || 'Not Specified';
                    
                    console.log(`Creating new student with ID=${studentData.student}, name=${name}, roll=${rollNumber}`);
                    
                    student = await ImportedStudent.create({
                      _id: studentData.student,
                      name: name,
                      rollNumber: rollNumber,
                      discipline: discipline,
                      courses: [course]
                    });
                    
                    console.log(`Created new student with ID: ${student._id}, name: ${name}`);
                  }
                }
              } else {
                // Existing student found - update if we have better data
                let needsUpdate = false;
                
                // Update name if existing is placeholder and we have better data
                if (studentData.name && studentData.name !== 'Unknown' && 
                    (student.name === 'Unknown' || student.name === 'Student')) {
                  student.name = studentData.name;
                  needsUpdate = true;
                  console.log(`Updating student ${student._id} name to: ${studentData.name}`);
                }
                
                // Update roll number if existing is AUTO and we have better data
                if (studentData.rollNumber && studentData.rollNumber !== 'Unknown' && 
                    !studentData.rollNumber.startsWith('AUTO-') && 
                    student.rollNumber && student.rollNumber.startsWith('AUTO-')) {
                  student.rollNumber = studentData.rollNumber;
                  needsUpdate = true;
                  console.log(`Updating student ${student._id} roll number to: ${studentData.rollNumber}`);
                }
                
                // Update discipline if existing is default and we have better data
                if (studentData.discipline && studentData.discipline !== 'Not Specified' && 
                    student.discipline === 'Not Specified') {
                  student.discipline = studentData.discipline;
                  needsUpdate = true;
                  console.log(`Updating student ${student._id} discipline to: ${studentData.discipline}`);
                }
                
                // Ensure course association
                if (!student.courses.includes(course)) {
                  student.courses.push(course);
                  needsUpdate = true;
                  console.log(`Adding course ${course} to student ${student._id}`);
                }
                
                // Save changes if needed
                if (needsUpdate) {
                  await student.save();
                  console.log(`Updated student ${student._id} with better data`);
                }
              }
              
              // Update attendance stats if we have a valid student
              if (student) {
                await ImportedStudent.updateAttendanceStats(
                  student._id,
                  course,
                  studentData.status.toLowerCase()
                );
              }
            } catch (error) {
              console.error('Error processing student data:', error);
            }
          }
        } catch (error) {
          console.error('Error handling student data:', error);
          // Continue with other students
        }
      }
      
      // Update the existing attendance record
      existingAttendance.students = studentRecords;
      existingAttendance.lastUpdated = Date.now();
      await existingAttendance.save();
      
      // Populate student data for the response
      await existingAttendance.populate({
        path: 'students.student',
        select: 'name rollNumber discipline department semester email courses'
      });
      
      // Convert to plain object and add direct student fields
      const responseAttendance = existingAttendance.toObject();
      responseAttendance.students = responseAttendance.students.map(student => {
        if (student.student && typeof student.student === 'object') {
          return {
            ...student,
            name: student.student.name || 'Unknown',
            rollNumber: student.student.rollNumber || 'Unknown',
            discipline: student.student.discipline || 'Not Specified'
          };
        }
        return student;
      });
      
      return res.status(200).json({
        success: true,
        message: 'Attendance updated successfully',
        data: responseAttendance
      });
    }
    
    // Process students and prepare attendance records
    const studentRecords = [];
    
    // Format each student for attendance
    for (const studentData of students) {
      try {
        // Validate the student ID is a valid ObjectId
        if (!mongoose.Types.ObjectId.isValid(studentData.student)) {
          console.log('Invalid student ID, checking if student exists by roll number:', studentData);
          
          // Get roll number, name and discipline from student data
          const rollNumber = studentData.rollNumber || `AUTO-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
          const name = studentData.name || 'Unknown';
          const discipline = studentData.discipline || 'Not Specified';
          
          console.log(`Processing student with complete details - name: ${name}, roll: ${rollNumber}, discipline: ${discipline} for course: ${course}`);
          
          // Try to find student by roll number first
          let student = null;
          try {
            student = await ImportedStudent.findOne({ rollNumber: rollNumber });
            
            if (student) {
              console.log(`Found existing student with roll number: ${rollNumber}, ID: ${student._id}`);
              
              // Only update if the existing data is placeholder and new data is better
              let needsUpdate = false;
              
              // Update name if existing is a placeholder
              if (name && name !== 'Unknown' && 
                  (student.name === 'Unknown' || student.name === 'Student')) {
                student.name = name;
                needsUpdate = true;
                console.log(`Updating student name to: ${name}`);
              }
              
              // Update discipline if existing is default
              if (discipline && discipline !== 'Not Specified' && 
                  student.discipline === 'Not Specified') {
                student.discipline = discipline;
                needsUpdate = true;
                console.log(`Updating student discipline to: ${discipline}`);
              }
              
              // Make sure student is associated with this course
              if (!student.courses.includes(course)) {
                student.courses.push(course);
                needsUpdate = true;
                console.log(`Adding course ${course} to student ${student._id}`);
              }
              
              // Save updates if needed
              if (needsUpdate) {
                await student.save();
                console.log(`Updated student data for ${student._id}`);
              }
            } else {
              // Create a new student with complete details
              student = await ImportedStudent.create({
                name: name,
                rollNumber: rollNumber,
                discipline: discipline,
                courses: [course]
              });
              console.log(`Created new student with roll number: ${rollNumber}, ID: ${student._id}`);
            }
            
            const studentRecord = {
              student: student._id,
              studentModel: 'ImportedStudent',
              status: studentData.status.toLowerCase(),
              remarks: studentData.remarks || ''
            };
            
            studentRecords.push(studentRecord);
            
            // Update attendance stats
            await ImportedStudent.updateAttendanceStats(
              student._id,
              course,
              studentData.status.toLowerCase()
            );
          } catch (error) {
            console.error('Error finding/creating student by roll number:', error);
            
            // Fallback to creating a new student
            const newStudentId = new mongoose.Types.ObjectId();
            
            // Update studentRecord with valid ID
            const studentRecord = {
              student: newStudentId,
              studentModel: 'ImportedStudent',
              status: studentData.status.toLowerCase(),
              remarks: studentData.remarks || ''
            };
            
            studentRecords.push(studentRecord);
            
            // Create a new student in the database with proper details
            try {
              // Create new student with all available details
              const newStudent = await ImportedStudent.create({
                _id: newStudentId,
                name: name,
                rollNumber: rollNumber,
                discipline: discipline,
                courses: [course]
              });
              
              console.log('Created student with ID:', newStudentId);
              
              // Update attendance stats
              await ImportedStudent.updateAttendanceStats(
                newStudentId,
                course,
                studentData.status.toLowerCase()
              );
            } catch (error) {
              console.error('Error creating student:', error);
            }
          }
        } else {
          // ID is a valid ObjectId, proceed normally
          const studentRecord = {
            student: studentData.student,
            studentModel: 'ImportedStudent',
            status: studentData.status.toLowerCase(),
            remarks: studentData.remarks || ''
          };
          
          studentRecords.push(studentRecord);
          
          // Ensure real student data is stored in the database
          try {
            // Look up existing student by ID first
            let student = await ImportedStudent.findById(studentData.student);
            
            if (!student) {
              // If student ID isn't found, try to find by roll number if provided
              if (studentData.rollNumber && studentData.rollNumber !== 'Unknown') {
                student = await ImportedStudent.findOne({ rollNumber: studentData.rollNumber });
                
                if (student) {
                  console.log(`Found student by roll number: ${studentData.rollNumber} instead of ID: ${studentData.student}`);
                  // Update the student record to use the correct ID
                  studentRecord.student = student._id;
                }
              }
              
              // If still no student found, check if it's a User object
              if (!student) {
                const User = require('../models/User');
                const userStudent = await User.findById(studentData.student);
                
                if (userStudent) {
                  console.log('Student found in User collection:', userStudent.name);
                  // Update the record to use User model
                  studentRecord.studentModel = 'User';
                } else {
                  // Create a new student record with the provided details
                  const name = studentData.name || 'Unknown';
                  const rollNumber = studentData.rollNumber || `AUTO-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
                  const discipline = studentData.discipline || 'Not Specified';
                  
                  console.log(`Creating new student with ID=${studentData.student}, name=${name}, roll=${rollNumber}`);
                  
                  student = await ImportedStudent.create({
                    _id: studentData.student,
                    name: name,
                    rollNumber: rollNumber,
                    discipline: discipline,
                    courses: [course]
                  });
                  
                  console.log(`Created new student with ID: ${student._id}, name: ${name}`);
                }
              }
            } else {
              // Existing student found - update if we have better data
              let needsUpdate = false;
              
              // Update name if existing is placeholder and we have better data
              if (studentData.name && studentData.name !== 'Unknown' && 
                  (student.name === 'Unknown' || student.name === 'Student')) {
                student.name = studentData.name;
                needsUpdate = true;
                console.log(`Updating student ${student._id} name to: ${studentData.name}`);
              }
              
              // Update roll number if existing is AUTO and we have better data
              if (studentData.rollNumber && studentData.rollNumber !== 'Unknown' && 
                  !studentData.rollNumber.startsWith('AUTO-') && 
                  student.rollNumber && student.rollNumber.startsWith('AUTO-')) {
                student.rollNumber = studentData.rollNumber;
                needsUpdate = true;
                console.log(`Updating student ${student._id} roll number to: ${studentData.rollNumber}`);
              }
              
              // Update discipline if existing is default and we have better data
              if (studentData.discipline && studentData.discipline !== 'Not Specified' && 
                  student.discipline === 'Not Specified') {
                student.discipline = studentData.discipline;
                needsUpdate = true;
                console.log(`Updating student ${student._id} discipline to: ${studentData.discipline}`);
              }
              
              // Ensure course association
              if (!student.courses.includes(course)) {
                student.courses.push(course);
                needsUpdate = true;
                console.log(`Adding course ${course} to student ${student._id}`);
              }
              
              // Save changes if needed
              if (needsUpdate) {
                await student.save();
                console.log(`Updated student ${student._id} with better data`);
              }
            }
            
            // Update attendance stats if we have a valid student
            if (student) {
              await ImportedStudent.updateAttendanceStats(
                student._id,
                course,
                studentData.status.toLowerCase()
              );
            }
          } catch (error) {
            console.error('Error processing student data:', error);
          }
        }
      } catch (error) {
        console.error('Error handling student data:', error);
        // Continue with other students
      }
    }
    
    // Create attendance record
    const attendance = await Attendance.create({
      course,
      date: new Date(date),
      students: studentRecords,
      faculty: userId
    });
    
    console.log('Attendance record created successfully:', attendance._id);
    
    // Populate student data for immediate access in frontend
    await attendance.populate({
      path: 'students.student',
      select: 'name rollNumber discipline department semester email courses'
    });
    
    // Convert to plain object and add direct student fields
    const responseAttendance = attendance.toObject();
    responseAttendance.students = responseAttendance.students.map(student => {
      if (student.student && typeof student.student === 'object') {
        return {
          ...student,
          name: student.student.name || 'Unknown',
          rollNumber: student.student.rollNumber || 'Unknown',
          discipline: student.student.discipline || 'Not Specified'
        };
      }
      return student;
    });
    
    res.status(201).json({
      success: true,
      data: responseAttendance
    });
  } catch (error) {
    console.error('Attendance creation error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server Error', 
      error: error.message 
    });
  }
};

// @desc    Get attendance records for a course
// @route   GET /api/attendance/course/:courseId
// @access  Private
exports.getCourseAttendance = async (req, res) => {
  try {
    const courseId = req.params.courseId;
    
    // Verify course exists
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }
    
    // Check authorization
    if (
      req.user.role === 'student' && 
      !course.students.includes(req.user.id)
    ) {
      return res.status(403).json({ message: 'Not enrolled in this course' });
    }
    
    // Get attendance records
    const attendanceRecords = await Attendance.find({ course: courseId })
      .populate({
        path: 'students.student',
        select: 'name rollNumber discipline department semester email courses'
      })
      .populate('faculty', 'name')
      .sort({ date: -1 });
    
    // Process records to include student details directly
    const processedRecords = attendanceRecords.map(record => {
      // Convert to plain object to allow modification
      const plainRecord = record.toObject();
      
      // Process each student entry to include direct access fields
      plainRecord.students = plainRecord.students.map(studentEntry => {
        // If student object is populated, copy key details to the main record level
        if (studentEntry.student && typeof studentEntry.student === 'object') {
          return {
            ...studentEntry,
            // Add these fields directly on the student record for easy access
            name: studentEntry.student.name || 'Unknown',
            rollNumber: studentEntry.student.rollNumber || 'Unknown',
            discipline: studentEntry.student.discipline || 'Not Specified'
          };
        }
        return studentEntry;
      });
      
      return plainRecord;
    });
    
    res.json({
      success: true,
      count: attendanceRecords.length,
      data: processedRecords
    });
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Get student's attendance across all courses
// @route   GET /api/attendance/student/:studentId
// @access  Private/Admin,Faculty or Student (self)
exports.getStudentAttendance = async (req, res) => {
  try {
    const studentId = req.params.studentId;
    
    // Students can only access their own attendance
    if (req.user.role === 'student' && req.user.id !== studentId) {
      return res.status(403).json({ message: 'Not authorized to view this data' });
    }
    
    // Find all attendance records that include this student
    const attendanceRecords = await Attendance.find({
      'students.student': studentId
    })
      .populate('course', 'name code')
      .populate('faculty', 'name');
    
    // Get student's attendance summary
    const student = await ImportedStudent.findById(studentId).select('attendanceStats');
    
    res.json({
      success: true,
      count: attendanceRecords.length,
      data: {
        records: attendanceRecords,
        stats: student?.attendanceStats || []
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Update attendance record
// @route   PUT /api/attendance/:id
// @access  Private/Admin,Faculty (owner)
exports.updateAttendance = async (req, res) => {
  try {
    let attendance = await Attendance.findById(req.params.id);
    
    if (!attendance) {
      return res.status(404).json({ message: 'Attendance record not found' });
    }
    
    // Only the creator or admin can update
    if (attendance.faculty.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to update this record' });
    }
    
    // Get current student statuses to track changes
    const previousStatuses = {};
    attendance.students.forEach(record => {
      previousStatuses[record.student.toString()] = record.status;
    });
    
    // Update student records if needed
    if (req.body.students && Array.isArray(req.body.students)) {
      // Identify and update AUTO-generated student records
      for (const studentRecord of req.body.students) {
        const studentId = studentRecord.student;
        
        try {
          // First check if this student exists and has an AUTO roll number
          const student = await ImportedStudent.findById(studentId);
          
          if (student && student.rollNumber && student.rollNumber.startsWith('AUTO-')) {
            // If student has real details now, update them
            if (studentRecord.name && studentRecord.name !== 'Student') {
              student.name = studentRecord.name;
            }
            
            if (studentRecord.rollNumber && !studentRecord.rollNumber.startsWith('AUTO-')) {
              student.rollNumber = studentRecord.rollNumber;
            }
            
            // Save if changes were made
            if (student.isModified()) {
              await student.save();
              console.log(`Updated student ${studentId} with real info`);
            }
          }
        } catch (error) {
          console.error(`Error checking/updating student ${studentId}:`, error);
        }
      }
    }
    
    // Update the record
    const updatedAttendance = await Attendance.findByIdAndUpdate(
      req.params.id, 
      {
        ...req.body,
        lastUpdated: Date.now()
      }, 
      {
        new: true,
        runValidators: true
      }
    ).populate({
      path: 'students.student',
      select: 'name rollNumber discipline'
    });
    
    // Update attendance stats for each student if status changed
    if (req.body.students && Array.isArray(req.body.students)) {
      for (const studentRecord of req.body.students) {
        const studentId = studentRecord.student;
        const newStatus = studentRecord.status;
        const oldStatus = previousStatuses[studentId];
        
        // Only update stats if status changed
        if (oldStatus && newStatus && oldStatus !== newStatus) {
          try {
            // Decrement old status count, increment new status count
            await ImportedStudent.findByIdAndUpdate(
              studentId,
              {
                $inc: {
                  [`attendanceStats.$[elem].${oldStatus}`]: -1,
                  [`attendanceStats.$[elem].${newStatus}`]: 1
                }
              },
              {
                arrayFilters: [{ "elem.course": attendance.course }]
              }
            );
            
            // Also update percentage
            const student = await ImportedStudent.findById(studentId);
            if (student) {
              const stats = student.attendanceStats.find(
                stat => stat.course.toString() === attendance.course.toString()
              );
              if (stats) {
                stats.percentage = (stats.present / stats.total) * 100;
                await student.save();
              }
            }
          } catch (error) {
            console.error('Error updating attendance stats:', error);
          }
        }
      }
    }
    
    // Convert to plain object and add direct student fields
    const responseAttendance = updatedAttendance.toObject();
    responseAttendance.students = responseAttendance.students.map(student => {
      if (student.student && typeof student.student === 'object') {
        return {
          ...student,
          name: student.student.name || 'Unknown',
          rollNumber: student.student.rollNumber || 'Unknown',
          discipline: student.student.discipline || 'Not Specified'
        };
      }
      return student;
    });
    
    res.json({
      success: true,
      data: responseAttendance
    });
  } catch (error) {
    console.error('Update attendance error:', error);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Get attendance records with optional filtering
// @route   GET /api/attendance
// @access  Private
exports.getAttendance = async (req, res) => {
  try {
    console.log('Get attendance query params:', req.query);
    const { course, date, startDate, endDate } = req.query;
    
    // Build filter object
    const filter = {};
    
    if (course) {
      filter.course = course;
    }
    
    // Date filtering
    if (date) {
      // For exact date matches, find records for that day
      const targetDate = new Date(date);
      
      // Set time to start of day and end of day
      const startOfDay = new Date(targetDate);
      startOfDay.setHours(0, 0, 0, 0);
      
      const endOfDay = new Date(targetDate);
      endOfDay.setHours(23, 59, 59, 999);
      
      filter.date = {
        $gte: startOfDay,
        $lte: endOfDay
      };
      
      console.log('Date filter:', filter.date);
    } else if (startDate && endDate) {
      // Date range filtering
      filter.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }
    
    console.log('Executing attendance query with filter:', filter);
    
    // Execute query
    const attendanceRecords = await Attendance.find(filter)
      .populate({
        path: 'students.student',
        select: 'name rollNumber discipline department semester email courses'
      })
      .populate('faculty', 'name email')
      .populate('course', 'courseName courseCode')
      .sort({ date: -1 });
    
    // Process records to include student details directly in each record for easier frontend access
    const processedRecords = attendanceRecords.map(record => {
      // Convert to plain object to allow modification
      const plainRecord = record.toObject();
      
      // Process each student entry to include direct access fields
      plainRecord.students = plainRecord.students.map(studentEntry => {
        // If student object is populated, copy key details to the main record level
        if (studentEntry.student && typeof studentEntry.student === 'object') {
          return {
            ...studentEntry,
            // Add these fields directly on the student record for easy access
            name: studentEntry.student.name,
            rollNumber: studentEntry.student.rollNumber,
            discipline: studentEntry.student.discipline || 'Not Specified'
          };
        }
        return studentEntry;
      });
      
      return plainRecord;
    });
    
    console.log(`Found ${attendanceRecords.length} attendance records`);
    
    // Return results
    res.status(200).json({
      success: true,
      count: attendanceRecords.length,
      data: processedRecords
    });
  } catch (error) {
    console.error('Error getting attendance records:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error retrieving attendance records', 
      error: error.message 
    });
  }
};

// @desc    Export attendance records as PDF or Excel
// @route   GET /api/attendance/export
// @access  Private/Faculty,Admin
exports.exportAttendance = async (req, res) => {
  try {
    console.log('Export attendance request received:', req.query);
    const { format, startDate, endDate, courseId } = req.query;
    const facultyId = req.user.id;
    
    // Validate input
    if (!['pdf', 'excel'].includes(format)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid format specified. Must be pdf or excel.'
      });
    }
    
    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'Start date and end date are required'
      });
    }
    
    // Parse dates
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    // Build query
    const query = {
      date: { $gte: start, $lte: end },
      faculty: facultyId
    };
    
    // Add course filter if specified
    if (courseId && courseId !== 'all') {
      query.course = courseId;
    }
    
    // Get attendance records
    const attendanceRecords = await Attendance.find(query)
      .populate('course', 'courseName courseCode')
      .populate({
        path: 'students.student',
        select: 'name rollNumber discipline'
      })
      .sort({ date: 1 });
    
    console.log(`Found ${attendanceRecords.length} attendance records for export`);
    
    if (attendanceRecords.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No attendance records found for the specified criteria'
      });
    }
    
    // Create temporary file path
    const tempDir = os.tmpdir();
    const timestamp = new Date().getTime();
    const exportFileName = `attendance_export_${timestamp}.${format === 'pdf' ? 'pdf' : 'xlsx'}`;
    const filePath = path.join(tempDir, exportFileName);
    
    // Generate report based on format
    if (format === 'pdf') {
      await generatePDFReport(attendanceRecords, filePath, start, end);
    } else {
      await generateExcelReport(attendanceRecords, filePath, start, end);
    }
    
    // Send file
    res.download(filePath, exportFileName, (err) => {
      if (err) {
        console.error('Error sending file:', err);
        // File couldn't be downloaded
        if (!res.headersSent) {
          res.status(500).json({
            success: false,
            message: 'Error downloading file',
            error: err.message
          });
        }
      }
      
      // Delete the temporary file after sending
      fs.unlink(filePath, (unlinkErr) => {
        if (unlinkErr) {
          console.error('Error deleting temporary file:', unlinkErr);
        }
      });
    });
  } catch (error) {
    console.error('Error exporting attendance:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// @desc    Delete attendance record
// @route   DELETE /api/attendance/:id
// @access  Private/Faculty,Admin
exports.deleteAttendance = async (req, res) => {
  try {
    const attendance = await Attendance.findById(req.params.id);
    
    if (!attendance) {
      return res.status(404).json({
        success: false,
        message: 'Attendance record not found'
      });
    }
    
    // Only the creator or admin can delete
    if (attendance.faculty.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this record'
      });
    }
    
    await attendance.deleteOne();
    
    res.status(200).json({
      success: true,
      message: 'Attendance record deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting attendance record:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// Helper function to generate PDF report
async function generatePDFReport(records, filePath, startDate, endDate) {
  return new Promise((resolve, reject) => {
    try {
      console.log("Generating PDF report with", records.length, "records");
      
      // Debug record structure
      if (records.length > 0) {
        const sampleRecord = records[0];
        console.log("Sample record structure:", JSON.stringify({
          date: sampleRecord.date,
          course: {
            id: sampleRecord.course._id,
            name: sampleRecord.course.courseName,
            code: sampleRecord.course.courseCode
          },
          totalStudents: sampleRecord.students.length
        }, null, 2));
        
        // Debug student data
        if (sampleRecord.students.length > 0) {
          const sampleStudent = sampleRecord.students[0];
          console.log("Sample student data:", JSON.stringify({
            studentObject: sampleStudent.student ? "exists" : "missing",
            studentData: sampleStudent.student ? {
              id: sampleStudent.student._id,
              name: sampleStudent.student.name,
              rollNumber: sampleStudent.student.rollNumber,
              discipline: sampleStudent.student.discipline
            } : null,
            status: sampleStudent.status
          }, null, 2));
        }
      }
      
      // Create a new PDF document
      const doc = new PDFDocument({ margin: 50 });
      
      // Pipe output to file
      const stream = fs.createWriteStream(filePath);
      doc.pipe(stream);
      
      // Add metadata
      doc.info.Title = 'Attendance Report';
      doc.info.Author = 'Attendance Management System';
      
      // Add header
      doc.fontSize(20).text('Attendance Report', { align: 'center' });
      doc.moveDown();
      
      // Add date range
      doc.fontSize(12).text(
        `Period: ${format(startDate, 'PPP')} to ${format(endDate, 'PPP')}`, 
        { align: 'center' }
      );
      doc.moveDown(2);
      
      // Group records by course
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
      
      // Process each course
      Object.values(courseGroups).forEach(course => {
        // Course heading
        doc.fontSize(16).text(course.name, { underline: true });
        doc.moveDown();
        
        // Process each attendance record
        course.records.forEach(record => {
          const date = format(new Date(record.date), 'PPP');
          const totalStudents = record.students.length;
          const presentStudents = record.students.filter(s => 
            s.status === 'present' || s.status === 'Present').length;
          const attendanceRate = totalStudents > 0 
            ? Math.round((presentStudents / totalStudents) * 100) 
            : 0;
          
          doc.fontSize(12).text(`Date: ${date}`);
          doc.fontSize(12).text(`Attendance: ${presentStudents}/${totalStudents} (${attendanceRate}%)`);
          doc.moveDown();
          
          // Create a table for students
          const tableTop = doc.y;
          const tableLeft = 50;
          const colWidth = 150;
          const rowHeight = 20;
          
          // Table headers
          doc.fontSize(10)
            .text('Roll Number', tableLeft, tableTop)
            .text('Name', tableLeft + colWidth, tableTop)
            .text('Status', tableLeft + colWidth * 2, tableTop);
          
          doc.moveTo(tableLeft, tableTop + rowHeight)
            .lineTo(tableLeft + colWidth * 3, tableTop + rowHeight)
            .stroke();
          
          // Table rows
          let rowTop = tableTop + rowHeight;
          
          // Sort students by roll number
          const sortedStudents = [...record.students].sort((a, b) => {
            const aRoll = a.student?.rollNumber || '';
            const bRoll = b.student?.rollNumber || '';
            return aRoll.localeCompare(bRoll);
          });
          
          // Debug first few students in this record
          console.log(`Students for record on ${date}:`);
          sortedStudents.slice(0, 3).forEach((student, i) => {
            console.log(`Student ${i+1}:`, {
              studentExists: !!student.student,
              name: student.student?.name || "No name property",
              rollNumber: student.student?.rollNumber || "No rollNumber property",
              studentObject: student.student ? Object.keys(student.student) : "No student object",
              status: student.status
            });
          });
          
          sortedStudents.forEach((student, i) => {
            const y = rowTop + i * rowHeight;
            
            // Check if we need a new page
            if (y > doc.page.height - 100) {
              doc.addPage();
              rowTop = 50;
              
              // Add headers on new page
              doc.fontSize(10)
                .text('Roll Number', tableLeft, rowTop)
                .text('Name', tableLeft + colWidth, rowTop)
                .text('Status', tableLeft + colWidth * 2, rowTop);
              
              doc.moveTo(tableLeft, rowTop + rowHeight)
                .lineTo(tableLeft + colWidth * 3, rowTop + rowHeight)
                .stroke();
              
              rowTop += rowHeight;
            }

            // Improved debug output and error handling for student data
            const studentObj = student.student;
            const studentName = studentObj && typeof studentObj === 'object' ? (studentObj.name || 'No Name') : 'Student Object Missing';
            const rollNumber = studentObj && typeof studentObj === 'object' ? (studentObj.rollNumber || 'No Roll') : 'N/A';
            const status = student.status === 'present' || student.status === 'Present' 
              ? 'Present' 
              : 'Absent';
            
            const rowY = rowTop + i * rowHeight;
            
            doc.fontSize(10)
              .text(rollNumber, tableLeft, rowY)
              .text(studentName, tableLeft + colWidth, rowY)
              .text(status, tableLeft + colWidth * 2, rowY);
            
            // Draw row divider
            doc.moveTo(tableLeft, rowY + rowHeight)
              .lineTo(tableLeft + colWidth * 3, rowY + rowHeight)
              .stroke();
          });
          
          doc.moveDown(2);
        });
        
        // Add page break between courses
        doc.addPage();
      });
      
      // Add summary page
      doc.fontSize(18).text('Attendance Summary', { align: 'center' });
      doc.moveDown();
      
      // Create summary table
      const summaryTableTop = doc.y;
      const summaryTableLeft = 50;
      const summaryColWidth = 120;
      const summaryRowHeight = 25;
      
      // Table headers
      doc.fontSize(12)
        .text('Course', summaryTableLeft, summaryTableTop)
        .text('Sessions', summaryTableLeft + summaryColWidth, summaryTableTop)
        .text('Avg. Attendance', summaryTableLeft + summaryColWidth * 2, summaryTableTop);
      
      doc.moveTo(summaryTableLeft, summaryTableTop + summaryRowHeight)
        .lineTo(summaryTableLeft + summaryColWidth * 3, summaryTableTop + summaryRowHeight)
        .stroke();
      
      // Summary rows
      let summaryRowTop = summaryTableTop + summaryRowHeight;
      Object.values(courseGroups).forEach((course, i) => {
        const y = summaryRowTop + i * summaryRowHeight;
        
        // Calculate average attendance for the course
        let totalRate = 0;
        course.records.forEach(record => {
          const totalStudents = record.students.length;
          const presentStudents = record.students.filter(s => 
            s.status === 'present' || s.status === 'Present').length;
          
          if (totalStudents > 0) {
            totalRate += (presentStudents / totalStudents) * 100;
          }
        });
        
        const avgAttendance = course.records.length > 0 
          ? Math.round(totalRate / course.records.length) 
          : 0;
        
        doc.fontSize(12)
          .text(course.name, summaryTableLeft, y)
          .text(course.records.length.toString(), summaryTableLeft + summaryColWidth, y)
          .text(`${avgAttendance}%`, summaryTableLeft + summaryColWidth * 2, y);
        
        // Draw row divider
        doc.moveTo(summaryTableLeft, y + summaryRowHeight)
          .lineTo(summaryTableLeft + summaryColWidth * 3, y + summaryRowHeight)
          .stroke();
      });
      
      // Finalize document
      doc.end();
      
      // Handle completion
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
}

// Helper function to generate Excel report
async function generateExcelReport(records, filePath, startDate, endDate) {
  try {
    // Create a new workbook
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Attendance Management System';
    workbook.created = new Date();
    
    // Add summary worksheet
    const summarySheet = workbook.addWorksheet('Summary');
    
    // Add title and date range
    summarySheet.mergeCells('A1:D1');
    const titleCell = summarySheet.getCell('A1');
    titleCell.value = 'Attendance Report';
    titleCell.font = { size: 16, bold: true };
    titleCell.alignment = { horizontal: 'center' };
    
    summarySheet.mergeCells('A2:D2');
    const dateRangeCell = summarySheet.getCell('A2');
    dateRangeCell.value = `Period: ${format(startDate, 'PPP')} to ${format(endDate, 'PPP')}`;
    dateRangeCell.alignment = { horizontal: 'center' };
    
    // Add summary headers
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
    
    // Group records by course
    const courseGroups = {};
    records.forEach(record => {
      const courseId = record.course._id.toString();
      const courseName = record.course.courseName || record.course.courseCode || 'Unknown Course';
      
      if (!courseGroups[courseId]) {
        courseGroups[courseId] = {
          name: courseName,
          id: courseId,
          records: []
        };
      }
      
      courseGroups[courseId].records.push(record);
    });
    
    // Add summary rows
    Object.values(courseGroups).forEach(course => {
      // Calculate attendance stats
      let totalStudents = 0;
      let totalRate = 0;
      
      course.records.forEach(record => {
        const students = record.students.length;
        totalStudents = Math.max(totalStudents, students);
        
        const presentStudents = record.students.filter(s => 
          s.status === 'present' || s.status === 'Present').length;
        
        if (students > 0) {
          totalRate += (presentStudents / students) * 100;
        }
      });
      
      const avgAttendance = course.records.length > 0 
        ? Math.round(totalRate / course.records.length) 
        : 0;
      
      // Add row to summary sheet
      summarySheet.addRow([
        course.name,
        course.records.length,
        totalStudents,
        `${avgAttendance}%`
      ]);
    });
    
    // Auto-size columns
    summarySheet.columns.forEach(column => {
      column.width = 20;
    });
    
    // Add detail worksheets for each course
    Object.values(courseGroups).forEach(course => {
      // Create worksheet for the course
      const sheet = workbook.addWorksheet(course.name.substring(0, 31)); // Excel has 31 char limit
      
      // Add course title
      sheet.mergeCells('A1:E1');
      const courseTitleCell = sheet.getCell('A1');
      courseTitleCell.value = course.name;
      courseTitleCell.font = { size: 14, bold: true };
      courseTitleCell.alignment = { horizontal: 'center' };
      
      // Process each attendance record
      let rowIndex = 3; // Start after title row
      
      course.records.forEach(record => {
        const date = format(new Date(record.date), 'PPP');
        const totalStudents = record.students.length;
        const presentStudents = record.students.filter(s => 
          s.status === 'present' || s.status === 'Present').length;
        const attendanceRate = totalStudents > 0 
          ? Math.round((presentStudents / totalStudents) * 100) 
          : 0;
        
        // Add session header
        sheet.mergeCells(`A${rowIndex}:E${rowIndex}`);
        const sessionHeaderCell = sheet.getCell(`A${rowIndex}`);
        sessionHeaderCell.value = `Date: ${date} - Attendance: ${presentStudents}/${totalStudents} (${attendanceRate}%)`;
        sessionHeaderCell.font = { bold: true };
        sessionHeaderCell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFF0F0F0' }
        };
        
        rowIndex++;
        
        // Add student table headers
        const studentHeaderRow = sheet.addRow(['No.', 'Roll Number', 'Name', 'Status', 'Remarks']);
        studentHeaderRow.eachCell(cell => {
          cell.font = { bold: true };
        });
        
        rowIndex++;
        
        // Sort students by roll number
        const sortedStudents = [...record.students].sort((a, b) => {
          const aRoll = a.student?.rollNumber || '';
          const bRoll = b.student?.rollNumber || '';
          return aRoll.localeCompare(bRoll);
        });
        
        // Add student rows
        sortedStudents.forEach((student, i) => {
          const studentName = student.student?.name || 'Unknown';
          const rollNumber = student.student?.rollNumber || 'N/A';
          const status = student.status === 'present' || student.status === 'Present' 
            ? 'Present' 
            : 'Absent';
          
          sheet.addRow([
            i + 1,
            rollNumber,
            studentName,
            status,
            student.remarks || ''
          ]);
          
          rowIndex++;
        });
        
        // Add space between sessions
        sheet.addRow([]);
        rowIndex += 2;
      });
      
      // Auto-size columns
      sheet.columns.forEach(column => {
        column.width = 18;
      });
    });
    
    // Create a student overview worksheet
    const studentSheet = workbook.addWorksheet('Student Overview');
    
    // Add title
    studentSheet.mergeCells('A1:E1');
    const studentTitleCell = studentSheet.getCell('A1');
    studentTitleCell.value = 'Student Attendance Overview';
    studentTitleCell.font = { size: 16, bold: true };
    studentTitleCell.alignment = { horizontal: 'center' };
    
    // Add headers
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
    
    // Create a map to track student attendance across all courses
    const studentAttendanceMap = new Map();
    
    // Process each record to build student data
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
    
    // Add student rows
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
        
        // Color-code attendance rates
        const row = studentSheet.lastRow;
        const rateCell = row.getCell(4);
        if (attendanceRate >= 90) {
          rateCell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFD5F5D5' } // Light green
          };
        } else if (attendanceRate < 75) {
          rateCell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFF5D5D5' } // Light red
          };
        }
      }
    }
    
    // Auto-size columns
    studentSheet.columns.forEach(column => {
      column.width = 20;
    });
    
    // Write to file
    await workbook.xlsx.writeFile(filePath);
    return filePath;
  } catch (err) {
    console.error('Error generating Excel report:', err);
    throw err;
  }
} 