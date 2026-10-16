# Error Handling

All API failures reject with a unified `StorageError`, mirroring the `RequestError` pattern from unix-request:

```ts
import { set } from '@/uni_modules/ux-storage'
import type { StorageError } from '@/uni_modules/ux-storage'

set('', data, null).catch((err) => {
	const e = err as StorageError
	console.log(e.code, e.errSubject, e.nativeErrCode, e.key, e.errMsg)
})
```

## The error shape

```ts
export type StorageErrorCode = 'ERR_PARAM' | 'ERR_NATIVE'

export type StorageError = {
	code: StorageErrorCode
	errSubject: string          // always 'unix-storage'
	errMsg: string
	nativeErrCode: number | null // native fail errCode passed through; null for library errors
	key: string | null           // related business key (prefix not included)
}
```

## Error codes

| Code | Meaning | Triggered by |
| --- | --- | --- |
| `ERR_PARAM` | Invalid arguments / config | Empty `key`; `keyPrefix` starting with the reserved `uni-` / `dcloud_` |
| `ERR_NATIVE` | Native storage failure | `uni.setStorage` family failing underneath; `getStorageInfoSync` throwing |

::: tip A miss is not an error
`get` / `remove` against a non-existent key do not reject: `get` resolves `null` (the native `getStorage` "data not found" fail is translated into miss semantics inside the adapter). Rejects only surface failures business code actually needs to handle.
:::

## Filtering by errSubject

`errSubject` is always `unix-storage`, useful for filtering error sources when multiple libraries are in play:

```ts
promise.catch((err) => {
	const e = err as StorageError
	if (e.errSubject === 'unix-storage') {
		// errors from unix-storage
	}
})
```
