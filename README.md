# 云南七日自驾旅行规划

2026.11.08–11.14：萧山 → 昆明 → 大理 → 丽江 → 香格里拉 → 昆明 → 萧山。

GitHub Pages：https://nenmonchina.github.io/yunnan-road-trip-2026/

网页镜像：https://yunnan-november-journey-2026.corou-2728.chatgpt.site

共享备注后端：腾讯云 CloudBase 上海环境 `yunnan-notes-d9glvl31g451cf24c`，函数 `yunnan-notes-api`，集合 `travel_notes`。

## 功能

- 三维路线示意、百度地图 GL 实际道路路线与自驾里程/时长
- 按已定安排显示七日计划，酒店和未定时段留空
- 独立的出行前准备框：抢票节点、证件、衣物和必带物品
- 香格里拉住宿地到蓝月谷往返自驾计算
- 14 日香格里拉到昆明机场自驾，按晚间航班倒推出发时间
- 小字机票参考表，注明查询快照、起价及次日到达
- Open-Meteo 按出行日期匹配预报
- 每日署名共享备注，所有访问者均可删除任意备注，删除后同步；服务端持久化；昵称自填，未经身份验证

## 本地预览

Node.js 24，无须安装运行依赖：

    node server.mjs

打开 http://127.0.0.1:4173 。本地备注存放于 .data/notes.json，已忽略，不上传。昵称、地图 AK 和时间试算偏好可存在浏览器。

## 线上部署

前端由 GitHub Pages 发布，直接请求腾讯云 HTTP 网关 `/api/notes`。dist 下三个前端源文件为 index.html、style.css、app.js。build.mjs 生成 docs 与镜像 Worker；旧 Worker 的备注 API 转发腾讯云，避免旧客户端写入另一套数据。

CloudBase 普通云函数源码在 cloudbase/notes，Node.js 20.19、执行方法 index.main、部署时自动安装依赖。集合 travel_notes 设置 ADMINONLY，由服务端 SDK 访问；HTTP 路由关联该函数，平台跨域关闭，由函数仅向两个已发布网页来源返回 CORS。无需公开数据库权限或将云密钥放进网页。体验环境有效期至 2027-04-29 23:59:59；未开通收费升级。

    pnpm install --frozen-lockfile --ignore-scripts
    pnpm run db:generate
    pnpm run build
    pnpm test

源码中的 .openai/hosting.json 保留 Sites 项目与旧 D1 绑定；旧库保留备份，线上备注改由腾讯云保存。发布包保留原有迁移文件。GitHub Pages 仅发布 docs，备注接口独立运行于腾讯云。

## 数据说明

百度地图 AK 为用户提供的浏览器端 key，会出现在公开客户端源码；在百度平台设置正式域名白名单。不要填服务端 SK。酒店未提供，路线使用明确标注的城市参考点；当天道路情况和实际地址变化会影响车程。

航班票价为 2026.10.29 携程查询快照，非实时锁价，含税总价未核实；航班未代订。天气没有匹配日期的数据时留空。共享备注不会写入源码仓库，本地测试与线上数据库彼此独立。

## GitHub Pages

Pages 发布源为 main 分支的 /docs 文件夹，构建时由已确认前端生成。共享备注直接连接腾讯云，支持署名填写和所有访问者删除。参考站 yunnan-travel 保持原样。

