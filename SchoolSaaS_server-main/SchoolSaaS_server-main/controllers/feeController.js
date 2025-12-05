import Fee from '../models/Fee.js';

export const getAllFees = async (req, res) => {
  try {
    const { schoolId, role, userId } = req.user;
    const { page = 1, limit = 10, studentId, status, class: className } = req.query;
    const skip = (page - 1) * limit;

    let filter = { schoolId };
    
    // If student or parent, filter by their student record
    if (role === 'student' || role === 'parent') {
      const Student = (await import('../models/Student.js')).default;
      const student = await Student.findOne({ userId, schoolId });
      if (student) {
        filter.studentId = student._id;
      } else {
        return res.json({ fees: [], pagination: { page: parseInt(page), limit: parseInt(limit), total: 0 } });
      }
    } else {
      // For admins, allow filtering by studentId
      if (studentId) filter.studentId = studentId;
      if (className) filter.class = className;
    }
    
    if (status) filter.status = status;

    const fees = await Fee.find(filter)
      .populate('studentId', 'rollNumber admissionNumber studentId')
      .populate({ path: 'studentId', populate: { path: 'userId', select: 'firstName lastName' } })
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    const total = await Fee.countDocuments(filter);

    res.json({
      fees,
      pagination: { page: parseInt(page), limit: parseInt(limit), total }
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching fees', error: error.message });
  }
};

export const createFee = async (req, res) => {
  try {
    const { schoolId } = req.user;
    const { studentId, class: className, section, feeMonth, amount, feeType, dueDate, notes } = req.body;

    // Find student by studentId (STU00001 format) or MongoDB _id
    const Student = (await import('../models/Student.js')).default;
    let student;
    
    if (studentId && studentId.startsWith('STU')) {
      student = await Student.findOne({ schoolId, studentId });
    } else if (studentId) {
      student = await Student.findById(studentId);
    }

    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    const fee = new Fee({
      schoolId,
      studentId: student._id,
      class: className,
      section,
      feeMonth,
      amount,
      feeType,
      dueDate: new Date(dueDate),
      notes,
      status: 'Pending'
    });

    await fee.save();
    res.status(201).json({ message: 'Fee created successfully', fee });
  } catch (error) {
    res.status(500).json({ message: 'Error creating fee', error: error.message });
  }
};

export const updateFee = async (req, res) => {
  try {
    const { id } = req.params;
    const { amount, feeType, dueDate, notes, status } = req.body;

    const fee = await Fee.findByIdAndUpdate(
      id,
      { amount, feeType, dueDate, notes, status },
      { new: true, runValidators: true }
    );

    if (!fee) {
      return res.status(404).json({ message: 'Fee not found' });
    }

    res.json({ message: 'Fee updated successfully', fee });
  } catch (error) {
    res.status(500).json({ message: 'Error updating fee', error: error.message });
  }
};

export const deleteFee = async (req, res) => {
  try {
    const { id } = req.params;
    const fee = await Fee.findByIdAndDelete(id);

    if (!fee) {
      return res.status(404).json({ message: 'Fee not found' });
    }

    res.json({ message: 'Fee deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting fee', error: error.message });
  }
};

export const generateFeesForAllStudents = async (req, res) => {
  try {
    const { schoolId } = req.user;
    const { feeMonth, feeType, dueDate } = req.body;

    const Student = (await import('../models/Student.js')).default;
    const students = await Student.find({ schoolId });

    const fees = [];
    for (const student of students) {
      const classNumber = parseInt(student.class);
      const amount = classNumber * 1000;

      const fee = new Fee({
        schoolId,
        studentId: student._id,
        class: student.class,
        section: student.section,
        feeMonth,
        amount,
        feeType: feeType || 'Tuition',
        dueDate: new Date(dueDate),
        status: 'Pending',
        notes: 'Bulk generated fee'
      });

      await fee.save();
      fees.push(fee);
    }

    res.status(201).json({ message: `${fees.length} fees generated successfully`, count: fees.length });
  } catch (error) {
    res.status(500).json({ message: 'Error generating fees', error: error.message });
  }
};

export const recordFeePayment = async (req, res) => {
  try {
    const { id } = req.params;
    const { paidAmount, paymentMethod, transactionId, receiptNumber } = req.body;

    const fee = await Fee.findById(id);
    if (!fee) {
      return res.status(404).json({ message: 'Fee record not found' });
    }

    fee.paidAmount = paidAmount;
    fee.paidDate = new Date();
    fee.paymentMethod = paymentMethod;
    fee.transactionId = transactionId;
    fee.receiptNumber = receiptNumber;

    if (paidAmount >= fee.amount) {
      fee.status = 'Paid';
    } else if (paidAmount > 0) {
      fee.status = 'Partial';
    } else if (new Date() > fee.dueDate && fee.status === 'Pending') {
      fee.status = 'Overdue';
    }

    await fee.save();
    res.json({ message: 'Fee payment recorded successfully', fee });
  } catch (error) {
    res.status(500).json({ message: 'Error recording fee payment', error: error.message });
  }
};

export const getFeeReport = async (req, res) => {
  try {
    const { schoolId } = req.user;
    const { class: className, month } = req.query;

    let filter = { schoolId };
    if (className) filter.class = className;
    if (month) filter.feeMonth = month;

    const fees = await Fee.find(filter);
    const totalAmount = fees.reduce((sum, fee) => sum + fee.amount, 0);
    const totalCollected = fees.reduce((sum, fee) => sum + fee.paidAmount, 0);
    const pending = fees.filter(fee => fee.status === 'Pending').length;
    const paid = fees.filter(fee => fee.status === 'Paid').length;

    res.json({
      report: {
        totalAmount,
        totalCollected,
        pending,
        paid,
        percentage: totalAmount > 0 ? ((totalCollected / totalAmount) * 100).toFixed(2) : 0
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Error generating fee report', error: error.message });
  }
};
