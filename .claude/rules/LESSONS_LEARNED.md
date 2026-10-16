# 经验教训记录（Strict：仅记录经运行验证的坑）

## 2026-10-15 P0/P1 工程初始化 + Spike（HBuilderX 5.26 / Node v22.23.0 / Windows）

### 工程骨架（playground 裁剪自 unix-request）

1. **App.uvue 必须含 `<template>` 或非空 `<script>` 块**：仅 `<style>` 报「At least one <template> or <script> is required」；空 `<script setup lang="uts"></script>` 同样被剔除后报错。最小可用形态：`<script setup lang="uts"> onLaunch(() => {}) </script>`（App.uvue 内生命周期 onLaunch 全局可用，无需 import）。
2. **uni-app x 5.26 npm 链 web 产物目录为 `dist/build/h5`**（非旧版 `dist/build/web`）。

### vite / npm 构建链

3. **`import uni from '@dcloudio/vite-plugin-uni'` 在 Node 22.23 + vite 5.2.8 下报 `uni is not a function`**：vite config bundle 的 ESM-CJS 互操作拿到的命名空间只含 `runDev/runBuild/shouldMoveSourceMapFromCache/default`（CJS 包带 `__esModule: true`），可调用实现在 `.default`。修复：`const uni = (uniPkg as any).default ?? uniPkg`。unix-request 同环境复现同错（非本项目特有，怀疑 Node 版本升级所致，其历史构建环境 Node 版本更低）。
4. **playground tsconfig lib 仅 ESNext 无 DOM**，vite.config.ts 会被 uts 类型检查器扫描 —— config 内写 `console.log` 报 TS2584（warning 级不阻断构建），调试日志用完即删。
5. **`import { createSSRApp } from 'vue'` 曾报 warning「'vue' has no exported member named 'createVueApp'」**：与 App.uvue 空 script 问题同期出现，App.uvue 修复后 build 通过且 warning 未再阻断，主因为伴随错误（待 Android 链复核）。

### HBuilderX CLI（core-protocol §1.2 文档解析结论）

6. **命令形态（官方 cli/launch-app.md、logcat-app.md）**：`D:\HBuilderX\cli.exe launch app-android --project <项目名或绝对路径>`（HBuilderX 5.0+，纯 CLI 运行默认；`--compile true` 只编译）；`cli logcat app-android --project <...> --mode full|lastBuild|prevBuild`（默认 prevBuild，取上一轮构建日志；拿当次运行日志用 full）。运行前须 `cli open`，`cli devices list` 需 IDE 已启动。
7. **launch / publish 校验有效 appid**（unix-request LESSONS 4 继承确认）：unix-storage playground 暂复用 `__UNI__1927897`（unix-request），后续发布前应在 GUI 重新获取独立 appid。

### Spike 结论（web 端运行验证，10 条 [spike] 日志全过、无 storage 报错；Android 端待设备补测）

8. **S1 Promise 形态**：`await uni.setStorage({...} as SetStorageOptions)` 原生可用（不传回调）；`await uni.getStorage({...})` 原生可用但 **返回完整结构 `{ data, errMsg, errSubject }` 而非 data 本身**（web 端实测）。跨端一致的安全路径 = **手动 Promise 包装**（success/fail 回调形态，success 回调参数 res.data 两端契约一致），adapter 据此实现。
9. **S2 序列化往返**：嵌套 type + null 字段对象 set→get 往返数据完整（`{"value":"tk-123","expire":null,"profile":{"nickname":"mengxi","avatar":null}}`）；**type 读回为 UTSJSONObject（官方文档「类型数据的存取说明」明确），还原统一用 `JSON.parse<T>(JSON.stringify(raw))`**（官方路径，`as T` web 端可用但 Kotlin 端有 ClassCastException 风险，库实现不用）；UTSJSONObject 下标访问兜底可用。
10. **S3 前缀过滤**：`uni.getStorageInfoSync().keys` 全量 key + `String.startsWith` 过滤正确；web 端 keys 含框架 `__DC_STAT_UUID`，库的命名空间过滤天然规避。
11. **uni.getStorage 对不存在 key 走 fail**：errMsg `getStorage:fail data not found`（官方文档明确）→ adapter 的 get 未命中语义 = fail 时按 errMsg 判定 resolve(null)，其他 fail 照常 reject。

## 2026-10-15 P2–P4 core 实现 + Web 全功能验证（22 条 [verify] 日志全过）

### Web 构建链

12. **`pnpm build:web`（uni build）默认找 `src/manifest.json` 直接 ENOENT**：必须设置 `UNI_INPUT_DIR` 环境变量指向 playground 目录（大写盘符 `E:\...`），再执行构建。esbuild 需在沙箱外跑（临时文件写 `E:\_tmp_*` 等沙箱外路径）。
13. **.uts 插件文件在 web 构建链报 `Cannot find name 'UniError' / 'UTSJSONObject'` warning**：TS 视图 linter 噪音，不阻断构建（DONE Build complete），运行时由 web polyfill 正常提供，22 条日志零报错实证。

### 实现层（运行验证）

14. **闭包自引用 / 闭包计数器捕获在 Kotlin 端是雷**（unix-request taskHolder 自引用教训同源）：批量删除 / clearExpired 扫描统一用**顶层函数递归 + resolve/reject 用零参包装闭包传递**（adapter.removeBatchNext / ttl.scanNext 模式），web 端验证通过，Android 同构规避。
15. **web 端 `uni.getStorageInfoSync().limitSize` 返回 Number.MAX_VALUE（1.79e308 KB）**：web 无容量上限，`info()` 的 limitSize 平台差异大，业务勿硬编码断言。
16. **record 探测（detectRecord）**：try-cast UTSJSONObject + `UTSJSONObject.keys()` 探活（keys 长度 0 视为非对象）+ data/expire 双字段判定 + expire try-cast number；web 端 22 条日志实证 record 往返、非 record 原样返回（Q5）、惰性过期、clearExpired 计数全对。
17. **Web 端验证结论矩阵**：TTL 三级回退（调用级/实例 defaultTTL/configureStorage 全局）、前缀隔离（keys 剥前缀、clear 仅本命名空间、跨实例不泄漏）、错误路径（空 key / 保留前缀均 ERR_PARAM 且 errSubject=unix-storage、key 正确挂载）全部符合 store-plan §4.4 语义。Android 端待设备补测（重点关注：get<VToken> 直接成员访问的 CCE 风险——安全路径为 JSON.parse<T>(JSON.stringify(raw))）。

## 2026-10-16 playground 多页化（首页导航 + pages-sub 六功能页）

18. **uni-app x 5.26 h5 产物默认 history 路由模式**：构建产物内嵌 `router:{mode:"history",base:"/"}`。直接访问 hash URL（`/#/pages-sub/x/x`）会被忽略并剥成无 hash 的 `/` 回落首页；子页正确入口是路径 URL `http://<host>/pages-sub/<name>/<name>`，且静态服务必须开 SPA 回退（`npx serve --single dist/build/h5`，文档/README 已按此写法）。首页 cell `@click + uni.navigateTo` 在 history 模式下浏览器实测跳转正常。
19. **多页分包结构经 web 链运行验证**：pages.json `subPackages`（root=pages-sub，6 页）+ `common/test-utils.uts` 共享 sleep/errDesc 编译运行均正常；6 页进入自动运行，[verify] 22 项断言（7+4+4+2+2+3）与原单页语义一致。core README 修改后须跑 `pnpm sync:uni-modules` 同步 playground 副本。
20. **ux-router 迁移接线（与 unix-request playground 完全对齐，实测通过）**：①复制 uni_modules/ux-router 模块（71 文件）；②vite.config.ts 在 `uni()` 前挂 `routeGen`（`./uni_modules/ux-router/plugins/index.mjs`，pages/subPackages/entryPage 配置），构建时自动生成路由表 + define-uni-page.d.ts + route-name.gen.d.ts，**路由表生成位置由 `router.outputPath` 控制（`path.resolve` 解析，现配 `router/routes.gen.uts`，import 同步改 `./routes.gen.uts`）**；③main.uts `app.use(router)`；④每页 script setup 写 `defineUniPage({title,name})` 宏（插件编译期剥离）；⑤导航用 `RouterLink to="pages-sub/x/x"`（相对路径无前导斜杠）。路由表 7 条（home+6 页），RouterLink 点击跳转 / history.back 回退均实测正常。pages.json 仍为手写维护，与路由表双轨并存（unix-request 同模式）。注意：vite.config.ts 中 `import uni from '@dcloudio/vite-plugin-uni'` 简写在本环境实测 `uni is not a function`，必须保留 `.default ?? uniPkg` 兜底（LESSONS 3）。

## 2026-10-16 P5 app 链编译打通（uts-proxy 字符串常量官方 bug）

21. **app 链报 `uni_modules/<plugin>?uts-proxy (13:44): Expected a semicolon` 根因 = @dcloudio/uni-uts-v1 官方 bug**：`dist/code.js` 的 `genInitCode` 对 `StringLiteral` 返回**裸值不加引号**（`return expr.value`），入口 `export const DEFAULT_KEY_PREFIX: string = 'mx_storage:'` 被生成代理为 `export const DEFAULT_KEY_PREFIX = mx_storage:`（非法 JS）；字符串值恰好是合法标识符时侥幸通过解析（unix-request 的 `DEFAULT_METHOD = 'GET'` 即此，所以 request 项目未暴露）。数值/布尔常量无此问题。业务源码无法规避（字符串常量改任何非字面量形态都会生成空赋值 `= ` 同样炸），必须修代理代码。
22. **修复方案（最终采用，零工具链改动）**：playground `vite.config.ts` 挂 `fix-uts-proxy-string-literal` 插件（enforce post，仅命中 `?uts-proxy` 模块，把 `export const X = 裸值` 行的裸值 JSON.stringify 补引号，跳过布尔/PURE 代理行）。**HBuilderX 编译 uni-app x 会加载项目 vite.config.ts**（证据：route-gen 插件日志出现在 HBuilderX 编译输出），一处修复 npm 链与 HBuilderX 链同时生效。曾试过 pnpm patch（npm 链，机制正规但只覆盖 npm 链）+ 手改 HBuilderX 内置 code.js（升级即覆盖，不可持续），均已还原撤销。官方修复 genInitCode 后可移除该插件。playground 已换独立 appid `__UNI__F7A692C`。
23. **uts-proxy 排查方法**：在 `uni-cli-shared/dist/vite/plugins/uts/uni_modules.js` 的 transform（`const result = await compile()` 后）插桩 dump `result.code` 即可看到生成的代理代码。npm 链 `pnpm build:app`（UNI_INPUT_DIR=. + `uni build -p app-android`）可与 HBuilderX 同错复现，插桩优先在 npm 链做。
24. **HBuilderX CLI 同名项目歧义**：本机 4 个仓库（unix-storage/request/router/utils）均有 `playground` 项目，`cli publish --project playground` 按名字解析会**误编译其他仓库的项目**（输出路径可甄别），同名项目只剩 2 个时仍会随机解析。先 `cli project list`，对非目标仓库执行 `cli project close --path <绝对路径>` 后再 publish；本地编译验证命令：`cli publish app-android --type appResource --project playground`（文档 publish-app-appResource.md，无需设备）；web 回归：`cli publish web --project playground`（文档 publish-h5.md）。

## 2026-10-17 云打包 Kotlin 编译打通（compileReleaseKotlin 三组错误）

25. **云打包报 `uni_modules/ux-storage/utssdk/app-android/src/index.kt` Kotlin 错误三组根因**（本地 `cli publish app-android --type appResource` 导出的 unpackage/resources/app-android/.../src/index.kt 可离线对照）：①`catch(onRejected)` 候选全部不适用 —— uts 源码 `.catch((e: any): void => {...})` 的参数标注 any 生成 Kotlin `fun(e: Any)`，不匹配 UTSPromise.catch 的 `(Any?) -> R` 候选，**必须标 `(e: any | null)`**（core.uts 6 处 + adapter.uts 1 处 + ttl.uts 2 处，ttl.uts 有一处 2-tab 缩进的嵌套 catch 易漏）；②`Argument type mismatch: actual 'Any?', expected 'Any'` —— 官方 `SetStorageOptions.data` 为非空 any，`setStorageRaw(key, data: any | null)` 直接透传编译不过，**null 分流到 removeStorageRaw**（null 写入与移除对读方等价，契约「读回 null」不变）；③`Unresolved reference 'StorageInstance'` —— Kotlin 生成器只为**入口 index.uts 显式 import 的类型**生成定义，`export type {} from` 转发不等于 import，createStorage 返回类型标注引用的 StorageInstance 必须加入入口 import type（web 端仅 TS warning 不易察觉，云打包才炸）。
26. **HBuilderX 发行 web 产物默认 hash 路由**（npm 链产物是 history 模式）：URL 形如 `http://host/#/pages-sub/basic/basic`，验证 URL 时查 `location.hash` 而非 pathname；hash 直达子页可用且不需要 SPA 回退（serve 不用 -s 也行）。
