/**
 * 本地存储工具模块
 * 封装uni-app的本地存储API，用于管理游戏数据的本地缓存
 */

// 本地缓存的最大消息条数（50轮对话 × 每轮2条 = 100条）
const MAX_CACHED_MESSAGES = 100

// 存储Key常量
const STORAGE_KEYS = {
  USER_INFO: 'ailianren_user_info',         // 用户基本信息
  CURRENT_LOVER: 'ailianren_current_lover',  // 当前恋人数据
  CHAT_HISTORY: 'ailianren_chat_history',    // 聊天历史缓存
  GAME_SETTINGS: 'ailianren_game_settings',  // 游戏设置
  DAILY_DATA: 'ailianren_daily_data'         // 每日数据（广告次数等）
}

/**
 * 保存用户信息到本地
 * @param {Object} userInfo - 用户信息对象
 */
export function saveUserInfo(userInfo) {
  try {
    uni.setStorageSync(STORAGE_KEYS.USER_INFO, JSON.stringify(userInfo))
  } catch (e) {
    console.error('保存用户信息失败:', e)
  }
}

/**
 * 获取本地缓存的用户信息
 * @returns {Object|null} 用户信息
 */
export function getUserInfo() {
  try {
    const data = uni.getStorageSync(STORAGE_KEYS.USER_INFO)
    return data ? JSON.parse(data) : null
  } catch (e) {
    console.error('获取用户信息失败:', e)
    return null
  }
}

/**
 * 保存当前恋人数据到本地
 * @param {Object} loverData - 恋人数据对象
 */
export function saveCurrentLover(loverData) {
  try {
    uni.setStorageSync(STORAGE_KEYS.CURRENT_LOVER, JSON.stringify(loverData))
  } catch (e) {
    console.error('保存恋人数据失败:', e)
  }
}

/**
 * 获取本地缓存的当前恋人数据
 * @returns {Object|null} 恋人数据
 */
export function getCurrentLover() {
  try {
    const data = uni.getStorageSync(STORAGE_KEYS.CURRENT_LOVER)
    return data ? JSON.parse(data) : null
  } catch (e) {
    console.error('获取恋人数据失败:', e)
    return null
  }
}

/**
 * 保存聊天历史到本地缓存（最近50轮，即100条消息）
 * @param {string} loverId - 恋人档案ID
 * @param {Array} messages - 消息数组
 */
export function saveChatHistory(loverId, messages) {
  try {
    const trimmed = messages.slice(-MAX_CACHED_MESSAGES)
    const key = `${STORAGE_KEYS.CHAT_HISTORY}_${loverId}`
    uni.setStorageSync(key, JSON.stringify(trimmed))
  } catch (e) {
    console.error('保存聊天历史失败:', e)
  }
}

/**
 * 获取本地缓存的聊天历史
 * @param {string} loverId - 恋人档案ID
 * @returns {Array} 消息数组
 */
export function getChatHistory(loverId) {
  try {
    const key = `${STORAGE_KEYS.CHAT_HISTORY}_${loverId}`
    const data = uni.getStorageSync(key)
    return data ? JSON.parse(data) : []
  } catch (e) {
    console.error('获取聊天历史失败:', e)
    return []
  }
}

/**
 * 保存游戏设置
 * @param {Object} settings - 设置对象
 */
export function saveGameSettings(settings) {
  try {
    uni.setStorageSync(STORAGE_KEYS.GAME_SETTINGS, JSON.stringify(settings))
  } catch (e) {
    console.error('保存游戏设置失败:', e)
  }
}

/**
 * 获取游戏设置
 * @returns {Object} 设置对象
 */
export function getGameSettings() {
  try {
    const data = uni.getStorageSync(STORAGE_KEYS.GAME_SETTINGS)
    return data ? JSON.parse(data) : {
      bgmOn: true,
      notificationOn: true,
      typingEffect: true
    }
  } catch (e) {
    return {
      bgmOn: true,
      notificationOn: true,
      typingEffect: true
    }
  }
}

/**
 * 保存每日数据（广告次数、分享次数等）
 * @param {Object} dailyData - 每日数据
 */
export function saveDailyData(dailyData) {
  try {
    uni.setStorageSync(STORAGE_KEYS.DAILY_DATA, JSON.stringify(dailyData))
  } catch (e) {
    console.error('保存每日数据失败:', e)
  }
}

/**
 * 获取每日数据，如果是新的一天则重置
 * @returns {Object} 每日数据
 */
export function getDailyData() {
  try {
    const data = uni.getStorageSync(STORAGE_KEYS.DAILY_DATA)
    if (data) {
      const parsed = JSON.parse(data)
      const today = new Date().toISOString().split('T')[0]
      // 如果不是今天的数据，重置
      if (parsed.date !== today) {
        const newData = {
          date: today,
          adsWatched: 0,
          shareCount: 0,
          dailyWordsClaimed: false
        }
        saveDailyData(newData)
        return newData
      }
      return parsed
    }
    const newData = {
      date: new Date().toISOString().split('T')[0],
      adsWatched: 0,
      shareCount: 0,
      dailyWordsClaimed: false
    }
    saveDailyData(newData)
    return newData
  } catch (e) {
    return {
      date: new Date().toISOString().split('T')[0],
      adsWatched: 0,
      shareCount: 0,
      dailyWordsClaimed: false
    }
  }
}

/**
 * 清除所有游戏数据（用于重置游戏）
 */
export function clearAllData() {
  try {
    uni.removeStorageSync(STORAGE_KEYS.USER_INFO)
    uni.removeStorageSync(STORAGE_KEYS.CURRENT_LOVER)
    uni.removeStorageSync(STORAGE_KEYS.GAME_SETTINGS)
    uni.removeStorageSync(STORAGE_KEYS.DAILY_DATA)
    // 聊天历史需要遍历清除
    const res = uni.getStorageInfoSync()
    if (res && res.keys) {
      res.keys.forEach(key => {
        if (key.startsWith(STORAGE_KEYS.CHAT_HISTORY)) {
          uni.removeStorageSync(key)
        }
      })
    }
  } catch (e) {
    console.error('清除数据失败:', e)
  }
}

export default {
  saveUserInfo,
  getUserInfo,
  saveCurrentLover,
  getCurrentLover,
  saveChatHistory,
  getChatHistory,
  saveGameSettings,
  getGameSettings,
  saveDailyData,
  getDailyData,
  clearAllData,
  STORAGE_KEYS
}
