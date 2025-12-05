import Announcement from '../models/Announcement.js';

export const getAllAnnouncements = async (req, res) => {
  try {
    const { schoolId } = req.user;
    const { page = 1, limit = 10, audience, priority } = req.query;
    const skip = (page - 1) * limit;

    let filter = { schoolId, active: true };
    if (audience) filter.audience = audience;
    if (priority) filter.priority = priority;

    const announcements = await Announcement.find(filter)
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ publishDate: -1 });

    const total = await Announcement.countDocuments(filter);

    res.json({
      announcements,
      pagination: { page: parseInt(page), limit: parseInt(limit), total }
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching announcements', error: error.message });
  }
};

export const createAnnouncement = async (req, res) => {
  try {
    const { schoolId, userId } = req.user;
    const { title, description, content, audience, class: className, section, priority, expiryDate, attachments } = req.body;

    const announcement = new Announcement({
      schoolId,
      title,
      description,
      content,
      audience,
      class: className,
      section,
      priority,
      expiryDate: expiryDate ? new Date(expiryDate) : null,
      attachments,
      publishedBy: userId,
      publishDate: new Date()
    });

    await announcement.save();
    res.status(201).json({ message: 'Announcement created successfully', announcement });
  } catch (error) {
    res.status(500).json({ message: 'Error creating announcement', error: error.message });
  }
};

export const updateAnnouncement = async (req, res) => {
  try {
    const announcement = await Announcement.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!announcement) {
      return res.status(404).json({ message: 'Announcement not found' });
    }

    res.json({ message: 'Announcement updated successfully', announcement });
  } catch (error) {
    res.status(500).json({ message: 'Error updating announcement', error: error.message });
  }
};

export const deleteAnnouncement = async (req, res) => {
  try {
    const announcement = await Announcement.findByIdAndUpdate(
      req.params.id,
      { active: false },
      { new: true }
    );

    if (!announcement) {
      return res.status(404).json({ message: 'Announcement not found' });
    }

    res.json({ message: 'Announcement deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting announcement', error: error.message });
  }
};
