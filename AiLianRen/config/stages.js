/**
 * 关系阶段配置
 * 定义从陌生人到白头偕老的完整人生阶段
 */

// ==================== 关系阶段定义 ====================
export const STAGES = [
  {
    id: 1,
    name: '陌生人',
    favorMin: 0,
    favorMax: 10,
    minRounds: 0,
    description: '初次相遇，不了解对方',
    aiMaxWords: 60,
    eventId: 'EVT001'
  },
  {
    id: 2,
    name: '初识',
    favorMin: 11,
    favorMax: 25,
    minRounds: 10,
    description: '知道对方名字，简单交流',
    aiMaxWords: 60,
    eventId: 'EVT002'
  },
  {
    id: 3,
    name: '熟悉',
    favorMin: 26,
    favorMax: 45,
    minRounds: 25,
    description: '经常聊天，了解彼此',
    aiMaxWords: 100,
    eventId: 'EVT003'
  },
  {
    id: 4,
    name: '好友',
    favorMin: 46,
    favorMax: 60,
    minRounds: 40,
    description: '成为好朋友，互相信任',
    aiMaxWords: 100,
    eventId: 'EVT004'
  },
  {
    id: 5,
    name: '暧昧',
    favorMin: 61,
    favorMax: 75,
    minRounds: 60,
    description: '心生好感，暗生情愫',
    aiMaxWords: 120,
    eventId: 'EVT005'
  },
  {
    id: 6,
    name: '表白',
    favorMin: 76,
    favorMax: 85,
    minRounds: 80,
    description: '鼓起勇气表达爱意',
    aiMaxWords: 120,
    eventId: 'EVT006',
    special: 'confession' // 特殊阶段标记：表白
  },
  {
    id: 7,
    name: '恋人',
    favorMin: 86,
    favorMax: 100,
    minRounds: 0, // 表白成功后自动进入
    description: '正式在一起',
    aiMaxWords: 120,
    eventId: 'EVT007'
  },
  {
    id: 8,
    name: '热恋',
    favorMin: 101,
    favorMax: 130,
    minRoundsExtra: 30,
    description: '甜蜜热恋期',
    aiMaxWords: 150,
    eventId: 'EVT009'
  },
  {
    id: 9,
    name: '磨合',
    favorMin: 131,
    favorMax: 155,
    minRoundsExtra: 25,
    description: '激情退去，学会包容',
    aiMaxWords: 150,
    eventId: 'EVT011'
  },
  {
    id: 10,
    name: '求婚',
    favorMin: 156,
    favorMax: 170,
    minRoundsExtra: 20,
    description: '向对方求婚',
    aiMaxWords: 150,
    eventId: 'EVT012',
    special: 'proposal' // 特殊阶段标记：求婚
  },
  {
    id: 11,
    name: '结婚',
    favorMin: 171,
    favorMax: 185,
    minRounds: 0,
    description: '步入婚姻殿堂',
    aiMaxWords: 150,
    eventId: 'EVT013'
  },
  {
    id: 12,
    name: '新婚',
    favorMin: 186,
    favorMax: 210,
    minRoundsExtra: 20,
    description: '新婚甜蜜生活',
    aiMaxWords: 120,
    eventId: 'EVT014'
  },
  {
    id: 13,
    name: '怀孕/生子',
    favorMin: 211,
    favorMax: 230,
    minRoundsExtra: 15,
    description: '迎接新生命',
    aiMaxWords: 120,
    eventId: 'EVT015'
  },
  {
    id: 14,
    name: '育儿期',
    favorMin: 231,
    favorMax: 260,
    minRoundsExtra: 20,
    description: '忙碌而幸福的育儿时光',
    aiMaxWords: 120,
    eventId: 'EVT016'
  },
  {
    id: 15,
    name: '10年婚姻',
    favorMin: 261,
    favorMax: 300,
    minRoundsExtra: 30,
    description: '锡婚，平淡是真',
    aiMaxWords: 120,
    eventId: 'EVT017'
  },
  {
    id: 16,
    name: '20年婚姻',
    favorMin: 301,
    favorMax: 340,
    minRoundsExtra: 30,
    description: '瓷婚，孩子长大',
    aiMaxWords: 120,
    eventId: 'EVT018'
  },
  {
    id: 17,
    name: '30年婚姻',
    favorMin: 341,
    favorMax: 380,
    minRoundsExtra: 30,
    description: '珍珠婚，空巢期',
    aiMaxWords: 120,
    eventId: 'EVT019'
  },
  {
    id: 18,
    name: '金婚',
    favorMin: 381,
    favorMax: 400,
    minRoundsExtra: 30,
    description: '金婚纪念，半世纪的爱',
    aiMaxWords: 120,
    eventId: 'EVT020'
  },
  {
    id: 19,
    name: '白头偕老',
    favorMin: 401,
    favorMax: 500,
    minRoundsExtra: 20,
    description: '圆满结局',
    aiMaxWords: 120,
    eventId: null
  },
  {
    id: 20,
    name: '死亡告别',
    favorMin: 0,
    favorMax: 500,
    minRounds: 0,
    description: '恋人离世',
    aiMaxWords: 200,
    eventId: 'EVT021',
    special: 'death' // 特殊阶段标记：死亡
  }
]

// ==================== 剧情事件定义 ====================
export const EVENTS = {
  EVT001: {
    id: 'EVT001',
    name: '偶然相遇',
    stageFrom: 1,
    stageTo: 2,
    description: '在某个场景偶遇，缘分就此开始',
    favorReward: 5,
    intimacyReward: 0,
    trustReward: 0,
    romanceReward: 0
  },
  EVT002: {
    id: 'EVT002',
    name: '交换联系方式',
    stageFrom: 2,
    stageTo: 3,
    description: '自然地交换了联系方式',
    favorReward: 5,
    intimacyReward: 3,
    trustReward: 0,
    romanceReward: 0
  },
  EVT003: {
    id: 'EVT003',
    name: '第一次一起吃饭',
    stageFrom: 3,
    stageTo: 4,
    description: '约了一顿饭，聊了很多',
    favorReward: 8,
    intimacyReward: 0,
    trustReward: 5,
    romanceReward: 0
  },
  EVT004: {
    id: 'EVT004',
    name: '不经意的接触',
    stageFrom: 4,
    stageTo: 5,
    description: '一次偶然的手碰手/撑同一把伞',
    favorReward: 5,
    intimacyReward: 0,
    trustReward: 0,
    romanceReward: 10
  },
  EVT005: {
    id: 'EVT005',
    name: '朋友起哄',
    stageFrom: 5,
    stageTo: 5,
    description: '共同的朋友开玩笑说你们很配',
    favorReward: 3,
    intimacyReward: 0,
    trustReward: 0,
    romanceReward: 5
  },
  EVT006: {
    id: 'EVT006',
    name: '月光下的告白',
    stageFrom: 5,
    stageTo: 7,
    description: '鼓起勇气表达爱意',
    favorReward: 0, // 根据成败决定
    intimacyReward: 0,
    trustReward: 0,
    romanceReward: 0,
    special: 'confession'
  },
  EVT007: {
    id: 'EVT007',
    name: '第一次约会',
    stageFrom: 7,
    stageTo: 7,
    description: '一起去看电影/逛公园',
    favorReward: 10,
    intimacyReward: 10,
    trustReward: 0,
    romanceReward: 0
  },
  EVT008: {
    id: 'EVT008',
    name: '第一次吵架',
    stageFrom: 7,
    stageTo: 8,
    description: '因小事产生分歧，考验处理能力',
    favorReward: 0,
    intimacyReward: 0,
    trustReward: 10,
    romanceReward: 0,
    special: 'conflict'
  },
  EVT009: {
    id: 'EVT009',
    name: '100天纪念',
    stageFrom: 8,
    stageTo: 8,
    description: '在一起100天的纪念',
    favorReward: 8,
    intimacyReward: 0,
    trustReward: 0,
    romanceReward: 8
  },
  EVT010: {
    id: 'EVT010',
    name: '见家长',
    stageFrom: 8,
    stageTo: 9,
    description: '带对方见自己的父母',
    favorReward: 0,
    intimacyReward: 0,
    trustReward: 15,
    romanceReward: 0
  },
  EVT011: {
    id: 'EVT011',
    name: '冷战事件',
    stageFrom: 9,
    stageTo: 9,
    description: '一次较大的矛盾，需要修复',
    favorReward: 0,
    intimacyReward: 0,
    trustReward: 0,
    romanceReward: 0,
    special: 'conflict'
  },
  EVT012: {
    id: 'EVT012',
    name: '浪漫求婚',
    stageFrom: 9,
    stageTo: 11,
    description: '精心策划的求婚',
    favorReward: 0,
    intimacyReward: 0,
    trustReward: 0,
    romanceReward: 0,
    special: 'proposal'
  },
  EVT013: {
    id: 'EVT013',
    name: '婚礼进行曲',
    stageFrom: 11,
    stageTo: 12,
    description: '盛大的婚礼场景',
    favorReward: 20,
    intimacyReward: 10,
    trustReward: 10,
    romanceReward: 10
  },
  EVT014: {
    id: 'EVT014',
    name: '蜜月旅行',
    stageFrom: 12,
    stageTo: 12,
    description: '一起去旅行',
    favorReward: 10,
    intimacyReward: 0,
    trustReward: 0,
    romanceReward: 15
  },
  EVT015: {
    id: 'EVT015',
    name: '新生命降临',
    stageFrom: 13,
    stageTo: 14,
    description: '孩子出生的感动时刻',
    favorReward: 15,
    intimacyReward: 15,
    trustReward: 0,
    romanceReward: 0
  },
  EVT016: {
    id: 'EVT016',
    name: '第一声爸妈',
    stageFrom: 14,
    stageTo: 14,
    description: '孩子第一次叫爸爸/妈妈',
    favorReward: 10,
    intimacyReward: 0,
    trustReward: 0,
    romanceReward: 0
  },
  EVT017: {
    id: 'EVT017',
    name: '婚姻危机',
    stageFrom: 15,
    stageTo: 15,
    description: '平淡中的考验',
    favorReward: 0,
    intimacyReward: 0,
    trustReward: 0,
    romanceReward: 0,
    special: 'conflict'
  },
  EVT018: {
    id: 'EVT018',
    name: '孩子成人',
    stageFrom: 16,
    stageTo: 16,
    description: '孩子高考/上大学',
    favorReward: 8,
    intimacyReward: 0,
    trustReward: 0,
    romanceReward: 0
  },
  EVT019: {
    id: 'EVT019',
    name: '退休时光',
    stageFrom: 17,
    stageTo: 17,
    description: '一起规划退休生活',
    favorReward: 10,
    intimacyReward: 0,
    trustReward: 0,
    romanceReward: 10
  },
  EVT020: {
    id: 'EVT020',
    name: '金婚典礼',
    stageFrom: 18,
    stageTo: 19,
    description: '50年婚姻纪念',
    favorReward: 20,
    intimacyReward: 0,
    trustReward: 0,
    romanceReward: 0
  },
  EVT021: {
    id: 'EVT021',
    name: '恋人离世',
    stageFrom: 0,
    stageTo: 20,
    description: '温馨而感人的告别',
    favorReward: 0,
    intimacyReward: 0,
    trustReward: 0,
    romanceReward: 0,
    special: 'death'
  }
}

// ==================== 工具函数 ====================

/**
 * 根据好感度获取当前应处阶段
 * @param {number} favorScore - 当前好感度
 * @param {number} currentStage - 当前阶段ID
 * @param {number} totalRounds - 总对话轮次
 * @returns {Object} 阶段信息
 */
export function getStageByFavor(favorScore, currentStage, totalRounds) {
  // 从当前阶段往上查找是否可以推进
  for (let i = STAGES.length - 1; i >= 0; i--) {
    const stage = STAGES[i]
    if (stage.id === 20) continue // 死亡阶段特殊处理
    if (favorScore >= stage.favorMin && favorScore <= stage.favorMax) {
      return stage
    }
  }
  return STAGES[0]
}

/**
 * 获取AI回复的最大字数限制
 * @param {number} stageId - 阶段ID
 * @returns {number} 最大字数
 */
export function getAiMaxWords(stageId) {
  const stage = STAGES.find(s => s.id === stageId)
  return stage ? stage.aiMaxWords : 100
}

/**
 * 计算表白成功率
 * @param {number} favorScore - 当前好感度
 * @returns {number} 成功率（0-100）
 */
export function getConfessionSuccessRate(favorScore) {
  const rate = (favorScore - 70) * 3 + 30
  return Math.min(100, Math.max(0, rate))
}

/**
 * 计算求婚成功率
 * @param {number} favorScore - 当前好感度
 * @returns {number} 成功率（0-100）
 */
export function getProposalSuccessRate(favorScore) {
  const rate = (favorScore - 150) * 4 + 40
  return Math.min(100, Math.max(0, rate))
}

/**
 * 检查是否触发死亡事件
 * @param {number} stageId - 当前阶段
 * @returns {boolean} 是否触发死亡
 */
export function checkDeathEvent(stageId) {
  if (stageId === 17) {
    // 30年婚姻后每轮0.5%概率
    return Math.random() < 0.005
  } else if (stageId >= 18) {
    // 金婚后每轮2%概率
    return Math.random() < 0.02
  }
  return false
}

export default {
  STAGES,
  EVENTS,
  getStageByFavor,
  getAiMaxWords,
  getConfessionSuccessRate,
  getProposalSuccessRate,
  checkDeathEvent
}
