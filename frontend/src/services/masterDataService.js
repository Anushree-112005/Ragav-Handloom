import api from './api';

const createMasterService = (endpoint) => ({
  getAll: async (params = {}) => {
    const response = await api.get(`/${endpoint}`, { params });
    return response.data;
  },
  create: async (data) => {
    const response = await api.post(`/${endpoint}`, data);
    return response.data;
  },
  update: async (id, data) => {
    const response = await api.put(`/${endpoint}/${id}`, data);
    return response.data;
  },
  delete: async (id) => {
    const response = await api.delete(`/${endpoint}/${id}`);
    return response.data;
  },
});

export const productService = createMasterService('products');
export const fabricService = createMasterService('fabrics');
export const yarnService = createMasterService('yarns');
export const colourService = createMasterService('colours');
export const designService = createMasterService('designs');
export const loomService = createMasterService('looms');
export const artisanService = createMasterService('artisans');
export const supplierService = createMasterService('suppliers');
export const customerService = createMasterService('customers');
export const warehouseService = createMasterService('warehouses');
export const uomService = createMasterService('uom');
export const taxRateService = createMasterService('tax-rates');

export const masterDataHubService = {
  getSummary: async () => {
    const response = await api.get('/dashboard/master-data-summary');
    return response.data;
  },
};
