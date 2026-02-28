'use strict';

const db = uniCloud.database();
const dbCmd = db.command;

exports.main = async (event, context) => {
  const { user_id, ad_type } = event;

  try {
    // 1. Get user info
    const userDoc = await db.collection('users').doc(user_id).get();
    const user = userDoc.data[0];

    if (!user) {
      return { code: 404, message: '用户不存在' };
    }

    // 2. Check daily ad limit
    const today = new Date().toISOString().split('T')[0];
    let dailyCount = user.daily_ads_count;

    if (user.daily_ads_reset_date !== today) {
      dailyCount = 0;
    }

    if (dailyCount >= 10) {
      return {
        code: 403,
        message: '今日广告观看次数已达上限（10次/天）'
      };
    }

    // 3. Calculate reward based on ad type
    let reward = 0;
    switch (ad_type) {
      case 'watch_ad':
        reward = 500;
        break;
      case 'change_lover':
        reward = 0;
        break;
      case 'apologize':
        reward = 200;
        break;
      case 'unlock_event':
        reward = 300;
        break;
      case 'daily_double':
        reward = 80;
        break;
      default:
        reward = 500;
    }

    // 4. Update user data
    await db.collection('users').doc(user_id).update({
      word_balance: dbCmd.inc(reward),
      total_ads_watched: dbCmd.inc(1),
      daily_ads_count: dailyCount + 1,
      daily_ads_reset_date: today,
      updated_at: new Date().toISOString()
    });

    return {
      code: 200,
      data: {
        reward_words: reward,
        new_balance: user.word_balance + reward,
        daily_ads_remaining: 10 - (dailyCount + 1)
      }
    };
  } catch (err) {
    console.error('ad-reward-handler error:', err);
    return { code: 500, message: '服务器错误' };
  }
};
