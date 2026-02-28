// Local storage utility for game data persistence

const STORAGE_KEYS = {
  USER: 'game_user',
  PROGRESS: 'game_progress_',
  CHAT: 'game_chat_',
  SETTINGS: 'game_settings'
}

// Get user data
export function getUser() {
  try {
    const data = uni.getStorageSync(STORAGE_KEYS.USER)
    return data ? JSON.parse(data) : null
  } catch (e) {
    return null
  }
}

// Save user data
export function saveUser(userData) {
  try {
    uni.setStorageSync(STORAGE_KEYS.USER, JSON.stringify(userData))
    return true
  } catch (e) {
    return false
  }
}

// Initialize new user
export function initUser(gender) {
  const user = {
    _id: 'local_user_' + Date.now(),
    gender: gender,
    nickname: gender === 'male' ? '少年' : '少女',
    word_balance: 800,
    total_words_used: 0,
    total_ads_watched: 0,
    daily_ads_count: 0,
    daily_ads_reset_date: new Date().toISOString().split('T')[0],
    daily_free_claimed: false,
    daily_share_claimed: false,
    consecutive_login_days: 1,
    last_login_date: new Date().toISOString().split('T')[0],
    current_lover_id: null,
    lover_history: [],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
  saveUser(user)
  return user
}

// Get game progress for a specific lover
export function getProgress(loverId) {
  try {
    const key = STORAGE_KEYS.PROGRESS + loverId
    const data = uni.getStorageSync(key)
    return data ? JSON.parse(data) : null
  } catch (e) {
    return null
  }
}

// Save game progress
export function saveProgress(loverId, progress) {
  try {
    const key = STORAGE_KEYS.PROGRESS + loverId
    uni.setStorageSync(key, JSON.stringify(progress))
    return true
  } catch (e) {
    return false
  }
}

// Initialize new game progress for a lover
export function initProgress(userId, loverId) {
  const progress = {
    _id: 'progress_' + Date.now(),
    user_id: userId,
    lover_id: loverId,
    favorability: 0,
    relationship_stage: 'stranger',
    total_chat_rounds: 0,
    chat_days: 1,
    events_triggered: [],
    milestones_reached: [],
    marriage_date: null,
    children: [],
    marriage_years: 0,
    lover_alive: true,
    game_ended: false,
    chat_summary: '',
    last_mood: 'neutral',
    first_chat_date: new Date().toISOString().split('T')[0],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
  saveProgress(loverId, progress)
  return progress
}

// Get chat messages for a lover
export function getChatMessages(loverId) {
  try {
    const key = STORAGE_KEYS.CHAT + loverId
    const data = uni.getStorageSync(key)
    return data ? JSON.parse(data) : []
  } catch (e) {
    return []
  }
}

// Save chat messages
export function saveChatMessages(loverId, messages) {
  try {
    const key = STORAGE_KEYS.CHAT + loverId
    // Keep only last 200 messages to save storage
    const trimmed = messages.slice(-200)
    uni.setStorageSync(key, JSON.stringify(trimmed))
    return true
  } catch (e) {
    return false
  }
}

// Get settings
export function getSettings() {
  try {
    const data = uni.getStorageSync(STORAGE_KEYS.SETTINGS)
    return data ? JSON.parse(data) : { sound: true, music: true, notification: true }
  } catch (e) {
    return { sound: true, music: true, notification: true }
  }
}

// Save settings
export function saveSettings(settings) {
  try {
    uni.setStorageSync(STORAGE_KEYS.SETTINGS, JSON.stringify(settings))
    return true
  } catch (e) {
    return false
  }
}

// Check and handle daily login
export function handleDailyLogin() {
  const user = getUser()
  if (!user) return null

  const today = new Date().toISOString().split('T')[0]
  
  if (user.last_login_date !== today) {
    // New day
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    const yesterdayStr = yesterday.toISOString().split('T')[0]
    
    if (user.last_login_date === yesterdayStr) {
      user.consecutive_login_days += 1
    } else {
      user.consecutive_login_days = 1
    }
    
    user.last_login_date = today
    user.daily_free_claimed = false
    user.daily_share_claimed = false
    user.daily_ads_count = 0
    user.daily_ads_reset_date = today
    user.updated_at = new Date().toISOString()
    
    saveUser(user)
  }
  
  return user
}

// Claim daily free words
export function claimDailyFree() {
  const user = getUser()
  if (!user || user.daily_free_claimed) return null
  
  user.daily_free_claimed = true
  user.word_balance += 80
  
  // Check consecutive login bonus
  const bonusMap = { 3: 100, 7: 300, 15: 500, 30: 1000 }
  const bonus = bonusMap[user.consecutive_login_days]
  if (bonus) {
    user.word_balance += bonus
  }
  
  user.updated_at = new Date().toISOString()
  saveUser(user)
  
  return {
    daily: 80,
    bonus: bonus || 0,
    consecutive_days: user.consecutive_login_days,
    new_balance: user.word_balance
  }
}

// Consume words
export function consumeWords(count) {
  const user = getUser()
  if (!user) return false
  
  user.word_balance = Math.max(0, user.word_balance - count)
  user.total_words_used += count
  user.updated_at = new Date().toISOString()
  saveUser(user)
  
  return user.word_balance
}

// Add words (from ad reward, etc.)
export function addWords(count) {
  const user = getUser()
  if (!user) return false
  
  user.word_balance += count
  user.updated_at = new Date().toISOString()
  saveUser(user)
  
  return user.word_balance
}

// Record ad watch
export function recordAdWatch() {
  const user = getUser()
  if (!user) return false
  
  user.daily_ads_count += 1
  user.total_ads_watched += 1
  user.updated_at = new Date().toISOString()
  saveUser(user)
  
  return user.daily_ads_count
}

// Clear all data (for testing)
export function clearAllData() {
  try {
    uni.clearStorageSync()
    return true
  } catch (e) {
    return false
  }
}
