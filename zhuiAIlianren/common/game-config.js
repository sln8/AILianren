// Game configuration constants and data

// Relationship stages with thresholds
export const STAGES = {
  stranger: { label: '🔴 陌生人', min: 0, max: 99 },
  acquaintance: { label: '🟠 认识', min: 100, max: 299 },
  familiar: { label: '🟡 熟悉', min: 300, max: 599 },
  friend: { label: '🟢 好友', min: 600, max: 999 },
  ambiguous: { label: '🔵 暧昧', min: 1000, max: 1499 },
  confessed: { label: '💜 表白阶段', min: 1500, max: 1999 },
  lover: { label: '❤️ 正式恋人', min: 2000, max: 2999 },
  passionate: { label: '💕 热恋期', min: 3000, max: 4499 },
  married: { label: '💍 结婚', min: 4500, max: 5999 },
  parent: { label: '👶 为人父母', min: 6000, max: 7499 },
  growing_old: { label: '🏠 婚后生活', min: 7500, max: 9999 },
  finale: { label: '🌅 白头偕老', min: 10000, max: 99999 }
}

// Stage labels for display
export const STAGE_LABELS = {
  stranger: '陌生人',
  acquaintance: '认识',
  familiar: '熟悉',
  friend: '好友',
  ambiguous: '暧昧',
  confessed: '表白',
  lover: '恋人',
  passionate: '热恋',
  married: '已婚',
  parent: '为人父母',
  growing_old: '白头偕老',
  finale: '白头偕老'
}

// Word economy configuration
export const WORD_CONFIG = {
  initialGift: 800,
  dailyFree: 80,
  adReward: 500,
  dailyAdLimit: 10,
  shareReward: 200,
  loginBonus: {
    3: 100,
    7: 300,
    15: 500,
    30: 1000
  }
}

// Calculate relationship stage from favorability value
export function calculateStage(favorability, totalRounds = 0) {
  if (favorability >= 10000) return 'finale'
  if (favorability >= 7500) return 'growing_old'
  if (favorability >= 6000) return 'parent'
  if (favorability >= 4500) return 'married'
  if (favorability >= 3000) return 'passionate'
  if (favorability >= 2000) return 'lover'
  if (favorability >= 1500) return 'confessed'
  if (favorability >= 1000) return 'ambiguous'
  if (favorability >= 600) return 'friend'
  if (favorability >= 300 && totalRounds >= 20) return 'familiar'
  if (favorability >= 100) return 'acquaintance'
  return 'stranger'
}

// Get next stage threshold
export function getNextThreshold(stage) {
  const thresholds = {
    stranger: 100,
    acquaintance: 300,
    familiar: 600,
    friend: 1000,
    ambiguous: 1500,
    confessed: 2000,
    lover: 3000,
    passionate: 4500,
    married: 6000,
    parent: 7500,
    growing_old: 10000,
    finale: 10000
  }
  return thresholds[stage] || 100
}

// Get stage constraints for AI prompt
export function getStageConstraints(stage) {
  const constraints = {
    stranger: '当前阶段（陌生人）：保持礼貌但有距离感，不主动过于热情，像初次见面的人一样交流。',
    acquaintance: '当前阶段（认识）：可以进行日常闲聊，偶尔表现出兴趣，但保持适当距离。',
    familiar: '当前阶段（熟悉）：可以分享日常、讨论兴趣爱好、偶尔开玩笑，但不主动暧昧。',
    friend: '当前阶段（好友）：可以分享秘密和心事，有亲密互动，偶尔有些暧昧的苗头。',
    ambiguous: '当前阶段（暧昧）：可以有暧昧对话，会吃醋、害羞，但还没有正式表白。',
    confessed: '当前阶段（表白）：已表白成功，开始正式恋爱，可以有甜蜜互动。',
    lover: '当前阶段（恋人）：正式情侣关系，可以有恋人专属的甜蜜互动。',
    passionate: '当前阶段（热恋）：热恋中，非常甜蜜，可以讨论未来，安排约会。',
    married: '当前阶段（已婚）：夫妻关系，生活化的甜蜜，讨论婚后生活。',
    parent: '当前阶段（为人父母）：有了孩子，可以讨论育儿和家庭生活。',
    growing_old: '当前阶段（白头偕老）：携手走过多年，回忆往事，珍惜当下。',
    finale: '当前阶段（终章）：人生即将走到终点，珍惜最后的时光。'
  }
  return constraints[stage] || constraints.stranger
}

// Count Chinese characters for word consumption
export function countChineseChars(text) {
  if (!text) return 0
  // Count all characters (both Chinese and non-Chinese count)
  return text.length
}
