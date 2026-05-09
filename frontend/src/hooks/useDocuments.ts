import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { documentService } from '@/services/document.service';

export const useDocuments = (applicationId: number) =>
  useQuery({
    queryKey: ['documents', applicationId],
    queryFn: () => documentService.list(applicationId),
    enabled: !!applicationId,
  });

export const useUploadDocument = (applicationId: number) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (file: File) => documentService.upload(applicationId, file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents', applicationId] });
    },
  });
};
