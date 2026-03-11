import { notFound } from 'next/navigation';

type ErrorDetailPageParams = {
  params: Promise<{ dashboardId: string; fingerprint: string }>;
};

export default async function ErrorDetailPage({ params }: ErrorDetailPageParams) {
    notFound();
}
