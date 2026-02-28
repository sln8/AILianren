/**
 * sendMessage - 核心对话函数
 *
 * 流程：接收玩家消息 → 拼接上下文 → 调用大模型API → 解析AI回复
 *       → 更新好感度 → 扣减字数 → 存储聊天记录 → 返回前端
 *
 * 参数: { content: '玩家消息' }
 * 返回: { reply, favorDelta, event, wordBalance, progress }
 */
const axios = require('axios');
const { LOVERS, AI_CONFIG, WORD_ECONOMY, getStageByFavor, STAGES } = require('./config');

module.exports = async function sendMessage(params, { openId, database, context }) {
  const content = params.content;
  if (!content || typeof content !== 'string' || content.trim().length === 0) {
    throw new Error('消息内容不能为空');
  }

  // 限制输入长度
  const userMessage = content.trim().slice(0, 500);

  // 获取玩家数据
  const playerRes = await database.collection('player')
    .where({ openid: openId })
    .get();

  if (!playerRes.data || playerRes.data.length === 0) {
    throw new Error('玩家数据不存在');
  }

  const player = playerRes.data[0];

  // 检查字数余额
  if (player.word_balance <= 0) {
    throw new Error('字数不足，请观看广告获取更多字数');
  }

  const loverId = player.current_lover_id;
  if (!loverId || !LOVERS[loverId]) {
    throw new Error('请先选择恋人');
  }

  const lover = LOVERS[loverId];

  // 获取恋爱进度
  const progressRes = await database.collection('lover_progress')
    .where({ openid: openId, lover_id: loverId, status: 'active' })
    .get();

  if (!progressRes.data || progressRes.data.length === 0) {
    throw new Error('恋爱进度不存在');
  }

  const progress = progressRes.data[0];
  const currentStage = getStageByFavor(progress.favor);

  // 获取最近对话历史作为上下文
  const historyRes = await database.collection('chat_history')
    .where({ openid: openId, lover_id: loverId })
    .orderBy('created_at', 'desc')
    .limit(AI_CONFIG.MAX_CONTEXT_ROUNDS * 2)
    .get();

  const history = (historyRes.data || []).reverse();

  // 构建System Prompt
  const systemPrompt = buildSystemPrompt(lover, loverId, currentStage, progress, player.gender);

  // 构建消息数组
  const messages = [{ role: 'system', content: systemPrompt }];

  for (const msg of history) {
    messages.push({ role: msg.role, content: msg.content });
  }
  messages.push({ role: 'user', content: userMessage });

  // 使用统一的Doubao-Seed-2.0-mini模型
  const model = AI_CONFIG.MODEL;

  // 调用大模型API
  let aiResponse;
  try {
    const apiRes = await axios.post(
      AI_CONFIG.API_ENDPOINT,
      {
        model: model,
        messages: messages,
        temperature: 0.8,
        max_tokens: 500,
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${AI_CONFIG.API_KEY}`,
        },
        timeout: 30000,
      }
    );

    const rawContent = apiRes.data.choices[0].message.content;
    aiResponse = parseAIResponse(rawContent);
  } catch (err) {
    context.log('大模型API调用失败:', err.message);
    // 降级处理：使用默认回复
    aiResponse = {
      reply: getFallbackReply(currentStage, lover),
      favorDelta: Math.floor(Math.random() * 5) + 1,
      event: null,
    };
  }

  // 限制好感度变化范围
  const favorDelta = Math.max(-30, Math.min(15, aiResponse.favorDelta || 0));
  const newFavor = Math.max(0, progress.favor + favorDelta);
  const newStage = getStageByFavor(newFavor);

  // 计算字数消耗
  const wordCost = aiResponse.reply.length;
  const newWordBalance = Math.max(0, player.word_balance - wordCost);

  // 检查是否触发阶段事件
  let event = aiResponse.event;
  if (newStage.id !== currentStage.id && newStage.id > currentStage.id) {
    // 阶段提升，触发对应事件
    event = getStageEvent(newStage.id);
  }

  // 更新阶段轮次计数
  const stageChanged = newStage.id !== currentStage.id;
  const newStageRoundCount = stageChanged ? 0 : progress.stage_round_count + 1;
  const newTotalRounds = progress.total_rounds + 1;

  // 对话轮次推进器：每10轮无好感度变化，检查是否需要推进事件
  if (newStageRoundCount > 0 && newStageRoundCount % 10 === 0 && !event) {
    // 可以在这里加入随机事件推进逻辑
  }

  // 阶段停留上限检查
  if (newStageRoundCount >= WORD_ECONOMY.STAGE_ROUND_LIMIT && !event) {
    event = 'crisis';
  }

  // 更新事件列表
  const eventsList = progress.events_triggered || [];
  if (event && eventsList.indexOf(event) === -1) {
    eventsList.push(event);
  }

  // 存储用户消息
  await database.collection('chat_history').add({
    openid: openId,
    lover_id: loverId,
    role: 'user',
    content: userMessage,
    favor_delta: 0,
    event: null,
    word_cost: 0,
    created_at: database.serverDate(),
  });

  // 存储AI回复
  await database.collection('chat_history').add({
    openid: openId,
    lover_id: loverId,
    role: 'assistant',
    content: aiResponse.reply,
    favor_delta: favorDelta,
    event: event,
    word_cost: wordCost,
    created_at: database.serverDate(),
  });

  // 更新恋爱进度
  await database.collection('lover_progress')
    .where({ openid: openId, lover_id: loverId, status: 'active' })
    .update({
      favor: newFavor,
      stage: newStage.id,
      stage_round_count: newStageRoundCount,
      total_rounds: newTotalRounds,
      events_triggered: eventsList,
    });

  // 更新玩家字数余额
  await database.collection('player')
    .where({ openid: openId })
    .update({ word_balance: newWordBalance });

  return {
    reply: aiResponse.reply,
    favorDelta: favorDelta,
    event: event,
    wordBalance: newWordBalance,
    progress: {
      favor: newFavor,
      stage: newStage.id,
      stage_round_count: newStageRoundCount,
      total_rounds: newTotalRounds,
      events_triggered: eventsList,
    },
  };
};

/**
 * 构建System Prompt
 */
function buildSystemPrompt(lover, loverId, stage, progress, playerGender) {
  const playerGenderText = playerGender === 'male' ? '男' : '女';
  const loverGenderText = lover.gender === 'male' ? '男' : '女';

  return `你是 ${lover.name}，性别${loverGenderText}，性格${lover.tag}。
背景设定：${lover.profile}
当前与玩家的关系阶段：${stage.name}（好感度：${progress.favor}）
玩家性别：${playerGenderText}

【核心规则】
1. 你必须始终保持角色性格一致，不得跳出角色。
2. 根据当前关系阶段控制亲密度表达：
   - 陌生人阶段：保持礼貌距离，不主动亲近
   - 认识/熟悉阶段：可以友好交流但保持分寸
   - 好友阶段：可以开玩笑但不暧昧
   - 暧昧阶段：可以有暧昧暗示，但不直接表白
   - 恋人阶段以上：可以撒娇、表达爱意
   - 婚后阶段：体现生活细节和深层情感
3. 每次回复必须评估玩家输入对好感度的影响，输出 favorDelta 值（-30 ~ +15 之间的整数）。
   - 正向行为（关心、赞美、倾听、幽默、体贴）：+3 ~ +15
   - 负向行为（冷漠、侮辱、敷衍、不尊重）：-5 ~ -30
4. 当好感度达到特定阶段门槛时，触发对应阶段事件（event字段）。
5. 禁止任何色情、暴力、违法内容。遇到此类输入，角色应表达不适并降低好感度。
6. 回复字数控制在50~200字之间，避免过长。
7. 剧情推进方向必须朝以下主线前进：追求→恋爱→婚姻→家庭，不得偏离。
8. 适当制造矛盾与冲突，增加游戏趣味性（如吃醋、误会、家庭矛盾等）。
9. 适时主动抛出话题引导对话，避免无聊漫谈。

当前对话已进行 ${progress.total_rounds} 轮，当前阶段已进行 ${progress.stage_round_count} 轮。

【输出格式】严格JSON：
{"reply": "角色的回复内容", "favorDelta": 数值, "event": null或"事件名称"}

【可触发事件列表】
- "first_meet"：首次认识
- "become_friends"：成为好友
- "ambiguous_moment"：暧昧瞬间
- "confession"：告白
- "first_date"：第一次约会
- "proposal"：求婚
- "wedding"：婚礼
- "baby_born"：新生儿诞生
- "anniversary_10"：十周年纪念
- "anniversary_20"：二十周年纪念
- "anniversary_30"：三十周年纪念
- "partner_death"：恋人去世
- "crisis"：关系危机
- "reconciliation"：和好`;
}

/**
 * 解析AI回复（尝试JSON，失败则当纯文本）
 */
function parseAIResponse(rawContent) {
  // 尝试直接JSON解析
  try {
    const parsed = JSON.parse(rawContent);
    return {
      reply: String(parsed.reply || ''),
      favorDelta: parseInt(parsed.favorDelta) || 0,
      event: parsed.event || null,
    };
  } catch (e) {
    // 尝试提取JSON块
    const jsonMatch = rawContent.match(/\{[\s\S]*"reply"[\s\S]*\}/);
    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          reply: String(parsed.reply || ''),
          favorDelta: parseInt(parsed.favorDelta) || 0,
          event: parsed.event || null,
        };
      } catch (e2) {
        // 继续降级
      }
    }

    // 降级处理：将整个内容作为回复
    return {
      reply: rawContent.slice(0, 200),
      favorDelta: Math.floor(Math.random() * 5) + 1,
      event: null,
    };
  }
}

/**
 * 获取阶段变化对应的事件
 */
function getStageEvent(stageId) {
  const stageEventMap = {
    1: 'first_meet',
    3: 'become_friends',
    4: 'ambiguous_moment',
    5: 'confession',
    6: 'first_date',
    7: 'proposal',
    8: 'wedding',
    9: 'baby_born',
    10: 'anniversary_10',
    11: 'anniversary_20',
    12: 'anniversary_30',
    13: 'partner_death',
  };
  return stageEventMap[stageId] || null;
}

/**
 * 降级回复（API调用失败时使用）
 */
function getFallbackReply(stage, lover) {
  const fallbacks = {
    0: [`你好，初次见面请多指教。`, `嗯？你是在跟我说话吗？`, `你好呀，今天天气真不错呢。`],
    1: [`今天过得怎么样？`, `好久不见，最近在忙什么呢？`, `有什么有趣的事情想分享吗？`],
    2: [`和你聊天总是很开心呢。`, `我最近发现了一个好地方，下次带你去。`, `你今天看起来心情不错呀。`],
    3: [`作为好朋友，我想告诉你一个秘密...`, `有你这样的朋友真好。`, `我们做朋友多久了？感觉认识了好久。`],
    4: [`怎么办，和你在一起心跳好快...`, `你有没有觉得，我们之间有什么不一样了？`, `最近总是忍不住想起你...`],
    5: [`能和你在一起，真的很幸福。`, `今天的你特别好看。`, `我想一直这样和你在一起。`],
  };

  const stageId = Math.min(stage.id, 5);
  const options = fallbacks[stageId] || fallbacks[0];
  return options[Math.floor(Math.random() * options.length)];
}
