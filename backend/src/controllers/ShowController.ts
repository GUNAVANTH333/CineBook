import { Request, Response, NextFunction } from "express";
import { showService } from "../services/ShowService.js";
import { seatService } from "../services/SeatService.js";
import { sendSuccess, sendCreated } from "../utils/apiResponse.js";

export class ShowController {
  async getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { movieId, city } = req.query as { movieId?: string; city?: string };
      const shows = await showService.getAll({ movieId, city });
      sendSuccess(res, shows);
    } catch (err) {
      next(err);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const show = await showService.getById(req.params["id"] as string);
      sendSuccess(res, show);
    } catch (err) {
      next(err);
    }
  }

  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const show = await showService.create(req.body);
      sendCreated(res, show, "Show created successfully");
    } catch (err) {
      next(err);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await showService.delete(req.params["id"] as string);
      sendSuccess(res, null, "Show deleted successfully");
    } catch (err) {
      next(err);
    }
  }

  async getSeatMap(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const seatMap = await seatService.getSeatMapForShow(req.params["id"] as string);
      sendSuccess(res, seatMap);
    } catch (err) {
      next(err);
    }
  }
  async repairSeatMaps(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await showService.repairSeatMaps();
      sendSuccess(res, result, `Repaired ${result.screensFixed} screen(s) and ${result.showsFixed} show(s)`);
    } catch (err) {
      next(err);
    }
  }
}

export const showController = new ShowController();
