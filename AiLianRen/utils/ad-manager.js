/**
 * 广告管理工具模块
 * 封装uni-ad广告SDK的调用逻辑
 * 支持激励视频广告、插屏广告
 */

import { AD_CONFIG } from '@/config/api.js'
import { getDailyData, saveDailyData } from '@/utils/storage.js'

// 广告实例缓存
let rewardedVideoAd = null
let interstitialAd = null

/**
 * 初始化激励视频广告
 * 在应用启动时调用
 */
export function initRewardedVideoAd() {
  // #ifdef APP-PLUS || MP-WEIXIN || MP-TOUTIAO
  if (typeof uni.createRewardedVideoAd === 'function') {
    const options = {
      adpid: AD_CONFIG.REWARDED_VIDEO_ADPID
    }
    // 微信小程序使用adUnitId
    // #ifdef MP-WEIXIN
    options.adUnitId = AD_CONFIG.WX_REWARDED_AD_UNIT_ID
    // #endif
    // 抖音小程序使用adUnitId
    // #ifdef MP-TOUTIAO
    options.adUnitId = AD_CONFIG.TT_REWARDED_AD_UNIT_ID
    // #endif

    rewardedVideoAd = uni.createRewardedVideoAd(options)

    // 监听加载错误
    rewardedVideoAd.onError((err) => {
      console.error('激励视频广告加载失败:', err)
    })

    // 预加载广告
    rewardedVideoAd.load().catch(err => {
      console.warn('预加载激励视频广告失败:', err)
    })
  }
  // #endif
}

/**
 * 初始化插屏广告
 */
export function initInterstitialAd() {
  // #ifdef APP-PLUS || MP-WEIXIN || MP-TOUTIAO
  if (typeof uni.createInterstitialAd === 'function') {
    const options = {
      adpid: AD_CONFIG.INTERSTITIAL_ADPID
    }
    // #ifdef MP-WEIXIN
    options.adUnitId = AD_CONFIG.WX_INTERSTITIAL_AD_UNIT_ID
    // #endif
    // #ifdef MP-TOUTIAO
    options.adUnitId = AD_CONFIG.TT_INTERSTITIAL_AD_UNIT_ID
    // #endif

    interstitialAd = uni.createInterstitialAd(options)

    interstitialAd.onError((err) => {
      console.warn('插屏广告加载失败:', err)
    })
  }
  // #endif
}

/**
 * 展示激励视频广告并获取字数奖励
 * @returns {Promise<Object>} { success: boolean, reward: number, message: string }
 */
export function showRewardedVideoAd() {
  return new Promise((resolve) => {
    // 检查今日广告次数
    const dailyData = getDailyData()
    if (dailyData.adsWatched >= AD_CONFIG.DAILY_AD_LIMIT) {
      resolve({
        success: false,
        reward: 0,
        message: `今日广告观看已达上限（${AD_CONFIG.DAILY_AD_LIMIT}次），明天再来吧！`
      })
      return
    }

    // #ifdef APP-PLUS || MP-WEIXIN || MP-TOUTIAO
    if (!rewardedVideoAd) {
      initRewardedVideoAd()
    }

    if (rewardedVideoAd) {
      // 移除旧的关闭监听
      rewardedVideoAd.offClose()

      // 设置关闭回调
      rewardedVideoAd.onClose((res) => {
        if (res && res.isEnded) {
          // 用户完整观看了广告
          dailyData.adsWatched += 1
          saveDailyData(dailyData)

          resolve({
            success: true,
            reward: AD_CONFIG.AD_REWARD_WORDS,
            message: `获得${AD_CONFIG.AD_REWARD_WORDS}字数！`
          })
        } else {
          resolve({
            success: false,
            reward: 0,
            message: '请完整观看广告才能获得奖励哦~'
          })
        }
      })

      // 展示广告
      rewardedVideoAd.show().catch(() => {
        // 展示失败，尝试重新加载
        rewardedVideoAd.load().then(() => {
          rewardedVideoAd.show()
        }).catch(() => {
          resolve({
            success: false,
            reward: 0,
            message: '广告加载失败，请稍后再试'
          })
        })
      })
    } else {
      // 开发环境没有广告SDK，模拟广告效果
      resolve(simulateAd(dailyData))
    }
    // #endif

    // #ifndef APP-PLUS || MP-WEIXIN || MP-TOUTIAO
    // H5或其他平台，模拟广告
    resolve(simulateAd(dailyData))
    // #endif
  })
}

/**
 * 展示插屏广告（阶段转换时调用）
 */
export function showInterstitialAd() {
  // #ifdef APP-PLUS || MP-WEIXIN || MP-TOUTIAO
  if (interstitialAd) {
    interstitialAd.show().catch(() => {
      // 插屏广告展示失败时静默处理，不影响游戏体验
      console.warn('插屏广告展示失败')
    })
  }
  // #endif
}

/**
 * 模拟广告效果（开发环境使用）
 * @param {Object} dailyData - 每日数据
 * @returns {Object} 模拟结果
 */
function simulateAd(dailyData) {
  // 开发模式直接给奖励
  dailyData.adsWatched += 1
  saveDailyData(dailyData)
  return {
    success: true,
    reward: AD_CONFIG.AD_REWARD_WORDS,
    message: `（开发模式）获得${AD_CONFIG.AD_REWARD_WORDS}字数！`
  }
}

/**
 * 获取今日剩余广告次数
 * @returns {number} 剩余次数
 */
export function getRemainingAdCount() {
  const dailyData = getDailyData()
  return Math.max(0, AD_CONFIG.DAILY_AD_LIMIT - dailyData.adsWatched)
}

/**
 * 分享获取字数
 * @returns {Promise<Object>} { success: boolean, reward: number, message: string }
 */
export function shareForWords() {
  return new Promise((resolve) => {
    const dailyData = getDailyData()
    if (dailyData.shareCount >= AD_CONFIG.DAILY_SHARE_LIMIT) {
      resolve({
        success: false,
        reward: 0,
        message: `今日分享次数已达上限（${AD_CONFIG.DAILY_SHARE_LIMIT}次）`
      })
      return
    }

    // #ifdef MP-WEIXIN || MP-TOUTIAO
    uni.share({
      provider: 'weixin',
      type: 0,
      title: '这些年我们追过的AI恋人',
      summary: '来和你的AI恋人谈一场跨越一生的恋爱吧！',
      success: () => {
        dailyData.shareCount += 1
        saveDailyData(dailyData)
        resolve({
          success: true,
          reward: AD_CONFIG.SHARE_REWARD_WORDS,
          message: `分享成功！获得${AD_CONFIG.SHARE_REWARD_WORDS}字数！`
        })
      },
      fail: () => {
        resolve({
          success: false,
          reward: 0,
          message: '分享取消'
        })
      }
    })
    // #endif

    // #ifndef MP-WEIXIN || MP-TOUTIAO
    // 其他平台模拟分享
    dailyData.shareCount += 1
    saveDailyData(dailyData)
    resolve({
      success: true,
      reward: AD_CONFIG.SHARE_REWARD_WORDS,
      message: `（开发模式）分享成功！获得${AD_CONFIG.SHARE_REWARD_WORDS}字数！`
    })
    // #endif
  })
}

export default {
  initRewardedVideoAd,
  initInterstitialAd,
  showRewardedVideoAd,
  showInterstitialAd,
  getRemainingAdCount,
  shareForWords
}
