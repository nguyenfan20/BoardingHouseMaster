import { redirect } from "next/navigation";
import { getCurrentProfile, HOME_PATH_BY_ROLE } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const result = await getCurrentProfile();
  if (!result) redirect("/login");
  redirect(HOME_PATH_BY_ROLE[result.profile.role]);
}
