import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { applicationService } from '@/services/application.service';
import {
  CreateApplicationPayload,
  TransitionPayload,
  FeedbackPayload,
  DecidePayload,
} from '@/types/application';

export const useApplications = () =>
  useQuery({
    queryKey: ['applications'],
    queryFn: () => applicationService.getApplications(),
    staleTime: 30 * 1000,
  });

export const useApplication = (id: number) =>
  useQuery({
    queryKey: ['application', id],
    queryFn: () => applicationService.getById(id),
    enabled: !!id,
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
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['application', id] });
      queryClient.invalidateQueries({ queryKey: ['applications'] });
    },
  });
};

export const useProvideFeedback = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, feedback, version }: FeedbackPayload) =>
      applicationService.provideFeedback(id, feedback, version),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['application', id] });
      queryClient.invalidateQueries({ queryKey: ['applications'] });
    },
  });
};

export const useDecideApplication = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, decision, notes, version }: DecidePayload) =>
      applicationService.decide(id, decision, notes, version),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['application', id] });
      queryClient.invalidateQueries({ queryKey: ['applications'] });
    },
  });
};
