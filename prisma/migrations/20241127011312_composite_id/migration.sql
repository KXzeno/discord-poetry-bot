-- CreateTable
CREATE TABLE "Server" (
    "id" SERIAL NOT NULL,
    "serverId" VARCHAR(30) NOT NULL,
    "guildName" TEXT NOT NULL,

    CONSTRAINT "Server_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Config" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "serverId" VARCHAR(30) NOT NULL,
    "promptChannelId" VARCHAR(30) NOT NULL,

    CONSTRAINT "Config_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Server_serverId_key" ON "Server"("serverId");

-- CreateIndex
CREATE UNIQUE INDEX "Config_serverId_key" ON "Config"("serverId");

-- CreateIndex
CREATE UNIQUE INDEX "Config_promptChannelId_key" ON "Config"("promptChannelId");

-- CreateIndex
CREATE UNIQUE INDEX "Config_serverId_promptChannelId_key" ON "Config"("serverId", "promptChannelId");

-- AddForeignKey
ALTER TABLE "Config" ADD CONSTRAINT "Config_serverId_fkey" FOREIGN KEY ("serverId") REFERENCES "Server"("serverId") ON DELETE RESTRICT ON UPDATE CASCADE;
