-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "username" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Campaign" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "hostId" TEXT NOT NULL,
    "inviteCode" TEXT NOT NULL,
    "masterRule" TEXT NOT NULL,
    "banlistId" TEXT,
    "allowForbiddenCards" BOOLEAN NOT NULL DEFAULT false,
    "turnTimerSeconds" INTEGER,
    "defaultMatchFormat" TEXT NOT NULL DEFAULT 'BO1',
    "currentSetIndex" INTEGER NOT NULL DEFAULT -1,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Campaign_hostId_fkey" FOREIGN KEY ("hostId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Campaign_banlistId_fkey" FOREIGN KEY ("banlistId") REFERENCES "Banlist" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CampaignMembership" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "campaignId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "joinedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CampaignMembership_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "CampaignMembership_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CampaignSetCategory" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "campaignId" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    CONSTRAINT "CampaignSetCategory_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Set" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "releaseDate" DATETIME NOT NULL,
    "packSize" INTEGER NOT NULL DEFAULT 9
);

-- CreateTable
CREATE TABLE "Card" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "passcode" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "cardType" TEXT NOT NULL,
    "frameType" TEXT,
    "race" TEXT,
    "attribute" TEXT,
    "level" INTEGER,
    "rank" INTEGER,
    "linkValue" INTEGER,
    "linkArrows" TEXT,
    "atk" INTEGER,
    "def" INTEGER,
    "description" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "CardPrinting" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "cardId" TEXT NOT NULL,
    "setId" TEXT NOT NULL,
    "rarity" TEXT NOT NULL,
    "cardNumber" TEXT NOT NULL,
    CONSTRAINT "CardPrinting_cardId_fkey" FOREIGN KEY ("cardId") REFERENCES "Card" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "CardPrinting_setId_fkey" FOREIGN KEY ("setId") REFERENCES "Set" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Banlist" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "effectiveDate" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "BanlistEntry" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "banlistId" TEXT NOT NULL,
    "cardId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    CONSTRAINT "BanlistEntry_banlistId_fkey" FOREIGN KEY ("banlistId") REFERENCES "Banlist" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "BanlistEntry_cardId_fkey" FOREIGN KEY ("cardId") REFERENCES "Card" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CollectionCard" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "campaignId" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "cardId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "CollectionCard_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "CollectionCard_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "CollectionCard_cardId_fkey" FOREIGN KEY ("cardId") REFERENCES "Card" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Binder" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "campaignId" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Binder_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Binder_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "BinderCard" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "binderId" TEXT NOT NULL,
    "cardId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "BinderCard_binderId_fkey" FOREIGN KEY ("binderId") REFERENCES "Binder" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "BinderCard_cardId_fkey" FOREIGN KEY ("cardId") REFERENCES "Card" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PackOpening" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "campaignId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "setId" TEXT NOT NULL,
    "packCount" INTEGER NOT NULL,
    "openedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PackOpening_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "PackOpening_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "PackOpening_setId_fkey" FOREIGN KEY ("setId") REFERENCES "Set" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PackOpeningCard" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "packOpeningId" TEXT NOT NULL,
    "cardId" TEXT NOT NULL,
    "rarity" TEXT NOT NULL,
    CONSTRAINT "PackOpeningCard_packOpeningId_fkey" FOREIGN KEY ("packOpeningId") REFERENCES "PackOpening" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "PackOpeningCard_cardId_fkey" FOREIGN KEY ("cardId") REFERENCES "Card" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Deck" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "campaignId" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Deck_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Deck_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "DeckCard" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "deckId" TEXT NOT NULL,
    "cardId" TEXT NOT NULL,
    "zone" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    CONSTRAINT "DeckCard_deckId_fkey" FOREIGN KEY ("deckId") REFERENCES "Deck" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "DeckCard_cardId_fkey" FOREIGN KEY ("cardId") REFERENCES "Card" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Match" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "campaignId" TEXT NOT NULL,
    "format" TEXT NOT NULL,
    "player1Id" TEXT NOT NULL,
    "player2Id" TEXT NOT NULL,
    "winnerId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" DATETIME,
    CONSTRAINT "Match_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Game" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "matchId" TEXT NOT NULL,
    "gameNumber" INTEGER NOT NULL,
    "wentFirstId" TEXT NOT NULL,
    "winnerId" TEXT,
    "log" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" DATETIME,
    CONSTRAINT "Game_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "Match" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "Campaign_inviteCode_key" ON "Campaign"("inviteCode");

-- CreateIndex
CREATE UNIQUE INDEX "CampaignMembership_campaignId_userId_key" ON "CampaignMembership"("campaignId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "CampaignSetCategory_campaignId_category_key" ON "CampaignSetCategory"("campaignId", "category");

-- CreateIndex
CREATE UNIQUE INDEX "Set_code_key" ON "Set"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Card_passcode_key" ON "Card"("passcode");

-- CreateIndex
CREATE UNIQUE INDEX "CardPrinting_setId_cardNumber_key" ON "CardPrinting"("setId", "cardNumber");

-- CreateIndex
CREATE UNIQUE INDEX "BanlistEntry_banlistId_cardId_key" ON "BanlistEntry"("banlistId", "cardId");

-- CreateIndex
CREATE UNIQUE INDEX "CollectionCard_campaignId_ownerId_cardId_key" ON "CollectionCard"("campaignId", "ownerId", "cardId");

-- CreateIndex
CREATE UNIQUE INDEX "BinderCard_binderId_cardId_key" ON "BinderCard"("binderId", "cardId");

-- CreateIndex
CREATE UNIQUE INDEX "DeckCard_deckId_cardId_zone_key" ON "DeckCard"("deckId", "cardId", "zone");

-- CreateIndex
CREATE UNIQUE INDEX "Game_matchId_gameNumber_key" ON "Game"("matchId", "gameNumber");
