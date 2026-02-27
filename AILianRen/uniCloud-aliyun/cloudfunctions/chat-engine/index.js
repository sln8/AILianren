'use strict';
const db = uniCloud.database()
const dbCmd = db.command

// AI API configuration - set these via uniCloud cloud function environment variables:
//   AI_API_URL: Your AI service endpoint (e.g. OpenAI-compatible API)
//   AI_API_KEY: Your API key/token
// When not configured, the function falls back to local simulation mode.
const AI_API_URL = process.env.AI_API_URL || ''
const AI_API_KEY = process.env.AI_API_KEY || ''

// Relationship stages definition
const STAGES = [
	{ name: '陌生人', minFavor: 0 },
	{ name: '相识', minFavor: 10 },
	{ name: '熟悉', minFavor: 25 },
	{ name: '朋友', minFavor: 40 },
	{ name: '暧昧', minFavor: 55 },
	{ name: '表白', minFavor: 70 },
	{ name: '恋人', minFavor: 80 },
	{ name: '求婚', minFavor: 90 },
	{ name: '新婚', minFavor: 92 },
	{ name: '育儿', minFavor: 85 },
	{ name: '十年婚姻', minFavor: 80 },
	{ name: '二十年婚姻', minFavor: 80 },
	{ name: '三十年婚姻', minFavor: 80 },
	{ name: '白头偕老', minFavor: 80 }
]

/**
 * Build system prompt for AI based on character personality and game state
 */
function buildSystemPrompt(character, gameState) {
	const stage = STAGES[gameState.stageIndex] || STAGES[0]
	const moodDesc = describeMood(gameState.mood || 'normal')

	return `你是一个AI恋爱游戏中的角色，请严格按照以下设定进行角色扮演。

## 角色信息
- 姓名：${character.name}
- 性格：${character.personality}
- 说话风格：${character.speakingStyle || '自然真实'}
- 兴趣爱好：${(character.hobbies || []).join('、')}
- 背景故事：${character.background || ''}

## 当前状态
- 关系阶段：${stage.name}
- 好感度：${gameState.favorability}/100
- 信任度：${gameState.trust}/100
- 亲密度：${gameState.intimacy}/100
- 无聊度：${gameState.boredom}/100
- 新鲜感：${gameState.freshness}/100
- 当前心情：${moodDesc}
- 在一起天数：${gameState.daysTogether || 0}天

## 回复规则
1. 完全以"${character.name}"的身份回复，保持角色一致性
2. 根据当前关系阶段调整亲密程度和用语
3. 回复长度控制在300字以内
4. 如果对方说了不恰当的话，要根据性格做出合理反应
5. 关系阶段低时保持距离感，阶段高时可以更亲密
6. 根据心情状态调整语气和态度

## 数值变化规则
- 关心体贴的话：好感+2~5，信任+1~3
- 幽默有趣：好感+1~3，新鲜感+2~5
- 浪漫表达：好感+3~5，亲密+2~4（仅限暧昧及以上阶段）
- 冷淡回应：好感-2~5，信任-1~3
- 粗鲁无礼：好感-5~10，信任-3~5
- 骚扰行为：好感-10~15，亲密-5~10
- 重复无趣：无聊+3~5，新鲜感-2~5

## 输出格式（严格JSON）
{
  "reply": "角色的回复内容",
  "mood": "happy|shy|angry|sad|normal|excited|nervous",
  "valueChanges": {
    "favorability": 0,
    "trust": 0,
    "intimacy": 0,
    "boredom": 0,
    "freshness": 0
  },
  "eventTriggered": null
}

请只输出JSON，不要有其他内容。`
}

function describeMood(mood) {
	const moods = {
		happy: '开心愉悦',
		shy: '害羞腼腆',
		angry: '生气不满',
		sad: '难过伤心',
		normal: '平静正常',
		excited: '兴奋激动',
		nervous: '紧张不安'
	}
	return moods[mood] || '平静正常'
}

/**
 * Call AI API for response generation
 */
async function callAIAPI(systemPrompt, recentMessages, userMessage) {
	const messages = [
		{ role: 'system', content: systemPrompt }
	]

	// Add recent conversation history for context
	if (recentMessages && recentMessages.length > 0) {
		for (const msg of recentMessages.slice(-10)) {
			messages.push({
				role: msg.role === 'user' ? 'user' : 'assistant',
				content: msg.content
			})
		}
	}

	messages.push({ role: 'user', content: userMessage })

	const res = await uniCloud.httpclient.request(AI_API_URL, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			'Authorization': `Bearer ${AI_API_KEY}`
		},
		data: {
			model: 'gpt-3.5-turbo',
			messages: messages,
			temperature: 0.8,
			max_tokens: 500
		},
		contentType: 'json',
		dataType: 'json',
		timeout: 30000
	})

	if (res.status !== 200) {
		throw new Error('AI API request failed')
	}

	const content = res.data.choices[0].message.content
	try {
		return JSON.parse(content)
	} catch (e) {
		return {
			reply: content,
			mood: 'normal',
			favorability_change: 1,
			trust_change: 0,
			intimacy_change: 0,
			boredom_change: 0,
			freshness_change: 0,
			event_triggered: null,
			stage_hint: 'no'
		}
	}
}

/**
 * Fallback simulation mode - generates responses locally when API is not configured
 */
function simulateResponse(character, gameState, userMessage) {
	const stage = STAGES[gameState.stageIndex] || STAGES[0]
	const msgLen = userMessage.length
	const isQuestion = userMessage.includes('?') || userMessage.includes('？')
	const hasEmoji = /[\u{1F300}-\u{1F9FF}]/u.test(userMessage)

	// Detect message sentiment
	const positiveWords = ['喜欢', '爱', '想你', '开心', '漂亮', '好看', '厉害', '关心', '在乎', '幸福', '快乐', '温柔', '可爱']
	const negativeWords = ['讨厌', '烦', '丑', '笨', '走开', '滚', '无聊', '不想', '算了', '再见']
	const romanticWords = ['爱你', '想你', '亲爱的', '宝贝', '在一起', '牵手', '拥抱', '亲亲', '心动']

	let sentiment = 'neutral'
	if (positiveWords.some(w => userMessage.includes(w))) sentiment = 'positive'
	if (negativeWords.some(w => userMessage.includes(w))) sentiment = 'negative'
	if (romanticWords.some(w => userMessage.includes(w))) sentiment = 'romantic'

	// Calculate value changes based on sentiment and stage
	const valueChanges = { favorability: 0, trust: 0, intimacy: 0, boredom: 0, freshness: 0 }
	let mood = 'normal'
	let reply = ''

	const stageIndex = gameState.stageIndex || 0

	if (sentiment === 'positive') {
		valueChanges.favorability = randomInt(2, 5)
		valueChanges.trust = randomInt(1, 3)
		valueChanges.boredom = -randomInt(1, 3)
		mood = 'happy'
	} else if (sentiment === 'negative') {
		valueChanges.favorability = -randomInt(2, 5)
		valueChanges.trust = -randomInt(1, 3)
		valueChanges.boredom = randomInt(1, 3)
		mood = stageIndex >= 4 ? 'sad' : 'angry'
	} else if (sentiment === 'romantic') {
		if (stageIndex >= 4) {
			valueChanges.favorability = randomInt(3, 5)
			valueChanges.intimacy = randomInt(2, 4)
			valueChanges.freshness = randomInt(1, 3)
			mood = 'shy'
		} else {
			valueChanges.favorability = -randomInt(1, 3)
			valueChanges.boredom = randomInt(1, 2)
			mood = 'nervous'
		}
	} else {
		valueChanges.favorability = randomInt(0, 2)
		valueChanges.freshness = -randomInt(0, 2)
		mood = 'normal'
	}

	if (hasEmoji) {
		valueChanges.freshness += 1
	}

	// Generate reply based on character, stage, and sentiment
	const charName = character.name || '对方'
	const replies = generateReplies(character, stageIndex, sentiment, isQuestion, userMessage)
	reply = replies[Math.floor(Math.random() * replies.length)]

	return {
		reply,
		mood,
		valueChanges,
		eventTriggered: null
	}
}

function generateReplies(character, stageIndex, sentiment, isQuestion, userMessage) {
	const personality = (character.personality || '').toLowerCase()
	const isGentle = personality.includes('温柔') || personality.includes('gentle')
	const isCold = personality.includes('高冷') || personality.includes('冷')
	const isCheerful = personality.includes('开朗') || personality.includes('活泼') || personality.includes('元气')
	const isShy = personality.includes('内向') || personality.includes('害羞')

	if (stageIndex <= 1) {
		// Stranger / acquaintance stage
		if (sentiment === 'positive') {
			if (isGentle) return ['谢谢你这么说，你也很好呢~', '嗯...你人真好，谢谢。', '你说的话让人心情变好了呢。']
			if (isCold) return ['嗯。', '...谢谢。', '还行吧。']
			if (isCheerful) return ['哇，你好会说话哦！😄', '嘻嘻谢谢你~', '你也超棒的！']
			return ['谢谢你，你也不错。', '嗯，谢谢你这么说。', '你真好。']
		}
		if (sentiment === 'negative') {
			if (isGentle) return ['嗯？你怎么了，是不是心情不好？', '没关系的，希望你开心起来。']
			if (isCold) return ['...我们好像不太熟吧。', '你说什么？', '无所谓。']
			if (isCheerful) return ['哎？你怎么这样说话呀！', '哼，不理你了！']
			return ['你怎么了？为什么这样说。', '嗯...这样说不太好吧。']
		}
		if (sentiment === 'romantic') {
			if (isCold) return ['...我们才刚认识。', '你是不是搞错了什么。']
			return ['我们好像还不太熟呢...', '你是不是太快了？', '额...我们先做朋友吧。']
		}
		if (isQuestion) {
			return ['嗯，让我想想...', '这个问题嘛...', '你怎么突然问这个？']
		}
		return ['嗯嗯。', '是这样啊。', '哦，原来如此。', '嗯，我知道了。']
	}

	if (stageIndex >= 2 && stageIndex <= 3) {
		// Friend stage
		if (sentiment === 'positive') {
			if (isGentle) return ['和你聊天总是很开心呢~', '你总是这么暖心，谢谢你。', '嗯，你让我今天很开心。']
			if (isCold) return ['...你今天话挺多的。不过，嗯，还不错。', '难得你说了句好听的。']
			if (isCheerful) return ['哈哈你也太会说话了吧！我超开心的！', '你是不是偷偷练过说话呀~']
			return ['谢谢，和你在一起很舒服。', '你这个人啊，总是让人觉得温暖。']
		}
		if (sentiment === 'romantic') {
			if (isGentle) return ['你...突然这样说，我有点不知道怎么回答...', '你说的话让我心跳加速了...']
			if (isCold) return ['...你在说什么呢。', '别开这种玩笑。']
			return ['你是认真的吗...？', '你这样说，我会误会的。']
		}
		return ['嗯，我觉得也是呢。', '是呀，今天天气真不错。', '对了，你最近怎么样？']
	}

	if (stageIndex >= 4 && stageIndex <= 5) {
		// Ambiguous / confession stage
		if (sentiment === 'positive') {
			if (isGentle) return ['你说的每句话我都会记住的...', '有你在身边真好~', '谢谢你一直对我这么好。']
			if (isCold) return ['...嗯，只有你能让我这样。', '别看我了...我会不好意思的。']
			return ['你对我真的很特别...', '和你在一起的每一刻都很珍贵。']
		}
		if (sentiment === 'romantic') {
			if (isGentle) return ['我...也是同样的心情呢...💕', '你说这种话...我好开心...', '其实我也一直想对你说...']
			if (isCold) return ['...笨蛋，我不会说那种话。但是...嗯。', '你...不要突然这样说啊...']
			if (isCheerful) return ['哎呀！你说的我脸都红了啦！💕', '我...我也喜欢你啦！哼！']
			return ['你的心意...我感受到了。', '我也有同样的感觉...']
		}
		return ['今天想做什么呢？', '有你的日子每天都很期待呢。', '我刚才还在想你呢。']
	}

	// Lover and beyond (stageIndex >= 6)
	if (sentiment === 'positive') {
		if (isGentle) return ['我最喜欢你了~', '有你在身边就是最大的幸福。', '亲爱的，你今天也很棒哦。']
		if (isCold) return ['...你已经知道我的心意了吧。', '嗯...我也是。别让我说出来。']
		return ['每天和你在一起都好幸福~', '我们要一直这样走下去哦。']
	}
	if (sentiment === 'romantic') {
		if (isGentle) return ['我永远爱你...💕', '你是我这辈子最好的选择。', '抱紧你，不想放手。']
		if (isCold) return ['...笨蛋。我也爱你。', '不要在外面说这种话...回家再说。']
		return ['我也一样爱你！', '你的每句情话我都想保存下来~']
	}
	if (sentiment === 'negative') {
		if (isGentle) return ['你怎么了...是不是我做错了什么？', '别生气好不好...我们好好说。']
		if (isCold) return ['...你想清楚再来找我。', '哼。']
		return ['你这样说让我很伤心...', '我们冷静一下好吗？']
	}
	return ['想你了~你在干嘛？', '今天想去哪里玩呀？', '亲爱的，晚上想吃什么？']
}

function randomInt(min, max) {
	return Math.floor(Math.random() * (max - min + 1)) + min
}

/**
 * Save chat message to history
 */
async function saveChatHistory(userId, characterId, role, content, gameStateId) {
	try {
		await db.collection('chat_histories').add({
			user_id: userId,
			character_id: characterId,
			game_state_id: gameStateId || '',
			role: role,
			content: content,
			created_at: Date.now()
		})
	} catch (e) {
		console.error('Failed to save chat history:', e)
	}
}

exports.main = async (event, context) => {
	const { characterId, userMessage, gameState, recentMessages } = event

	if (!characterId || !userMessage) {
		return { code: -1, msg: '缺少必要参数' }
	}

	if (userMessage.length > 200) {
		return { code: -1, msg: '消息长度超过限制（200字）' }
	}

	try {
		// Load character info from database
		let character = null
		try {
			const charRes = await db.collection('characters').doc(characterId).get()
			if (charRes.data && charRes.data.length > 0) {
				character = charRes.data[0]
			}
		} catch (e) {
			// Character not found in DB, use gameState character info as fallback
		}

		if (!character && gameState && gameState.character) {
			character = gameState.character
		}

		if (!character) {
			return { code: -1, msg: '角色不存在' }
		}

		const currentGameState = gameState || {
			stageIndex: 0,
			favorability: 0,
			trust: 0,
			intimacy: 0,
			boredom: 0,
			freshness: 100,
			mood: 'normal',
			daysTogether: 0
		}

		let result

		// Try AI API first, fallback to simulation
		if (AI_API_KEY) {
			try {
				const systemPrompt = buildSystemPrompt(character, currentGameState)
				result = await callAIAPI(systemPrompt, recentMessages, userMessage)
			} catch (apiError) {
				console.warn('AI API call failed, using simulation:', apiError.message)
				result = simulateResponse(character, currentGameState, userMessage)
			}
		} else {
			// No API key configured - use simulation mode
			result = simulateResponse(character, currentGameState, userMessage)
		}

		// Ensure valid response structure
		const response = {
			reply: result.reply || '...',
			mood: result.mood || 'normal',
			valueChanges: {
				favorability: (result.valueChanges && result.valueChanges.favorability) || 0,
				trust: (result.valueChanges && result.valueChanges.trust) || 0,
				intimacy: (result.valueChanges && result.valueChanges.intimacy) || 0,
				boredom: (result.valueChanges && result.valueChanges.boredom) || 0,
				freshness: (result.valueChanges && result.valueChanges.freshness) || 0
			},
			eventTriggered: result.eventTriggered || null
		}

		// Save chat messages to history
		const userId = context.CLIENTINFO && context.CLIENTINFO.uid
		if (userId) {
			await saveChatHistory(userId, characterId, 'user', userMessage, gameState && gameState._id)
			await saveChatHistory(userId, characterId, 'assistant', response.reply, gameState && gameState._id)
		}

		return { code: 0, data: response }
	} catch (err) {
		console.error('chat-engine error:', err)
		return { code: -1, msg: '对话引擎异常：' + err.message }
	}
}
