/**
 * 供应商无关的 AI 服务边界。
 *
 * 首版不接入模型，因此默认适配器明确拒绝请求。接入千问或其他服务时，只需
 * 在此文件替换实现，并在服务端读取对应环境变量；不得把密钥传入客户端。
 */
export type AiChatMessage = {
  role: 'user' | 'assistant';
  content: string;
};

export type AiChatReply = {
  role: 'assistant';
  content: string;
};

export class AiServiceUnavailableError extends Error {
  constructor() {
    super('AI service has not been configured.');
    this.name = 'AiServiceUnavailableError';
  }
}

export async function requestAiReply(_messages: AiChatMessage[]): Promise<AiChatReply> {
  throw new AiServiceUnavailableError();
}
