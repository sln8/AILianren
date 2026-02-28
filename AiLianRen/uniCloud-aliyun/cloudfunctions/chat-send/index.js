'use strict'
/**
 * 云函数：chat-send
 * 核心对话处理云函数
 * 
 * 功能：
 * 1. 验证用户字数余额
 * 2. 扣除玩家输入字数
 * 3. 从数据库读取角色信息、关系数据、对话历史
 * 4. 构建AI请求上下文
 * 5. 调用豆包大模型API获取回复
 * 6. 解析AI回复并更新数值
 * 7. 检查阶段推进与事件触发
 * 8. 保存对话记录和恋人数据
 * 9. 返回完整结果给前端
 * 
 * 注意：当前版本前端直接调用AI API
 *       此云函数作为服务端方案的完整实现
 *       上线时可切换为云函数调用以保护API Key
 */

const db = uniCloud.database()
const dbCmd = db.command

// ==================== 大模型API配置 ====================
// 【上线前请设置uniCloud环境变量 DOUBAO_API_KEY】
// 在uniCloud Web控制台 → 云函数 → 环境变量中配置
const DOUBAO_API_URL = 'https://ark.cn-beijing.volces.com/api/v3/chat/completions'
const DOUBAO_API_KEY = process.env.DOUBAO_API_KEY || 'd3d95f0e-717b-41cf-b08c-5ac1c23dac43'
const DOUBAO_MODEL = 'doubao-seed-2-0-mini-260215'

// ==================== 敏感词库 ====================
const SENSITIVE_WORDS = [
  // 色情相关
  '做爱', '性交', '口交', '肛交', '自慰', '手淫',
  '裸体', '裸照', '色情', '黄片', '成人片', 'AV',
  '嫖娼', '卖淫', '援交', '约炮', '一夜情',
  '乳房', '阴茎', '阴道', '生殖器', '下体',
  '调教', 'SM', '捆绑', '恋童', '萝莉控',
  '潮吹', '高潮', '射精', '勃起',
  // 暴力相关
  '杀人', '砍人', '捅人', '打死', '弄死', '去死',
  '自杀', '割腕', '跳楼', '上吊', '服毒',
  '炸弹', '枪支', '刀具', '凶器',
  '虐待', '施暴', '殴打', '强奸',
  '恐怖袭击', '爆炸', '纵火',
  // 政治敏感
  '颠覆政权', '反党', '反政府', '分裂国家',
  '邪教', '法轮功', '全能神',
  '暴动', '游行示威', '政变',
  // 违法犯罪
  '毒品', '吸毒', '贩毒', '大麻', '冰毒', '海洛因',
  '赌博', '网赌', '赌场',
  '洗钱', '诈骗', '传销',
  '偷拍', '偷窥', '跟踪',
  // 歧视侮辱
  '废物', '垃圾人', '贱人', '荡妇', '婊子',
  '智障', '弱智', '脑残', '白痴',
  '滚蛋', '去死吧', '该死'
]

/**
 * 检测文本中是否包含敏感词
 * @param {string} text - 待检测文本
 * @returns {boolean} 是否包含敏感词
 */
function containsSensitiveWords(text) {
  if (!text) return false
  const normalizedText = text.toLowerCase()
  return SENSITIVE_WORDS.some(word => normalizedText.includes(word.toLowerCase()))
}

exports.main = async (event, context) => {
  const { user_id, message, lover_id } = event

  try {
    // ===== 0. 敏感词过滤 =====
    if (containsSensitiveWords(message)) {
      return { code: -4, msg: '你的消息包含不适当的内容，请修改后重新发送' }
    }

    // ===== 1. 获取用户信息并验证字数 =====
    const userRes = await db.collection('users').doc(user_id).get()
    if (!userRes.data || userRes.data.length === 0) {
      return { code: -1, msg: '用户不存在' }
    }
    const user = userRes.data[0]

    // 计算玩家输入的字数
    const msgWordCount = message.length

    // 检查字数是否足够（玩家输入 + 预留AI回复至少50字）
    if (user.words_balance < msgWordCount + 50) {
      return { code: -2, msg: '字数不足，请观看广告获取字数' }
    }

    // ===== 2. 获取恋人档案 =====
    const loverRes = await db.collection('lovers').doc(lover_id).get()
    if (!loverRes.data || loverRes.data.length === 0) {
      return { code: -3, msg: '恋人档案不存在' }
    }
    const lover = loverRes.data[0]

    // ===== 3. 获取最近20轮对话 =====
    const historyRes = await db.collection('chat_history')
      .where({ lover_id: lover_id, user_id: user_id })
      .orderBy('round', 'desc')
      .limit(20)
      .get()
    const recentHistory = (historyRes.data || []).reverse()

    // ===== 4. 获取角色配置 =====
    const characterConfig = getCharacterConfig(lover.character_id)

    // ===== 5. 构建System Prompt =====
    const aiMaxWords = getMaxReplyWords(lover.stage)
    const systemPrompt = buildSystemPrompt(characterConfig, lover, aiMaxWords)

    // ===== 6. 构建消息数组 =====
    const messages = [
      { role: 'system', content: systemPrompt }
    ]

    // 添加关系摘要
    if (lover.relationship_summary) {
      messages.push({
        role: 'system',
        content: `【关系摘要】${lover.relationship_summary}`
      })
    }

    // 添加历史对话
    for (const record of recentHistory) {
      if (record.messages) {
        for (const msg of record.messages) {
          messages.push({
            role: msg.role,
            content: msg.content
          })
        }
      }
    }

    // 添加当前用户消息
    messages.push({ role: 'user', content: message })

    // ===== 7. 调用豆包大模型API =====
    const aiResponse = await callDoubaoAPI(messages, aiMaxWords)
    const aiResult = parseAiResponse(aiResponse)

    // ===== 8. 计算字数消耗 =====
    const aiWordCount = aiResult.reply.length
    const totalCost = msgWordCount + aiWordCount

    // ===== 9. 更新用户字数 =====
    await db.collection('users').doc(user_id).update({
      words_balance: dbCmd.inc(-totalCost),
      words_total_used: dbCmd.inc(totalCost)
    })

    // ===== 10. 更新恋人数值 =====
    const newFavor = clamp(lover.favor_score + (aiResult.favor_change || 0), 0, 500)
    const newIntimacy = clamp(lover.intimacy_score + (aiResult.intimacy_change || 0), 0, 100)
    const newTrust = clamp(lover.trust_score + (aiResult.trust_change || 0), 0, 100)
    const newRomance = clamp(lover.romance_score + (aiResult.romance_change || 0), 0, 100)

    // ===== 11. 检查阶段推进 =====
    const stageResult = checkStageAdvance(lover, newFavor)

    // ===== 12. 更新恋人档案 =====
    const updateData = {
      favor_score: newFavor,
      intimacy_score: newIntimacy,
      trust_score: newTrust,
      romance_score: newRomance,
      total_rounds: dbCmd.inc(1),
      total_words_consumed: dbCmd.inc(totalCost),
      last_chat_at: new Date()
    }

    if (stageResult.advanced) {
      updateData.stage = stageResult.newStage
      updateData.stage_name = stageResult.newStageName
    }

    await db.collection('lovers').doc(lover_id).update(updateData)

    // ===== 13. 保存对话记录 =====
    await db.collection('chat_history').add({
      user_id,
      lover_id,
      round: lover.total_rounds + 1,
      messages: [
        {
          role: 'user',
          content: message,
          words_cost: msgWordCount,
          timestamp: new Date()
        },
        {
          role: 'assistant',
          content: aiResult.reply,
          words_cost: aiWordCount,
          emotion: aiResult.emotion,
          favor_change: aiResult.favor_change,
          timestamp: new Date()
        }
      ]
    })

    // ===== 14. 返回结果 =====
    return {
      code: 0,
      data: {
        reply: aiResult.reply,
        emotion: aiResult.emotion,
        favor_change: aiResult.favor_change,
        current_favor: newFavor,
        words_remaining: user.words_balance - totalCost,
        words_cost: totalCost,
        stage_advance: stageResult.advanced ? stageResult : null,
        event: aiResult.event_trigger,
        stage_hint: aiResult.stage_hint
      }
    }

  } catch (error) {
    console.error('chat-send 云函数错误:', error)
    return { code: -99, msg: '服务器内部错误: ' + error.message }
  }
}

/**
 * 调用豆包大模型API
 * @param {Array} messages - 消息数组
 * @param {number} maxWords - AI回复最大字数
 * @returns {string} AI回复文本
 */
async function callDoubaoAPI(messages, maxWords) {
  const response = await uniCloud.httpclient.request(DOUBAO_API_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${DOUBAO_API_KEY}`,
      'Content-Type': 'application/json'
    },
    data: {
      model: DOUBAO_MODEL,
      messages: messages,
      max_tokens: maxWords * 3,
      temperature: 0.8,
      top_p: 0.9
    },
    dataType: 'json'
  })

  if (response.data && response.data.choices && response.data.choices.length > 0) {
    return response.data.choices[0].message.content
  }

  throw new Error('AI API返回异常')
}

/**
 * 解析AI回复JSON
 * @param {string} text - AI原始回复
 * @returns {Object} 解析后的数据
 */
function parseAiResponse(text) {
  try {
    let parsed = null
    try {
      parsed = JSON.parse(text)
    } catch (e) {
      // 尝试从markdown代码块中提取JSON
      const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/)
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[1].trim())
      } else {
        // 尝试直接匹配大括号包裹的JSON
        const braceMatch = text.match(/\{[\s\S]*\}/)
        if (braceMatch) {
          parsed = JSON.parse(braceMatch[0])
        }
      }
    }

    if (parsed && parsed.reply) {
      return {
        reply: parsed.reply,
        emotion: parsed.emotion || 'neutral',
        favor_change: typeof parsed.favor_change === 'number' ? parsed.favor_change : 1,
        intimacy_change: typeof parsed.intimacy_change === 'number' ? parsed.intimacy_change : 0,
        trust_change: typeof parsed.trust_change === 'number' ? parsed.trust_change : 0,
        romance_change: typeof parsed.romance_change === 'number' ? parsed.romance_change : 0,
        event_trigger: parsed.event_trigger || null,
        stage_hint: parsed.stage_hint || null
      }
    }

    // 如果解析失败，返回原始文本作为回复
    return {
      reply: text.substring(0, 200),
      emotion: 'neutral',
      favor_change: 1,
      intimacy_change: 0,
      trust_change: 0,
      romance_change: 0,
      event_trigger: null,
      stage_hint: null
    }
  } catch (e) {
    // 兜底回复，确保不会出现空回复
    return {
      reply: '（微笑）嗯，你说得对。',
      emotion: 'neutral',
      favor_change: 0,
      intimacy_change: 0,
      trust_change: 0,
      romance_change: 0,
      event_trigger: null,
      stage_hint: null
    }
  }
}

/**
 * 根据阶段获取AI回复字数上限
 * @param {number} stage - 阶段ID
 * @returns {number} 最大字数
 */
function getMaxReplyWords(stage) {
  // 不同阶段的AI回复字数上限
  const limits = {
    1: 60, 2: 60,           // 陌生人/初识阶段，回复简短
    3: 100, 4: 100,         // 熟悉/好友阶段，回复适中
    5: 120, 6: 120, 7: 120, // 暧昧/表白/恋人阶段
    8: 150, 9: 150, 10: 150, 11: 150, // 热恋到结婚阶段，回复较长
    12: 120, 13: 120, 14: 120, // 新婚到育儿阶段
    15: 120, 16: 120, 17: 120, 18: 120, 19: 120, // 婚姻阶段
    20: 200  // 死亡告别阶段，回复最长
  }
  return limits[stage] || 100
}

/**
 * 获取角色配置（简化版，完整数据应存入数据库）
 * @param {string} characterId - 角色ID
 * @returns {Object} 角色配置
 */
function getCharacterConfig(characterId) {
  // 角色基础配置映射
  const configs = {
    'F01': { name: '苏晚晴', gender: '女', personality: '温柔知性', background: '文学系研究生', extra: '说话温柔细腻，喜欢引用诗句' },
    'F02': { name: '林小夏', gender: '女', personality: '活泼开朗', background: '活力少女', extra: '性格活泼，经常用语气词和表情' },
    'F03': { name: '陈思雨', gender: '女', personality: '高冷傲娇', background: '实习律师', extra: '表面高冷，内心柔软，会傲娇' },
    'F04': { name: '白鹿鸣', gender: '女', personality: '古灵精怪', background: '自媒体博主', extra: '鬼点子多，喜欢整蛊但很暖心' },
    'F05': { name: '叶知秋', gender: '女', personality: '沉静温婉', background: '茶道老师', extra: '优雅从容，偶尔引用古诗词' },
    'M01': { name: '顾言深', gender: '男', personality: '温文尔雅', background: '心理学讲师', extra: '善于倾听，温柔有深度' },
    'M02': { name: '陆北辰', gender: '男', personality: '阳光暖男', background: '健身教练', extra: '阳光开朗，做饭好吃' },
    'M03': { name: '沈墨白', gender: '男', personality: '冷面腹黑', background: '投行精英', extra: '话不多但句句到心' },
    'M04': { name: '江一帆', gender: '男', personality: '浪漫文艺', background: '独立音乐人', extra: '浪漫但不切实际' },
    'M05': { name: '赵明轩', gender: '男', personality: '忠犬暖系', background: '小学老师', extra: '真诚善良，有点笨拙' }
  }
  return configs[characterId] || configs['F01']
}

/**
 * 根据关系阶段获取AI主动性规则
 * @param {number} stage - 当前阶段ID
 * @returns {string} 主动性规则描述
 */
function getProactivenessRules(stage) {
  if (stage <= 1) {
    return `当前是陌生人阶段：回复简短克制，不主动问私人问题，不分享隐私，保持社交距离。只有聊到你感兴趣的话题时才会多说几句。`
  } else if (stage <= 2) {
    return `当前是初识阶段：比陌生人阶段稍微放松，但仍保持适当距离。可以适度回应和简单提问，聊到感兴趣的话题时可以多说一些。`
  } else if (stage <= 4) {
    return `当前是熟悉/好友阶段：可以更自然地交流，偶尔主动分享日常。每3-5轮可以主动提出话题。`
  } else if (stage <= 6) {
    return `当前是暧昧/表白阶段：明显更主动，在意对方感受。偶尔主动关心对方，话语中带暗示和羞涩。`
  } else {
    return `当前是恋人/婚后阶段：非常主动，经常关心对方、分享日常，每1-2轮主动引导话题。`
  }
}

/**
 * 构建System Prompt
 * @param {Object} config - 角色配置
 * @param {Object} lover - 恋人数据
 * @param {number} maxWords - AI回复字数上限
 * @returns {string} System Prompt
 */
function buildSystemPrompt(config, lover, maxWords) {
  // 阶段名称映射表
  const stageNames = {
    1: '陌生人', 2: '初识', 3: '熟悉', 4: '好友', 5: '暧昧',
    6: '表白', 7: '恋人', 8: '热恋', 9: '磨合', 10: '求婚',
    11: '结婚', 12: '新婚', 13: '怀孕/生子', 14: '育儿期',
    15: '10年婚姻', 16: '20年婚姻', 17: '30年婚姻', 18: '金婚',
    19: '白头偕老', 20: '死亡告别'
  }
  const stageName = stageNames[lover.stage] || '陌生人'

  return `你是一个互动恋爱模拟游戏中的AI恋人角色。

【角色信息】
- 名字：${config.name}
- 性别：${config.gender}
- 性格：${config.personality}
- 背景：${config.background}
- 当前关系阶段：${stageName}（第${lover.stage}阶段）
- 当前好感度：${lover.favor_score}
- 亲密度：${lover.intimacy_score}
- 信任值：${lover.trust_score}

【性格特点】
${config.extra}

【主动性规则】
${getProactivenessRules(lover.stage)}

【核心规则】
1. 始终保持角色扮演，不能跳出角色
2. 回复符合当前关系阶段：
   - 陌生人阶段：保持礼貌但有距离感，回复简短克制，像真实的陌生人
   - 初识阶段：略显好奇，愿意简单交流，但仍有保留
   - 熟悉阶段：更放松，会开玩笑
   - 好友阶段：信任对方，主动关心
   - 暧昧阶段：会脸红、紧张、在意对方
   - 恋人之后：亲昵、甜蜜、主动分享日常
   - 婚后阶段：温馨、日常、偶有矛盾但互相包容
3. 好感度变化合理
4. 拒绝违规内容
5. 回复不超过${maxWords}字

【回复格式 - 纯JSON】
{
  "reply": "回复内容（不超过${maxWords}字）",
  "emotion": "happy/shy/sad/angry/neutral/surprised",
  "favor_change": -20到8的整数,
  "intimacy_change": -5到3的整数,
  "trust_change": -5到3的整数,
  "romance_change": -3到5的整数,
  "event_trigger": "事件ID或null",
  "stage_hint": "提示或null"
}`
}

/**
 * 检查阶段推进
 * @param {Object} lover - 恋人数据
 * @param {number} newFavor - 新好感度
 * @returns {Object} 推进结果
 */
function checkStageAdvance(lover, newFavor) {
  // 阶段好感度阈值表
  const stageThresholds = [
    { stage: 2, favor: 11, name: '初识' },
    { stage: 3, favor: 26, name: '熟悉' },
    { stage: 4, favor: 46, name: '好友' },
    { stage: 5, favor: 61, name: '暧昧' },
    { stage: 7, favor: 86, name: '恋人' },
    { stage: 8, favor: 101, name: '热恋' },
    { stage: 9, favor: 131, name: '磨合' },
    { stage: 11, favor: 171, name: '结婚' },
    { stage: 12, favor: 186, name: '新婚' },
    { stage: 13, favor: 211, name: '怀孕/生子' },
    { stage: 14, favor: 231, name: '育儿期' },
    { stage: 15, favor: 261, name: '10年婚姻' },
    { stage: 16, favor: 301, name: '20年婚姻' },
    { stage: 17, favor: 341, name: '30年婚姻' },
    { stage: 18, favor: 381, name: '金婚' },
    { stage: 19, favor: 401, name: '白头偕老' }
  ]

  // 遍历阈值表，找到第一个满足条件的阶段
  for (const threshold of stageThresholds) {
    if (lover.stage < threshold.stage && newFavor >= threshold.favor) {
      return {
        advanced: true,
        newStage: threshold.stage,
        newStageName: threshold.name
      }
    }
  }

  return { advanced: false }
}

/**
 * 限制数值范围
 * @param {number} val - 数值
 * @param {number} min - 最小值
 * @param {number} max - 最大值
 * @returns {number} 限制后的数值
 */
function clamp(val, min, max) {
  return Math.max(min, Math.min(max, val))
}
