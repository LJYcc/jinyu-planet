import type { VisitorIdentity } from '~/types/visitor';
import { bootstrapVisitor, updateVisitorNickname } from '~/services/visitor-api';

export function useVisitor() {
  // useState 让同一次 Nuxt 应用生命周期内的组件共享访客身份。
  const visitor = useState<VisitorIdentity | null>('visitor-identity', () => null);
  const isLoading = ref(false);

  async function bootstrap() {
    // 防止多个组件同时初始化，造成重复请求或重复创建会话。
    if (isLoading.value) return visitor.value;
    isLoading.value = true;
    try {
      const identity = await bootstrapVisitor();
      // Cookie 由浏览器自动保存，前端只需要保存可展示的公开身份。
      visitor.value = identity;
      return visitor.value;
    } finally {
      isLoading.value = false;
    }
  }

  async function changeNickname(nickname?: string) {
    // nickname 为空时让服务端生成新昵称；传字符串时由服务端校验后保存。
    const identity = await updateVisitorNickname(nickname);
    // 更新共享状态，让所有使用 useVisitor 的组件立即刷新显示。
    visitor.value = identity;
    return visitor.value;
  }

  return { visitor, isLoading, bootstrap, changeNickname };
}
