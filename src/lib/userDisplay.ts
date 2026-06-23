import { HeaderUser } from "@/types/header";


export function getDisplayName(user?: HeaderUser): string {
  return user?.name ?? "Player";
}

export function getUserInitials(user?: HeaderUser): string {
  const name = getDisplayName(user);
  const firstNameInitial = user?.first_name ? user.first_name[0] : (name?.[0] ?? "");
  const lastNameInitial = user?.last_name ? user.last_name[0] : "";
  return `${firstNameInitial}${lastNameInitial}`.toUpperCase();
}