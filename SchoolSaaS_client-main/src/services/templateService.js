import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const templateService = {
  // Get all templates by school
  getTemplates: (schoolId, type = null) => {
    const params = type ? { type } : {};
    return api.get(`/templates/school/${schoolId}`, { params });
  },
  
  // Get single template
  getTemplate: (id) => api.get(`/templates/${id}`),
  
  // Create template
  createTemplate: (templateData) => api.post('/templates', templateData),
  
  // Update template
  updateTemplate: (id, templateData) => api.put(`/templates/${id}`, templateData),
  
  // Delete template
  deleteTemplate: (id) => api.delete(`/templates/${id}`),
  
  // Set default template
  setDefaultTemplate: (id) => api.post(`/templates/${id}/set-default`),
  
  // Preview template
  previewTemplate: (html, css) => api.post('/templates/preview', { html, css }),
  
  // Render template with data
  renderTemplate: (templateId, data) => api.post('/templates/render', { templateId, data }),
};