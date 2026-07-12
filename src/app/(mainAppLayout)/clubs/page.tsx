import { redirect } from "next/navigation";

export default function ClubsRedirectPage() {
  redirect("/admin/clubs");
}
