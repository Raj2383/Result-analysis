import { asyncHandler } from '../utils/asyncHandler';
import { apiResponse } from '../utils/apiResponse';
import toppersService from '../services/toppers.service';

export const getOverallToppers = asyncHandler(async (req, res) => {
  const limit = Math.min(Number(req.query.limit) || 50, 500);
  const offset = Math.max(Number(req.query.offset) || 0, 0);
  const programmeCode = (req.query.programmeCode || req.query.course) as string | undefined;
  const batch = req.query.batch ? Number(req.query.batch) : undefined;
  const toppers = await toppersService.getOverallToppers({ programmeCode, batch, limit, offset });
  return apiResponse(res, { data: toppers, message: 'OK' });
});

export const getSemesterToppers = asyncHandler(async (req, res) => {
  const sem = Number(req.params.sem);
  const limit = Math.min(Number(req.query.limit) || 50, 500);
  const offset = Math.max(Number(req.query.offset) || 0, 0);
  const programmeCode = (req.query.programmeCode || req.query.course) as string | undefined;
  const batch = req.query.batch ? Number(req.query.batch) : undefined;
  const toppers = await toppersService.getSemesterToppers({ semester: sem, programmeCode, batch, limit, offset });
  return apiResponse(res, { data: toppers, message: 'OK' });
});

export const getCollegeToppers = asyncHandler(async (req, res) => {
  const code = String(req.params.code);
  const limit = Math.min(Number(req.query.limit) || 50, 500);
  const offset = Math.max(Number(req.query.offset) || 0, 0);
  const programmeCode = (req.query.programmeCode || req.query.course) as string | undefined;
  const batch = req.query.batch ? Number(req.query.batch) : undefined;
  const toppers = await toppersService.getCollegeToppers({ institutionCode: code, programmeCode, batch, limit, offset });
  return apiResponse(res, { data: toppers, message: 'OK' });
});

export const getSubjectToppers = asyncHandler(async (req, res) => {
  const paperId = String(req.params.paperId);
  const limit = Math.min(Number(req.query.limit) || 10, 100);
  const programmeCode = (req.query.programmeCode || req.query.course) as string | undefined;
  const batch = req.query.batch ? Number(req.query.batch) : undefined;
  const toppers = await toppersService.getSubjectToppers({ paperId, programmeCode, batch, limit });
  return apiResponse(res, { data: toppers, message: 'OK' });
});

export const getToppers = asyncHandler(async (req, res) => {
  const semParam = req.params.sem ?? req.query.semester;
  const codeParam = req.params.code ?? req.query.instCode;
  const paperParam = req.params.paperId ?? req.query.paperId;

  if (semParam != null) {
    const toppers = await toppersService.getSemesterToppers({
      semester: Number(semParam),
      limit: Math.min(Number(req.query.limit) || 50, 500),
    });
    return apiResponse(res, { data: toppers, message: 'OK' });
  }

  if (codeParam != null) {
    const toppers = await toppersService.getCollegeToppers({
      institutionCode: String(codeParam),
      limit: Math.min(Number(req.query.limit) || 50, 500),
    });
    return apiResponse(res, { data: toppers, message: 'OK' });
  }

  if (paperParam != null) {
    const toppers = await toppersService.getSubjectToppers({
      paperId: String(paperParam),
      limit: Math.min(Number(req.query.limit) || 10, 100),
    });
    return apiResponse(res, { data: toppers, message: 'OK' });
  }

  const toppers = await toppersService.getOverallToppers({
    limit: Math.min(Number(req.query.limit) || 50, 500),
  });
  return apiResponse(res, { data: toppers, message: 'OK' });
});

export default {
  getOverallToppers,
  getSemesterToppers,
  getCollegeToppers,
  getSubjectToppers,
  getToppers,
};
