// 浏览器可以使用的匿名访客公开信息，不包含 Cookie 或数据库内部字段。
export type VisitorStatus = 'active' | 'blocked';

export type VisitorIdentity = {
  nickname: string;
  status: VisitorStatus;
};
