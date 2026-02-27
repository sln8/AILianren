import { reactive } from 'vue'

const STORAGE_KEY = 'ai_lianren_user'

const state = reactive({
  gender: null,
  wordBalance: 2000,
  totalWordsUsed: 0,
  totalAdsWatched: 0,
  consecutiveLoginDays: 0,
  lastLoginDate: '',
  settings: {
    soundEnabled: true,
    notificationEnabled: true
  }
})

function saveToStorage() {
  uni.setStorageSync(STORAGE_KEY, JSON.parse(JSON.stringify(state)))
}

function initUser() {
  const saved = uni.getStorageSync(STORAGE_KEY)
  if (saved) {
    Object.assign(state, saved)
  }
  checkDailyBonus()
}

function setGender(gender) {
  state.gender = gender
  saveToStorage()
}

function addWords(amount, source = '') {
  state.wordBalance += amount
  saveToStorage()
}

function spendWords(amount) {
  if (state.wordBalance < amount) return false
  state.wordBalance -= amount
  state.totalWordsUsed += amount
  saveToStorage()
  return true
}

function checkDailyBonus() {
  const today = new Date().toISOString().slice(0, 10)
  if (state.lastLoginDate === today) return

  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10)
  if (state.lastLoginDate === yesterday) {
    state.consecutiveLoginDays += 1
  } else {
    state.consecutiveLoginDays = 1
  }

  const streakBonus = Math.min(state.consecutiveLoginDays * 20, 200)
  const dailyBonus = 200 + streakBonus
  state.wordBalance += dailyBonus
  state.lastLoginDate = today
  saveToStorage()
}

function watchedAd() {
  state.totalAdsWatched += 1
  saveToStorage()
}

export const userStore = {
  state,
  initUser,
  setGender,
  addWords,
  spendWords,
  checkDailyBonus,
  watchedAd,
  saveToStorage
}
