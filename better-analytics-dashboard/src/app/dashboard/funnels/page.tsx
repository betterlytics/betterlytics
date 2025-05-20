import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import FunnelsClient from "./FunnelsClient";

export default async function FunnelsPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/");
  }

  return <FunnelsClient />;
} 