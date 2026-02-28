'use strict';

const db = uniCloud.database();
const dbCmd = db.command;

exports.main = async (event, context) => {
  const { action, data } = event;

  try {
    switch (action) {
      case 'register':
        return await registerUser(data, context);
      case 'login':
        return await loginUser(data, context);
      case 'getDailyReward':
        return await getDailyReward(data);
      case 'getProfile':
        return await getProfile(data);
      case 'updateProfile':
        return await updateProfile(data);
      default:
        return { code: 400, message: '未知操作' };
    }
  } catch (err) {
    console.error('user-manager error:', err);
    return { code: 500, message: '服务器错误' };
  }
};

async function registerUser(data, context) {
  const { gender, nickname } = data;

  // Get platform info
  const { PLATFORM, APPID } = context;

  const user = {
    platform: PLATFORM || 'unknown',
    nickname: nickname || (gender === 'male' ? '少年' : '少女'),
    gender: gender,
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
  };

  const result = await db.collection('users').add(user);

  return {
    code: 200,
    data: {
      user_id: result.id,
      ...user
    }
  };
}

async function loginUser(data, context) {
  const { user_id } = data;

  const userDoc = await db.collection('users').doc(user_id).get();
  const user = userDoc.data[0];

  if (!user) {
    return { code: 404, message: '用户不存在' };
  }

  const today = new Date().toISOString().split('T')[0];

  if (user.last_login_date !== today) {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    const newConsecutive = user.last_login_date === yesterdayStr
      ? user.consecutive_login_days + 1
      : 1;

    await db.collection('users').doc(user_id).update({
      last_login_date: today,
      consecutive_login_days: newConsecutive,
      daily_free_claimed: false,
      daily_share_claimed: false,
      daily_ads_count: 0,
      daily_ads_reset_date: today,
      updated_at: new Date().toISOString()
    });
  }

  return {
    code: 200,
    data: user
  };
}

async function getDailyReward(data) {
  const { user_id } = data;

  const userDoc = await db.collection('users').doc(user_id).get();
  const user = userDoc.data[0];

  if (!user) {
    return { code: 404, message: '用户不存在' };
  }

  if (user.daily_free_claimed) {
    return { code: 400, message: '今日已领取' };
  }

  let reward = 80;

  // Consecutive login bonus
  const bonusMap = { 3: 100, 7: 300, 15: 500, 30: 1000 };
  const bonus = bonusMap[user.consecutive_login_days] || 0;
  reward += bonus;

  await db.collection('users').doc(user_id).update({
    word_balance: dbCmd.inc(reward),
    daily_free_claimed: true,
    updated_at: new Date().toISOString()
  });

  return {
    code: 200,
    data: {
      daily: 80,
      bonus: bonus,
      total_reward: reward,
      consecutive_days: user.consecutive_login_days,
      new_balance: user.word_balance + reward
    }
  };
}

async function getProfile(data) {
  const { user_id } = data;

  const userDoc = await db.collection('users').doc(user_id).get();
  const user = userDoc.data[0];

  if (!user) {
    return { code: 404, message: '用户不存在' };
  }

  return { code: 200, data: user };
}

async function updateProfile(data) {
  const { user_id, updates } = data;

  // Only allow certain fields to be updated
  const allowedFields = ['nickname', 'current_lover_id'];
  const safeUpdates = {};
  for (const key of allowedFields) {
    if (updates[key] !== undefined) {
      safeUpdates[key] = updates[key];
    }
  }
  safeUpdates.updated_at = new Date().toISOString();

  await db.collection('users').doc(user_id).update(safeUpdates);

  return { code: 200, message: '更新成功' };
}
