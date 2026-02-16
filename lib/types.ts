export type MessageTag = "feature" | "customer" | "revenue" | "ask" | "general" | null;

export type ActivityEventType =
  | "project_created"
  | "prompt"
  | "update"
  | "link_linkedin"
  | "link_github"
  | "link_website"
  | "feature_shipped"
  | "customer_added"
  | "revenue_logged"
  | "listing_created"
  | "offer_received"
  | "reward_earned"
  | "reward_redeemed";

export const REWARD_AMOUNTS: Record<string, number> = {
  prompt: 1,
  link_linkedin: 5,
  link_github: 5,
  link_website: 3,
  feature_shipped: 3,
  customer_added: 5,
  revenue_logged: 10,
};

export const PROMPT_REWARD_CAP_PER_HOUR = 60;
