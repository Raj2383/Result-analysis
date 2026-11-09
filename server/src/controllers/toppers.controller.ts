import { asyncHandler } from '../utils/asyncHandler';
import { apiResponse } from '../utils/apiResponse';
import toppersService from '../services/toppers.service';

export const getToppers = asyncHandler(async (req, res) => {
  const toppers = await toppersService.getToppers({
    semester: Number(req.params.sem ?? req.query.semester ?? 5),
    batchYear: req.query.batchYear ? Number(req.query.batchYear) : undefined,
    instCode: req.query.instCode,
    examCategory: req.query.examCategory,
    groupBy: req.query.groupBy === 'name' ? 'name' : 'code',
    limit: Math.min(Number(req.query.limit) || 50, 500),
  });
  return apiResponse(res, { data: toppers, message: 'OK' });
});

export default { getToppers };
