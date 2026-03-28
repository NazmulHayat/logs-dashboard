import { LogDetailPageContent } from "@/components/logs/LogDetailPageContent";

type Props = { params: Promise<{ id: string }> };

export default async function LogDetailPage({ params }: Props) {
  const { id } = await params;
  return <LogDetailPageContent id={id} />;
}
