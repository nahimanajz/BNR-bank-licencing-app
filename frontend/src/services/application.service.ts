import apiClient from '../config/api.client';
import { Application } from '@/types';

export const applicationService = {
  getApplications: async (): Promise<Application[]> => {
    const { data } = await apiClient.get('/applications');
    return data.data;
  },

  getById: async (id: number): Promise<Application> => {
    const { data } = await apiClient.get(`/applications/${id}`);
    return data.data;
  },

  create: async (payload: { institution_name: string }): Promise<Application> => {
    const { data } = await apiClient.post('/applications', payload);
    return data.data;
  },

  transition: async (id: number, newStatus: string, version: number): Promise<Application> => {
    const { data } = await apiClient.patch(`/applications/${id}/transition`, { newStatus, version });
    return data.data;
  },

  provideFeedback: async (id: number, feedback: string, version: number): Promise<Application> => {
    const { data } = await apiClient.patch(`/applications/${id}/feedback`, { feedback, version });
    return data.data;
  },

  decide: async (id: number, decision: string, notes: string, version: number): Promise<Application> => {
    const { data } = await apiClient.patch(`/applications/${id}/decide`, { decision, notes, version });
    return data.data;
  },
};
