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

# 4. Youge数据结构（仅作为接口参考，不属于本次开发范围）

说明：
Youge表格已存在或由业务侧自行创建。
Google Antigravity不负责Youge表结构设计与创建。

表名建议：Social\_Content\_XHS

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

# 5. 自动发布逻辑（Google Antigravity开发范围）

以下内容属于 Google Antigravity 开发范围：

## 5.1 定时机制

- GitHub Actions 定时执行
- 每日最多执行2次
- 支持随机延迟执行

## 5.2 内容读取逻辑

- 调用Youge OpenAPI
- 查询 Status = pending
- ScheduledTime <= 当前时间
- limit = 1

## 5.3 发布流程

1. 启动浏览器（Playwright）
2. 使用持久化登录态
3. 进入小红书发布页面
4. 上传图片
5. 输入标题
6. 输入正文（模拟人工打字）
7. 随机停留
8. 点击发布
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

必须包含：

/src
fetchContent.ts
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
- Playwright自动发布逻辑
- Youge API对接逻辑
- 状态回写逻辑
- 定时执行工作流
- 风控机制实现

## 8.2 不在Google Antigravity范围内

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

