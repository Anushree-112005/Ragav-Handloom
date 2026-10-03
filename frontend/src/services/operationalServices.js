import api from './api';

export const dashboardService = {
  getStats: async () => {
    const response = await api.get('/dashboard/stats');
    return response.data;
  },
};

export const operationsService = {
  getProduction: async () => {
    const response = await api.get('/operations/production');
    return response.data;
  },
  getInventory: async () => {
    const response = await api.get('/operations/inventory');
    return response.data;
  },
  getPurchase: async () => {
    const response = await api.get('/operations/purchase');
    return response.data;
  },
  getSales: async () => {
    const response = await api.get('/operations/sales');
    return response.data;
  },
  getQuality: async () => {
    const response = await api.get('/operations/quality');
    return response.data;
  },
};

export const reportsService = {
  getSummary: async () => {
    const response = await api.get('/reports/summary');
    return response.data;
  },
  downloadCsv: async (reportType) => {
    const response = await api.get(`/reports/export-csv/${reportType}`, {
      responseType: 'blob',
    });
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `loomora_${reportType}_report.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },
};

export const searchService = {
  globalSearch: async (query) => {
    const response = await api.get('/search', { params: { q: query } });
    return response.data;
  },
};
