import { apiSuccess, defineApiHandler } from '../../utils/apiResponse';
import { isDeepThinkingAvailable, isWebSearchAvailable } from '../../services/ai-client';

/** 只公开当前 AI 能力开关，不暴露供应商密钥、账号或内部配置。 */
export default defineApiHandler(() => {
  return apiSuccess({ deepThinking: isDeepThinkingAvailable(), webSearch: isWebSearchAvailable() });
});
