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
