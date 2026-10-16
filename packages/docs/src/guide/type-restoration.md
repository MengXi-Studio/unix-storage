# 类型还原

## 为什么需要还原

uni-app x 的存储底层对 type 对象做序列化往返：**type 对象读回为 `UTSJSONObject`**（官方文档「类型数据的存取说明」）。unix-storage 的 record 包裹不改变这一点——`get` 拿到的对象数据是 `UTSJSONObject`，直接当原 type 用会丢类型信息，Kotlin 端强转还有 `ClassCastException` 风险。

## 官方还原路径

统一用 `JSON.parse<T>(JSON.stringify(raw))` 官方路径还原：

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
	// user.id / user.name 恢复静态类型，嵌套字段按声明结构递归还原
}
```

## 平台差异：as 断言

`get<T>` 的泛型仅是**静态标注**，data 以 any 流转，无运行时实例化：

- **Web 端**：`as` 断言直接可用（JS 无真实类型，擦除后按字段访问）
- **Kotlin 端（Android）**：推荐统一走 `JSON.parse<T>(JSON.stringify(raw))` 官方路径，规避 `raw as T` 强转的 `ClassCastException` 风险

::: tip 一条规则走全端
不分平台、统一 `JSON.parse<T>(JSON.stringify(raw))`，是最省心的写法；Web 端多一次序列化往返的成本可忽略。
:::

## 无需还原的场景

- **基础类型**（string / number / boolean / null）：读写无类型往返，直接使用
- **数组**：以 any 流转；元素为 type 对象时，按上述路径还原

## 下一步

- [实现原理](./internals)：record 包裹与序列化往返在管线中的位置
