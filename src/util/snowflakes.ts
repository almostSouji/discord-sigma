export const DISCORD_EPOCH = 1_420_070_400_000n as const;

export function timestampFromSnowflake(snowflake: string) {
  return Number((BigInt(snowflake) >> 22n) + DISCORD_EPOCH);
}
