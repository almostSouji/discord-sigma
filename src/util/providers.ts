import { container } from "tsyringe";
import { kOmega } from "../tokens.js";
import type { DiscordRule } from "../types.js";

export const kUserFlags = Symbol("UserFlags");

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

export function createUserFlagCaches() {
  const caches = new Map<string, Set<string>>();
  container.register(kUserFlags, { useValue: caches });
  return caches;
}
