/**
 * selectLover - 选择恋人
 *
 * 参数: { loverId: 'M1'|'F1'|... }
 * 返回: { player, progress }
 */
const { LOVERS } = require('./config');

module.exports = async function selectLover(params, { openId, database }) {
  const loverId = params.loverId;
  if (!LOVERS[loverId]) {
    throw new Error('恋人ID无效');
  }

  // 获取玩家数据
  const playerRes = await database.collection('player')
    .where({ openid: openId })
    .get();

  if (!playerRes.data || playerRes.data.length === 0) {
    throw new Error('玩家数据不存在，请先初始化');
  }

  const player = playerRes.data[0];

  // 检查是否已有该恋人的进度
  const existingProgress = await database.collection('lover_progress')
    .where({ openid: openId, lover_id: loverId })
    .get();

  let progress;
  if (existingProgress.data && existingProgress.data.length > 0) {
    progress = existingProgress.data[0];
    // 恢复进度
    await database.collection('lover_progress')
      .where({ openid: openId, lover_id: loverId })
      .update({ status: 'active' });
    progress.status = 'active';
  } else {
    // 创建新进度
    progress = {
      openid: openId,
      lover_id: loverId,
      favor: 0,
      stage: 0,
      stage_round_count: 0,
      total_rounds: 0,
      status: 'active',
      events_triggered: [],
      created_at: database.serverDate(),
      ended_at: null,
    };
    await database.collection('lover_progress').add(progress);
  }

  // 更新玩家当前恋人
  await database.collection('player')
    .where({ openid: openId })
    .update({ current_lover_id: loverId });

  player.current_lover_id = loverId;

  return { player, progress };
};
