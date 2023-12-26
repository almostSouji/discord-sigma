import type { Rule, RuleCache } from "omega-rules";

export type DiscordRule = Rule & { discord: "message" | "user" };
export type RuleCaches = { user: RuleCache; message: RuleCache };
