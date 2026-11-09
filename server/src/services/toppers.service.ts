import { toppersRepository } from '../repositories/toppers.repository';
import { Runner } from '../repositories/catalog.repository';

export interface ToppersServiceDeps {
  repo?: typeof toppersRepository;
}

export function createToppersService(deps: ToppersServiceDeps = {}) {
  const repo = deps.repo ?? toppersRepository;

  async function getToppers(input: Record<string, unknown>) {
    const rows = await repo.overallToppers({ query: async () => ({ rows: [] }) } as Runner, {
      limit: Number(input.limit ?? 50),
      offset: 0,
    });
    return { items: rows, count: rows.length };
  }

  return { getToppers };
}

export default createToppersService();
