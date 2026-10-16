# TTL 过期管理

unix-storage 通过 record 包裹实现毫秒级 TTL：`set` 写入时在业务数据外包裹 `{ data, expire }` 过期时间戳，读取时**惰性判断**（`Date.now() > expire` 即移除并返回 `null`），并支持 `clearExpired()` 全量扫描清理。

## 设置过期时间

`set` 的第三个参数 `ttl` 为过期毫秒数，传 `null` 表示「沿用实例默认 TTL」：

```ts
import { set, get } from '@/uni_modules/ux-storage'

await set('session', data, 60_000) // 60 秒过期
await set('theme', 'dark', null)   // 沿用实例 defaultTTL（内置 = 永不过期）

await get('session') // 过期后：惰性移除并返回 null，不 reject
```

## TTL 三级回退

实际生效的 TTL 按「调用级 → 实例级 → 内置」回退，对齐 unix-request / axios 的三级合并心智：

| 优先级 | 来源 | 说明 |
| --- | --- | --- |
| 1 | 调用级 `ttl` 参数 | `set(key, data, ttl)` 显式传入（非 null） |
| 2 | 实例 `defaultTTL` | `createStorage` / `configureStorage` 配置 |
| 3 | 内置默认 | `null` = 永不过期 |

```ts
import { createStorage } from '@/uni_modules/ux-storage'
import type { StorageDefaults } from '@/uni_modules/ux-storage'

// 实例 defaultTTL 5 分钟：所有未显式传 ttl 的 set 都在 5 分钟后过期
const cacheStore = createStorage({ keyPrefix: 'api_cache:', defaultTTL: 300_000 } as StorageDefaults)
await cacheStore.set('user:1', user, null)      // 5 分钟过期
await cacheStore.set('user:2', user, 3_600_000) // 调用级覆盖：1 小时过期
```

## 全量扫描清理

惰性过期只在读取时触发；未被再次读取的过期数据会一直占着容量。`clearExpired()` 扫描本命名空间全部 key，移除已过期记录并返回清理条数：

```ts
import { clearExpired } from '@/uni_modules/ux-storage'

const count = await clearExpired() // 本命名空间内清理条数
console.log(`已清理 ${count} 条过期缓存`)
```

::: warning 清理范围
`clearExpired()` 与 `clear()` 一样**只作用于当前实例命名空间**（按 keyPrefix 过滤），不会触碰其他命名空间或业务直写原生 API 的数据。
:::

## 兼容策略

读到非本库写入格式的数据（业务直写 `uni.setStorage` 的存量数据）按「无过期」**原样返回**：不报错、不误删。判定标准为「对象且同时含 data / expire 字段且 expire 为 number | null」。
