# Type Restoration

## Why restoration is needed

The uni-app x storage layer performs a serialization round trip on typed objects: **typed objects read back as `UTSJSONObject`** (official "type data storage" docs). The record wrapping in unix-storage does not change this — object data returned by `get` is a `UTSJSONObject`. Using it directly as the original type loses type information, and on Kotlin a hard cast risks `ClassCastException`.

## The official restoration path

Restore types uniformly via the official `JSON.parse<T>(JSON.stringify(raw))` path:

```ts
import { set, get } from '@/uni_modules/ux-storage'

type UserInfo = {
	id: number
	name: string
	tags: Array<string>
	profile: { city: string }
}

await set('user:1', { id: 1, name: 'mx', tags: ['a'], profile: { city: 'cd' } } as UserInfo, null)

const raw = await get('user:1') // UTSJSONObject
if (raw != null) {
	const user = JSON.parse<UserInfo>(JSON.stringify(raw))
	// user.id / user.name regain their static types; nested fields restore per the declared structure
}
```

## Platform difference: as casts

The `get<T>` generic is a **static annotation only** — data flows as `any` with no runtime instantiation:

- **Web**: `as` casts work directly (JS has no real types; erased, field-based access)
- **Kotlin (Android)**: prefer the official `JSON.parse<T>(JSON.stringify(raw))` path to avoid the `ClassCastException` risk of a raw `raw as T` cast

::: tip One rule for all platforms
Skipping platform branches and always using `JSON.parse<T>(JSON.stringify(raw))` is the simplest discipline; the extra serialization round trip on Web is negligible.
:::

## When restoration is unnecessary

- **Primitives** (string / number / boolean / null): no type round trip, use directly
- **Arrays**: flow as `any`; when elements are typed objects, restore via the path above

## Next steps

- [Implementation Notes](./internals): where record wrapping and the serialization round trip sit in the pipeline
