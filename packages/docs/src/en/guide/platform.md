# Platform Support

The library treats the native `uni.setStorage` API family as its only underlying dependency (unified across platforms) and is a pure orchestration layer with no per-platform directories. UTS source is distributed and compiled on the fly by the uni-app x toolchain:

| Platform | Status |
| --- | --- |
| Web | ✅ Build verified, all 22 verification logs passed (six groups: basic I/O / TTL / namespace / instances / clearExpired / error paths) |
| WeChat Mini Program | Same codebase for all platforms, pending testing |
| Android | Same codebase for all platforms, pending device testing |
| iOS / HarmonyOS | Adapted, untested due to environment limits (iOS needs macOS, HarmonyOS needs DevEco Studio) |

## Platform differences

| Difference | Notes |
| --- | --- |
| Capacity limits | H5 ~5MB / Mini Programs ~10MB; on Web `info().limitSize` returns `Number.MAX_VALUE` (no limit concept). The library exposes `info()` for self-management and **does no LRU eviction** (a v1 design decision) |
| Miss shape | Native `getStorage` fails on missing keys ("data not found"); the adapter translates it into "resolve(null)" so the contract matches on every platform |
| Serialization round trip | Typed objects read back as `UTSJSONObject` (official "type data storage" docs); restore types via the official `JSON.parse<T>(JSON.stringify(raw))` path |

## Verify it yourself

The repo ships a verification project at [packages/playground](https://github.com/MengXi-Studio/unix-storage/tree/main/packages/playground). The home page navigates into six verification pages grouped by feature (basic I/O / TTL / namespaces & instances / global config / clearExpired / error paths); each page auto-runs its checks on open and prints `[verify]` logs. Runs directly on Web:

```bash
pnpm install
cd packages/playground
pnpm build:web
npx serve --single dist/build/h5
```
