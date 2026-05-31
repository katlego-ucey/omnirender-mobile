import { Router, type IRouter } from "express";
import healthRouter from "./health";
import cityRouter from "./city";

const router: IRouter = Router();

router.use(healthRouter);
router.use(cityRouter);

export default router;
