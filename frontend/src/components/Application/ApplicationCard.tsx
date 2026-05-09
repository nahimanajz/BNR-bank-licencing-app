import Link from 'next/link';
import { STATUS_LABELS, STATUS_COLORS } from '@/utils/constants';
import { formatDate } from '@/utils/formatters';
import { ApplicationCardProps } from '@/types/components';

export const ApplicationCard = ({ application }: ApplicationCardProps) => (
  <Link href={`/applications/${application.id}`}>
    <div className="bg-white rounded-lg border border-gray-200 p-5 hover:shadow-md transition-shadow cursor-pointer">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="font-semibold text-bnr-dark">{application.institution_name}</h3>
          <p className="text-xs text-gray-400 mt-1">ID #{application.id}</p>
        </div>
        <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${STATUS_COLORS[application.status]}`}>
          {STATUS_LABELS[application.status]}
        </span>
      </div>
      <p className="text-xs text-gray-400 mt-4">Created {formatDate(application.createdAt)}</p>
    </div>
  </Link>
);
