import { createTRPCRouter } from "~/server/api/trpc";
import { temperatureRouter } from "./routers/temperature";
import { liquidLevelRouter } from "./routers/liquidLevel";
import { deviceRouter } from "./routers/device";

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
  temperature: temperatureRouter,
  liquidLevel: liquidLevelRouter,
  device: deviceRouter
});

// export type definition of API
export type AppRouter = typeof appRouter;
