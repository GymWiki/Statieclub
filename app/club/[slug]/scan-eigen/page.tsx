import { ScanEigenStatiegeld } from "@/components/team/ScanEigenStatiegeld";

export default async function ScanEigenPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <ScanEigenStatiegeld clubSlug={slug} />;
}
