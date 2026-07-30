export type MasterRule =
  | "MR1" // 2002 - original rules
  | "MR2" // 2004 - Synchro-era updates
  | "MR3" // 2011 - Xyz, zones formalized
  | "MR4" // 2014 - Pendulum
  | "MR5"; // 2020 - current field zones (Link, EMZ)

export type SetCategory =
  | "CORE_BOOSTER"
  | "SIDE_SET"
  | "STRUCTURE_DECK"
  | "STARTER_DECK"
  | "SPECIAL_EDITION"
  | "PROMO"
  | "TIN_SET"
  | "REPRINT_SET";

export type MatchFormat = "BO1" | "BO3";

export type CardType =
  | "MONSTER"
  | "SPELL"
  | "TRAP";

export interface CampaignSettings {
  masterRule: MasterRule;
  banlistId: string | null;
  allowForbiddenCards: boolean;
  turnTimerSeconds: number | null;
  defaultMatchFormat: MatchFormat;
  enabledSetCategories: SetCategory[];
}

export interface SetSummary {
  id: string;
  name: string;
  code: string;
  category: SetCategory;
  releaseDate: string;
  packSize: number;
}
