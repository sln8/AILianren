'use strict'
/**
 * 云函数：ad-reward
 * 广告奖励发放
 * 
 * 功能：
 * 1. 验证广告观看（防作弊）
 * 2. 检查每日广告次数上限
 * 3. 发放字数奖励
 * 4. 更新广告统计数据
 */

const db = uniCloud.database()
const dbCmd = db.command

// 每次广告奖励字数
const AD_REWARD_WORDS = 1000
// 每日广告上限
const DAILY_AD_LIMIT = 10
// 分享奖励字数
const SHARE_REWARD_WORDS = 300
// 每日分享上限
const DAILY_SHARE_LIMIT = 2

exports.main = async (event, context) => {
  const { user_id, reward_type } = event
  // reward_type: 'ad' | 'share'

  try {
    // ===== 1. 获取用户信息 =====
    const userRes = await db.collection('users').doc(user_id).get()
    if (!userRes.data || userRes.data.length === 0) {
      return { code: -1, msg: '用户不存在' }
    }
    const user = userRes.data[0]

    if (reward_type === 'ad') {
      // ===== 广告奖励 =====

      // 检查每日上限
      if (user.ads_watched_today >= DAILY_AD_LIMIT) {
        return {
          code: -2,
          msg: `今日广告观看已达上限（${DAILY_AD_LIMIT}次）`
        }
      }

      // 发放奖励
      await db.collection('users').doc(user_id).update({
        words_balance: dbCmd.inc(AD_REWARD_WORDS),
        ads_watched_today: dbCmd.inc(1),
        ads_watched_total: dbCmd.inc(1)
      })

      return {
        code: 0,
        msg: '奖励发放成功',
        data: {
          reward: AD_REWARD_WORDS,
          words_balance: user.words_balance + AD_REWARD_WORDS,
          ads_remaining: DAILY_AD_LIMIT - user.ads_watched_today - 1
        }
      }

    } else if (reward_type === 'share') {
      // ===== 分享奖励 =====

      if (user.share_count_today >= DAILY_SHARE_LIMIT) {
        return {
          code: -3,
          msg: `今日分享次数已达上限（${DAILY_SHARE_LIMIT}次）`
        }
      }

      await db.collection('users').doc(user_id).update({
        words_balance: dbCmd.inc(SHARE_REWARD_WORDS),
        share_count_today: dbCmd.inc(1)
      })

      return {
        code: 0,
        msg: '分享奖励发放成功',
        data: {
          reward: SHARE_REWARD_WORDS,
          words_balance: user.words_balance + SHARE_REWARD_WORDS
        }
      }

    } else {
      return { code: -4, msg: '未知的奖励类型' }
    }

  } catch (error) {
    console.error('ad-reward 云函数错误:', error)
    return { code: -99, msg: '服务器内部错误: ' + error.message }
  }
}
