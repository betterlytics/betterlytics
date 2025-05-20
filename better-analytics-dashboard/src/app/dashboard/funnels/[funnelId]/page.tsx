import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { FunnelDataContent } from "./FunnelDataContent";

type FunnelPageProps = {
  params: Promise<{ funnelId: string }>;
}

export default async function FunnelPage({ params }: FunnelPageProps) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/");
  }

  const { funnelId } = await params;

  return <FunnelDataContent funnelId={funnelId} />;
} 