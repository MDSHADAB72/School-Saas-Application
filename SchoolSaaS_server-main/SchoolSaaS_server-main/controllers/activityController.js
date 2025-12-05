import Activity from '../models/Activity.js';

export const logActivity = async (req, res) => {
  try {
    const { userId, schoolId } = req.user;
    const { type, message, metadata } = req.body;

    const activity = new Activity({
      schoolId,
      userId,
      type,
      message,
      metadata
    });

    await activity.save();
    res.status(201).json({ message: 'Activity logged', activity });
  } catch (error) {
    res.status(500).json({ message: 'Error logging activity', error: error.message });
  }
};

export const getActivities = async (req, res) => {
  try {
    const { userId, schoolId, role } = req.user;
    const { page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    let filter = { schoolId };
    
    // Students and parents see only their activities
    if (role === 'student' || role === 'parent') {
      filter.userId = userId;
    }

    const activities = await Activity.find(filter)
      .populate('userId', 'firstName lastName')
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    const total = await Activity.countDocuments(filter);

    res.json({
      activities,
      pagination: { page: parseInt(page), limit: parseInt(limit), total }
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching activities', error: error.message });
  }
};
