
import {
  createTRPCRouter,
} from "~/server/api/trpc";
import { getTemperatureLogs } from "../controllers/temperature";

export const temperatureRouter = createTRPCRouter({
  getTemperatureLogs

  
});
