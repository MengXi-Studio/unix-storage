# 基础用法

默认实例开箱即用，七个顶层函数覆盖全部存取场景，全部返回 Promise。

## 写入：set

```ts
import { set } from '@/uni_modules/ux-storage'

await set('theme', 'dark', null)          // null：沿用实例默认 TTL（内置 = 永不过期）
await set('session', sessionData, 60_000) // 60 秒后过期

// 任意可序列化数据：字符串 / 数字 / 布尔 / 对象 / 数组
await set('count', 42, null)
await set('user:1', { id: 1, name: 'mx' }, null)
```

`data` 传 `null` 合法，但读取时与未命中同样返回 `null`，无法区分「存了 null」和「不存在」——业务上不建议存 null。

## 读取：get

```ts
import { get } from '@/uni_modules/ux-storage'

const theme = await get('theme') // 命中返回值；未命中 / 已过期返回 null

if (theme == null) {
	// 未命中或已过期，走兜底逻辑
}
```

::: tip 未命中不是错误
原生 `getStorage` 对不存在的 key 走 fail（`data not found`），adapter 层已统一转译为 `resolve(null)`，业务侧只需判空。
:::

## 移除：remove

```ts
import { remove } from '@/uni_modules/ux-storage'

await remove('session') // key 不存在也不报错
```

## 命名空间视角：keys

```ts
import { keys } from '@/uni_modules/ux-storage'

const list = await keys() // ['theme', 'user:1'] —— 本命名空间 key，剥前缀返回
```

## 清理：clear / clearExpired

```ts
import { clear, clearExpired } from '@/uni_modules/ux-storage'

await clear()                  // 清理本命名空间全部缓存，不触碰其他前缀数据
const n = await clearExpired() // 扫描本命名空间，移除已过期记录，返回清理条数
```

## 存储信息：info

```ts
import { info } from '@/uni_modules/ux-storage'

const storageInfo = await info()
// storageInfo.keys —— 全端全量 key（不做命名空间过滤）
// storageInfo.currentSize —— 当前占用（KB）
// storageInfo.limitSize —— 容量上限（KB）
```

::: tip info 与 keys 的区别
`info()` 返回 `uni.getStorageInfo` 原样结构（keys 全量）；要看本命名空间列表用 `keys()`。
:::

## 全局配置与多实例

- `configureStorage(defaults)`：覆盖默认实例全局默认（如 App.uvue onLaunch 中配置一次）
- `createStorage(defaults)`：创建隔离实例（前缀 / 默认 TTL 独立），详见[命名空间与多实例](./namespace)
