import { createHash, randomBytes, randomInt } from 'node:crypto';
import type { H3Event } from 'h3';
import { getCookie, setCookie } from 'h3';

// Cookie 里保存的是原始令牌；数据库只保存它的哈希值。
export const VISITOR_SESSION_COOKIE = 'goldfish_visitor_session';
// 匿名会话默认保留 30 天，过期后下次 bootstrap 会创建新会话。
export const VISITOR_SESSION_TTL_SECONDS = 60 * 60 * 24 * 30;
// 会话剩余不超过 3 天时才续期，避免每次访问都重写 Cookie。
export const VISITOR_SESSION_RENEWAL_THRESHOLD_SECONDS = 60 * 60 * 24 * 3;

// 昵称由两部分中文词语和四位数字组成，既容易阅读也不包含真实身份信息。
const nicknameAdjectives = [
  '\u4f1a\u53d1\u5149\u7684',
  '\u6162\u6162\u6e38\u7684',
  '\u5b89\u9759\u89c2\u5bdf\u7684',
  '\u60f3\u5403\u591c\u5bb5\u7684',
  '\u5e26\u7740\u661f\u5149\u7684',
  '\u5076\u5c14\u53d1\u5446\u7684'
];

const nicknameNouns = [
  '\u91d1\u9c7c',
  '\u5c0f\u536b\u661f',
  '\u6708\u4eae\u8239',
  '\u4e91\u4e2d\u65c5\u4eba',
  '\u5c0f\u6d77\u8c5a',
  '\u661f\u5c18'
];

export function createSessionToken() {
  // randomBytes 生成不可预测的随机值，不能使用 Math.random 代替。
  return randomBytes(32).toString('base64url');
}

export function hashSessionToken(token: string) {
  // 令牌哈希可以用于查库，即使数据库泄露也不会直接得到 Cookie 内容。
  return createHash('sha256').update(token).digest('hex');
}

export function createNickname() {
  // randomInt 避免手写随机算法的偏差，并保证数组下标始终合法。
  const adjective = nicknameAdjectives[randomInt(nicknameAdjectives.length)];
  const noun = nicknameNouns[randomInt(nicknameNouns.length)];
  const suffix = String(randomInt(0, 10000)).padStart(4, '0');
  return `${adjective}${noun}${suffix}`;
}

export function getSessionToken(event: H3Event) {
  const token = getCookie(event, VISITOR_SESSION_COOKIE);
  // 限制长度是一个廉价的输入保护，异常长的 Cookie 不参与数据库查询。
  return token && token.length <= 256 ? token : undefined;
}

export function setSessionTokenToCookie(event: H3Event, token: string) {
  setCookie(event, VISITOR_SESSION_COOKIE, token, {
    // HttpOnly 让浏览器脚本无法读取令牌，降低 XSS 窃取会话的风险。
    httpOnly: true,
    // 本地 HTTP 开发不能开启 Secure；生产环境必须只通过 HTTPS 发送。
    secure: process.env.NODE_ENV === 'production',
    // Lax 允许正常站内导航，同时减少跨站请求携带 Cookie 的机会。
    sameSite: 'lax',
    // 让整个站点的 API 和页面都能使用同一个匿名会话。
    path: '/',
    maxAge: VISITOR_SESSION_TTL_SECONDS
  });
}
