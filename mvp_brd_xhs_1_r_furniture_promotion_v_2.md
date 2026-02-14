# MVP BRD v1

## Project: 小红书自动发布系统（MVP阶段）

---

# 1. 项目目标

本项目目标为：

构建一个可稳定运行的小红书自动发布系统，用于测试内容自动分发能力与自然流量获取能力。

本MVP仅关注：

- 自动读取内容
- 自动发布图文
- 自动回写状态
- 基础风控控制

本MVP不包含：

- 多账号矩阵
- 自动私信
- 自动评论
- 数据抓取分析
- 内容自动生成系统

---

# 2. 验证目标与KPI

## 2.1 核心验证点

- 自动发布系统是否稳定
- 是否可以持续30天无异常运行
- 是否能够获得自然曝光

## 2.2 基础KPI

- 每日发布1–2篇
- 30天累计发布 ≥ 30篇
- 系统运行7天无发布异常

---

# 3. 系统架构

Youge内容表（已有系统）
→ GitHub Repository（唯一开发与运行Workspace）
→ GitHub Actions 定时触发
→ Playwright 浏览器自动发布
→ 回写Youge状态

重要说明：

- 本项目唯一开发与运行环境为 GitHub Repository
- 所有代码必须托管在指定 GitHub Repo 中
- 不允许使用本地长期运行环境
- 不允许使用第三方服务器
- 不允许部署到其他云平台

约束条件：

- 无自建服务器
- 使用GitHub Actions运行
- 通过Youge OpenAPI读取与更新数据

---

# 4. Youge数据结构与API接口说明（接口对接参考）

## 4.0 字段ID（FieldCode）自动拉取（Google Antigravity开发范围）

背景：
- Youge OpenAPI 文档未提供“直接获取表字段元数据/FieldCode列表”的标准接口，因此不要求业务侧手工逐个查看字段ID。
- 采用一次性“浏览器自动化抓取网络返回”的方式导出 FieldCode 映射表，供后续Youge API读写使用。

输入：
- Youge表页面URL（由业务侧提供，例如：
  https://sanyu.cloud/ug/ug-pc-app-polymer/app/{appCode}/{schemaCode}/{viewId}
  ）

输出（交付物）：
- /config/youge_field_map.json（字段名/显示名 → FieldCode 映射）
- 可选：/config/youge_field_map.csv

实现要求：
1. 使用 Playwright 打开该URL（仅用于导出字段映射，不参与每日发布主流程）
2. 监听 network 请求，捕获包含字段定义的接口响应（通常为 /v3/control/xxx 或类似）
3. 从响应中提取字段显示名、字段code（FieldCode）等信息
4. 生成映射文件（json/csv）并输出

触发方式：
- GitHub Actions 手动触发（workflow_dispatch）

边界：
- 该工具脚本仅需在表结构变更时重新运行
- 不要求自动提交回仓库（可输出为artifact，由业务侧下载后放入/config）

---


## 4.0 字段ID（FieldCode）自动拉取（Google Antigravity开发范围）

背景：
- Youge OpenAPI 文档未提供“直接获取表字段元数据/FieldCode列表”的标准接口，因此不要求业务侧手工逐个查看字段ID。
- 采用一次性“浏览器自动化抓取网络返回”的方式导出 FieldCode 映射表，供后续Youge API读写使用。

输入：
- Youge表页面URL（由业务侧提供，例如：
  https://sanyu.cloud/ug/ug-pc-app-polymer/app/{appCode}/{schemaCode}/{viewId}
  ）

输出（交付物）：
- /config/youge_field_map.json
  - 内容为字段名/显示名 → FieldCode 的映射
- 可选：/config/youge_field_map.csv

实现要求：
1. 使用 Playwright 打开该URL（仅用于导出字段映射，不参与每日发布主流程）
2. 监听 network 请求，捕获包含字段定义的接口响应（通常为 /v3/control/xxx 或类似）
3. 从响应中提取字段显示名、字段code（FieldCode）等信息
4. 生成并保存映射文件到仓库（或作为 workflow artifact 输出）

触发方式：
- GitHub Actions 手动触发（workflow_dis

说明：
Youge表格已存在或由业务侧自行创建。
Google Antigravity不负责Youge表结构设计与创建。

表名建议：Social_Content_XHS

字段示例（仅供接口调用参考）：

1. Title
2. Content
3. ImageURLs
4. Status（draft / pending / posted / failed）
5. ScheduledTime
6. PublishedTime
7. RandomDelaySec
8. ErrorMessage

状态规则：

- 仅Status = pending 才允许被读取
- 成功发布 → 更新为 posted
- 失败 → 更新为 failed + ErrorMessage

---

## 4.1 Youge OpenAPI 接口信息

统一访问地址：

https://sanyu.cloud/openapi

认证方式：

HTTP Header:
Authorization: Bearer {token}
Content-Type: application/json

Token由业务侧提供，并存储在 GitHub Secrets 中。

---

## 4.2 读取待发布内容（批量查询接口）

接口：
POST /records/{appCode}/{schemaCode}

示例请求体：

{
  "offset": 0,
  "limit": 1,
  "filters": [
    {
      "code": "Status",
      "operator": "equal",
      "value": ["pending"]
    }
  ],
  "sorts": [
    {
      "code": "ScheduledTime",
      "sortType": 0
    }
  ]
}

逻辑要求：
- 仅取一条
- 必须判断 ScheduledTime <= 当前时间

---

## 4.3 更新发布状态（PATCH接口）

接口：
PATCH /record/{appCode}/{schemaCode}/{bizObjectId}

成功示例：

{
  "Status": "posted",
  "PublishedTime": "2026-02-14 10:30:00"
}

失败示例：

{
  "Status": "failed",
  "ErrorMessage": "selector not found"
}

返回成功应为：

{
  "data": true
}

---

接口参数说明：
- appCode 与 schemaCode 5. 运行模式要求：
   - 生产环境（GitHub Actions）：允许 headless 或 xvfb 虚拟显示运行（以可稳定运行优先）
   - 本地调试：允许 headed（可见窗口）用于选择器校准d 为记录唯一ID

所有接口调用必须：
- 捕获异常
- 输出日志
- 失败时不丢失数据

---

## 7. GitHub项目结构（Google Antigravity开发范围）

必须包含：

/src
  fetchContent.ts
  publishXHS.ts
  updateStatus.ts
  utils/randomDelay.ts
  exportYougeFieldMap.ts   # 一次性导出FieldCode映射

/config
  youge_field_map.json      # 字段映射（用于API字段code映射）

/.github/workflows
  publish.yml
  export-field-map.yml      # workflow_dispatch：导出FieldCode映射

要求：API
- 查询 Status = pending
- ScheduledTime <= 当前时间## 8.1 Google Antigravity负责

- GitHub仓库初始化
- Playwright自动发布逻辑
- Youge API对接逻辑
- 状态回写逻辑
- 定时执行工作流
- 风控机制实现
- 一次性工具：自动导出Youge表 FieldCode 映射（exportYougeFieldMap + export-field-map workflow）

## 8.28. 点击发布
9. 检测发布成功提示

## 5.4 发布成功处理

- 调用Youge API
- 更新 Status = posted
- 写入 PublishedTime

## 5.5 发布失败处理

- 更新 Status = failed
- 写入 ErrorMessage
- 保留日志

---

# 6. 风控要求（Google Antigravity必须实现）

必须实现：

1. 每日发布数量上限控制
2. 随机延迟机制
3. 模拟人工打字
4. 模拟页面停留
5. 使用非无头模式（headful）
6. 登录态持久化
7. 基础异常捕获

禁止实现：

- 高频循环发布
- 批量账号管理

---

# 7. GitHub项目结构（Google Antigravity开发范围）
ontent.ts
publishXHS.ts
updateStatus.ts
utils/randomDelay.ts

/.github/workflows
publish.yml

要求：

- 可本地单次调试
- 有完整日志输出
- 有错误处理

---

# 8. 开发职责划分

## 8.1 Google Antigravity负责

- GitHub仓库初始化
- Playwright自动发布逻ity范围内

- Youge表结构设计与创建
- 内容生产
- 账号注册与养号
- 商业策略制定

---

# 9. 验收标准

系统上线后满足：

1. 能成功读取Youge待发布内容
2. 能成功发布图文
3. 能成功回写状态
4. 连续运行7天无系统级错误

---

# 10. Phase 2（未来扩展）

- 多账号支持
- 数据统计模块
- TikTok扩展
- Youtube扩展
- Instagramku扩展

---

End of MVP BRD v1

