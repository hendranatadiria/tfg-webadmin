import { getAllDevices } from "../controllers/device";
import { createTRPCRouter } from "../trpc";

export const deviceRouter = createTRPCRouter({
    getAllDevices,
});