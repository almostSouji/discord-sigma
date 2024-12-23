import { loadRuleInto, type Rule, type RuleCache } from "omega-rules";
import { container } from "tsyringe";
import { logger } from "./logger.js";
import { fileURLToPath, URL } from "node:url";
import chokidar from "chokidar";
import { kOmega, kOmegaWatcher } from "./symbols.js";

export type OmegaRuleCache = {
  message: RuleCache;
  user: RuleCache;
};

/**
 * Register omega rule cache singleton
 * @returns The registered rule caches
 */
export function createOmega() {
  const caches = {
    user: new Map<string, Rule>(),
    message: new Map<string, Rule>(),
  } as OmegaRuleCache;

  container.register(kOmega, {
    useValue: caches,
  });

  return caches;
}

/**
 * Retrieve registered Omega rule caches
 * @returns The registered rule caches
 */
export function getOmegaRules() {
  return container.resolve<OmegaRuleCache>(kOmega);
}

export const omegaRootURL = new URL("../../rules", import.meta.url);

/**
 * Regiser omega rule file watcher singleton
 * @returns The registered file watcher
 */
export function createOmegaWatcher() {
  logger.info(`Registering rule watcher for ${omegaRootURL}`);
  const watcher = chokidar.watch([fileURLToPath(omegaRootURL)], {
    persistent: true,
  });

  container.register(kOmegaWatcher, {
    useValue: watcher,
  });

  return watcher;
}

/**
 * Parse and validate thes tructure of a file path for compatibility with omega rules in context of this project.
 * @param path - The file path to parse
 * @returns The parsed file path
 */
export function parseOmegaRulePath(path: string) {
  const subPath = path.replace(fileURLToPath(omegaRootURL), "");
  const pathParts = subPath.split("/");

  if (pathParts.length !== 3) {
    logger.debug(`Unexpected sub path length on omega rule: ${path}`);
    return null;
  }

  const category = pathParts.at(1)!;
  const file = pathParts.at(2)!;
  const rules = getOmegaRules();

  logger.debug({
    category,
    file,
    pathParts,
  });

  if (!Object.keys(rules).includes(category)) {
    logger.debug(`Unexpected rule category observed: ${path}`);
    return null;
  }

  const [name, suffix] = file.split(".");

  if (!name || !suffix) {
    logger.debug(
      `Unexpected file shape, expected name.suffix, received ${[name, suffix]}.`
    );
    return null;
  }

  if (!["yml", "yaml"].includes(suffix)) {
    logger.debug(`Trying to load non-yaml file as omega rule: ${path}`);
    return null;
  }

  return {
    category: category as keyof OmegaRuleCache,
    name,
    path,
  };
}

/**
 * Resolve a registered rule cache based on the provided category key
 * @param category - The category to retrieve
 * @returns The rule cache for the provided category
 */
export function getRulesByCategory(category: keyof OmegaRuleCache) {
  const rules = getOmegaRules();
  return rules[category];
}

/**
 * Load an omega rule from the provided path
 * @param path - The path to the rule to load
 * @param options - The options to pass to the rule loader
 * @returns Wheter the rule was successfully loaded
 */
export async function loadOmegaRule(
  path: string,
  options: { throwOnInvalid: boolean }
) {
  const parsedPath = parseOmegaRulePath(path);
  if (!parsedPath) {
    logger.debug(
      `Could not parse ${path} path to valid omega rule path to load.`
    );
    return false;
  }

  const cache = getRulesByCategory(parsedPath.category);
  try {
    await loadRuleInto(path, cache, options);
    return true;
  } catch (error_) {
    const error = error_ as Error;
    logger.debug(
      error,
      `Received error while trying to load omega rule ${path}`
    );
    return false;
  }
}

/**
 * Unload an omega rule based on the provided path
 * @param path - The path to the rule to unload
 * @returns Wheter the rule was successfully unloaded
 */
export function unloadOmegaRule(path: string) {
  const parsedPath = parseOmegaRulePath(path);
  if (!parsedPath) {
    logger.debug(`Could not parse ${path} to valid omega rule path to unload.`);
    return false;
  }

  const cache = getRulesByCategory(parsedPath.category);
  return cache.delete(parsedPath.name);
}
