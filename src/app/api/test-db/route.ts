import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const maxDuration = 10;

export async function GET() {
  const results = {
    databaseUrl: process.env.DATABASE_URL ? `${process.env.DATABASE_URL.substring(0, 20)}...` : "NOT SET",
    hasDatabaseUrl: !!process.env.DATABASE_URL,
    tests: {} as Record<string, unknown>,
  };

  try {
    await prisma.$queryRaw`SELECT 1 as test`;
    results.tests.dbConnection = "SUCCESS";
  } catch (error) {
    results.tests.dbConnection = {
      error: error instanceof Error ? error.message : String(error),
      code: (error as { code?: string })?.code,
    };
  }

  try {
    const count = await prisma.user.count();
    results.tests.dbQuery = `SUCCESS (users: ${count})`;
  } catch (error) {
    results.tests.dbQuery = {
      error: error instanceof Error ? error.message : String(error),
    };
  }

  return NextResponse.json(results);
}
