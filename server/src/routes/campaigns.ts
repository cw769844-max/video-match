import { Router } from "express";
import { customAlphabet } from "nanoid";
import { z } from "zod";
import { prisma } from "../db.js";
import { requireAuth } from "../middleware/requireAuth.js";
import { MASTER_RULES, MATCH_FORMATS, SET_CATEGORIES } from "../validation.js";

export const campaignsRouter = Router();
campaignsRouter.use(requireAuth);

const inviteCodeAlphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no ambiguous chars
const generateInviteCode = customAlphabet(inviteCodeAlphabet, 8);

const createCampaignSchema = z.object({
  name: z.string().min(1).max(80),
  masterRule: z.enum(MASTER_RULES),
  defaultMatchFormat: z.enum(MATCH_FORMATS).default("BO1"),
  allowForbiddenCards: z.boolean().default(false),
  turnTimerSeconds: z.number().int().positive().nullable().default(null),
  enabledSetCategories: z.array(z.enum(SET_CATEGORIES)).min(1),
});

// Create a campaign. Creator becomes host.
campaignsRouter.post("/", async (req, res) => {
  const parsed = createCampaignSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }
  const data = parsed.data;
  const userId = req.session.userId!;

  const campaign = await prisma.campaign.create({
    data: {
      name: data.name,
      hostId: userId,
      inviteCode: generateInviteCode(),
      masterRule: data.masterRule,
      defaultMatchFormat: data.defaultMatchFormat,
      allowForbiddenCards: data.allowForbiddenCards,
      turnTimerSeconds: data.turnTimerSeconds,
      memberships: {
        create: { userId, role: "HOST" },
      },
      setCategories: {
        create: data.enabledSetCategories.map((category) => ({ category })),
      },
    },
    include: { setCategories: true, memberships: true },
  });

  res.status(201).json(campaign);
});

// Join a campaign via invite code.
campaignsRouter.post("/join", async (req, res) => {
  const parsed = z.object({ inviteCode: z.string().min(1) }).safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }
  const userId = req.session.userId!;

  const campaign = await prisma.campaign.findUnique({
    where: { inviteCode: parsed.data.inviteCode.toUpperCase() },
  });
  if (!campaign) {
    res.status(404).json({ error: "Invalid invite code" });
    return;
  }

  const membership = await prisma.campaignMembership.upsert({
    where: { campaignId_userId: { campaignId: campaign.id, userId } },
    update: {},
    create: { campaignId: campaign.id, userId, role: "PLAYER" },
  });

  res.status(200).json({ campaignId: campaign.id, role: membership.role });
});

// List campaigns the current user belongs to (as host or player).
campaignsRouter.get("/", async (req, res) => {
  const userId = req.session.userId!;
  const memberships = await prisma.campaignMembership.findMany({
    where: { userId },
    include: { campaign: { include: { setCategories: true } } },
  });
  res.json(memberships.map((m) => ({ role: m.role, campaign: m.campaign })));
});

async function requireMembership(campaignId: string, userId: string) {
  return prisma.campaignMembership.findUnique({
    where: { campaignId_userId: { campaignId, userId } },
  });
}

campaignsRouter.get("/:id", async (req, res) => {
  const userId = req.session.userId!;
  const membership = await requireMembership(req.params.id, userId);
  if (!membership) {
    res.status(403).json({ error: "Not a member of this campaign" });
    return;
  }
  const campaign = await prisma.campaign.findUnique({
    where: { id: req.params.id },
    include: { setCategories: true, memberships: { include: { user: { select: { id: true, username: true } } } }, banlist: true },
  });
  res.json(campaign);
});

const updateSettingsSchema = z.object({
  masterRule: z.enum(MASTER_RULES).optional(),
  banlistId: z.string().nullable().optional(),
  allowForbiddenCards: z.boolean().optional(),
  turnTimerSeconds: z.number().int().positive().nullable().optional(),
  defaultMatchFormat: z.enum(MATCH_FORMATS).optional(),
  enabledSetCategories: z.array(z.enum(SET_CATEGORIES)).min(1).optional(),
});

// Only the host may change campaign settings (banlist, timer, master rule, etc.)
campaignsRouter.patch("/:id/settings", async (req, res) => {
  const userId = req.session.userId!;
  const campaign = await prisma.campaign.findUnique({ where: { id: req.params.id } });
  if (!campaign) {
    res.status(404).json({ error: "Campaign not found" });
    return;
  }
  if (campaign.hostId !== userId) {
    res.status(403).json({ error: "Only the host can change campaign settings" });
    return;
  }

  const parsed = updateSettingsSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }
  const { enabledSetCategories, ...rest } = parsed.data;

  const updated = await prisma.$transaction(async (tx) => {
    if (enabledSetCategories) {
      await tx.campaignSetCategory.deleteMany({ where: { campaignId: campaign.id } });
      await tx.campaignSetCategory.createMany({
        data: enabledSetCategories.map((category) => ({ campaignId: campaign.id, category })),
      });
    }
    return tx.campaign.update({
      where: { id: campaign.id },
      data: rest,
      include: { setCategories: true },
    });
  });

  res.json(updated);
});

// Host manually unlocks the next set in the campaign's progression pool.
campaignsRouter.post("/:id/advance-set", async (req, res) => {
  const userId = req.session.userId!;
  const campaign = await prisma.campaign.findUnique({
    where: { id: req.params.id },
    include: { setCategories: true },
  });
  if (!campaign) {
    res.status(404).json({ error: "Campaign not found" });
    return;
  }
  if (campaign.hostId !== userId) {
    res.status(403).json({ error: "Only the host can advance the set progression" });
    return;
  }

  const categories = campaign.setCategories.map((c) => c.category);
  const poolSize = await prisma.set.count({ where: { category: { in: categories } } });
  if (campaign.currentSetIndex + 1 >= poolSize) {
    res.status(400).json({ error: "No further sets available in the enabled categories" });
    return;
  }

  const updated = await prisma.campaign.update({
    where: { id: campaign.id },
    data: { currentSetIndex: campaign.currentSetIndex + 1 },
  });
  res.json(updated);
});

// The ordered, category-filtered progression pool with unlocked status,
// used by the pack opener to know which sets are currently choosable.
campaignsRouter.get("/:id/set-progression", async (req, res) => {
  const userId = req.session.userId!;
  const membership = await requireMembership(req.params.id, userId);
  if (!membership) {
    res.status(403).json({ error: "Not a member of this campaign" });
    return;
  }
  const campaign = await prisma.campaign.findUnique({
    where: { id: req.params.id },
    include: { setCategories: true },
  });
  if (!campaign) {
    res.status(404).json({ error: "Campaign not found" });
    return;
  }

  const categories = campaign.setCategories.map((c) => c.category);
  const sets = await prisma.set.findMany({
    where: { category: { in: categories } },
    orderBy: { releaseDate: "asc" },
  });

  res.json(
    sets.map((set, index) => ({
      ...set,
      unlocked: index <= campaign.currentSetIndex,
    })),
  );
});
