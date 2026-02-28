/**
 * switchLover - 更换恋人
 *
 * 中途更换恋人需要观看3次激励视频广告（由前端控制）
 *
 * 参数: { newLoverId: 'M1'|'F1'|... }
 * 返回: { player, progress }
 */
const { LOVERS } = require('./config');

module.exports = async function switchLover(params, { openId, database }) {
  const newLoverId = params.newLoverId;
  if (!LOVERS[newLoverId]) {
    throw new Error('恋人ID无效');
  }

  // 获取玩家数据
  const playerRes = await database.collection('player')
    .where({ openid: openId })
    .get();

  if (!playerRes.data || playerRes.data.length === 0) {
    throw new Error('玩家数据不存在');
  }

  const player = playerRes.data[0];
  const oldLoverId = player.current_lover_id;

  // 暂停旧恋人进度（保留数据可回档）
  if (oldLoverId && oldLoverId !== newLoverId) {
    await database.collection('lover_progress')
      .where({ openid: openId, lover_id: oldLoverId, status: 'active' })
      .update({
        status: 'paused',
      });
  }

  // 检查新恋人是否有历史进度
  const existingProgress = await database.collection('lover_progress')
    .where({ openid: openId, lover_id: newLoverId })
    .get();

  let progress;
  if (existingProgress.data && existingProgress.data.length > 0) {
    // 恢复历史进度
    progress = existingProgress.data[0];
    await database.collection('lover_progress')
      .where({ openid: openId, lover_id: newLoverId })
      .update({ status: 'active' });
    progress.status = 'active';
  } else {
    // 创建新进度
    progress = {
      openid: openId,
      lover_id: newLoverId,
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
    .update({ current_lover_id: newLoverId });

  player.current_lover_id = newLoverId;

  return { player, progress };
};
