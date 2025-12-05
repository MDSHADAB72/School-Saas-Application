import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const authService = {
  login: (email, password) => api.post('/auth/login', { email, password }),
  register: (data) => api.post('/auth/register', data),
  registerSchool: (data) => api.post('/auth/register-school', data),
  getCurrentUser: () => api.get('/auth/me'),
  updateProfile: (data) => api.put('/auth/profile', data),
};

export const schoolService = {
  getAllSchools: (page = 1, limit = 10) => api.get('/schools', { params: { page, limit } }),
  getSchoolById: (id) => api.get(`/schools/${id}`),
  createSchool: (data) => api.post('/schools', data),
  updateSchool: (id, data) => api.put(`/schools/${id}`, data),
  deleteSchool: (id) => api.delete(`/schools/${id}`),
};

export const studentService = {
  getAllStudents: (params) => api.get('/students', { params }),
  getStudentById: (id) => api.get(`/students/${id}`),
  createStudent: (data) => api.post('/students', data),
  bulkCreateStudents: (students) => api.post('/students/bulk', { students }),
  updateStudent: (id, data) => api.put(`/students/${id}`, data),
  deleteStudent: (id) => api.delete(`/students/${id}`),
  generateAdmitCard: (id) => api.get(`/students/${id}/admit-card`),
};

export const teacherService = {
  getAllTeachers: (params) => api.get('/teachers', { params }),
  getTeacherById: (id) => api.get(`/teachers/${id}`),
  createTeacher: (data) => api.post('/teachers', data),
  bulkCreateTeachers: (data) => api.post('/teachers/bulk', data),
  updateTeacher: (id, data) => api.put(`/teachers/${id}`, data),
  deleteTeacher: (id) => api.delete(`/teachers/${id}`)
};

export const attendanceService = {
  getAllAttendance: (params) => api.get('/attendance', { params }),
  markAttendance: (data) => api.post('/attendance', data),
  bulkMarkAttendance: (data) => api.post('/attendance/bulk', data),
  updateAttendance: (id, data) => api.put(`/attendance/${id}`, data),
  getAttendanceReport: (studentId, params) => api.get(`/attendance/report/${studentId}`, { params }),
};

export const examinationService = {
  getAllExaminations: (params) => api.get('/examinations', { params }),
  getUpcomingExams: () => api.get('/examinations/upcoming'),
  getMyExamSchedule: () => api.get('/examinations/my-schedule'),
  checkAdmitCardEligibility: () => api.get('/examinations/admit-card/eligibility'),
  generateAdmitCard: (examinationId) => api.get(`/examinations/admit-card/${examinationId}`),
  createExamination: (data) => api.post('/examinations', data),
  updateExamination: (id, data) => api.put(`/examinations/${id}`, data),
  updateExaminationStatus: (id, status) => api.put(`/examinations/${id}/status`, { status }),
  submitResult: (data) => api.post('/examinations/results/submit', data),
  publishResult: (id) => api.put(`/examinations/results/${id}/publish`),
  getMyResults: () => api.get('/examinations/results/my'),
  getStudentResults: (studentId) => api.get(`/examinations/results/student/${studentId}`),
  getExaminationResults: (examinationId) => api.get(`/examinations/results/examination/${examinationId}`),
  printResultCard: (resultId) => api.get(`/examinations/results/${resultId}/print`),
};

export const feeService = {
  getAllFees: (params) => api.get('/fees', { params }),
  createFee: (data) => api.post('/fees', data),
  updateFee: (id, data) => api.put(`/fees/${id}`, data),
  deleteFee: (id) => api.delete(`/fees/${id}`),
  recordFeePayment: (id, data) => api.put(`/fees/${id}/payment`, data),
  getFeeReport: (params) => api.get('/fees/report/summary', { params }),
  generateFeesForAll: (data) => api.post('/fees/generate-all', data),
  printReceipt: (id) => api.get(`/fees/${id}/print`),
};

export const announcementService = {
  getAllAnnouncements: (params) => api.get('/announcements', { params }),
  createAnnouncement: (data) => api.post('/announcements', data),
  updateAnnouncement: (id, data) => api.put(`/announcements/${id}`, data),
  deleteAnnouncement: (id) => api.delete(`/announcements/${id}`),
};

export const assignmentService = {
  getAllAssignments: (params) => api.get('/assignments', { params }),
  createAssignment: (formData) => {
    return api.post('/assignments', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
  submitAssignment: (formData) => {
    return api.post('/assignments/submit', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
  getSubmissions: (assignmentId) => api.get(`/assignments/${assignmentId}/submissions`),
  getMySubmissions: () => api.get('/assignments/my-submissions'),
  gradeSubmission: (id, data) => api.put(`/assignments/submission/${id}/grade`, data),
};

export const activityService = {
  logActivity: (data) => api.post('/activities', data),
  getActivities: (params) => api.get('/activities', { params }),
};

export const getFileUrl = (fileUrl) => {
  if (!fileUrl) return '';
  if (fileUrl.startsWith('http')) return fileUrl;
  return `${API_BASE_URL.replace('/api', '')}${fileUrl}`;
};

export { api };
export default api;
