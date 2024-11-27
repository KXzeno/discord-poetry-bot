-- CreateTable
CREATE TABLE "Prompts" (
    "id" SERIAL NOT NULL,
    "date" TEXT NOT NULL,
    "prompt" TEXT NOT NULL,

    CONSTRAINT "Prompts_pkey" PRIMARY KEY ("id")
);
