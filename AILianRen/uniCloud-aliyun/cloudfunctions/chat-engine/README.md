# Chat Engine Cloud Function - 阿里云百炼 Qwen 模型集成

## 概述

本云函数实现了 AI 恋爱游戏的核心对话引擎，集成了阿里云百炼（DashScope）的 Qwen 系列大模型（支持 Qwen3.5-Flash 等），实现真实的聊天游戏体验。

## 功能特性

### 1. 阿里云百炼 Qwen 模型集成
- 支持 Qwen-Plus、Qwen-Turbo、Qwen-Max 等多个模型
- 自动处理 DashScope API 请求和响应
- 失败时自动降级到本地模拟模式

### 2. AI 性格控制
- **关键词提取**：自动从角色性格描述中提取关键词（温柔、高冷、开朗等）
- **性格指导**：为 AI 生成详细的性格表现指南
- **一致性保持**：通过 System Prompt 确保角色性格一致性

支持的性格关键词：
- 温柔：用词温和，多用柔和语气词
- 高冷：回复简洁，保持距离感
- 开朗：语气活泼，积极向上
- 害羞：容易脸红，不太主动
- 成熟：说话得体，考虑周全
- 可爱：使用叠词，语气俏皮
- 霸道：语气强势，有主导性
- 文艺：用词优雅，表达浪漫
- 幽默：适当开玩笑，轻松氛围
- 知性：逻辑清晰，谈吐优雅

### 3. 对话记忆管理
- **滑动窗口**：保留最近 10 轮完整对话
- **记忆摘要**：自动构建对话记忆上下文
- **上下文连贯**：确保 AI 记住之前的对话内容

### 4. 游戏逻辑实现
- **关系阶段系统**：从陌生人到白头偕老 14 个阶段
- **数值变化**：好感度、信任度、亲密度、无聊度、新鲜感
- **情绪系统**：happy、shy、angry、sad、normal、excited、nervous
- **智能判断**：AI 根据玩家消息自动判断数值变化

### 5. 本地模拟模式
当 API 未配置时，自动使用智能模拟模式：
- 情感分析（积极、消极、浪漫）
- 关系阶段适配
- 性格差异化回复
- 数值变化计算

## 配置方法

### 1. 获取阿里云 DashScope API Key

1. 访问 [阿里云百炼平台](https://dashscope.console.aliyun.com/)
2. 登录/注册阿里云账号
3. 开通 DashScope 服务
4. 在控制台获取 API Key

### 2. 配置云函数环境变量

在 uniCloud 控制台配置以下环境变量：

```bash
DASHSCOPE_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxx  # 必填：阿里云 DashScope API Key
AI_MODEL=qwen-plus                          # 可选：模型名称，默认 qwen-plus
```

可选模型：
- `qwen-turbo`：快速模型，适合高并发场景
- `qwen-plus`：平衡模型，推荐使用（Qwen3.5-Flash 对应此模型）
- `qwen-max`：高质量模型，效果最好但成本较高

### 3. 在 HBuilderX 中配置

1. 右键点击 `chat-engine` 云函数
2. 选择"云函数配置"
3. 添加环境变量
4. 上传并运行云函数

## API 调用示例

### 请求参数

```javascript
{
  "characterId": "F01",              // 角色 ID
  "userMessage": "今天天气真好呀",    // 用户消息
  "gameState": {                     // 游戏状态
    "stageIndex": 2,
    "favorability": 35,
    "trust": 25,
    "intimacy": 15,
    "boredom": 10,
    "freshness": 80,
    "mood": "happy",
    "daysTogether": 7
  },
  "recentMessages": [                // 最近的对话历史
    {
      "role": "user",
      "content": "你好呀"
    },
    {
      "role": "assistant",
      "content": "嗨～你好！"
    }
  ]
}
```

### 响应格式

```javascript
{
  "code": 0,
  "data": {
    "reply": "是啊，阳光明媚的，心情都变好了呢～",
    "mood": "happy",
    "valueChanges": {
      "favorability": 2,
      "trust": 1,
      "intimacy": 0,
      "boredom": -1,
      "freshness": 0
    },
    "eventTriggered": null
  }
}
```

## 性能优化

### Token 优化策略
1. **滑动窗口**：只发送最近 10 轮对话
2. **模板化 Prompt**：精简系统提示词
3. **限制长度**：max_tokens 设为 500（约 300 中文字）
4. **记忆摘要**：长对话自动摘要

### 成本估算
- Qwen-Turbo：约 ¥0.3/万 tokens
- Qwen-Plus：约 ¥2/万 tokens  
- Qwen-Max：约 ¥40/万 tokens

单次对话平均消耗：
- System Prompt: ~800 tokens
- 对话历史 (10轮): ~500 tokens
- 用户消息: ~50 tokens
- AI 回复: ~150 tokens
- **总计**: ~1500 tokens/次 ≈ ¥0.003/次 (使用 Qwen-Plus)

## 安全性

1. **输入验证**：检查消息长度（最大 200 字）
2. **错误处理**：API 调用失败自动降级
3. **权限控制**：通过 uniCloud 权限系统控制访问
4. **敏感信息**：API Key 通过环境变量配置，不暴露在代码中

## 故障排查

### API 调用失败
1. 检查 `DASHSCOPE_API_KEY` 是否正确配置
2. 检查账号余额是否充足
3. 查看云函数日志中的错误信息
4. 验证网络连接是否正常

### 回复不符合预期
1. 调整 `temperature` 参数（0.7-0.9 之间）
2. 优化 System Prompt 中的性格描述
3. 增加对话历史上下文
4. 尝试使用更高级的模型（如 qwen-max）

### 性能问题
1. 使用 qwen-turbo 提升响应速度
2. 减少对话历史数量（调整滑动窗口大小）
3. 启用 CDN 加速
4. 考虑增加云函数实例数

## 开发建议

### 测试流程
1. 先使用模拟模式测试基本逻辑
2. 配置 API Key 后进行真实对话测试
3. 测试不同性格角色的回复差异
4. 验证数值变化是否合理
5. 检查对话记忆是否生效

### 扩展功能
- 添加更多性格关键词
- 实现对话摘要功能
- 支持多语言
- 添加敏感词过滤
- 实现情感分析可视化

## 相关文档

- [阿里云百炼文档](https://help.aliyun.com/zh/dashscope/)
- [Qwen 模型介绍](https://help.aliyun.com/zh/dashscope/developer-reference/model-introduction)
- [DashScope API 参考](https://help.aliyun.com/zh/dashscope/developer-reference/api-details)

## 更新日志

### v1.0.0 (2026-02-27)
- ✅ 集成阿里云 DashScope API
- ✅ 支持 Qwen 系列模型
- ✅ 实现性格关键词控制
- ✅ 添加对话记忆管理
- ✅ 完善游戏逻辑系统
- ✅ 支持本地模拟模式
