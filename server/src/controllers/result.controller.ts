import { asyncHandler } from '../utils/asyncHandler';
import { apiResponse } from '../utils/apiResponse';
import resultService from '../services/result.service';

export const getStudentResult = asyncHandler(async (req, res) => {
  const rollNo = req.params.rollNo;
  const semester = req.query.semester ? Number(req.query.semester) : undefined;
  const result = await resultService.getStudentResult({ rollNo, semester });
  return apiResponse(res, { data: result, message: 'OK' });
});

export const searchStudents = asyncHandler(async (req, res) => {
  const q = String(req.query.q ?? req.params.q ?? '');
  const limit = Math.min(Number(req.query.limit) || 20, 100);
  const page = Math.max(1, Number(req.query.page) || 1);
  const { items, total } = await resultService.searchStudents({ q, limit, page });
  return apiResponse(res, { data: { items, page, limit, total }, message: 'OK' });
});

export default { getStudentResult, searchStudents };
