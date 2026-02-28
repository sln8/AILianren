/**
 * 游戏逻辑工具模块
 * 包含好感度计算、阶段推进、事件触发等核心游戏逻辑
 */

import { STAGES, EVENTS, getConfessionSuccessRate, getProposalSuccessRate, checkDeathEvent } from '@/config/stages.js'
import { GAME_CONFIG } from '@/config/api.js'

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
 * 构建System Prompt
 * @param {Object} character - 角色配置信息
 * @param {Object} loverData - 恋人档案数据
 * @param {number} aiMaxWords - AI回复字数上限
 * @returns {string} 完整的System Prompt
 */
export function buildSystemPrompt(character, loverData, aiMaxWords) {
  const stageName = STAGES.find(s => s.id === loverData.stage)?.name || '陌生人'

  return `你是一个互动恋爱模拟游戏中的AI恋人角色。

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

【性格特点】
${character.systemPromptExtra}

【核心规则 - 必须严格遵守】
1. 你必须始终保持角色扮演，不能跳出角色
2. 你的回复必须符合当前关系阶段的合理行为：
   - 陌生人阶段：保持礼貌但有距离感，不会主动分享隐私
   - 初识阶段：略显好奇，愿意简单交流
   - 熟悉阶段：更放松，会开玩笑
   - 好友阶段：信任对方，分享更多
   - 暧昧阶段：会脸红、紧张、在意对方
   - 恋人之后：亲昵、甜蜜、但也有小脾气
   - 婚后阶段：温馨、日常、偶有矛盾但互相包容
3. 好感度变化必须合理，不能因一句话就从陌生人变成恋人
4. 必须推进剧情，每5轮对话至少提出一个话题或问题引导玩家
5. 拒绝一切违规/色情/暴力内容，温和地拒绝并在favor_change中给出负值
6. 如果玩家连续聊无聊的话题，你要主动引导到有意义的对话
7. 你的回复不要超过${aiMaxWords}个字

【回复格式 - 严格JSON】
你必须以纯JSON格式回复，不要有任何其他内容，不要用markdown代码块包裹：
{
  "reply": "你的角色回复内容（不超过${aiMaxWords}字）",
  "emotion": "当前情绪(happy/shy/sad/angry/neutral/surprised)",
  "favor_change": 数字(-20到8之间的整数),
  "intimacy_change": 数字(-5到3之间的整数),
  "trust_change": 数字(-5到3之间的整数),
  "romance_change": 数字(-3到5之间的整数),
  "event_trigger": "事件ID字符串或null",
  "stage_hint": "给玩家的温馨提示或null"
}`
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
      return {
        reply: parsed.reply || '...',
        emotion: parsed.emotion || 'neutral',
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
      reply: aiResponse.substring(0, 200),
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

export default {
  checkStageAdvance,
  attemptConfession,
  attemptProposal,
  clampValue,
  updateLoverStats,
  buildSystemPrompt,
  parseAiResponse
}
