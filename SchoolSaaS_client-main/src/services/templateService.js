import api from './api.js';

export const templateService = {
  getTemplates: async (schoolId, type = null) => {
    const params = type ? { type } : {};
    const response = await api.get(`/templates/school/${schoolId}`, { params });
    return response.data;
  },

  getTemplate: async (id) => {
    const response = await api.get(`/templates/${id}`);
    return response.data;
  },

  createTemplate: async (templateData) => {
    const response = await api.post('/templates', templateData);
    return response.data;
  },

  updateTemplate: async (id, templateData) => {
    const response = await api.put(`/templates/${id}`, templateData);
    return response.data;
  },

  deleteTemplate: async (id) => {
    const response = await api.delete(`/templates/${id}`);
    return response.data;
  },

  setDefaultTemplate: async (id) => {
    const response = await api.post(`/templates/${id}/set-default`);
    return response.data;
  },

  renderTemplate: async (templateId, data = null) => {
    const response = await api.post('/templates/render', { templateId, data });
    return response.data;
  },

  previewTemplate: async (html, css = '') => {
    const response = await api.post('/templates/preview', { html, css });
    return response.data;
  }
};

export default templateService;