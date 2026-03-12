---
title: Google Workspace CLI 使用教程：怎么和 OpenClaw 结合
description: 一篇面向管理员的实用教程：介绍 GAM（Google Workspace CLI）的定位、典型用法，以及如何与 OpenClaw 的 exec、cron、hooks、message 能力组合成自动化工作流。
date: 2026-03-12
tags: ["Google Workspace", "GAM", "OpenClaw", "教程", "自动化"]
draft: false
archive: false
badge: 教程
slug: google-workspace-cli-openclaw-guide
---

# Google Workspace CLI 使用教程：怎么和 OpenClaw 结合

> 这篇默认把“Google Workspace CLI”理解为 **GAM**（Google Apps Manager / `gam7`），因为它基本是 Google Workspace 管理员命令行世界里最常用、资料最完整、最像“正经 CLI”的那一个。
>
> 如果你说的是别的项目，那另算；但大概率你要找的就是它。

---

## 1. 这玩意儿到底是什么

**GAM** 是一个面向 **Google Workspace 管理员** 的命令行工具，用来批量管理：

- 用户
- 组织架构（OU）
- 群组
- Gmail 设置
- Google Drive 文件与权限
- Calendar / Meet / 审计类数据
- Admin SDK 能覆盖的很多管理动作

一句人话：

> 你不想一页页点 Google Admin 控制台，就用 GAM。

它特别适合：

- 批量创建/修改账号
- 批量导出信息
- 定时巡检
- 跟 CSV / Google Sheet 联动
- 给 OpenClaw 当“Google Workspace 运维抓手”

---

## 2. 适合谁，不适合谁

### 适合
- 你有 Google Workspace 管理员权限
- 你经常做重复的管理动作
- 你想自动化：日报、审计、告警、批量改配置
- 你想让 OpenClaw 帮你把操作串起来

### 不适合
- 你只是普通 Gmail 个人用户
- 你没有管理员权限
- 你想搞 GUI 点点点，不想碰命令行

没管理员权限还想玩这个，跟拿门卡刷空气差不多，没戏。

---

## 3. 基础架构：GAM + Google API + OpenClaw

建议把职责分清：

### GAM 负责
- 真正调用 Google Workspace Admin / Gmail / Drive / Calendar 等 API
- 做查询、导出、更新、批处理

### OpenClaw 负责
- 用自然语言驱动流程
- 调 `exec` 跑 GAM 命令
- 用 `cron` 定时执行检查
- 用 `hooks` 接收外部事件
- 用 `message` 把结果发回 Telegram / Slack / Discord
- 用文件、脚本、日报模板把结果整理成人话

一句话架构：

> **GAM 干活，OpenClaw 编排、解释、提醒。**

这才像样，不然单独用 GAM 就只是一个暴躁 CLI。

---

## 4. 安装方式概览

GAM 官方常见安装方式有三类：

### 方式 A：官方安装脚本
适合先跑起来。

### 方式 B：GitHub Releases / 安装包
适合想走稳定发布包的人。

### 方式 C：Python 包
例如：

```bash
pip install gam7
```

如果你已经有比较干净的 Python 环境，`pip install gam7` 往往是最省脑子的。

> 但别一股脑在系统 Python 里乱装。那种做法后面排错时很想骂人。

---

## 5. 首次配置思路

GAM 的麻烦不在命令本身，而在 **Google API 授权配置**。

你通常需要准备：

- 一个 Google Cloud Project
- 启用相关 API（例如 Admin SDK、Gmail API、Drive API、Calendar API）
- OAuth / service account / domain-wide delegation 之类的授权方式
- Google Workspace 管理员侧的授权

### 常见实践
如果目标是 **管理员级批量管理**，通常要关注：

- **Admin SDK API**
- **Domain-wide delegation**
- **Workspace 管理员权限范围**

### 建议顺序
1. 先把最小功能跑通
   - 例如先验证能列出 1 个用户
2. 再加 API scope
3. 再做批量任务
4. 最后再接 OpenClaw 自动化

别一上来就想：
“我今天要把 Gmail、Drive、Calendar、用户生命周期、审计告警一次性接完。”

这种思路通常会把自己拧成麻花。

---

## 6. 常见命令场景

下面这些不是完整 GAM 语法大全，而是你最可能真的会用的方向。

### 6.1 查用户
```bash
gam info user alice@example.com
```

适合：
- 看账号状态
- 看基本属性
- 看许可证 / 组织结构等信息（取决于具体命令与权限）

### 6.2 列用户
```bash
gam print users
```

适合：
- 做导出
- 做盘点
- 跟 OpenClaw 后续分析串起来

### 6.3 建用户
```bash
gam create user alice@example.com firstname Alice lastname Zhang password 'TempPassword123!'
```

适合：
- 新员工入职
- 批量开账号

### 6.4 改群组成员
```bash
gam update group eng@example.com add member alice@example.com
```

适合：
- 按部门 / 项目调整成员

### 6.5 批量跑 CSV
GAM 一个强项就是 CSV / 批处理。
例如：

```bash
gam csv users.csv gam update user ~primaryEmail suspended off
```

这类命令适合：
- 批量改属性
- 批量开关帐号
- 批量改签名、群组、OU

### 6.6 用 Google Sheet 作为输入
GAM 文档里也支持从 Google Sheet / Google Doc 取数据跑批处理。
这很适合把“运营同学填表”跟“管理员执行”拆开。

---

## 7. GAM 的强项：批量和并行
从官方 wiki 的 Bulk Processing 看，GAM 对这块是认真做过的。

关键点：

- 支持 `batch` / `tbatch`
- 支持 `csv`
- 支持从 Google Sheet / Google Doc 取命令或数据
- 支持并行处理
- 支持输出重定向

这意味着它很适合做：

- 批量建号
- 批量审计
- 批量导出权限
- 批量同步群组成员

对 OpenClaw 来说，这很香，因为：

> OpenClaw 不该一条条替你点网页；这种重复体力活，应该让 GAM 去抡。

---

## 8. OpenClaw 跟 GAM 结合的正确姿势

下面是重点。

---

## 8.1 模式一：让 OpenClaw 用 `exec` 直接调用 GAM

最简单，也最实用。

### 适合场景
- 临时查询
- 低频管理动作
- 让 OpenClaw 帮你解释输出

### 典型流程
1. 你对 OpenClaw 说：
   - “查一下哪些用户最近被 suspend”
   - “导出 sales 组成员”
2. OpenClaw 用 `exec` 跑 GAM
3. OpenClaw 解析输出
4. OpenClaw 把结果整理成人话发给你

### 示例思路
```bash
gam print users fields primaryEmail,suspended,orgUnitPath
```

然后让 OpenClaw：
- 过滤 suspended=true
- 总结数量
- 按 OU 分类
- 发成 Telegram 消息

### 优点
- 简单
- 不需要改 OpenClaw 内部结构
- 见效快

### 缺点
- 需要机器上已经正确安装和配置 GAM
- 如果命令很危险，必须加确认

这点别犯蠢：
**查询类动作可以直接跑，修改类动作要确认。**

---

## 8.2 模式二：用 OpenClaw 的 `cron` 做定时巡检

这几乎是最值钱的组合之一。

OpenClaw 的 Gateway 自带 cron 调度，可以：

- 定时触发任务
- 让任务在主会话或隔离会话里跑
- 把结果自动回发到聊天渠道

### 适合场景
- 每天早上导出新用户 / 停用用户列表
- 每天检查共享盘或文件权限异常
- 每周盘点高风险管理员账号
- 每天汇总 Gmail / Drive / Admin 相关运营数据

### 推荐套路
- 用 cron 触发一个“巡检任务”
- 任务里跑 shell 脚本或一组 GAM 命令
- OpenClaw 负责把原始结果总结成消息

### 例子
你可以让 OpenClaw 每天 09:00 做：

- `gam print users ...`
- `gam print groups ...`
- `gam print admins ...`
- 汇总异常
- 发 Telegram 给你

### 为什么这个比自己写 crontab 香
因为 OpenClaw 的 cron：
- 跟会话、消息投递能打通
- 可以直接把结论发回来
- 比单纯 shell + mail 好用得多

---

## 8.3 模式三：用 OpenClaw 的 `hooks` 接收外部事件，再联动 GAM

如果你已经有别的系统能发 webhook，这条路更顺。

OpenClaw 的 webhook/hook 能做两件事：

- `POST /hooks/wake`：往主会话塞一个系统事件
- `POST /hooks/agent`：跑一个隔离 agent 任务

### 适合场景
- HR 系统发来“新员工入职”事件
- 表单系统发来“创建共享邮箱”请求
- 审计系统发来“某管理员角色被修改”事件

### 组合方式
外部系统 → OpenClaw hook → OpenClaw 决定执行 → `exec` 跑 GAM → 回消息

### 例子
#### 新员工入职自动化
1. HR 系统 webhook 发给 OpenClaw
2. OpenClaw 收到：姓名、部门、邮箱、OU、群组
3. OpenClaw 调用本地脚本或直接跑 GAM：
   - 创建账号
   - 加群组
   - 设 OU
4. OpenClaw 把结果发你

这就是一个很典型的“自然语言编排层 + 命令行执行层”组合。

---

## 8.4 模式四：GAM 负责采集，OpenClaw 负责总结成日报 / 告警

这是我最推荐的落地方式。

### 为什么
因为 GAM 输出经常是：
- 长
- 硬
- 像机器咳出来的

OpenClaw 的价值就在于把这坨东西变成人能看的摘要。

### 典型流程
1. GAM 导出 CSV / JSON / 文本
2. OpenClaw 读结果文件
3. OpenClaw 总结：
   - 重点变化
   - 风险项
   - 建议动作
4. 发给你或写到日报文档

### 例子
#### Drive 权限审计
- GAM 导出某 OU 用户的文件权限列表
- OpenClaw 提取：
  - 对外共享数量
  - anyone-with-link 数量
  - 高风险文件 owner
- 最后回一句人话：
  - “今天发现 12 个外链共享，其中 3 个属于财务 OU，建议先看这 3 个。”

这就不是冷冰冰的 CLI 了，这才像助理。

---

## 9. 推荐的集成架构

如果你真要长期用，我建议这样分层：

### 第 1 层：GAM 命令或脚本层
放在本机，比如：

- `scripts/gw/list_suspended_users.sh`
- `scripts/gw/audit_drive_sharing.sh`
- `scripts/gw/create_onboarding_user.sh`

每个脚本只做一件事。

### 第 2 层：OpenClaw 编排层
由 OpenClaw 负责：

- 调用脚本
- 解析输出
- 决定是否告警
- 定时执行
- 回消息

### 第 3 层：聊天 / 报告层
结果投递到：

- Telegram
- Slack
- Discord
- 日报 Markdown 文件

### 为什么别把所有逻辑都塞进一句巨长的 GAM 命令
因为后期维护会很恶心。

拆脚本的好处：
- 容易测
- 容易复用
- 容易审计
- OpenClaw 调用起来也干净

---

## 10. 一个实战例子：每天巡检停用账号

### 目标
每天早上 9 点：
- 跑 GAM 查询所有 suspended 用户
- OpenClaw 生成摘要
- 发到 Telegram

### 建议实现
#### 脚本
`scripts/gw/list_suspended_users.sh`

逻辑：
1. 调 `gam print users fields primaryEmail,suspended,lastLoginTime,orgUnitPath`
2. 过滤 `suspended=true`
3. 输出 CSV 或纯文本

#### OpenClaw 任务
- 用 cron 每天 09:00 触发
- 跑脚本
- 读输出
- 生成摘要

### 结果消息应长这样
- 今日停用账号：8 个
- 新增停用：2 个
- 主要集中在 `/Contractors`
- 超过 30 天未登录且仍未归档：3 个

比直接甩你 300 行命令输出强多了。

---

## 11. 一个实战例子：入职自动化

### 目标
通过一个结构化输入，完成：
- 建账号
- 放 OU
- 加群组
- 返回结果

### 推荐做法
#### 输入来源
- Google Sheet
- 外部表单
- webhook
- 你直接在 Telegram 里发结构化指令

#### 执行动作
OpenClaw 调用：
- `gam create user`
- `gam update group ... add member ...`
- 其他后续脚本

#### 输出
OpenClaw 回复：
- 已创建用户
- 临时密码状态（注意别乱外发）
- 已加入哪些组
- 哪一步失败

### 安全提醒
**密码、恢复邮箱、权限提升这些动作，别默认自动执行。**

这类动作建议：
- 先生成 plan
- 再确认
- 再执行

不然等于给自动化系统一把锤子，然后盼着它别敲到自己脚。

---

## 12. 安全边界：这部分别装瞎

Google Workspace 管理自动化，最容易出事的不是技术不会，而是权限太大。

### 建议原则
#### 1. 查询和修改分开
- 查询：可以让 OpenClaw 直接执行
- 修改：最好要求确认

#### 2. 最小权限
GAM 用到哪些 API scope，就开哪些。
别为了省事把一堆 scope 全开满。

#### 3. 别把密钥乱塞进脚本
- 不要硬编码 client secret
- 不要把 token 提交到 git
- 不要把敏感配置写进会发给别人的日志

#### 4. 把高危动作做成单独脚本
例如：
- 删除用户
- 提升管理员权限
- 批量改共享策略

这些最好：
- 单独文件
- 单独审查
- 单独确认

#### 5. OpenClaw 只做编排，不要顺手变成“超级管理员自动炮塔”
自动化很香，但也很容易香过头。

---

## 13. 推荐的文件组织

你可以在工作区里这么放：

```text
workspace/
  scripts/
    gw/
      list_users.sh
      list_suspended_users.sh
      audit_drive_sharing.sh
      create_onboarding_user.sh
  data/
    gw/
      reports/
      snapshots/
  google-workspace-cli-openclaw-guide.md
```

### 说明
- `scripts/gw/`：放真正执行 GAM 的脚本
- `data/gw/reports/`：放导出结果
- `data/gw/snapshots/`：放周期快照，方便比较差异

这样收拾得像个人，不像把命令历史扔进洗衣机。

---

## 14. 推荐的 OpenClaw 结合点

如果你要和 OpenClaw 真结合，优先做这 4 个：

### 1. `exec`
用途：直接跑 GAM / shell 脚本

适合：
- ad-hoc 查询
- 管理动作执行
- 本地脚本编排

### 2. `cron`
用途：定时巡检、日报、盘点

适合：
- 每日账号巡检
- 每周共享权限审计
- 每月许可证统计

### 3. `hooks`
用途：接入外部系统事件

适合：
- 入职、离职、权限变更
- 工单系统 / 表单系统 / HR 系统联动

### 4. `message`
用途：把结果主动发回聊天渠道

适合：
- 告警
- 巡检摘要
- 执行结果通知

这四个够你搭出一条很完整的线了，没必要一开始就把系统搞成宇宙飞船。

---

## 15. 推荐阅读文章 / 文档列表

下面这份我按“先看什么、后看什么”排过了。

### A. GAM 官方入口
1. **GAM GitHub 仓库**  
   https://github.com/GAM-team/GAM

2. **GAM GitHub Wiki**  
   https://github.com/GAM-team/GAM/wiki

### B. GAM 重点阅读
3. **Bulk Processing（批处理 / CSV / 并行）**  
   https://github.com/GAM-team/GAM/wiki/Bulk-Processing

4. **GAM 安装与 setup 说明（从主仓库 README 进入）**  
   https://github.com/GAM-team/GAM

5. **GAM Wiki 中与 Admin / Gmail / Drive / Groups 相关的专题页**  
   从这里按需展开：  
   https://github.com/GAM-team/GAM/wiki

### C. Google Workspace 官方开发文档
6. **Google Workspace for Developers 首页**  
   https://developers.google.com/workspace

7. **Admin SDK 相关文档**  
   从 Workspace 开发首页进入 Admin SDK 部分

8. **Gmail API 文档**  
   从 Workspace 开发首页进入 Gmail API 部分

9. **Drive API 文档**  
   从 Workspace 开发首页进入 Drive API 部分

10. **Calendar API 文档**  
    从 Workspace 开发首页进入 Calendar API 部分

### D. OpenClaw 结合时必看
11. **OpenClaw Cron Jobs 文档**  
    本地：`docs/automation/cron-jobs.md`

12. **OpenClaw Webhooks 文档**  
    本地：`docs/automation/webhook.md`

13. **OpenClaw CLI Backends 文档**  
    本地：`docs/gateway/cli-backends.md`

> 其中第 11、12 最关键，因为真正让 Google Workspace 自动化“活起来”的，不是 CLI 本身，而是调度和事件接入。

---

## 16. 我给你的推荐阅读顺序

如果你不想被文档淹死，按这个顺序：

### 第一步：知道 GAM 能干什么
- `GAM GitHub 仓库`
- `GAM Wiki`

### 第二步：学最值钱的能力
- `Bulk Processing`
- 用户 / 群组 / Drive 相关 Wiki 页面

### 第三步：补 Google 官方概念
- `Google Workspace for Developers`
- Admin SDK / Drive / Gmail / Calendar API 文档

### 第四步：接 OpenClaw 自动化
- `cron-jobs.md`
- `webhook.md`

这个顺序比较像正常人学东西，不是上来先把自己埋掉。

---

## 17. 最后给个务实建议

如果你后面真要落地，我建议分三步走：

### Phase 1：先把 GAM 本身跑通
先验证：
- 能查 1 个用户
- 能列 1 个群组
- 能导 1 份 CSV

### Phase 2：把高频查询做成脚本
例如：
- 停用账号列表
- 管理员账号盘点
- Drive 外链共享审计

### Phase 3：再接 OpenClaw
接：
- `exec`
- `cron`
- `hooks`
- `message`

这样你会得到一个可维护的系统，而不是一坨今天能跑、明天爆炸的自动化泥球。

---

## 18. 一句话总结

**GAM 是 Google Workspace 的“执行层”，OpenClaw 是“编排层 + 解释层 + 通知层”。**

真正好用的方案不是二选一，而是：

> **让 GAM 负责 API 和批处理，让 OpenClaw 负责人话、调度、提醒和工作流。**

这才是省命的组合。
