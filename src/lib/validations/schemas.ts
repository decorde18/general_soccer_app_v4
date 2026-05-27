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