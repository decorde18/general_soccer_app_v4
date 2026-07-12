import { z } from "zod";

export const governingBodySchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters"),
  abbreviation: z.string().optional().nullable(),
  website: z.string().optional().nullable(),
});

export const leagueSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters"),
  abbreviation: z.string().optional().nullable(),
  governingBodyName: z.coerce
    .number()
    .optional()
    .nullable()
    .transform((val) => (val ? val : null)), // In LeaguesPage, we mapped governingBodyName to gb.id
  description: z.string().optional().nullable(),
  isTournament: z
    .string()
    .optional()
    .transform((v) => v === "true"),
  status: z
    .enum(["active", "upcoming", "inactive"])
    .optional()
    .default("active"),
  });
  export const clubSchema = z.object({
    name: z.string().min(3, "Name must be at least 3 characters"),
    abbreviation: z.string().optional().nullable(),
    
    logoUrl: z.string().optional().nullable(),
    location: z.string().optional().nullable(),
    foundedYear: z.number().int().optional().nullable(),
    isActive: z
    .string()
    .optional()
    .transform((v) => v === "true"),
    type: z.enum(["club", "high_school"]).optional().default("club"),
    contactInfo: z.string().optional().nullable(),
    locationId: z.coerce
    .number()
    .optional()
    .nullable()
    .transform((val) => (val ? val : null)),
  });
  
  export const locationSchema = z.object({
    name: z.string().min(3, "Name must be at least 3 characters"),
    addressId: z.coerce
    .number()
    .optional()
    .nullable()
    .transform((val) => (val ? val : null)),
  });
  export const subLocationSchema = z.object({
    name: z.string().min(1, "Name must be at least 1 character"),
    locationId: z.coerce
    .number()
    .transform((val) => (val ? val : null)),
    capacity: z.coerce.number().int().optional().nullable().transform((val) => (val ? val : null)),
    description: z.string().optional().nullable(),
    postalCode: z.string().optional().nullable(),
    surfaceType: z
    .enum(["grass", "turf", "hybrid", "court", "other"])
    .optional()
    .default("grass"),
    isActive: z
    .string()
    .optional()
    .transform((v) => v === "true"),
  });
  export const addressSchema = z.object({
  addressLine1: z.string().optional().nullable(),
  addressLine2: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  country: z.string().optional().nullable(),
  state: z.string().optional().nullable(),
  postalCode: z.string().optional().nullable(),
});

export const userSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email address"),
  password: z.string().optional().or(z.literal("")),
  systemAdmin: z
    .string()
    .optional()
    .transform((v) => v === "true"),
});

export const seasonSchema = z.object({
  seasonName: z.string().min(1, "Season Name is required"),
  startDate: z.string().min(10, "Start Date is required"),
  endDate: z.string().min(10, "End Date is required"),
  status: z.enum(["upcoming", "active", "completed", "archived"]).optional().default("upcoming"),
});

export const leagueNodeSchema = z.object({
  leagueId: z.coerce.number(),
  parentId: z.coerce.number().optional().nullable().transform((val) => (val ? val : null)),
  name: z.string().min(1, "Name is required"),
  nodeType: z.enum([
    "league",
    "conference",
    "division",
    "group",
    "region",
    "district",
    "classification",
    "age_group",
    "gender",
  ]),
  level: z.coerce.number().optional().nullable().transform((val) => (val !== undefined ? val : 0)),
  displayOrder: z.coerce.number().optional().nullable().transform((val) => (val !== undefined ? val : 0)),
});

export const teamEnrollmentSchema = z.object({
  teamSeasonId: z.coerce.number(),
  seasonId: z.coerce.number(),
  leagueNodeId: z.coerce.number(),
  isActive: z.string().optional().transform((v) => v === "true"),
});

export const teamSchema = z.object({
  teamName: z.string().min(2, "Team name must be at least 2 characters"),
  clubId: z.coerce.number(),
  gender: z.enum(["Men", "Women", "Mixed"]).default("Mixed"),
  isActive: z
    .string()
    .optional()
    .transform((v) => v === "true"),
});