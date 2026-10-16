---
layout: home

hero:
  name: unix-storage
  text: uni-app x 本地缓存库
  tagline: Promise 化 / TTL 过期 / key 命名空间 / 多实例 —— 基于 uni.setStorage 系列原生 API，一套 API 多端覆盖
  actions:
    - theme: brand
      text: 快速开始
      link: /guide/getting-started
    - theme: alt
      text: API 参考
      link: /api/functions
    - theme: alt
      text: GitHub
      link: https://github.com/MengXi-Studio/unix-storage

features:
  - icon: ⚡️
    title: Promise 化
    details: set / get / remove / clear / info / keys / clearExpired 全量 async/await；未命中与已过期返回 null，不 reject
  - icon: ⏱️
    title: TTL 过期管理
    details: 毫秒级过期，读取惰性判断（过期即移除）；clearExpired 全量扫描返回清理条数；三级回退对齐 axios 心智
  - icon: 🗂️
    title: key 命名空间
    details: "默认前缀 mx_storage: 规避平台保留前缀；keys() 剥前缀；clear 只清理本命名空间，不触碰其他数据"
  - icon: 🏗️
    title: 多实例
    details: createStorage(defaults) 创建前缀 / TTL 隔离的实例，心智对标 axios.create；默认实例开箱即用
  - icon: 🛡️
    title: 统一错误结构
    details: StorageError 携带 errSubject / nativeErrCode / key；非法保留前缀在操作期以 ERR_PARAM 拦截
  - icon: 🧩
    title: 强类型 UTS
    details: 配置字段 | null 空安全兜底，错误码字面量联合类型，get<T> 泛型静态标注；Web 端 22 项验证日志全过
---
