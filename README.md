# 云南七日自驾旅行规划

2026.11.08–11.14：萧山 → 昆明 → 大理 → 丽江 → 香格里拉 → 昆明 → 萧山。

网页发布地址：https://yunnan-november-journey-2026.corou-2728.chatgpt.site

## 功能

- 三维路线示意、百度地图 GL 实际道路路线与自驾里程/时长
- 按已定安排显示七日计划，酒店和未定时段留空
- 独立的出行前准备框：抢票节点、证件、衣物和必带物品
- 香格里拉住宿地到蓝月谷往返自驾计算
- 14 日香格里拉到昆明机场自驾，按晚间航班倒推出发时间
- 小字机票参考表，注明查询快照、起价及次日到达
- Open-Meteo 按出行日期匹配预报
- 每日署名共享备注，服务端持久化；昵称自填，未经身份验证

## 本地预览

Node.js 24，无须安装运行依赖：

    node server.mjs

打开 http://127.0.0.1:4173 。本地备注存放于 .data/notes.json，已忽略，不上传。昵称、地图 AK 和时间试算偏好可存在浏览器。

## 线上部署

线上版本为 ESM Worker + D1 数据库，沿用与本地相同的已确认前端。dist 下三个前端源文件为 index.html、style.css、app.js。worker/index.mjs 实现共享备注 API，build.mjs 将前端嵌入 Worker 并生成 dist/server/index.js。数据库迁移由 Drizzle 从 db/schema.ts 生成。

    pnpm install --frozen-lockfile --ignore-scripts
    pnpm run db:generate
    pnpm run build
    pnpm test

源码中的 .openai/hosting.json 绑定 Sites 项目与 D1 DB。发布包需要 dist/server/index.js、hosting manifest 和 drizzle 迁移。GitHub 用于存放源码；不要只把前端放到 GitHub Pages，否则共享备注 API 不存在。

## 数据说明

百度地图 AK 为用户提供的浏览器端 key，会出现在公开客户端源码；在百度平台设置正式域名白名单。不要填服务端 SK。酒店未提供，路线使用明确标注的城市参考点；当天道路情况和实际地址变化会影响车程。

航班票价为 2026.10.29 携程查询快照，非实时锁价，含税总价未核实；航班未代订。天气没有匹配日期的数据时留空。共享备注不会写入源码仓库，本地测试与线上数据库彼此独立。
