import apiClient from '../config/api.client';
import { AuditLog } from '@/types';

export const auditService = {
  getByApplication: async (applicationId: number): Promise<AuditLog[]> => {
    const {data: response} = await apiClient.get(`/audit/applications/${applicationId}`);
    return response.data;
  },

  getAll: async (applicationId?: number): Promise<AuditLog[]> => {
    const params = applicationId ? `?applicationId=${applicationId}` : '';
    const { data:response } = await apiClient.get(`/audit${params}`);
    return response.data;
  },
};
