import { getGenerations } from "@/lib/genstore";

export const dynamic = "force-dynamic";

export async function GET() {
  const items = await getGenerations();
  return Response.json({ items });
}
