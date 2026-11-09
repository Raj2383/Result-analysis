import { asyncHandler } from '../utils/asyncHandler';
import { apiResponse } from '../utils/apiResponse';
import analyticsService from '../services/analytics.service';

export const getAnalytics = asyncHandler(async (req, res) => {
  const summary = await analyticsService.getAnalytics({
    batchYear: req.query.batchYear ? Number(req.query.batchYear) : undefined,
    batch: req.query.batch ? Number(req.query.batch) : (req.query.batchYear ? Number(req.query.batchYear) : undefined),
    year: req.query.year ? Number(req.query.year) : undefined,
    programmeCode: req.query.programmeCode || req.query.course,
    course: req.query.course || req.query.programmeCode,
    semester: req.query.semester ? Number(req.query.semester) : undefined,
    instCode: req.query.instCode,
    groupBy: req.query.groupBy === 'name' ? 'name' : 'code',
  });
  return apiResponse(res, { data: summary, message: 'OK' });
});

export default { getAnalytics };
