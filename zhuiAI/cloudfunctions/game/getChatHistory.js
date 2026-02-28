/**
 * getChatHistory - 分页获取聊天历史
 *
 * 参数: { page: 1, pageSize: 50 }
 * 返回: { messages, total, page, pageSize }
 */
module.exports = async function getChatHistory(params, { openId, database }) {
  const page = Math.max(1, parseInt(params.page) || 1);
  const pageSize = Math.min(100, Math.max(1, parseInt(params.pageSize) || 50));
  const skip = (page - 1) * pageSize;

  // 获取玩家当前恋人
  const playerRes = await database.collection('player')
    .where({ openid: openId })
    .get();

  if (!playerRes.data || playerRes.data.length === 0) {
    throw new Error('玩家数据不存在');
  }

  const player = playerRes.data[0];
  if (!player.current_lover_id) {
    return { messages: [], total: 0, page, pageSize };
  }

  // 获取聊天记录（最新的在前）
  const historyRes = await database.collection('chat_history')
    .where({ openid: openId, lover_id: player.current_lover_id })
    .orderBy('created_at', 'desc')
    .skip(skip)
    .limit(pageSize)
    .get();

  // 反转为时间正序
  const messages = (historyRes.data || []).reverse().map(msg => ({
    role: msg.role,
    content: msg.content,
    favorDelta: msg.favor_delta,
    event: msg.event,
  }));

  // 获取总数
  const countRes = await database.collection('chat_history')
    .where({ openid: openId, lover_id: player.current_lover_id })
    .count();

  return {
    messages,
    total: countRes.total || 0,
    page,
    pageSize,
  };
};
