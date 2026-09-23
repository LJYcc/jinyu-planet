/**
 * 将外部输入规范化为正整数分页参数。
 *
 * - value 未提供时返回 defaultValue
 * - value 不是正整数时返回 undefined，由 API 层转换为 400
 * - maxValue 存在时，将结果限制在最大值以内
 */
export function normalizePositiveInteger(value: unknown, defaultValue: number, maxValue?: number) {
  if (value === undefined) return defaultValue;

  const parsed = typeof value === 'string' && /^\d+$/.test(value) ? Number(value) : NaN;
  if (!Number.isInteger(parsed) || parsed < 1) return undefined;

  return maxValue === undefined ? parsed : Math.min(parsed, maxValue);
}
