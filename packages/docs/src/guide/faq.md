# 常见问题

## 可以和原生 `uni.setStorage` API 混用吗？

可以。库只按 `keyPrefix` 圈定自己的命名空间，原生读写其他 key 互不影响；本库读到非自己写入格式的数据按「无过期」原样返回。注意方向：**原生 API 读本库 key** 会拿到 `{ data, expire }` 包裹值，需自行取 `.data`。

## 各端容量上限是多少？

H5 约 5MB、小程序约 10MB；Web 端 `uni.getStorageInfoSync().limitSize` 返回 `Number.MAX_VALUE`（无上限概念）。统一用 `info()` 在运行时读取，业务自管容量（库不做 LRU 淘汰）。

## 为什么 get 的泛型还要 JSON.parse 还原？

type 对象经底层存储序列化往返后读回为 `UTSJSONObject`（uni-app x 官方「类型数据的存取说明」），`get<T>` 的泛型仅静态标注、无运行时实例化。还原统一走官方路径 `JSON.parse<T>(JSON.stringify(raw))`，详见[类型还原](./type-restoration)。

## clear() 会不会删掉别的业务数据？

不会。`clear()` / `clearExpired()` 经 `getStorageInfoSync().keys` 拿全量列表后按 `startsWith(keyPrefix)` 过滤，只移除本命名空间 key；其他前缀、业务直写的数据原样保留。

## 未命中为什么返回 null 而不是 reject？

原生 `getStorage` 对不存在的 key 走 fail（`data not found`），adapter 层把这一情形转译为 `resolve(null)`——未命中是业务的常态分支而非异常。真正 reject 只发生在参数非法（`ERR_PARAM`）与底层存储失败（`ERR_NATIVE`）。

## 为什么 createStorage 传非法前缀不报错？

`createStorage` / `setConfig` 是同步 void 函数，无法 reject；非法保留前缀（`uni-` / `dcloud_` 开头）在该实例的每次操作时以 `ERR_PARAM` 拦截，见[命名空间与多实例](./namespace)。

## 小程序 / Android 什么时候可用？

代码全端同构（纯编排层、无平台目录端），Web 端 22 项功能验证日志全部通过；微信小程序与 Android 待实测，iOS / 鸿蒙未实测（环境限制）。可用仓库内置的 [packages/playground](https://github.com/MengXi-Studio/unix-storage/tree/main/packages/playground) 自助验证，见[平台支持](./platform)。

## 会支持同步 API / 内存缓存 / LRU 吗？

V1 明确不做（设计决策非遗漏）：统一 Promise 形态避免双轨心智、无内存双引擎、无 LRU 自动淘汰。需求请到 [Discussions](https://github.com/MengXi-Studio/unix-storage/discussions) 讨论。
