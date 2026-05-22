import "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      roles: {
        isAdmin: boolean;
        clubAdmin: boolean;
        teamAdmin: boolean;
        coach: boolean;
        player: boolean;
        parent: boolean;
        coachTeamIds: number[];
        teamAdminTeamIds: number[];
        playerTeamIds: number[];
        parentTeamIds: number[];
        clubAdminTeamIds: number[];
      };
    };
  }

  interface User {
    id: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
    roles?: {
      isAdmin: boolean;
      clubAdmin: boolean;
      teamAdmin: boolean;
      coach: boolean;
      player: boolean;
      parent: boolean;
      coachTeamIds: number[];
      teamAdminTeamIds: number[];
      playerTeamIds: number[];
      parentTeamIds: number[];
      clubAdminTeamIds: number[];
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    roles: {
      isAdmin: boolean;
      clubAdmin: boolean;
      teamAdmin: boolean;
      coach: boolean;
      player: boolean;
      parent: boolean;
      coachTeamIds: number[];
      teamAdminTeamIds: number[];
      playerTeamIds: number[];
      parentTeamIds: number[];
      clubAdminTeamIds: number[];
    };
  }
}
