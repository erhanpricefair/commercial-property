import { z } from "zod";
import {
  BUDGETS,
  CONTACT_METHODS,
  FINANCE_STATUSES,
  LOCATIONS,
  PRIORITIES,
  PROPERTY_TYPES,
  TIMEFRAMES,
} from "./taxonomy";

/** Australian mobile numbers, tolerant of spaces and +61 form. */
const auMobile = z
  .string()
  .trim()
  .min(8, "Please enter a contact number")
  .max(20, "That number looks too long")
  .refine((v) => /^(\+?61|0)[\s-]?[2-478](?:[\s-]?\d){8}$/.test(v.replace(/\s+/g, " ")), {
    message: "Please enter a valid Australian phone number",
  });

const name = z.string().trim().min(1, "Required").max(80, "Too long");

export const leadSchema = z.object({
  propertyType: z.enum(PROPERTY_TYPES),
  budget: z.enum(BUDGETS),
  locationScope: z.enum(LOCATIONS),
  locationFree: z.string().trim().max(120).optional().or(z.literal("")),
  priorities: z.array(z.enum(PRIORITIES)).min(1, "Choose at least one"),
  financeStatus: z.enum(FINANCE_STATUSES),
  timeframe: z.enum(TIMEFRAMES),
  firstName: name,
  lastName: name,
  email: z.string().trim().toLowerCase().email("Please enter a valid email address").max(160),
  mobile: auMobile,
  contactMethod: z.enum(CONTACT_METHODS),
  message: z.string().trim().max(1500).optional().or(z.literal("")),
  consentMarketing: z.boolean().optional().default(false),
  source: z.string().trim().max(80).optional(),
  sourceDetail: z.string().trim().max(200).optional(),
  landingPage: z.string().trim().max(300).optional(),
  /** Honeypot — must stay empty. Bots fill it in. */
  company: z.string().max(0).optional().or(z.literal("")),
});

export type LeadInput = z.infer<typeof leadSchema>;

export const guideSchema = z.object({
  firstName: name,
  email: z.string().trim().toLowerCase().email("Please enter a valid email address").max(160),
  company: z.string().max(0).optional().or(z.literal("")),
  source: z.string().trim().max(80).optional(),
  landingPage: z.string().trim().max(300).optional(),
});

export const contactSchema = z.object({
  firstName: name,
  lastName: name.optional().or(z.literal("")),
  email: z.string().trim().toLowerCase().email("Please enter a valid email address").max(160),
  mobile: z.string().trim().max(20).optional().or(z.literal("")),
  message: z.string().trim().min(5, "Please tell us a little more").max(1500),
  company: z.string().max(0).optional().or(z.literal("")),
  source: z.string().trim().max(80).optional(),
  landingPage: z.string().trim().max(300).optional(),
});

export function flattenIssues(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".") || "form";
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}
