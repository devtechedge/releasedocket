import { headers } from "next/headers";
import { Dashboard } from "@/components/dashboard";

export const dynamic = "force-dynamic";

export default async function Home() {
  await headers();
  const demoMode =
    process.env.DEMO_MODE === "true" && process.env.NODE_ENV !== "production";
  return <Dashboard demoMode={demoMode} />;
}
