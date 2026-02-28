/**
 * watchAd - 观看广告奖励字数
 *
 * 返回: { wordBalance, dailyAdCount }
 */
const { WORD_ECONOMY } = require('./config');

module.exports = async function watchAd(params, { openId, database }) {
  const playerRes = await database.collection('player')
    .where({ openid: openId })
    .get();

  if (!playerRes.data || playerRes.data.length === 0) {
    throw new Error('玩家数据不存在');
  }

  const player = playerRes.data[0];

  // 检查今日广告次数限制
  const today = new Date().toISOString().slice(0, 10);
  let dailyCount = player.daily_ad_count || 0;

  // 如果不是今天的计数，重置
  if (player.last_login_date !== today) {
    dailyCount = 0;
  }

  if (dailyCount >= WORD_ECONOMY.DAILY_AD_LIMIT) {
    throw new Error(`今日广告观看次数已达上限（${WORD_ECONOMY.DAILY_AD_LIMIT}次）`);
  }

  // 增加字数和广告次数
  const newWordBalance = player.word_balance + WORD_ECONOMY.AD_REWARD;
  const newDailyAdCount = dailyCount + 1;

  await database.collection('player')
    .where({ openid: openId })
    .update({
      word_balance: newWordBalance,
      daily_ad_count: newDailyAdCount,
    });

  return {
    wordBalance: newWordBalance,
    dailyAdCount: newDailyAdCount,
  };
};
