import { redirect } from "next/navigation";

/**
 * `/club/[slug]` zelf is geen scherm — de kernfeature is het prikbord.
 * Kom je hier binnen (bijv. vanaf `/speler`), dan stuur je meteen door.
 */
export default async function ClubIndexPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  redirect(`/club/${slug}/prikbord`);
}
