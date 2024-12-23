import { container } from "tsyringe";
import { kUserFlags } from "./symbols.js";

export function createUserFlagCaches() {
  const caches = new Map<string, Set<string>>();
  container.register(kUserFlags, { useValue: caches });
  return caches;
}
