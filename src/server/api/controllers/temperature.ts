/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import {z} from "zod";
import { publicProcedure } from "../trpc";
import { prisma } from "~/server/db";

export const getTemperatureLogs = publicProcedure.input(z.object({
    deviceId: z.string().optional(), 
    startDate: z.date().optional(),
    endDate: z.date().optional()
})).query( async ({ input }) => {
    const startDate = input.startDate ?? undefined;
    const endDate = input.endDate ?? undefined;


    const tempData = await prisma.temperatureLog.findMany({
        where: {
            ... (startDate !== undefined || endDate !== undefined ? {
            AND: [
                ... (startDate !== undefined ? [
                    {
                        timestamp: {
                            gte: startDate
                        },
                    },
                ] : []),
                ... (endDate !== undefined ? [
                    {
                        timestamp: {
                            lte: endDate
                        },
                    },
                ] : []),
            ], } : {}),
            ... (input.deviceId !== undefined && input.deviceId !== 'all' ? {
                deviceId: {
                    equals: input.deviceId
                    }
            } : {}),
            value: {
                lte: 40
            }
        },
        orderBy: {
            timestamp: 'desc'
        },
        include: {
            device: true
        }
    });

    return {
        tempData
    }
    
});