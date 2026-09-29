/**
 * Cache API 工具：发布页面后主动清除对应边缘缓存
 */

export async function purgeUrl(url: string): Promise<void> {
  const cache = caches.default;
  await cache.delete(new Request(url, { method: 'GET' }));
}

/** 全站布局/导航变更时调用 */
export async function purgeAll(appUrl: string): Promise<void> {
  // Cache API 不支持通配符批量 purge；这里只清根路径作为兜底。
  // 生产环境可改用 Cloudflare API 的 cache_purge: true 按 URL 批量清。
  await purgeUrl(appUrl + '/');
}
