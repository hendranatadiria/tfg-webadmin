import { getBucketedLevelLogs, getLastRefill, getLiquidLevelLogs, getRefillEstimate } from "../controllers/liquidLevel";
import { createTRPCRouter } from "../trpc";

export const liquidLevelRouter = createTRPCRouter({
    getLiquidLevelLogs,
    getBucketedLevelLogs,
    getLastRefill,
    getRefillEstimate
});