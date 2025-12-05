import School from '../models/School.js';

export const getAllSchools = async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const skip = (page - 1) * limit;

    let filter = {};
    if (status) filter.subscriptionStatus = status;

    const schools = await School.find(filter)
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    const total = await School.countDocuments(filter);

    res.json({
      schools,
      pagination: { page: parseInt(page), limit: parseInt(limit), total }
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching schools', error: error.message });
  }
};

export const getSchoolById = async (req, res) => {
  try {
    const school = await School.findById(req.params.id);
    if (!school) {
      return res.status(404).json({ message: 'School not found' });
    }
    res.json({ school });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching school', error: error.message });
  }
};

export const createSchool = async (req, res) => {
  try {
    const { name, email, phoneNumber, address, city, state, pincode, principalName } = req.body;

    const existingSchool = await School.findOne({ email });
    if (existingSchool) {
      return res.status(400).json({ message: 'School with this email already exists' });
    }

    const school = new School({
      name,
      email,
      phoneNumber,
      address,
      city,
      state,
      pincode,
      principalName,
      subscriptionStartDate: new Date(),
      subscriptionEndDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    });

    await school.save();
    res.status(201).json({ message: 'School created successfully', school });
  } catch (error) {
    res.status(500).json({ message: 'Error creating school', error: error.message });
  }
};

export const updateSchool = async (req, res) => {
  try {
    const school = await School.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!school) {
      return res.status(404).json({ message: 'School not found' });
    }

    res.json({ message: 'School updated successfully', school });
  } catch (error) {
    res.status(500).json({ message: 'Error updating school', error: error.message });
  }
};

export const deleteSchool = async (req, res) => {
  try {
    const school = await School.findByIdAndDelete(req.params.id);
    if (!school) {
      return res.status(404).json({ message: 'School not found' });
    }
    res.json({ message: 'School deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting school', error: error.message });
  }
};
