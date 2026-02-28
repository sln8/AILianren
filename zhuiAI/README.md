# 《这些年我们追过的AI恋人》

AI互动恋爱养成游戏 —— 抖音小游戏

## 游戏简介

自由对话驱动剧情发展，追求AI恋人，从陌生人到白头偕老的恋爱养成游戏。

## 项目结构

```
zhuiAI/
├── game.js                    # 游戏入口文件
├── game.json                  # 游戏配置
├── project.config.json        # 项目配置
├── icon.png                   # 游戏图标
├── js/
│   ├── config.js              # 游戏配置（角色数据、阶段、常量）
│   ├── managers/
│   │   ├── sceneManager.js    # 场景管理器
│   │   ├── dataManager.js     # 数据管理器（云函数调用）
│   │   └── adManager.js       # 广告管理器
│   ├── scenes/
│   │   ├── loadingScene.js    # 加载页
│   │   ├── genderScene.js     # 性别选择页
│   │   ├── loverSelectScene.js # 恋人选择页
│   │   ├── chatScene.js       # 主对话页（核心玩法）
│   │   ├── profileScene.js    # 个人中心页
│   │   ├── eventScene.js      # 事件/剧情演出页
│   │   └── settingsScene.js   # 设置页
│   └── ui/
│       └── ui.js              # UI绘制工具库
├── cloudfunctions/
│   ├── game/                  # 游戏云函数
│   │   ├── index.js           # 云函数入口（路由分发）
│   │   ├── config.js          # 服务端配置
│   │   ├── initPlayer.js      # 初始化玩家
│   │   ├── selectLover.js     # 选择恋人
│   │   ├── sendMessage.js     # 核心对话（调用AI大模型）
│   │   ├── dailyLogin.js      # 每日登录奖励
│   │   ├── watchAd.js         # 广告奖励字数
│   │   ├── getProgress.js     # 获取玩家进度
│   │   ├── getChatHistory.js  # 获取聊天历史
│   │   ├── switchLover.js     # 更换恋人
│   │   └── package.json       # 依赖配置
│   └── quickstart/            # 快速开始示例（可删除）
└── images/                    # 角色图片资源目录
```

## 上架前配置

### 1. 替换广告ID

打开 `js/config.js`，找到 `AD_CONFIG` 部分，替换为真实的广告ID：

```javascript
const AD_CONFIG = {
  REWARDED_VIDEO_ID: 'YOUR_REWARDED_VIDEO_AD_ID',   // 替换为真实激励视频广告ID
  INTERSTITIAL_ID: 'YOUR_INTERSTITIAL_AD_ID',       // 替换为真实插屏广告ID
  BANNER_ID: 'YOUR_BANNER_AD_ID',                   // 替换为真实Banner广告ID
};
```

### 2. 替换大模型API配置

打开 `js/config.js` 和 `cloudfunctions/game/config.js`，找到 `AI_CONFIG` 部分，替换为真实的火山方舟API配置：

```javascript
const AI_CONFIG = {
  API_ENDPOINT: 'https://ark.cn-beijing.volces.com/api/v3/chat/completions',
  MODEL_LITE: 'YOUR_DOUBAO_LITE_MODEL_ENDPOINT_ID',   // 替换为真实端点ID
  MODEL_PRO: 'YOUR_DOUBAO_PRO_MODEL_ENDPOINT_ID',     // 替换为真实端点ID
  API_KEY: 'YOUR_VOLC_API_KEY',                        // 替换为真实API Key
};
```

### 3. 创建云数据库集合

在抖音云控制台创建以下数据库集合：
- `player` — 玩家信息表
- `lover_progress` — 恋爱进度表
- `chat_history` — 对话历史表
- `achievements` — 成就表

### 4. 部署云函数

在抖音开发者工具中，右键 `cloudfunctions/game` 目录，选择"上传并部署：云端安装依赖"。

### 5. 添加角色图片（可选）

将角色立绘图片放入 `images/` 目录，命名规则：`{角色ID}_avatar.png`（如 `M1_avatar.png`）。

## 核心玩法

1. **选择性别** → 展示异性恋人候选列表
2. **选择恋人** → 进入对话界面
3. **自由聊天** → AI大模型驱动对话，推动剧情发展
4. **关系递进** → 陌生人→认识→熟悉→好友→暧昧→恋人→热恋→求婚→结婚→...→白头偕老
5. **字数经济** → 通过观看广告获取对话字数

## 变现模式

- 激励视频广告：获取对话字数（核心）
- 插屏广告：每10轮对话自然插入
- Banner广告：设置页、个人中心底部