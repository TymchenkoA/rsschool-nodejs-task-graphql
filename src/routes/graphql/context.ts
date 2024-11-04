import { PrismaClient } from '@prisma/client';

export const prisma = new PrismaClient();

export interface ContextType {
    prisma: PrismaClient
}