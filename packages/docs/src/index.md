---
layout: home

title: '@meng-xi/unix-storage'
titleTemplate: Unix Storage 本地缓存

hero:
  name: '@meng-xi/unix-storage'
  text: uni-app x 本地缓存
  tagline: 为 uni-app x 提供功能完善的本地缓存库
  image:
    src: /logo.svg
    alt: Unix Storage
  actions:
    - theme: brand
      text: 快速开始
      link: /guide/getting-started
    - theme: alt
      text: 介绍
      link: /guide/introduction
    - theme: alt
      text: GitHub
      link: https://github.com/MengXi-Studio/unix-storage

features:
  - icon: ⚡️
    title: Promise 化
    details: set / get / remove / clear / info / keys / clearExpired 全量 async/await；未命中与已过期返回 null 不 reject；统一 StorageError 携带 errSubject / nativeErrCode / key
  - icon: ⏱️
    title: TTL 过期管理
    details: record 包裹过期时间戳，读取惰性判断（Date.now() > expire 即移除）；clearExpired 全量扫描返回清理条数；三级回退：调用级 ttl → 实例 defaultTTL → 内置永不过期
  - icon: 🗂️
    title: key 命名空间
    details: '默认前缀 mx_storage: 规避 uni- / dcloud_ 保留前缀，非法保留前缀以 ERR_PARAM 拦截；keys() 剥前缀返回原始 key；clear 仅清理本命名空间'
  - icon: 🏗️
    title: 多实例
    details: createStorage(defaults) 创建前缀 / TTL 隔离的实例，心智对标 axios.create；默认实例开箱即用，configureStorage 配置全局默认
  - icon: 🛡️
    title: 兼容策略
    details: 非本库格式数据（业务直写原生 API 的存量）按无过期原样返回，不报错不误删；get 未命中语义与原生 data not found fail 在 adapter 层统一转译
  - icon: 🧩
    title: UTS / TypeScript 优先
    details: 配置字段 | null 空安全兜底，错误码字面量联合，get<T> 泛型静态标注；Web 端 22 项功能验证日志全部通过
---
