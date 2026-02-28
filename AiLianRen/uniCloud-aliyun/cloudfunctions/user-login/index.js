'use strict'
/**
 * 云函数：user-login
 * 用户登录/注册/每日字数发放
 * 
 * 功能：
 * 1. 微信/抖音用户登录（获取openid）
 * 2. 新用户自动注册并发放初始字数
 * 3. 老用户检查每日免费字数发放
 * 4. 返回用户完整信息
 */

const db = uniCloud.database()
const dbCmd = db.command

// 新用户初始字数
const INITIAL_WORDS = 1000
// 每日免费字数
const DAILY_FREE_WORDS = 100

exports.main = async (event, context) => {
  // 获取客户端平台信息
  const { PLATFORM } = context
  let openid = ''

  try {
    // ===== 1. 获取用户openid =====
    // 云函数中通过 context.PLATFORM 判断平台，不使用条件编译
    if (PLATFORM === 'mp-weixin' && event.code) {
      // 微信小程序登录：通过 code 换取 openid
      const wxRes = await uniCloud.httpclient.request(
        `https://api.weixin.qq.com/sns/jscode2session?appid=${event.appid}&secret=${event.secret}&js_code=${event.code}&grant_type=authorization_code`,
        { dataType: 'json' }
      )
      openid = wxRes.data.openid
    }

    // 如果没有获取到openid，使用设备ID作为替代
    if (!openid) {
      openid = event.deviceId || `device_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    }

    // ===== 2. 查找用户 =====
    const userRes = await db.collection('users').where({ openid }).get()

    if (userRes.data && userRes.data.length > 0) {
      // ===== 老用户：检查每日字数 =====
      const user = userRes.data[0]
      const today = new Date().toISOString().split('T')[0]
      const lastLogin = user.last_login_at ? new Date(user.last_login_at).toISOString().split('T')[0] : ''

      const updateData = {
        last_login_at: new Date()
      }

      // 如果是新的一天，重置每日数据并发放免费字数
      if (lastLogin !== today) {
        updateData.words_balance = dbCmd.inc(DAILY_FREE_WORDS)
        updateData.ads_watched_today = 0
        updateData.share_count_today = 0
        updateData.daily_words_claimed = true
      }

      await db.collection('users').doc(user._id).update(updateData)

      // 重新获取更新后的用户数据
      const updatedRes = await db.collection('users').doc(user._id).get()

      return {
        code: 0,
        msg: '登录成功',
        data: updatedRes.data[0],
        isNew: false,
        dailyWordsClaimed: lastLogin !== today
      }

    } else {
      // ===== 新用户：注册 =====
      const newUser = {
        openid: openid,
        platform: PLATFORM || 'unknown',
        nickname: event.nickname || '旅人',
        gender: event.gender || '',
        words_balance: INITIAL_WORDS,
        words_total_used: 0,
        ads_watched_today: 0,
        ads_watched_total: 0,
        share_count_today: 0,
        current_lover_id: '',
        total_lovers_played: 0,
        created_at: new Date(),
        last_login_at: new Date(),
        daily_words_claimed: true,
        settings: {
          bgm_on: true,
          notification_on: true,
          typing_effect: true
        }
      }

      const addRes = await db.collection('users').add(newUser)
      newUser._id = addRes.id

      return {
        code: 0,
        msg: '注册成功',
        data: newUser,
        isNew: true,
        dailyWordsClaimed: true
      }
    }

  } catch (error) {
    console.error('user-login 云函数错误:', error)
    return { code: -1, msg: '登录失败: ' + error.message }
  }
}
