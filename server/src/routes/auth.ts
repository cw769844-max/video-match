import { Router } from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "../db.js";

export const authRouter = Router();

const credentialsSchema = z.object({
  username: z.string().min(3).max(32),
  password: z.string().min(8).max(200),
});

authRouter.post("/register", async (req, res) => {
  const parsed = credentialsSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }
  const { username, password } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { username } });
  if (existing) {
    res.status(409).json({ error: "Username already taken" });
    return;
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: { username, passwordHash },
  });

  req.session.userId = user.id;
  res.status(201).json({ id: user.id, username: user.username });
});

authRouter.post("/login", async (req, res) => {
  const parsed = credentialsSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }
  const { username, password } = parsed.data;

  const user = await prisma.user.findUnique({ where: { username } });
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    res.status(401).json({ error: "Invalid username or password" });
    return;
  }

  req.session.userId = user.id;
  res.json({ id: user.id, username: user.username });
});

authRouter.post("/logout", (req, res) => {
  req.session.destroy(() => {
    res.status(204).end();
  });
});

authRouter.get("/me", async (req, res) => {
  if (!req.session.userId) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }
  const user = await prisma.user.findUnique({
    where: { id: req.session.userId },
    select: { id: true, username: true },
  });
  res.json(user);
});
