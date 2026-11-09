import { asyncHandler } from '../utils/asyncHandler';
import { apiResponse } from '../utils/apiResponse';
import { ApiError } from '../utils/ApiError';
import ingestionService from '../services/ingestion.service';

export const uploadPdfController = asyncHandler(async (req, res) => {
  if (!req.file) throw ApiError.badRequest('Attach the result PDF as field "pdf"');
  const result = await ingestionService.ingestPdf({
    buffer: req.file.buffer,
    filename: req.file.originalname,
    uploadedBy: req.user?.id ?? null,
  });
  return apiResponse(res, { status: 201, data: result, message: 'PDF ingested successfully' });
});

export const uploadHistory = asyncHandler(async (req, res) => {
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 20;
  const offset = (page - 1) * limit;
  const { items, total } = await ingestionService.listUploads({ limit, offset });
  return apiResponse(res, { data: { items, page, limit, total }, message: 'OK' });
});

export const deleteUploadController = asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  if (!id || isNaN(id)) throw ApiError.badRequest('Invalid upload id');
  const result = await ingestionService.deleteUpload(id);
  return apiResponse(res, { data: result, message: 'Upload deleted successfully' });
});

export default { uploadPdfController, uploadHistory, deleteUploadController };
