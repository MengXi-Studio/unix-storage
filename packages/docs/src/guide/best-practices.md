# 最佳实践

## key 命名规范

用「业务域:对象:id」的分隔风格，让 key 自解释且便于排查：

```ts
await set('user:profile:1', profile, null) // 用户域 / 资料 / 用户 id
await set('cart:items:1001', items, null)  // 购物车域
```

- 顶层前缀已由实例 `keyPrefix` 承担，业务 key 不必再重复
- 多实例时用前缀区分业务域（`api_cache:` / `draft:`），单实例时用 key 分段

## TTL 策略

| 数据类型 | 建议 |
| --- | --- |
| 会话 / token / 短期缓存 | 显式短 TTL（分钟级），配合读取时惰性过期 |
| 主题 / 语言 / 用户偏好 | `null` 永不过期，随版本或用户操作主动更新 |
| 接口响应缓存 | 实例级 `defaultTTL` 统一兜底，热点数据调用级覆盖 |

过期数据不被读取就永不释放——对有批量过期语义的场景（如接口缓存），在合适时机调用 `clearExpired()`：

```ts
// App.uvue onShow 或进入缓存页时
const removed = await clearExpired()
```

## 多实例划分

按业务域创建实例，而不是全局一个实例混用：

```ts
import { createStorage } from '@/uni_modules/ux-storage'
import type { StorageDefaults } from '@/uni_modules/ux-storage'

export const cacheStore = createStorage({ keyPrefix: 'api_cache:', defaultTTL: 300_000 } as StorageDefaults)
export const draftStore = createStorage({ keyPrefix: 'draft:', defaultTTL: null } as StorageDefaults)
```

- 实例建议模块级导出复用，避免散落创建
- `clear()` 清的是实例前缀域，划分清晰后「一键清空某业务」才安全

## 容量自管

库不做 LRU 自动淘汰（V1 设计决策），容量上限差异见[平台支持](./platform)。高频写入场景应主动观测：

```ts
const storageInfo = await info()
console.log(storageInfo.currentSize, storageInfo.limitSize) // KB
```

- 小程序端注意约 10MB 上限，大对象考虑拆 key 或改走文件 / 服务端
- Web 端 `limitSize` 为 `Number.MAX_VALUE`，仍建议控量

## 与存量数据共存

- 业务直写 `uni.setStorage` 的旧数据：本库读到后**原样返回、不误删**，可以渐进迁移
- 迁移路径：读旧 key → `set` 写入本库（获得 TTL 能力）→ 删除旧 key
- 反向注意：本库写入的值是 `{ data, expire }` 包裹，业务**不要**用原生 API 直接读本库 key 后当业务数据用

## 类型还原统一走官方路径

跨端统一 `JSON.parse<T>(JSON.stringify(raw))` 还原 type 对象，详见[类型还原](./type-restoration)。
