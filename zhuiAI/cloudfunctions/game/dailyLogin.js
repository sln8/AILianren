/**
 * dailyLogin - 每日登录奖励
 *
 * 返回: 更新后的玩家数据
 */
const { WORD_ECONOMY } = require('./config');

module.exports = async function dailyLogin(params, { openId, database }) {
  const playerRes = await database.collection('player')
    .where({ openid: openId })
    .get();

  if (!playerRes.data || playerRes.data.length === 0) {
    throw new Error('玩家数据不存在');
  }

  const player = playerRes.data[0];
  const today = new Date().toISOString().slice(0, 10);

  // 今日已登录
  if (player.last_login_date === today) {
    return player;
  }

  // 计算连续登录天数
  const lastDate = new Date(player.last_login_date);
  const todayDate = new Date(today);
  const diffDays = Math.floor((todayDate - lastDate) / (1000 * 60 * 60 * 24));

  let consecutiveLogin = 1;
  if (diffDays === 1) {
    consecutiveLogin = (player.consecutive_login || 0) + 1;
  }
  // 超过3天未登录，好感度衰减
  let favorDecay = 0;
  if (diffDays > 3) {
    favorDecay = (diffDays - 3) * 5;
  }

  // 计算奖励字数
  let bonusWords = WORD_ECONOMY.DAILY_GIFT;

  // 连续登录额外奖励
  const loginBonus = WORD_ECONOMY.LOGIN_BONUS[consecutiveLogin];
  if (loginBonus) {
    bonusWords += loginBonus;
  }

  const newWordBalance = player.word_balance + bonusWords;

  // 更新玩家数据
  const updateData = {
    last_login_date: today,
    consecutive_login: consecutiveLogin,
    word_balance: newWordBalance,
    daily_ad_count: 0, // 重置每日广告次数
  };

  await database.collection('player')
    .where({ openid: openId })
    .update(updateData);

  // 如果有好感度衰减，更新当前恋人进度
  if (favorDecay > 0 && player.current_lover_id) {
    const progressRes = await database.collection('lover_progress')
      .where({ openid: openId, lover_id: player.current_lover_id, status: 'active' })
      .get();

    if (progressRes.data && progressRes.data.length > 0) {
      const progress = progressRes.data[0];
      const newFavor = Math.max(0, progress.favor - favorDecay);
      await database.collection('lover_progress')
        .where({ openid: openId, lover_id: player.current_lover_id, status: 'active' })
        .update({ favor: newFavor });
    }
  }

  return {
    ...player,
    ...updateData,
    bonusWords,
    consecutiveLogin,
  };
};
