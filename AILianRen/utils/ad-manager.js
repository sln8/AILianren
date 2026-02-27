const AD_COUNT_KEY = 'ai_lianren_ad_count'
const DAILY_LIMIT = 15

function getTodayKey() {
  return AD_COUNT_KEY + '_' + new Date().toISOString().slice(0, 10)
}

export function getDailyAdCount() {
  return uni.getStorageSync(getTodayKey()) || 0
}

export function canWatchAd() {
  return getDailyAdCount() < DAILY_LIMIT
}

export function showRewardAd(onSuccess, onFail) {
  if (!canWatchAd()) {
    onFail && onFail('今日观看次数已达上限')
    return
  }

  // Simulate rewarded ad via modal; in production use uni.createRewardedVideoAd()
  uni.showModal({
    title: '观看广告',
    content: '模拟：观看一段广告以获取字数奖励？',
    success(res) {
      if (res.confirm) {
        const key = getTodayKey()
        const count = uni.getStorageSync(key) || 0
        uni.setStorageSync(key, count + 1)
        onSuccess && onSuccess()
      } else {
        onFail && onFail('用户取消')
      }
    }
  })
}
