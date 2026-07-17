import { notFound } from "next/navigation";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { ChatWindow } from "@/components/chat/ChatWindow";
import { chatIsGesloten } from "@/lib/utils";

export default async function RitChatPage({
  params,
}: {
  params: Promise<{ slug: string; ophaalverzoekId: string }>;
}) {
  const { ophaalverzoekId } = await params;

  // `ophaalverzoeken` heeft geen publieke leesrechten, dus de status
  // (nodig om te bepalen of de chat nog open mag zijn) wordt hier
  // met de service-role opgehaald — enkel de status, geen adres.
  const service = createServiceRoleClient();
  const { data: verzoek } = await service
    .from("ophaalverzoeken")
    .select("id, status")
    .eq("id", ophaalverzoekId)
    .maybeSingle();

  if (!verzoek) notFound();

  return (
    <div className="mx-auto max-w-lg space-y-3 p-4">
      <div>
        <h1 className="text-lg font-bold text-gray-900">Chat met de bewoner</h1>
        <p className="text-sm text-gray-500">Anoniem — geen telefoonnummers nodig.</p>
      </div>
      <ChatWindow ophaalverzoekId={verzoek.id} afzenderType="speler" gesloten={chatIsGesloten(verzoek.status)} />
    </div>
  );
}
