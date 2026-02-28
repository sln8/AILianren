'use strict';

const db = uniCloud.database();
const dbCmd = db.command;

exports.main = async (event, context) => {
  const { user_id, lover_id, user_message } = event;

  try {
    // 1. Get user info, check word balance
    const userDoc = await db.collection('users').doc(user_id).get();
    const user = userDoc.data[0];

    if (!user || user.word_balance <= 0) {
      return {
        code: 402,
        message: '字数不足，请观看广告获取更多字数',
        data: { word_balance: 0 }
      };
    }

    // 2. Get game progress
    const progressDoc = await db.collection('game_progress')
      .where({ user_id, lover_id, game_ended: false })
      .get();
    const progress = progressDoc.data[0];

    if (!progress) {
      return { code: 404, message: '游戏进度不存在' };
    }

    // 3. Get lover config
    const loverDoc = await db.collection('lovers').doc(lover_id).get();
    const lover = loverDoc.data[0];

    if (!lover) {
      return { code: 404, message: '恋人角色不存在' };
    }

    // 4. Get recent chat history (last 20 rounds for context)
    const chatDoc = await db.collection('chats')
      .where({ user_id, lover_id })
      .orderBy('date', 'desc')
      .limit(1)
      .get();

    const recentMessages = chatDoc.data[0]?.messages?.slice(-40) || [];

    // 5. Build System Prompt
    const systemPrompt = buildSystemPrompt(lover, progress, user);

    // 6. Build message list
    const messages = [
      { role: 'system', content: systemPrompt },
      ...recentMessages.map(m => ({ role: m.role, content: m.content })),
      { role: 'user', content: user_message }
    ];

    // 7. Call LLM
    const llmResponse = await callLLM(messages);

    // 8. Parse response
    const parsed = parseLLMResponse(llmResponse);

    // 9. Calculate word consumption
    const wordCount = countChineseChars(parsed.reply);

    // 10. Update word balance
    const newBalance = Math.max(0, user.word_balance - wordCount);
    await db.collection('users').doc(user_id).update({
      word_balance: newBalance,
      total_words_used: dbCmd.inc(wordCount)
    });

    // 11. Update favorability and game progress
    const newFavorability = Math.max(0, progress.favorability + parsed.favorability_change);
    const newStage = calculateStage(newFavorability, progress.total_chat_rounds + 1);

    await db.collection('game_progress').doc(progress._id).update({
      favorability: newFavorability,
      relationship_stage: newStage,
      total_chat_rounds: dbCmd.inc(1),
      last_mood: parsed.mood,
      updated_at: new Date().toISOString()
    });

    // 12. Save chat record
    await saveChat(user_id, lover_id, progress._id, user_message, parsed, wordCount);

    return {
      code: 200,
      data: {
        reply: parsed.reply,
        favorability: newFavorability,
        favorability_change: parsed.favorability_change,
        relationship_stage: newStage,
        word_balance: newBalance,
        words_consumed: wordCount,
        event_triggered: parsed.event_triggered,
        suggested_actions: parsed.suggested_actions,
        mood: parsed.mood
      }
    };
  } catch (err) {
    console.error('chat-handler error:', err);
    return { code: 500, message: '服务器错误，请稍后重试' };
  }
};

async function callLLM(messages) {
  // Call DeepSeek API or other LLM
  // Replace YOUR_API_KEY with actual API key
  const res = await uniCloud.httpclient.request('https://api.deepseek.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer YOUR_API_KEY'
    },
    data: {
      model: 'deepseek-chat',
      messages: messages,
      temperature: 0.85,
      max_tokens: 300,
      response_format: { type: 'json_object' }
    },
    contentType: 'json',
    dataType: 'json'
  });
  return res.data.choices[0].message.content;
}

function parseLLMResponse(responseText) {
  try {
    const parsed = JSON.parse(responseText);
    return {
      reply: parsed.reply || '...',
      favorability_change: Math.min(20, Math.max(-30, parsed.favorability_change || 0)),
      favorability_reason: parsed.favorability_reason || '',
      mood: parsed.mood || 'neutral',
      event_triggered: parsed.event_triggered || null,
      suggested_actions: parsed.suggested_actions || []
    };
  } catch (e) {
    // If JSON parse fails, treat entire response as reply text
    return {
      reply: responseText || '...',
      favorability_change: 3,
      favorability_reason: '日常对话',
      mood: 'neutral',
      event_triggered: null,
      suggested_actions: []
    };
  }
}

function buildSystemPrompt(lover, progress, user) {
  return `你现在扮演一个名叫"${lover.name}"的${lover.age}岁${lover.gender === 'female' ? '女性' : '男性'}角色。

【角色设定】
- 姓名：${lover.name}
- 年龄：${lover.age}岁
- 职业：${lover.occupation}
- 性格：${(lover.personality_tags || []).join('、')}
- 说话风格：${lover.speaking_style}
- 喜欢：${(lover.likes || []).join('、')}
- 讨厌：${(lover.dislikes || []).join('、')}

【当前状态】
- 与玩家的关系：${getStageLabel(progress.relationship_stage)}（好感度：${progress.favorability}）
- 累计对话轮数：${progress.total_chat_rounds}轮
- 之前的对话摘要：${progress.chat_summary || '暂无'}

【行为约束】
${getStageConstraints(progress.relationship_stage)}

【输出格式】
请严格按照以下JSON格式回复：
{
  "reply": "你的角色扮演回复内容",
  "favorability_change": 数值(-30到+20),
  "favorability_reason": "好感度变化原因",
  "mood": "当前心情",
  "event_triggered": "触发的事件ID或null",
  "suggested_actions": ["建议选项1", "建议选项2", "建议选项3"]
}

【剧情推动规则】
- 回复控制在50-150字以内
- 每3-5轮主动制造话题或小事件
- 偶尔给玩家2-3个建议选项
- 符合当前关系阶段的情感距离

【安全红线】
- 禁止色情、暴力、政治敏感内容
- 保持角色一致性，不暴露AI身份
- 不引导任何现实付费行为`;
}

function getStageLabel(stage) {
  const labels = {
    stranger: '陌生人', acquaintance: '认识', familiar: '熟悉',
    friend: '好友', ambiguous: '暧昧', confessed: '表白',
    lover: '恋人', passionate: '热恋', married: '已婚',
    parent: '为人父母', growing_old: '白头偕老', finale: '终章'
  };
  return labels[stage] || '陌生人';
}

function getStageConstraints(stage) {
  const constraints = {
    stranger: '保持礼貌但有距离感，像初次见面的人一样交流。',
    acquaintance: '可以进行日常闲聊，偶尔表现出兴趣，但保持适当距离。',
    familiar: '可以分享日常、讨论兴趣爱好、偶尔开玩笑，但不主动暧昧。',
    friend: '可以分享秘密和心事，有亲密互动，偶尔有些暧昧的苗头。',
    ambiguous: '可以有暧昧对话，会吃醋、害羞，但还没有正式表白。',
    confessed: '已表白成功，开始正式恋爱。',
    lover: '正式情侣关系，甜蜜互动。',
    passionate: '热恋中，可以讨论未来。',
    married: '夫妻关系，生活化的甜蜜。',
    parent: '有了孩子，家庭生活。',
    growing_old: '携手多年，珍惜当下。',
    finale: '人生终章，珍惜最后的时光。'
  };
  return constraints[stage] || constraints.stranger;
}

function calculateStage(favorability, totalRounds) {
  if (favorability >= 10000) return 'finale';
  if (favorability >= 7500) return 'growing_old';
  if (favorability >= 6000) return 'parent';
  if (favorability >= 4500) return 'married';
  if (favorability >= 3000) return 'passionate';
  if (favorability >= 2000) return 'lover';
  if (favorability >= 1500) return 'confessed';
  if (favorability >= 1000) return 'ambiguous';
  if (favorability >= 600) return 'friend';
  if (favorability >= 300 && totalRounds >= 20) return 'familiar';
  if (favorability >= 100) return 'acquaintance';
  return 'stranger';
}

function countChineseChars(text) {
  if (!text) return 0;
  return text.length;
}

async function saveChat(userId, loverId, progressId, userMessage, parsed, wordCount) {
  const today = new Date().toISOString().split('T')[0];

  const existing = await db.collection('chats')
    .where({ user_id: userId, lover_id: loverId, date: today })
    .get();

  const userMsg = {
    role: 'user',
    content: userMessage,
    timestamp: new Date().toISOString()
  };

  const aiMsg = {
    role: 'assistant',
    content: parsed.reply,
    timestamp: new Date().toISOString(),
    word_count: wordCount,
    favorability_change: parsed.favorability_change,
    event_triggered: parsed.event_triggered
  };

  if (existing.data.length > 0) {
    await db.collection('chats').doc(existing.data[0]._id).update({
      messages: dbCmd.push([userMsg, aiMsg]),
      round_count: dbCmd.inc(1),
      total_words_consumed: dbCmd.inc(wordCount)
    });
  } else {
    await db.collection('chats').add({
      user_id: userId,
      lover_id: loverId,
      progress_id: progressId,
      messages: [userMsg, aiMsg],
      date: today,
      round_count: 1,
      total_words_consumed: wordCount
    });
  }
}
