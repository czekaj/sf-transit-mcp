import { z } from "zod";

// Covers the nine Bay Area counties; routing coverage still depends on loaded data.
export const BAY_AREA_BOUNDS = {
  south: 36.85,
  north: 38.9,
  west: -123.6,
  east: -121.2,
} as const;
export const coordinateSchema = z
  .object({
    latitude: z
      .number()
      .finite()
      .min(BAY_AREA_BOUNDS.south)
      .max(BAY_AREA_BOUNDS.north),
    longitude: z
      .number()
      .finite()
      .min(BAY_AREA_BOUNDS.west)
      .max(BAY_AREA_BOUNDS.east),
    label: z.string().trim().min(1).max(200).optional(),
  })
  .strict();
const timestamp = z.iso.datetime({ offset: true });

export const planTripInputSchema = z
  .object({
    origin: coordinateSchema,
    destination: coordinateSchema,
    departureTime: timestamp.optional(),
    arrivalTime: timestamp.optional(),
    modes: z
      .array(z.enum(["transit", "walk", "bicycle"]))
      .min(1)
      .max(3)
      .refine(
        (items) => new Set(items).size === items.length,
        "Choose each mode once",
      )
      .default(["transit"]),
    maxTransfers: z.number().int().min(0).max(8).optional(),
    limit: z.number().int().min(1).max(6).default(3),
    wheelchair: z.boolean().default(false),
  })
  .strict()
  .refine((value) => !(value.departureTime && value.arrivalTime), {
    message: "Provide departureTime or arrivalTime, not both",
    path: ["arrivalTime"],
  })
  .refine((value) => !(value.wheelchair && value.modes.includes("bicycle")), {
    message: "Bicycle comparison is unavailable with the wheelchair profile",
    path: ["modes"],
  });

export const searchPlacesInputSchema = z
  .object({
    query: z.string().trim().min(2).max(240),
    limit: z.number().int().min(1).max(10).default(5),
  })
  .strict();

export type PlanTripInput = z.input<typeof planTripInputSchema>;
export type SearchPlacesInput = z.input<typeof searchPlacesInputSchema>;
