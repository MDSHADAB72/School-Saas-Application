import PeriodConfiguration from '../models/PeriodConfiguration.js';
import User from '../models/User.js';

export const createPeriodConfiguration = async (req, res) => {
  try {
    const { academicYear, class: className, section, workingDays, periods } = req.body;
    
    // Validate for internal conflicts within this configuration
    const internalConflicts = validateInternalConflicts(workingDays, periods);
    if (internalConflicts.length > 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Cannot create configuration with teacher conflicts',
        conflicts: internalConflicts
      });
    }
    
    // Check for conflicts with existing configurations
    const externalConflicts = await validateExternalConflicts(req.user.schoolId, academicYear, workingDays, periods);
    if (externalConflicts.length > 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Teacher conflicts detected with existing timetables',
        conflicts: externalConflicts
      });
    }
    
    // Deactivate existing configurations for this specific class and section
    await PeriodConfiguration.updateMany(
      { 
        schoolId: req.user.schoolId, 
        academicYear, 
        class: className,
        section,
        isActive: true 
      },
      { isActive: false }
    );

    const configuration = new PeriodConfiguration({
      schoolId: req.user.schoolId,
      academicYear,
      class: className,
      section,
      workingDays,
      periods,
      totalPeriodsPerDay: periods.filter(p => p.type === 'class').length,
      createdBy: req.user.userId
    });

    await configuration.save();
    res.status(201).json({ success: true, data: configuration });
  } catch (error) {
    console.error('Period configuration creation error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getPeriodConfigurations = async (req, res) => {
  try {
    const configurations = await PeriodConfiguration.find({ 
      schoolId: req.user.schoolId 
    })
    .populate('createdBy', 'firstName lastName')
    .sort({ createdAt: -1 });
    
    res.json({ success: true, data: configurations });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getActivePeriodConfiguration = async (req, res) => {
  try {
    const { academicYear } = req.params;
    
    const configuration = await PeriodConfiguration.findOne({ 
      schoolId: req.user.schoolId,
      academicYear,
      isActive: true
    }).populate('createdBy', 'firstName lastName');
    
    if (!configuration) {
      return res.status(404).json({ success: false, message: 'No active configuration found' });
    }
    
    res.json({ success: true, data: configuration });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updatePeriodConfiguration = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    if (updates.periods && updates.workingDays) {
      // Validate for internal conflicts within this configuration
      const internalConflicts = validateInternalConflicts(updates.workingDays, updates.periods);
      if (internalConflicts.length > 0) {
        return res.status(400).json({ 
          success: false, 
          message: 'Cannot update configuration with teacher conflicts',
          conflicts: internalConflicts
        });
      }
      
      // Get current configuration to check academic year
      const currentConfig = await PeriodConfiguration.findById(id);
      if (!currentConfig) {
        return res.status(404).json({ success: false, message: 'Configuration not found' });
      }
      
      // Check for conflicts with other configurations (excluding current one)
      const externalConflicts = await validateExternalConflicts(
        currentConfig.schoolId, 
        currentConfig.academicYear, 
        updates.workingDays, 
        updates.periods,
        id
      );
      if (externalConflicts.length > 0) {
        return res.status(400).json({ 
          success: false, 
          message: 'Teacher conflicts detected with existing timetables',
          conflicts: externalConflicts
        });
      }
      
      updates.totalPeriodsPerDay = updates.periods.filter(p => p.type === 'class').length;
    }
    
    const configuration = await PeriodConfiguration.findByIdAndUpdate(
      id,
      updates,
      { new: true }
    );
    
    if (!configuration) {
      return res.status(404).json({ success: false, message: 'Configuration not found' });
    }
    
    res.json({ success: true, data: configuration });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deletePeriodConfiguration = async (req, res) => {
  try {
    const { id } = req.params;
    
    const configuration = await PeriodConfiguration.findByIdAndDelete(id);
    
    if (!configuration) {
      return res.status(404).json({ success: false, message: 'Configuration not found' });
    }
    
    res.json({ success: true, message: 'Configuration deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get teachers for timetable dropdown
export const getTeachersForTimetable = async (req, res) => {
  try {
    const teachers = await User.find({ 
      role: 'teacher',
      schoolId: req.user.schoolId,
      active: true
    }).select('firstName lastName email');
    
    res.json({ success: true, data: teachers });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Helper function to check if two time periods overlap
const timePeriodsOverlap = (start1, end1, start2, end2) => {
  const [h1, m1] = start1.split(':').map(Number);
  const [h2, m2] = end1.split(':').map(Number);
  const [h3, m3] = start2.split(':').map(Number);
  const [h4, m4] = end2.split(':').map(Number);
  
  const time1Start = h1 * 60 + m1;
  const time1End = h2 * 60 + m2;
  const time2Start = h3 * 60 + m3;
  const time2End = h4 * 60 + m4;
  
  return time1Start < time2End && time2Start < time1End;
};

// Helper function to validate internal conflicts within a single configuration
const validateInternalConflicts = (workingDays, periods) => {
  const conflicts = [];
  
  workingDays.forEach(day => {
    const classPeriods = periods.filter(p => p.type === 'class' && p.teacher);
    
    for (let i = 0; i < classPeriods.length; i++) {
      for (let j = i + 1; j < classPeriods.length; j++) {
        const period1 = classPeriods[i];
        const period2 = classPeriods[j];
        
        if (period1.teacher === period2.teacher && 
            timePeriodsOverlap(period1.startTime, period1.endTime, period2.startTime, period2.endTime)) {
          conflicts.push({
            teacherId: period1.teacher,
            day,
            message: `Teacher has overlapping periods: ${period1.startTime}-${period1.endTime} and ${period2.startTime}-${period2.endTime} on ${day}`
          });
        }
      }
    }
  });
  
  return conflicts;
};

// Helper function to validate conflicts with existing configurations
const validateExternalConflicts = async (schoolId, academicYear, workingDays, periods, excludeConfigId = null) => {
  const existingConfigs = await PeriodConfiguration.find({
    schoolId,
    academicYear,
    isActive: true,
    ...(excludeConfigId && { _id: { $ne: excludeConfigId } })
  });
  
  const conflicts = [];
  
  // Check each new period against all existing periods
  workingDays.forEach(day => {
    const newClassPeriods = periods.filter(p => p.type === 'class' && p.teacher);
    
    newClassPeriods.forEach(newPeriod => {
      existingConfigs.forEach(config => {
        if (config.workingDays.includes(day)) {
          const existingClassPeriods = config.periods.filter(p => p.type === 'class' && p.teacher === newPeriod.teacher);
          
          existingClassPeriods.forEach(existingPeriod => {
            if (timePeriodsOverlap(newPeriod.startTime, newPeriod.endTime, existingPeriod.startTime, existingPeriod.endTime)) {
              conflicts.push({
                teacherId: newPeriod.teacher,
                day,
                message: `Teacher already assigned to Class ${config.class}${config.section ? ` Section ${config.section}` : ''} at ${existingPeriod.startTime}-${existingPeriod.endTime} on ${day}, conflicts with new period ${newPeriod.startTime}-${newPeriod.endTime}`,
                existingAssignment: {
                  class: config.class,
                  section: config.section,
                  subject: existingPeriod.subject,
                  startTime: existingPeriod.startTime,
                  endTime: existingPeriod.endTime
                }
              });
            }
          });
        }
      });
    });
  });
  
  return conflicts;
};

// Detect conflicts in timetable
export const detectTimetableConflicts = async (req, res) => {
  try {
    const { academicYear } = req.params;
    
    const configurations = await PeriodConfiguration.find({
      schoolId: req.user.schoolId,
      academicYear,
      isActive: true
    }).lean();
    
    const conflicts = [];
    const allAssignments = [];
    
    // Collect all teacher assignments with time details
    configurations.forEach(config => {
      config.workingDays.forEach(day => {
        config.periods.forEach((period, periodIndex) => {
          if (period.type === 'class' && period.teacher) {
            allAssignments.push({
              teacherId: period.teacher,
              day,
              periodIndex,
              timeSlot: `${day}-${periodIndex}`,
              configId: config._id,
              class: config.class,
              section: config.section,
              subject: period.subject,
              periodName: period.periodName,
              startTime: period.startTime,
              endTime: period.endTime
            });
          }
        });
      });
    });
    
    // Find overlapping assignments for each teacher
    const teacherConflicts = {};
    
    for (let i = 0; i < allAssignments.length; i++) {
      for (let j = i + 1; j < allAssignments.length; j++) {
        const assignment1 = allAssignments[i];
        const assignment2 = allAssignments[j];
        
        if (assignment1.teacherId === assignment2.teacherId && 
            assignment1.day === assignment2.day &&
            timePeriodsOverlap(assignment1.startTime, assignment1.endTime, assignment2.startTime, assignment2.endTime)) {
          
          // Add conflict for both time slots
          [assignment1, assignment2].forEach(assignment => {
            const key = `${assignment.teacherId}-${assignment.timeSlot}`;
            if (!teacherConflicts[key]) {
              teacherConflicts[key] = {
                teacherId: assignment.teacherId,
                timeSlot: assignment.timeSlot,
                conflictCount: 0,
                assignments: []
              };
            }
            
            const existingAssignment = teacherConflicts[key].assignments.find(a => 
              a.configId.toString() === assignment.configId.toString() && 
              a.periodIndex === assignment.periodIndex
            );
            
            if (!existingAssignment) {
              teacherConflicts[key].assignments.push(assignment);
              teacherConflicts[key].conflictCount = teacherConflicts[key].assignments.length;
            }
          });
        }
      }
    }
    
    // Convert to array and filter out non-conflicts
    const conflictArray = Object.values(teacherConflicts).filter(conflict => conflict.conflictCount > 1);
    
    res.json({ success: true, data: conflictArray });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Validate timetable before saving
export const validateTimetable = async (req, res) => {
  try {
    const { academicYear, workingDays, periods, configId } = req.body;
    
    // Validate internal conflicts
    const internalConflicts = validateInternalConflicts(workingDays, periods);
    
    // Validate external conflicts
    const externalConflicts = await validateExternalConflicts(
      req.user.schoolId, 
      academicYear, 
      workingDays, 
      periods, 
      configId
    );
    
    const allConflicts = [...internalConflicts, ...externalConflicts];
    
    res.json({ 
      success: true, 
      isValid: allConflicts.length === 0,
      conflicts: allConflicts
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};