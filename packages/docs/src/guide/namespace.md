# 命名空间与多实例

## key 前缀命名空间

库内所有读写的实际存储 key = `keyPrefix + key`。默认前缀 `mx_storage:`，规避 `uni-` / `dcloud_` 平台保留前缀；**非法保留前缀在操作期以 `ERR_PARAM` 拦截**（`createStorage` / `setConfig` 为同步 void 无法 reject）。

```ts
import { set, keys, clear } from '@/uni_modules/ux-storage'

await set('user:1', user, null) // 实际存储 key = 'mx_storage:user:1'

await keys()   // ['user:1'] —— 剥前缀后返回原始 key
await clear()  // 仅清理本命名空间，按前缀过滤后逐个移除
```

::: tip 与原生 API 协作
`info()` 返回 `uni.getStorageInfo` 原样结构（keys 为全端全量 key，不做命名空间过滤）；需要命名空间视角时用 `keys()`。跨命名空间、跨业务的数据互不可见、互不影响。
:::

## 多实例隔离

`createStorage(defaults)` 创建独立实例（前缀 / defaultTTL 隔离），心智对标 `axios.create`；默认实例开箱即用，两者返回的 `StorageInstance` 完全同构：

```ts
import { createStorage } from '@/uni_modules/ux-storage'
import type { StorageDefaults } from '@/uni_modules/ux-storage'

const cacheStore = createStorage({ keyPrefix: 'api_cache:', defaultTTL: 300_000 } as StorageDefaults)
const draftStore = createStorage({ keyPrefix: 'draft:', defaultTTL: null } as StorageDefaults)

await cacheStore.set('user:1', user, null) // mx_storage:... 与 api_cache:... 互不可见
await draftStore.set('page:1', draft, null)

await cacheStore.clear() // 只清 api_cache:* ，draft:* 原样保留
```

## 修改实例配置

实例的 `setConfig` 覆盖该实例默认配置，不影响其他实例：

```ts
cacheStore.setConfig({ keyPrefix: 'api_cache_v2:', defaultTTL: 60_000 } as StorageDefaults)
```

## 语义速查

| 语义 | 约定 |
| --- | --- |
| 实际存储 key | `keyPrefix + key` |
| `keys()` | 本命名空间 key 列表，剥前缀返回原始 key |
| `clear()` | 仅清理本命名空间（按前缀过滤后逐个 remove） |
| `clearExpired()` | 扫描本命名空间，返回清理条数 |
| `info()` | `uni.getStorageInfo` 原样结构（全量 keys） |
| 非本库格式数据 | 按无过期原样返回，不报错（Q5 兼容策略） |
