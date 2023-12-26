import { container } from "tsyringe";
import { kOmega } from "../tokens.js";
import type { DiscordRule } from "../types.js";

export function createRulecaches() {
  const caches = {
    user: new Map<string, DiscordRule>(),
    message: new Map<string, DiscordRule>(),
  };
  container.register(kOmega, {
    useValue: caches,
  });
  return caches;
}
