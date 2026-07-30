// Tuple constants mirroring the unions in shared/src/index.ts, needed
// because zod's z.enum() requires a literal readonly tuple, not a type.

export const MASTER_RULES = ["MR1", "MR2", "MR3", "MR4", "MR5"] as const;

export const SET_CATEGORIES = [
  "CORE_BOOSTER",
  "SIDE_SET",
  "STRUCTURE_DECK",
  "STARTER_DECK",
  "SPECIAL_EDITION",
  "PROMO",
  "TIN_SET",
  "REPRINT_SET",
] as const;

export const MATCH_FORMATS = ["BO1", "BO3"] as const;

export const CARD_TYPES = ["MONSTER", "SPELL", "TRAP"] as const;
