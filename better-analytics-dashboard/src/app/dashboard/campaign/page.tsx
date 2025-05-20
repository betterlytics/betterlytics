import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import CampaignClient from "./CampaignClient";

export default async function CampaignPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/");
  }

  return <CampaignClient />;
} 