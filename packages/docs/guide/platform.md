# 平台支持

库以 `uni.setStorage` 系列原生 API 为唯一底层依赖（全端统一），自身为纯编排层、无平台目录端。UTS 源码分发，由 uni-app x 编译链现场编译：

| 平台 | 状态 |
| --- | --- |
| Web | ✅ 编译产物验证，22 项功能验证日志全部通过（基础存取 / TTL / 命名空间 / 多实例 / clearExpired / 错误路径六组） |
| 微信小程序 | 代码全端同构，待实测 |
| Android | 代码全端同构，待真机实测 |
| iOS / 鸿蒙 | 代码已适配，受环境限制暂未实测（iOS 需 macOS、鸿蒙需 DevEco Studio） |

## 平台差异说明

| 差异点 | 说明 |
| --- | --- |
| 容量上限 | H5 约 5MB / 小程序约 10MB；Web 端 `info().limitSize` 返回 `Number.MAX_VALUE`（无上限概念）。库提供 `info()` 由业务自管，**不做 LRU 自动淘汰**（V1 设计决策） |
| 未命中形态 | 原生 `getStorage` 对不存在 key 走 fail（`data not found`），adapter 层统一转译为「resolve(null)」，两端契约一致 |
| 序列化往返 | type 对象读回为 `UTSJSONObject`（官方文档「类型数据的存取说明」），类型还原统一用 `JSON.parse<T>(JSON.stringify(raw))` 官方路径 |

## 自助验证

仓库内置验证工程 [packages/playground](https://github.com/MengXi-Studio/unix-storage/tree/main/packages/playground)，验证页按功能分六组输出 `[verify]` 日志（基础存取 / TTL / 前缀命名空间 / 多实例 / clearExpired / 错误路径），Web 端可直接运行：

```bash
pnpm install
cd packages/playground
pnpm build:web
npx serve --single dist/build/h5
```
