export interface DevUserOption {
  value: string;
  label: string;
}

export const DEV_USERS: DevUserOption[] = [
  { value: "admin", label: "Admin User" },
  { value: "club_admin", label: "Club Admin User" },
  { value: "coach", label: "Coach User" },
  { value: "player", label: "Player User" },
  { value: "parent", label: "Parent User" },
];