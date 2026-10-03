import api from './api';

export const roleService = {
  getRoles: async () => {
    const response = await api.get('/roles');
    return response.data;
  },

  getRoleById: async (id) => {
    const response = await api.get(`/roles/${id}`);
    return response.data;
  },

  createRole: async (roleData) => {
    const response = await api.post('/roles', roleData);
    return response.data;
  },

  updateRole: async (id, roleData) => {
    const response = await api.put(`/roles/${id}`, roleData);
    return response.data;
  },

  deleteRole: async (id) => {
    const response = await api.delete(`/roles/${id}`);
    return response.data;
  },
};

export const departmentService = {
  getDepartments: async (params = {}) => {
    const response = await api.get('/departments', { params });
    return response.data;
  },

  createDepartment: async (deptData) => {
    const response = await api.post('/departments', deptData);
    return response.data;
  },

  updateDepartment: async (id, deptData) => {
    const response = await api.put(`/departments/${id}`, deptData);
    return response.data;
  },

  deleteDepartment: async (id) => {
    const response = await api.delete(`/departments/${id}`);
    return response.data;
  },
};

export const plantService = {
  getPlants: async (params = {}) => {
    const response = await api.get('/plants', { params });
    return response.data;
  },

  createPlant: async (plantData) => {
    const response = await api.post('/plants', plantData);
    return response.data;
  },

  updatePlant: async (id, plantData) => {
    const response = await api.put(`/plants/${id}`, plantData);
    return response.data;
  },

  deletePlant: async (id) => {
    const response = await api.delete(`/plants/${id}`);
    return response.data;
  },
};

export const auditService = {
  getAuditLogs: async (params = {}) => {
    const response = await api.get('/audit-logs', { params });
    return response.data;
  },

  getLoginActivity: async (params = {}) => {
    const response = await api.get('/login-activity', { params });
    return response.data;
  },

  getUserApprovals: async (params = {}) => {
    const response = await api.get('/user-approvals', { params });
    return response.data;
  },

  decideApproval: async (id, action, notes) => {
    const response = await api.post(`/user-approvals/${id}/decision`, {
      action,
      notes,
    });
    return response.data;
  },
};
