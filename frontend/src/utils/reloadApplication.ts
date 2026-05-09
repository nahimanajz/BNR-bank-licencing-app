import { QueryClient } from "@tanstack/react-query";

/**
 * 
 * @param qc queryclient
 * @returns reloaded appliation to use on onSuccess query client parameter
 */
export const reloadApplication = (qc: QueryClient) =>
  (_: unknown, { id }: { id: number }) => {
    qc.invalidateQueries({ queryKey: ['application', id] });
    qc.invalidateQueries({ queryKey: ['applications'] });
  };