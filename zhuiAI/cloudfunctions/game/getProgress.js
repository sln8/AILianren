/**
 * getProgress - 获取玩家当前进度
 *
 * 返回: { player, progress }
 */
module.exports = async function getProgress(params, { openId, database }) {
  // 获取玩家数据
  const playerRes = await database.collection('player')
    .where({ openid: openId })
    .get();

  if (!playerRes.data || playerRes.data.length === 0) {
    throw new Error('玩家数据不存在');
  }

  const player = playerRes.data[0];
  let progress = null;

  // 获取当前恋爱进度
  if (player.current_lover_id) {
    const progressRes = await database.collection('lover_progress')
      .where({ openid: openId, lover_id: player.current_lover_id, status: 'active' })
      .get();

    if (progressRes.data && progressRes.data.length > 0) {
      progress = progressRes.data[0];
    }
  }

  return { player, progress };
};
