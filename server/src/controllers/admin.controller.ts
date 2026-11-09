import { asyncHandler } from '../utils/asyncHandler';
import { apiResponse } from '../utils/apiResponse';
import adminService from '../services/admin.service';

export const createFacultyController = asyncHandler(async (req, res) => {
  const user = await adminService.createFaculty(req.body);
  return apiResponse(res, { status: 201, data: user, message: 'Faculty account created' });
});

export const adminListUploads = asyncHandler(async (req, res) => {
  const { items, total } = await adminService.listUploads();
  return apiResponse(res, { data: { items, total }, message: 'OK' });
});

export default { createFacultyController, adminListUploads };
