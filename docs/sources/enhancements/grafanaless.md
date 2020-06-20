# 分享 Dashboard

## 应用场景

在整体解决方案中，所有物联网时序数据保存在时序数据库中，例如 InfluxDB，通过 Grafana 读取 InfluxDB 进行可视化图表展示，最终这些可视化图表被第三方平台所集成。

## 问题

使用开源版 Grafana 进行分享展示时，存在 Grafana 的踪迹，当被第三方平台集成时，用户容易混淆。最好的方式是用户并不感知 Grafana 的存在：

- 存在侧边栏
- 导航栏中保留了 logo
- 导航栏中点击 Dashboard 名字，出现 Dashboard 搜索
- Cycle View Icon，点击时会在三种模式之间切换(normal, tv, fullscreen)

## 需求

将面板进行分享时，用户只看到图标，不感知 Grafana 的存在。

## 方案

1. 匿名访问：Grafana 已有功能

- auth anonymous
- allow embedding
- 配置匿名访问 Org.
- 配置角色：Viewer role

2. 分享 URL

- 分享 URL 中默认携带两个参数：

  - kiosk=tv
  - shared

- 分享模式(kiosk=tv&shared)下，屏蔽 esc 退出按键

- SideMenu 修改

- DashNav 修改
