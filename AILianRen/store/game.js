import { reactive } from 'vue'

const STORAGE_KEY = 'ai_lianren_game'

const STAGES = [
  { name: '陌生人', min: 0, max: 9, goal: '试着打个招呼吧' },
  { name: '认识', min: 10, max: 24, goal: '多聊聊，让对方记住你' },
  { name: '熟悉', min: 25, max: 39, goal: '找到共同话题，加深了解' },
  { name: '好友', min: 40, max: 54, goal: '成为可以信赖的朋友' },
  { name: '暧昧', min: 55, max: 69, goal: '关系变得微妙起来了' },
  { name: '表白', min: 70, max: 79, goal: '是时候表达心意了' },
  { name: '恋人', min: 80, max: 89, goal: '好好经营这段感情吧' },
  { name: '求婚', min: 90, max: 91, goal: '准备携手一生' },
  { name: '新婚', min: 92, max: 94, goal: '享受甜蜜的新婚生活' },
  { name: '育儿', min: 85, max: 100, goal: '一起迎接新生命' },
  { name: '10年婚姻', min: 0, max: 100, goal: '保持感情的温度' },
  { name: '20年婚姻', min: 0, max: 100, goal: '风雨同舟，不离不弃' },
  { name: '30年婚姻', min: 0, max: 100, goal: '回忆过去，珍惜当下' },
  { name: '白头偕老', min: 0, max: 100, goal: '执子之手，与子偕老' }
]

const defaultState = {
  characterId: '',
  relationshipStage: '陌生人',
  stageIndex: 0,
  favorability: 0,
  trust: 0,
  intimacy: 0,
  boredom: 0,
  freshness: 100,
  currentMood: 'normal',
  gameDate: '',
  daysTogether: 0,
  totalInteractions: 0,
  eventsCompleted: [],
  milestones: [],
  conversationSummary: ''
}

const state = reactive({ ...defaultState })

function clamp(val, min = 0, max = 100) {
  return Math.max(min, Math.min(max, val))
}

function saveToStorage() {
  uni.setStorageSync(STORAGE_KEY, JSON.parse(JSON.stringify(state)))
}

function initGame(characterId) {
  Object.assign(state, { ...defaultState }, {
    characterId,
    gameDate: new Date().toISOString().slice(0, 10),
    eventsCompleted: [],
    milestones: []
  })
  saveToStorage()
}

function loadGame() {
  const saved = uni.getStorageSync(STORAGE_KEY)
  if (saved) {
    Object.assign(state, saved)
    return true
  }
  return false
}

function updateValues(changes) {
  if (changes.favorability_change) {
    state.favorability = clamp(state.favorability + changes.favorability_change)
  }
  if (changes.trust_change) {
    state.trust = clamp(state.trust + changes.trust_change)
  }
  if (changes.intimacy_change) {
    state.intimacy = clamp(state.intimacy + changes.intimacy_change)
  }
  if (changes.boredom_change) {
    state.boredom = clamp(state.boredom + changes.boredom_change)
  }
  if (changes.freshness_change) {
    state.freshness = clamp(state.freshness + changes.freshness_change)
  }
  if (changes.mood) {
    state.currentMood = changes.mood
  }
  state.totalInteractions += 1
  checkStageProgress()
  saveToStorage()
}

function checkStageProgress() {
  if (state.stageIndex >= STAGES.length - 1) return false
  const nextStage = STAGES[state.stageIndex + 1]
  if (state.favorability >= nextStage.min) {
    advanceStage()
    return true
  }
  return false
}

function advanceStage() {
  if (state.stageIndex >= STAGES.length - 1) return
  state.stageIndex += 1
  state.relationshipStage = STAGES[state.stageIndex].name
  addMilestone({
    type: 'stage_advance',
    stage: state.relationshipStage,
    date: state.gameDate
  })
  saveToStorage()
}

function addMilestone(milestone) {
  state.milestones.push({
    ...milestone,
    timestamp: Date.now()
  })
  saveToStorage()
}

function addEvent(eventId) {
  if (!state.eventsCompleted.includes(eventId)) {
    state.eventsCompleted.push(eventId)
    saveToStorage()
  }
}

function advanceGameDay() {
  state.daysTogether += 1
  const date = new Date(state.gameDate)
  date.setDate(date.getDate() + 1)
  state.gameDate = date.toISOString().slice(0, 10)
  saveToStorage()
}

function getStageInfo() {
  const current = STAGES[state.stageIndex]
  const next = state.stageIndex < STAGES.length - 1 ? STAGES[state.stageIndex + 1] : null
  return {
    name: current.name,
    goal: current.goal,
    nextThreshold: next ? next.min : null,
    isMaxStage: state.stageIndex >= STAGES.length - 1
  }
}

export const gameStore = {
  state,
  STAGES,
  initGame,
  loadGame,
  updateValues,
  checkStageProgress,
  advanceStage,
  addMilestone,
  addEvent,
  advanceGameDay,
  saveToStorage,
  getStageInfo
}
