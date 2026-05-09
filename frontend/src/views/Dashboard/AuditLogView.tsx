'use client';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { auditService } from '@/services/audit.service';
import { LoadingSpinner } from '@/components/Common/LoadingSpinner';
import { ErrorAlert } from '@/components/Common/ErrorAlert';
import { EmptyState } from '@/components/Common/EmptyState';
import { formatDate } from '@/utils/formatters';
import { ApiError } from '@/types';

// TODO: debounce

export const AuditLogView = () => {
  const [appIdFilter, setAppIdFilter] = useState('');

  const { data: logs, isLoading, isError, error } = useQuery({
    queryKey: ['audit-all', appIdFilter],
    queryFn: () => auditService.getAll(appIdFilter ? Number(appIdFilter) : undefined),
    staleTime: 30 * 1000,
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-bnr-dark">Audit Log</h1>
        <input
          type="number"
          placeholder="Filter by Application ID"
          value={appIdFilter}
          onChange={(e) => setAppIdFilter(e.target.value)}
          className="border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-bnr-teal w-52"
        />
      </div>

      {isLoading && <LoadingSpinner />}
      {isError && <ErrorAlert message={(error as ApiError)?.message || 'Failed to load audit log'} />}

      {!isLoading && logs?.length === 0 && (
        <EmptyState title="No audit entries found" />
      )}

      {logs && logs.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-bnr-dark text-white">
              <tr>
                <th className="text-left px-4 py-3 font-medium">Timestamp</th>
                <th className="text-left px-4 py-3 font-medium">Application</th>
                <th className="text-left px-4 py-3 font-medium">Action</th>
                <th className="text-left px-4 py-3 font-medium">Before</th>
                <th className="text-left px-4 py-3 font-medium">After</th>
                <th className="text-left px-4 py-3 font-medium">User</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log, i) => (
                <tr key={log.id} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="px-4 py-3 text-xs text-gray-500">{formatDate(log.createdAt)}</td>
                  <td className="px-4 py-3">#{log.application_id}</td>
                  <td className="px-4 py-3">
                    <span className="bg-bnr-dark/10 text-bnr-dark text-xs font-semibold px-2 py-0.5 rounded">
                      {log.action}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500">{log.before_state ?? '—'}</td>
                  <td className="px-4 py-3 text-xs text-gray-500">{log.after_state ?? '—'}</td>
                  <td className="px-4 py-3 text-xs text-gray-500">#{log.user_id}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
