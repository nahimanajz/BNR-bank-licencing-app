import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { applicationService } from '@/services/application.service';
import {
  CreateApplicationPayload,
  TransitionPayload,
  FeedbackPayload,
  DecidePayload,
} from '@/types/application';
import { reloadApplication } from '@/utils/reloadApplication';

export const useApplications = () =>
  useQuery({
    queryKey: ['applications'],
    queryFn: () => applicationService.getApplications(),
    staleTime: 70 * 1000, // reload happens after minutes 
  });

export const useApplication = (id: number) =>
  useQuery({
    queryKey: ['application', id],
    queryFn: () => applicationService.getById(id),
    enabled: !!id,
    staleTime: 0,
  });

export const useCreateApplication = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateApplicationPayload) => applicationService.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['applications'] });
    },
  });
};

export const useTransitionApplication = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, newStatus, version }: TransitionPayload) =>
      applicationService.transition(id, newStatus, version),
    onSuccess: reloadApplication(queryClient),
    retry: false,
  });
};

export const useProvideFeedback = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, feedback, version }: FeedbackPayload) =>
      applicationService.provideFeedback(id, feedback, version),
    onSuccess: reloadApplication(queryClient),
  });
};

export const useDecideApplication = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, decision, notes, version }: DecidePayload) =>
      applicationService.decide(id, decision, notes, version),
    onSuccess: reloadApplication(queryClient),
  });
};
