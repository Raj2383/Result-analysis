import authService from './auth.service';
import ingestionService from './ingestion.service';

export function createAdminService(deps: { auth?: typeof authService; ingestion?: typeof ingestionService } = {}) {
  const auth = deps.auth ?? authService;
  const ingestion = deps.ingestion ?? ingestionService;

  async function createFaculty(input: { username: string; password: string; name?: string }) {
    const user = await auth.createFaculty(input);
    return { user };
  }

  async function listUploads() {
    const { items, total } = await ingestion.listUploads({});
    return { items, total };
  }

  return { createFaculty, listUploads };
}

export default createAdminService();
