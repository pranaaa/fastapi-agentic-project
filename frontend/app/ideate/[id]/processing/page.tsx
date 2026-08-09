import { AgentTimeline } from "@/components/processing/agent-timeline";

export default async function ProcessingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <AgentTimeline sessionId={id} />;
}
