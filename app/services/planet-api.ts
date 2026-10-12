import type { ApiSuccess } from '~/types/api';
import type { PlanetStats } from '~/types/planet';

export async function getPlanetStats() {
  const response = await $fetch<ApiSuccess<PlanetStats>>('/api/planet/stats');
  return response.data;
}
