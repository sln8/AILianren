import { reactive } from 'vue'

const STORAGE_PREFIX = 'ai_lianren_chat_'

const state = reactive({
  messages: [],
  isLoading: false
})

function addMessage(role, content, extra = {}) {
  state.messages.push({
    role,
    content,
    timestamp: Date.now(),
    mood: extra.mood || 'normal',
    valueChanges: extra.valueChanges || null
  })
}

function loadMessages(characterId) {
  const saved = uni.getStorageSync(STORAGE_PREFIX + characterId)
  state.messages = saved ? JSON.parse(JSON.stringify(saved)) : []
}

function saveMessages(characterId) {
  uni.setStorageSync(STORAGE_PREFIX + characterId, JSON.parse(JSON.stringify(state.messages)))
}

function clearMessages() {
  state.messages = []
}

function getRecentMessages(count = 10) {
  return state.messages.slice(-count)
}

function getMessagesSummary() {
  if (state.messages.length === 0) return ''
  const recent = state.messages.slice(-20)
  return recent.map(m => `${m.role === 'user' ? '玩家' : 'TA'}：${m.content}`).join('\n')
}

export const chatStore = {
  state,
  addMessage,
  loadMessages,
  saveMessages,
  clearMessages,
  getRecentMessages,
  getMessagesSummary
}
