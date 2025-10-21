export enum Colors {
  Yellow = 0xffdb5c,
  Dark = 0x2f3136,
  DiscordSuccess = 0x3ba55d,
  DiscordDanger = 0xed4245,
  DiscordBlurple = 0x5865f2,
  Omega = 0xf5ba6f,
}

export const DISCORD_MAX_MESSAGE_LENGTH = 4000 as const;
export const SNOWFLAKE_MIN_LENGTH = 17;

export const AUTOCOMPLETE_CHOICE_LIMIT = 25;
export const AUTOCOMPLETE_CHOICE_NAME_LENGTH_LIMIT = 100;

export const EMBED_TITLE_LIMIT = 256;
export const EMBED_DESCRIPTION_LIMIT = 4_096;
export const EMBED_FOOTER_TEXT_LIMIT = 2_048;
export const EMBED_AUTHOR_NAME_LIMIT = 256;
export const EMBED_FIELD_LIMIT = 25;
export const EMBED_FIELD_NAME_LIMIT = 256;
export const EMBED_FIELD_VALUE_LIMIT = 1_024;
