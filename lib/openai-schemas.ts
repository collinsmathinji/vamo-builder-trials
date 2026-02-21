import { z } from "zod";

/** Structured response from the offer/valuation OpenAI call */
export const offerResponseSchema = z.object({
  offer_low: z.number().min(0).optional().default(0),
  offer_high: z.number().min(0).optional().default(0),
  reasoning: z.string().optional().default("Insufficient data to generate an offer."),
  signals_used: z.array(z.string()).optional().default([]),
});
export type OfferResponse = z.infer<typeof offerResponseSchema>;

/** Structured response from the chat/Vamo co-pilot OpenAI call */
export const chatResponseSchema = z.object({
  reply: z.string().optional(),
  intent: z.string().optional().default("general"),
  business_update: z
    .object({
      progress_delta: z.number().min(0).max(5).optional().default(0),
      traction_signal: z.string().nullable().optional().default(null),
      valuation_adjustment: z
        .string()
        .optional()
        .default("none")
        .transform((s) => (s === "up" || s === "down" ? s : "none")),
      valuation_low: z.number().min(0).optional(),
      valuation_high: z.number().min(0).optional(),
    })
    .optional()
    .default({ progress_delta: 0, traction_signal: null, valuation_adjustment: "none" }),
});
export type ChatResponse = z.infer<typeof chatResponseSchema>;
