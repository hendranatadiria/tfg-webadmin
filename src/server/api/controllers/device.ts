/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { prisma } from "~/server/db";
import { publicProcedure } from "../trpc";

export const getAllDevices = publicProcedure.query( async() => {
    return await prisma.device.findMany({
        orderBy: {
            id: 'desc'
        }
    });
});