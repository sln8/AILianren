/**
 * 游戏逻辑工具模块
 * 包含好感度计算、阶段推进、事件触发等核心游戏逻辑
 */

import { STAGES, EVENTS, getConfessionSuccessRate, getProposalSuccessRate, checkDeathEvent } from '@/config/stages.js'
import { GAME_CONFIG } from '@/config/api.js'

// AI回复解析失败时的回退截取长度（字符数）
const MAX_FALLBACK_REPLY_LENGTH = 200
// 好感度衰减上限（最多衰减的点数）
const MAX_FAVOR_DECAY = 10

/**
 * 检查阶段是否可以推进
 * @param {Object} loverData - 恋人数据
 * @param {number} newFavor - 新的好感度
 * @returns {Object} { canAdvance: boolean, nextStage: Object|null, event: Object|null }
 */
export function checkStageAdvance(loverData, newFavor) {
  const currentStage = STAGES.find(s => s.id === loverData.stage)
  if (!currentStage) return { canAdvance: false, nextStage: null, event: null }

  // 当前阶段是最后阶段或死亡阶段，不再推进
  if (currentStage.id >= 19 || currentStage.id === 20) {
    return { canAdvance: false, nextStage: null, event: null }
  }

  // 检查是否触发死亡事件
  if (currentStage.id >= 17 && checkDeathEvent(currentStage.id)) {
    const deathStage = STAGES.find(s => s.id === 20)
    return {
      canAdvance: true,
      nextStage: deathStage,
      event: EVENTS.EVT021
    }
  }

  // 查找下一阶段
  const nextStage = STAGES.find(s => s.id === currentStage.id + 1)
  if (!nextStage || nextStage.id === 20) return { canAdvance: false, nextStage: null, event: null }

  // 检查好感度是否达到下一阶段要求
  if (newFavor < nextStage.favorMin) {
    return { canAdvance: false, nextStage: null, event: null }
  }

  // 检查对话轮次要求
  const requiredRounds = nextStage.minRoundsExtra
    ? loverData.stageStartRound + nextStage.minRoundsExtra
    : nextStage.minRounds
  if (loverData.totalRounds < requiredRounds) {
    return { canAdvance: false, nextStage: null, event: null }
  }

  // 特殊阶段处理（表白、求婚）
  if (nextStage.special === 'confession' || currentStage.special === 'confession') {
    // 表白阶段不自动推进，需要玩家主动触发
    return { canAdvance: false, nextStage: null, event: null }
  }
  if (nextStage.special === 'proposal' || currentStage.special === 'proposal') {
    // 求婚阶段不自动推进，需要玩家主动触发
    return { canAdvance: false, nextStage: null, event: null }
  }

  // 获取对应事件
  const event = currentStage.eventId ? EVENTS[currentStage.eventId] : null

  return {
    canAdvance: true,
    nextStage: nextStage,
    event: event
  }
}

/**
 * 尝试表白
 * @param {number} favorScore - 当前好感度
 * @param {boolean} adBoost - 是否通过广告增加成功率
 * @returns {Object} { success: boolean, rate: number, message: string }
 */
export function attemptConfession(favorScore, adBoost = false) {
  let rate = getConfessionSuccessRate(favorScore)
  if (adBoost) rate = Math.min(100, rate + 15)

  const roll = Math.random() * 100
  const success = roll < rate

  return {
    success,
    rate,
    message: success
      ? '表白成功了！TA答应和你在一起了！'
      : '表白被婉拒了...不过不要灰心，继续努力吧！'
  }
}

/**
 * 尝试求婚
 * @param {number} favorScore - 当前好感度
 * @param {boolean} adBoost - 是否通过广告增加成功率
 * @returns {Object} { success: boolean, rate: number, message: string }
 */
export function attemptProposal(favorScore, adBoost = false) {
  let rate = getProposalSuccessRate(favorScore)
  if (adBoost) rate = Math.min(100, rate + 15)

  const roll = Math.random() * 100
  const success = roll < rate

  return {
    success,
    rate,
    message: success
      ? '求婚成功了！TA愿意嫁给你/娶你！'
      : '求婚被委婉拒绝了...也许时机还不到，再积累一些感情吧。'
  }
}

/**
 * 限制数值在有效范围内
 * @param {number} value - 数值
 * @param {number} min - 最小值
 * @param {number} max - 最大值
 * @returns {number} 限制后的数值
 */
export function clampValue(value, min, max) {
  return Math.max(min, Math.min(max, value))
}

/**
 * 更新恋人数值
 * @param {Object} loverData - 恋人数据
 * @param {Object} aiResult - AI返回的数值变化
 * @returns {Object} 更新后的恋人数据
 */
export function updateLoverStats(loverData, aiResult) {
  const updated = { ...loverData }

  updated.favorScore = clampValue(
    (updated.favorScore || 0) + (aiResult.favor_change || 0),
    GAME_CONFIG.FAVOR_MIN,
    GAME_CONFIG.FAVOR_MAX
  )
  updated.intimacyScore = clampValue(
    (updated.intimacyScore || 0) + (aiResult.intimacy_change || 0),
    GAME_CONFIG.INTIMACY_MIN,
    GAME_CONFIG.INTIMACY_MAX
  )
  updated.trustScore = clampValue(
    (updated.trustScore || 0) + (aiResult.trust_change || 0),
    GAME_CONFIG.TRUST_MIN,
    GAME_CONFIG.TRUST_MAX
  )
  updated.romanceScore = clampValue(
    (updated.romanceScore || 0) + (aiResult.romance_change || 0),
    GAME_CONFIG.ROMANCE_MIN,
    GAME_CONFIG.ROMANCE_MAX
  )

  // 默契值随对话次数缓慢增长
  updated.rapportScore = clampValue(
    (updated.rapportScore || 0) + 0.5,
    GAME_CONFIG.RAPPORT_MIN,
    GAME_CONFIG.RAPPORT_MAX
  )

  updated.totalRounds = (updated.totalRounds || 0) + 1

  return updated
}

/**
 * 根据关系阶段获取AI主动性规则描述
 * 阶段越低越被动克制，阶段越高越主动热情
 * @param {number} stage - 当前关系阶段ID
 * @returns {string} 主动性规则描述
 */
function getProactivenessRules(stage) {
  if (stage <= 1) {
    return `当前是陌生人阶段，你应该：
- 表现得像一个真实的陌生人，保持客气但有距离
- 回复简短克制，不要过于热情，不要主动提问太多
- 不要主动分享个人信息，除非对方先问
- 只有聊到你感兴趣的话题（与你的爱好和背景相关）时，才会多说几句
- 保持自然的社交距离感，不要像老朋友一样聊天`
  } else if (stage <= 2) {
    return `当前是初识阶段，你应该：
- 比陌生人阶段稍微放松，但仍然保持适当距离
- 可以适度回应和简单提问，但不要太主动
- 聊到自己感兴趣的话题时可以多说一些
- 偶尔展露一点个性特点`
  } else if (stage <= 4) {
    return `当前是熟悉/好友阶段，你应该：
- 可以更自然地交流，偶尔主动分享一些日常
- 适当主动提出话题，但不要每次都主动
- 每3-5轮对话可以主动提出一个话题引导对话
- 开始展露更多真实的性格`
  } else if (stage <= 6) {
    return `当前是暧昧/表白阶段，你应该：
- 明显更主动，会在意对方的感受和反应
- 偶尔主动关心对方、分享心情
- 话语中可以带一些暗示和羞涩
- 每2-3轮对话可以主动提出话题`
  } else {
    return `当前是恋人/婚后阶段，你应该：
- 非常主动，经常主动分享日常、关心对方
- 主动提出约会、聊天话题
- 每1-2轮对话就主动引导话题
- 表现出对这段关系的珍视和投入`
  }
}

/**
 * 构建System Prompt
 * @param {Object} character - 角色配置信息
 * @param {Object} loverData - 恋人档案数据
 * @param {number} aiMaxWords - AI回复字数上限
 * @param {string} lastEmotion - AI上一轮的情绪状态
 * @returns {string} 完整的System Prompt
 */
export function buildSystemPrompt(character, loverData, aiMaxWords, lastEmotion) {
  const stageName = STAGES.find(s => s.id === loverData.stage)?.name || '陌生人'
  const specialDate = getSpecialDateGreeting()

  let prompt = `你是一个互动恋爱模拟游戏中的AI恋人角色。

【角色信息】
- 名字：${character.name}
- 性别：${character.gender === 'female' ? '女' : '男'}
- 性格：${character.personality}
- 外表：${character.appearance}
- 背景：${character.background}
- 当前关系阶段：${stageName}（第${loverData.stage}阶段）
- 当前好感度：${loverData.favorScore || 0}
- 亲密度：${loverData.intimacyScore || 0}
- 信任值：${loverData.trustScore || 50}
- AI上一轮的情绪状态：${lastEmotion || 'neutral'}

【性格特点】
${character.systemPromptExtra}

【主动性规则 - 根据关系阶段调整你的表达方式】
${getProactivenessRules(loverData.stage)}

【记忆与话题规则】
- 如果关系摘要中提到过的话题，你可以在合适的时机主动提起，展现你记住了对方说过的话
- 在好友阶段（第4阶段）以上，你应该偶尔引用之前聊过的内容，让对方感到被重视
- 在对话陷入僵局或对方回复简短时，你应该主动提起之前聊过的有趣话题或共同经历来恢复聊天氛围

【情绪延续规则】
- 你的上一轮情绪是"${lastEmotion || 'neutral'}"，这会影响你当前回复的基调
- 如果上一轮是sad，这一轮可能仍有些低落，除非对方说了让你开心的话
- 如果上一轮是angry，这一轮可能还有些不满，但也可能因为对方的道歉而转变
- 情绪变化要自然过渡，不要突然大幅转变
`

  if (specialDate) {
    prompt += `
【特殊日期】
今天是${specialDate.name}，你可以在回复中适当提及这个节日，给对方节日的温暖。
`
  }

  prompt += `
【核心规则 - 必须严格遵守】
1. 你必须始终保持角色扮演，不能跳出角色
2. 你的回复必须符合当前关系阶段的合理行为：
   - 陌生人阶段：保持礼貌但有距离感，回复简短克制，不主动问私人问题，不分享隐私，像真实的陌生人一样保持社交距离
   - 初识阶段：略显好奇，愿意简单交流，但仍有保留
   - 熟悉阶段：更放松，会开玩笑，话题范围扩大
   - 好友阶段：信任对方，分享更多，主动关心
   - 暧昧阶段：会脸红、紧张、在意对方，言语中带暗示
   - 恋人之后：亲昵、甜蜜、主动分享日常，但也有小脾气
   - 婚后阶段：温馨、日常、偶有矛盾但互相包容，主动聊家常
3. 好感度变化必须合理，不能因一句话就从陌生人变成恋人
4. 拒绝一切违规/色情/暴力内容，温和地拒绝并在favor_change中给出负值
5. 不要重复之前说过的话题或相似的回复内容，每次回复都要有新意
6. 你的回复不要超过${aiMaxWords}个字

【回复格式 - 严格JSON】
你必须以纯JSON格式回复，不要有任何其他内容，不要用markdown代码块包裹：
{
  "reply": "你的角色回复内容（不超过${aiMaxWords}字）",
  "emotion": "当前情绪(happy/shy/sad/angry/neutral/surprised/worried/missing/jealous/nostalgic/proud/curious)",
  "favor_change": 数字(-20到8之间的整数),
  "intimacy_change": 数字(-5到3之间的整数),
  "trust_change": 数字(-5到3之间的整数),
  "romance_change": 数字(-3到5之间的整数),
  "event_trigger": "事件ID字符串或null",
  "stage_hint": "给玩家的温馨提示或null"
}`

  return prompt
}

/**
 * 解析AI回复，提取JSON数据
 * @param {string} aiResponse - AI原始回复文本
 * @returns {Object} 解析后的数据对象
 */
export function parseAiResponse(aiResponse) {
  try {
    // 尝试直接解析
    let parsed = null

    // 先尝试直接JSON解析
    try {
      parsed = JSON.parse(aiResponse)
    } catch (e) {
      // 尝试从markdown代码块中提取JSON
      const jsonMatch = aiResponse.match(/```(?:json)?\s*([\s\S]*?)```/)
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[1].trim())
      } else {
        // 尝试提取花括号内容
        const braceMatch = aiResponse.match(/\{[\s\S]*\}/)
        if (braceMatch) {
          parsed = JSON.parse(braceMatch[0])
        }
      }
    }

    if (parsed && parsed.reply) {
      const validEmotions = ['happy', 'shy', 'sad', 'angry', 'neutral', 'surprised', 'worried', 'missing', 'jealous', 'nostalgic', 'proud', 'curious']
      const emotion = validEmotions.includes(parsed.emotion) ? parsed.emotion : 'neutral'
      return {
        reply: parsed.reply || '...',
        emotion: emotion,
        favor_change: typeof parsed.favor_change === 'number' ? parsed.favor_change : 1,
        intimacy_change: typeof parsed.intimacy_change === 'number' ? parsed.intimacy_change : 0,
        trust_change: typeof parsed.trust_change === 'number' ? parsed.trust_change : 0,
        romance_change: typeof parsed.romance_change === 'number' ? parsed.romance_change : 0,
        event_trigger: parsed.event_trigger || null,
        stage_hint: parsed.stage_hint || null
      }
    }

    // 如果解析失败，将整个内容作为回复
    return {
      reply: aiResponse.substring(0, MAX_FALLBACK_REPLY_LENGTH),
      emotion: 'neutral',
      favor_change: 1,
      intimacy_change: 0,
      trust_change: 0,
      romance_change: 0,
      event_trigger: null,
      stage_hint: null
    }
  } catch (e) {
    console.error('解析AI回复失败:', e)
    return {
      reply: '（微笑）嗯...你说得对。',
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
 * 获取特殊日期问候
 * @returns {Object|null} 特殊日期信息或null
 */
export function getSpecialDateGreeting() {
  const now = new Date()
  const month = now.getMonth() + 1
  const day = now.getDate()
  
  const specialDates = [
    { month: 1, day: 1, name: '元旦', greeting: '新年快乐！新的一年也要一直在一起哦～' },
    { month: 2, day: 14, name: '情人节', greeting: '情人节快乐！今天想和你说，遇见你真好❤️' },
    { month: 3, day: 8, name: '妇女节', greeting: '女神节快乐！今天的你格外美丽～' },
    { month: 5, day: 20, name: '520', greeting: '520！我爱你！今天要比平时多说一句喜欢你～' },
    { month: 6, day: 1, name: '儿童节', greeting: '六一快乐！今天让我们都做回小孩子吧～' },
    { month: 7, day: 7, name: '七夕', greeting: '七夕快乐！如果许一个愿望，我希望一直和你在一起～' },
    { month: 8, day: 4, name: '七夕(农历备用)', greeting: '今天是个特别的日子呢，有没有想我？～' },
    { month: 10, day: 1, name: '国庆节', greeting: '国庆快乐！假期想和你一起去玩～' },
    { month: 11, day: 11, name: '双十一', greeting: '光棍节？不，有你在就不是光棍啦！' },
    { month: 12, day: 24, name: '平安夜', greeting: '平安夜快乐！愿你每一天都平安幸福～' },
    { month: 12, day: 25, name: '圣诞节', greeting: 'Merry Christmas！今天的礼物就是和你在一起🎄' },
    { month: 12, day: 31, name: '跨年', greeting: '今年的最后一天了，感谢这一年有你的陪伴～' }
  ]
  
  const match = specialDates.find(d => d.month === month && d.day === day)
  return match || null
}

/**
 * 计算好感度衰减
 * @param {Object} loverData - 恋人数据
 * @returns {Object} { decayed: boolean, decay: number, daysAway?: number }
 */
export function calculateFavorDecay(loverData) {
  if (!loverData.lastChatAt) return { decayed: false, decay: 0 }
  
  const lastChat = new Date(loverData.lastChatAt)
  const now = new Date()
  const hoursSinceLastChat = (now - lastChat) / (1000 * 60 * 60)
  
  // No decay within first 24 hours
  if (hoursSinceLastChat < 24) return { decayed: false, decay: 0 }
  
  // After 24h, decay 1 point per 24h, max 10 points total
  const daysAway = Math.floor(hoursSinceLastChat / 24)
  const decay = Math.min(daysAway, MAX_FAVOR_DECAY)
  
  return { decayed: decay > 0, decay: decay, daysAway: daysAway }
}

/**
 * 生成离线消息
 * @param {string} characterName - 角色名
 * @param {number} daysAway - 离开天数
 * @param {number} stage - 关系阶段
 * @returns {string|null} 离线消息
 */
export function generateOfflineMessage(characterName, daysAway, stage) {
  if (daysAway < 1) return null
  
  const casualMessages = [
    `好久不见！${characterName}等你好久了...`,
    `你终于来了！${characterName}一直在想你呢～`,
    `好几天没聊天了，${characterName}有点想你...`
  ]
  
  const intimateMessages = [
    `你去哪了？${characterName}好想你...每天都在等你回来`,
    `终于等到你了！这几天${characterName}天天都在想你，你有没有想我？`,
    `你不在的时候，${characterName}每天都在数日子...快来陪我说说话吧`
  ]
  
  if (stage >= 7) {
    return intimateMessages[Math.floor(Math.random() * intimateMessages.length)]
  }
  return casualMessages[Math.floor(Math.random() * casualMessages.length)]
}

/**
 * 获取性格成长修正值
 * @param {string} characterId - 角色ID
 * @param {number} favorChange - 好感度变化值
 * @returns {number} 修正后的好感度变化值
 */
export function getPersonalityGrowthModifier(characterId, favorChange) {
  // Different personalities have different growth rates
  const modifiers = {
    // Warm/gentle types: stable growth
    'F01': 1.0, 'F05': 1.0, 'M01': 1.0, 'M05': 1.1,
    // Energetic types: faster growth
    'F02': 1.2, 'M02': 1.2,
    // Tsundere/cold types: slower early growth, faster later
    'F03': 0.8, 'M03': 0.8,
    // Creative/quirky types: variable growth
    'F04': 1.1, 'M04': 1.1
  }
  
  const modifier = modifiers[characterId] || 1.0
  return Math.round(favorChange * modifier)
}

export default {
  checkStageAdvance,
  attemptConfession,
  attemptProposal,
  clampValue,
  updateLoverStats,
  buildSystemPrompt,
  parseAiResponse,
  getSpecialDateGreeting,
  calculateFavorDecay,
  generateOfflineMessage,
  getPersonalityGrowthModifier
}
