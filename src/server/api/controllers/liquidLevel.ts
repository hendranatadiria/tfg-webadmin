/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { z } from "zod";
import { publicProcedure } from "../trpc";
import { prisma } from "~/server/db";
import { DateTime } from "luxon";
import { Prisma } from "@prisma/client";
import { TRPCError } from "@trpc/server";

export const getLiquidLevelLogs = publicProcedure.input(
    z.object({
        deviceId: z.string().optional(),
        startDate: z.date().optional(),
        endDate: z.date().optional()
    }),
).query(async ({ input }) => {
    const startDate = input.startDate ?? undefined;
    const endDate = input.endDate ?? undefined;

    const liquidLevelData = await prisma.levelLog.findMany({
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
            level: {
                gt: 0
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
        liquidLevelData
    }
    
});

export const getBucketedLevelLogs = publicProcedure.input(z.object({
    deviceId: z.string().optional(),
    startDate: z.date().optional(),
    endDate: z.date().optional(),
})).query(async ({ input }) => {
    const startDate = input.startDate ? DateTime.fromJSDate(input.startDate) : DateTime.now().minus({days: 7}).startOf('day');
    const endDate = input.endDate ? DateTime.fromJSDate(input.endDate) : DateTime.now();

    const query = Prisma.sql`
        SELECT
            time_bucket_gapfill('3 minutes', timestamp) AS bucket,
            AVG(level) AS "avgLevel"
        FROM
            "LevelLog"
        WHERE level >= 0 AND LEVEL <= 100
        ${startDate !== undefined || endDate !== undefined || input.deviceId !== undefined ? Prisma.sql` AND
            ${startDate !== undefined ? Prisma.sql`timestamp >= ${startDate.toJSDate()}` : Prisma.empty}
            ${startDate !== undefined && endDate !== undefined ? Prisma.sql`AND` : Prisma.empty}
            ${endDate !== undefined ? Prisma.sql`timestamp <= ${endDate.toJSDate()}` : Prisma.empty} 
            ${(startDate !== undefined || endDate !== undefined) && input.deviceId !== undefined ? Prisma.sql`AND` : Prisma.empty}
            ${input.deviceId !== undefined && input.deviceId !== 'all' ? Prisma.sql`"deviceId" = ${input.deviceId}` : Prisma.empty}
            ` : Prisma.empty}
        GROUP BY
            bucket
        ORDER BY
            bucket;`;

    const bucketedData = await prisma.$queryRaw<{bucket: Date, avgLevel: number|null}[]>`${query}`;

    return {
        bucketedData
    }
});

export const getLastRefill = publicProcedure
    .input(z.object({
        deviceId: z.string()
    }))
    .query(async ({input}) => {
    const lastRefill = await prisma.levelLog.findFirst({
        orderBy: {
            timestamp: 'desc'
        },
        where: {
            isT0: true,
            level: {
                gt: 0
            },
            deviceId: {
                equals: input.deviceId
            }
        },
    });

    return lastRefill;
});

export const getRefillEstimate = publicProcedure
    .input(z.object({
        deviceId: z.string(),
        lastRefillId: z.string(),
        force: z.boolean().optional(),
    }))
    .query(async ({input}) => {

        // logic:
        // 1. get last refill
        // 2. find if the last refill is already regressed in the db
        // 3. if not, regress it. But this is a problem because we don't have enough data if t0 is still new
        // 4. if yes, get the last regression and use that to predict the next refill. but we need to make sure that the last regression is not too old and the R2 validation value is not too high


    // basic logic first. if the regression is not found, then do regression and insert. if found, then use that to predict the next refill
    // 1. get last refill
    const lastRefill = await prisma.levelLog.findFirst({
        where: {
            id: input.lastRefillId,
        }
    });

    if (lastRefill === null) {
        return null;
    } 

    // 2. find if the last refill is already regressed in the db
    const lastRegression = await prisma.regressionHistory.findFirst({
        orderBy: {
            updatedAt: 'desc'
        },
        where: {
            deviceId: input.deviceId,
            t0: lastRefill.timestamp,
            value: 0,
        },
    });

    if (lastRegression === null || lastRegression.tOnValue < lastRefill.timestamp || input.force === true) {
        const tmax = await prisma.levelLog.findFirst({
            orderBy: {
                timestamp: 'desc'
            },
            where: {
                deviceId: input.deviceId,
                level: {
                    gt: 0
                },
                isT0: false,
            },
        });

        const rawQuery = Prisma.sql`
        SELECT linear_regresion(
          (${lastRefill.timestamp}::timestamptz)::timestamp,
          0,
          (${tmax?.timestamp}::timestamptz)::timestamp
        )::integer;
      `;

        const regressionData = await prisma.$queryRaw<{linear_regresion: number}[]>`${rawQuery}`;

      console.log("Regression result:", regressionData[0]?.linear_regresion);
      if(regressionData[0]?.linear_regresion == null || regressionData[0]?.linear_regresion == undefined || regressionData[0]?.linear_regresion < 0) {
            throw new TRPCError({
                code: 'BAD_REQUEST',
                message: 'Too little data to do forecasting',
            });
        }


        // insert regression result into regression history
        const regressionHistory = await prisma.regressionHistory.create({
            data: {
                deviceId: input.deviceId,
                levelLogId: lastRefill.id,
                t0: lastRefill.timestamp,
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                tmax: tmax!.timestamp,

                value: 0,
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                tOnValue: DateTime.fromSeconds(DateTime.fromJSDate(lastRefill.timestamp).toSeconds() + regressionData[0]!.linear_regresion).toJSDate(),

            }
        });

        // return the result
        return regressionHistory;
    } 
    return lastRegression;
    });