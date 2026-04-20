import { Router } from "express";
import { z } from "zod";
import { showController } from "../controllers/ShowController.js";
import { authenticate, authorize } from "../middlewares/authMiddleware.js";
import { validate } from "../middlewares/validateRequest.js";

const router = Router();

const createShowSchema = z.object({
  movieId: z.string().uuid(),
  screenId: z.string().uuid(),
  showTime: z.string().datetime(),
  basePrice: z.number().positive(),
});

router.get("/", (req, res, next) => showController.getAll(req, res, next));
router.get("/:id", (req, res, next) => showController.getById(req, res, next));
router.get("/:id/seats", (req, res, next) => showController.getSeatMap(req, res, next));
router.post("/", authenticate, authorize("ADMIN"), validate(createShowSchema), (req, res, next) => showController.create(req, res, next));
router.post("/repair-seats", authenticate, authorize("ADMIN"), (req, res, next) => showController.repairSeatMaps(req, res, next));
router.delete("/:id", authenticate, authorize("ADMIN"), (req, res, next) => showController.delete(req, res, next));

export default router;
