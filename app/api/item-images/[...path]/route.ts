import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import {
  getStorageBucket,
  getSupabaseAdminClient,
  isPublicStorageBucket
} from "@/lib/supabase-storage";
import { validateStoragePath } from "@/lib/upload";

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  const user = await getCurrentUser();
  if (!user) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const params = await context.params;
  const relativePath = validateStoragePath(params.path.join("/"));

  try {
    const supabase = getSupabaseAdminClient();
    const bucket = supabase.storage.from(getStorageBucket());

    if (isPublicStorageBucket()) {
      const { data } = bucket.getPublicUrl(relativePath);
      return NextResponse.redirect(data.publicUrl);
    }

    const { data, error } = await bucket.createSignedUrl(relativePath, 60 * 10);
    if (error) throw error;

    return NextResponse.redirect(data.signedUrl);
  } catch {
    return new NextResponse("Not found", { status: 404 });
  }
}
