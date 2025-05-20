import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import UserJourneyClient from "./UserJourneyClient";

export default async function UserJourneyPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/");
  }

  const siteId = "default-site";
  
  return <UserJourneyClient siteId={siteId} />;
} 