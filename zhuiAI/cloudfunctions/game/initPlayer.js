/**
 * initPlayer - 新玩家初始化
 *
 * 参数: { gender: 'male'|'female' }
 * 返回: 玩家数据对象
 */
const { WORD_ECONOMY } = require('./config');

module.exports = async function initPlayer(params, { openId, database }) {
  const gender = params.gender;
  if (gender !== 'male' && gender !== 'female') {
    throw new Error('性别参数无效');
  }

  // 检查是否已存在
  const existing = await database.collection('player')
    .where({ openid: openId })
    .get();

  if (existing.data && existing.data.length > 0) {
    // 已存在，返回现有数据
    return existing.data[0];
  }

  // 创建新玩家
  const now = new Date();
  const playerData = {
    openid: openId,
    gender: gender,
    word_balance: WORD_ECONOMY.INITIAL_GIFT,
    daily_ad_count: 0,
    last_login_date: now.toISOString().slice(0, 10),
    consecutive_login: 1,
    created_at: database.serverDate(),
    current_lover_id: null,
  };

  await database.collection('player').add(playerData);

  return playerData;
};
