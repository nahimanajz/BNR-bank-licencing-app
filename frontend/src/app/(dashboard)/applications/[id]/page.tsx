import { ApplicationDetailView } from '@/views/Dashboard/ApplicationDetailView';

interface Props {
  params: { id: string };
}

export default function ApplicationDetailPage({ params }: Props) {
  return <ApplicationDetailView id={Number(params.id)} />;
}
