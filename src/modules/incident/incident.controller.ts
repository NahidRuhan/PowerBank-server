import { Request, Response, NextFunction } from 'express';
import { IncidentService } from './incident.service.js';
import { sendSuccess } from '../../lib/response.js';
import { uploadToCloudinary } from '../../middleware/upload.js';

export class IncidentController {
  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const data = { ...req.body };
      
      if (req.file) {
        data.photoUrl = await uploadToCloudinary(req.file.buffer, 'powerbank/incidents');
      }

      const incident = await IncidentService.create(data, req.user!.id);
      return sendSuccess(res, incident, 'Incident reported successfully', 201);
    } catch (error) {
      next(error);
    }
  }

  static async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await IncidentService.getAll(req.query);
      return sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }

  static async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const incident = await IncidentService.getById(req.params.id);
      return sendSuccess(res, incident);
    } catch (error) {
      next(error);
    }
  }

  static async update(req: Request, res: Response, next: NextFunction) {
    try {
      const incident = await IncidentService.update(req.params.id, req.body, req.user!.id);
      return sendSuccess(res, incident, 'Incident updated successfully');
    } catch (error) {
      next(error);
    }
  }
}
