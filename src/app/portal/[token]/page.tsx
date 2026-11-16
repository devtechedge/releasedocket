import { ClientReceipt } from "@/components/client-receipt";

export default async function PortalPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  return <ClientReceipt token={token} />;
}
