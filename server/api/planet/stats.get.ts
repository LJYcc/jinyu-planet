import { getPlanetStats } from '../../repositories/planetRepository';
import { apiSuccess, defineApiHandler } from '../../utils/apiResponse';

export default defineApiHandler(async () => apiSuccess(await getPlanetStats()));
