# 统一错误处理

所有 API 的失败统一以 `StorageError` reject，结构与 unix-request 的 `RequestError` 模式对齐：

```ts
import { set } from '@/uni_modules/ux-storage'
import type { StorageError } from '@/uni_modules/ux-storage'

set('', data, null).catch((err) => {
	const e = err as StorageError
	console.log(e.code, e.errSubject, e.nativeErrCode, e.key, e.errMsg)
})
```

## 错误结构

```ts
export type StorageErrorCode = 'ERR_PARAM' | 'ERR_NATIVE'

export type StorageError = {
	code: StorageErrorCode
	errSubject: string          // 固定 'unix-storage'
	errMsg: string
	nativeErrCode: number | null // 原生 fail errCode 原值透传，库内错误为 null
	key: string | null           // 关联的业务原始 key（未含前缀）
}
```

## 错误码

| 错误码 | 含义 | 触发场景 |
| --- | --- | --- |
| `ERR_PARAM` | 入参 / 配置非法 | `key` 为空；`keyPrefix` 使用 `uni-` / `dcloud_` 保留前缀 |
| `ERR_NATIVE` | 原生存储失败 | `uni.setStorage` 系列底层 fail；`getStorageInfoSync` 异常 |

::: tip 未命中不是错误
`get` / `remove` 等对「不存在的 key」不 reject：`get` 返回 `null`（原生 `getStorage` 的 `data not found` fail 在 adapter 层已转译为未命中语义）。reject 只发生在真正需要业务感知的失败上。
:::

## errSubject 过滤

`errSubject` 固定为 `unix-storage`，多库混用时可用于错误来源过滤：

```ts
promise.catch((err) => {
	const e = err as StorageError
	if (e.errSubject === 'unix-storage') {
		// unix-storage 的错误
	}
})
```
