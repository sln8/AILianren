# Chat Engine 配置模板

## 云函数环境变量配置

### 必需配置

```bash
# 阿里云 DashScope API Key（必填）
# 获取地址：https://dashscope.console.aliyun.com/
DASHSCOPE_API_KEY=sk-your-dashscope-api-key-here
```

### 可选配置

```bash
# AI 模型选择（可选，默认: qwen-plus）
# 可选值: qwen-turbo, qwen-plus, qwen-max
AI_MODEL=qwen-plus
```

## 配置说明

### 1. DASHSCOPE_API_KEY
- **类型**: String
- **必填**: 是（如果不填将使用本地模拟模式）
- **格式**: sk-xxxxxxxxxxxxxxxxxxxxxxxx
- **获取方式**: 
  1. 访问 https://dashscope.console.aliyun.com/
  2. 登录阿里云账号
  3. 在"API-KEY管理"中创建新密钥
  4. 复制密钥值（注意保密）

### 2. AI_MODEL
- **类型**: String
- **必填**: 否
- **默认值**: qwen-plus
- **可选值**:
  - `qwen-turbo`: 快速模型，响应速度快，成本低
  - `qwen-plus`: 平衡模型（推荐），对应 Qwen3.5-Flash
  - `qwen-max`: 高质量模型，效果最好但成本较高

## 模型对比

| 模型 | 速度 | 质量 | 成本 | 推荐场景 |
|------|------|------|------|----------|
| qwen-turbo | 快 | 良好 | ¥0.3/万tokens | 高并发、追求速度 |
| qwen-plus | 中等 | 优秀 | ¥2/万tokens | **推荐：平衡性好** |
| qwen-max | 慢 | 最佳 | ¥40/万tokens | 追求极致效果 |

## 配置步骤

### 在 HBuilderX 中配置

1. 右键点击 `chat-engine` 云函数
2. 选择 "云函数配置" -> "云端配置"
3. 在"环境变量"部分添加配置
4. 点击"保存"
5. 右键云函数，选择"上传部署"

### 配置示例

```
键: DASHSCOPE_API_KEY
值: sk-abc123def456ghi789jkl

键: AI_MODEL  
值: qwen-plus
```

## 验证配置

上传云函数后，可以通过以下方式验证：

### 方法 1: 查看云函数日志

1. 右键 `chat-engine` 云函数
2. 选择 "云函数日志"
3. 发送测试请求后查看日志
4. 如果看到 "DashScope API key not configured" 说明未配置
5. 如果看到 API 请求成功，说明配置正确

### 方法 2: 测试请求

发送测试数据到云函数：

```json
{
  "characterId": "F01",
  "userMessage": "你好",
  "gameState": {
    "stageIndex": 0,
    "favorability": 0,
    "trust": 0,
    "intimacy": 0,
    "boredom": 0,
    "freshness": 100,
    "mood": "normal",
    "daysTogether": 0
  },
  "recentMessages": []
}
```

正常返回示例：
```json
{
  "code": 0,
  "data": {
    "reply": "你好呀～很高兴见到你！",
    "mood": "happy",
    "valueChanges": {
      "favorability": 2,
      "trust": 1,
      "intimacy": 0,
      "boredom": 0,
      "freshness": 0
    },
    "eventTriggered": null
  }
}
```

## 故障排查

### 问题 1: "API key not configured" 
**原因**: 环境变量未正确设置
**解决**: 
1. 检查环境变量名称是否为 `DASHSCOPE_API_KEY`
2. 检查是否已上传部署云函数
3. 重新配置并上传

### 问题 2: "Authentication failed"
**原因**: API Key 无效或过期
**解决**:
1. 检查 API Key 是否正确复制（包括 sk- 前缀）
2. 在阿里云控制台检查 API Key 状态
3. 如果过期，创建新的 API Key

### 问题 3: "Insufficient balance"
**原因**: 账号余额不足
**解决**:
1. 在阿里云控制台充值
2. 或临时切换到模拟模式（移除 API Key 配置）

### 问题 4: 回复质量不佳
**原因**: 模型选择或参数设置不当
**解决**:
1. 尝试使用 qwen-max 模型
2. 调整 temperature 参数（在 index.js 中）
3. 完善角色的性格描述

## 成本控制

### 预估成本

```
假设每天 1000 次对话：
- 每次约 1500 tokens
- 使用 qwen-plus (¥2/万tokens)
- 日成本 = 1000 × 1500 / 10000 × 2 = ¥3
- 月成本 ≈ ¥90
```

### 省钱技巧

1. **使用 qwen-turbo**: 成本降低 85%
2. **减少历史消息**: 修改代码中的 `.slice(-10)` 为 `.slice(-5)`
3. **降低 max_tokens**: 在代码中改为 300
4. **开发时用模拟模式**: 不配置 API Key

## 安全建议

1. **不要泄露 API Key**: 切勿提交到 Git 仓库
2. **定期更换 Key**: 建议每月更换一次
3. **监控用量**: 定期检查 API 调用量和费用
4. **设置预算警告**: 在阿里云控制台设置费用预警

## 联系支持

- 阿里云技术支持：https://help.aliyun.com/
- 项目 Issues：提交到 GitHub 仓库
- DashScope 文档：https://help.aliyun.com/zh/dashscope/

---

配置完成后，请参考 `USAGE_GUIDE.md` 了解如何使用。
