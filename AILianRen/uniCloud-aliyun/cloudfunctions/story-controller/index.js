'use strict';
const db = uniCloud.database()
const dbCmd = db.command
const events = require('./events.json')

exports.main = async (event, context) => {
	const { action, ...params } = event

	switch (action) {
		case 'checkEvents':
			return await checkEvents(params)
		case 'completeEvent':
			return await completeEvent(params)
		case 'getEventInfo':
			return await getEventInfo(params)
		default:
			return { code: -1, msg: '未知操作: ' + action }
	}
}

/**
 * Check for triggered events based on game state
 */
async function checkEvents(params) {
	const { userId, gameState } = params

	if (!userId || !gameState) {
		return { code: -1, msg: '缺少必要参数' }
	}

	const completedEvents = gameState.completedEvents || []
	const triggeredEvents = []

	for (const evt of events) {
		// Skip already completed events
		if (completedEvents.includes(evt.id)) {
			continue
		}

		if (checkTriggerConditions(evt.triggerConditions, gameState, completedEvents)) {
			triggeredEvents.push({
				id: evt.id,
				name: evt.name,
				description: evt.description,
				choices: evt.choices,
				reward: evt.reward
			})
		}
	}

	// Return at most one event at a time (highest priority)
	const nextEvent = triggeredEvents.length > 0 ? triggeredEvents[0] : null

	return { code: 0, data: { event: nextEvent } }
}

/**
 * Check if trigger conditions are met
 */
function checkTriggerConditions(conditions, gameState, completedEvents) {
	if (!conditions) return false

	if (conditions.minStageIndex !== undefined) {
		if ((gameState.stageIndex || 0) < conditions.minStageIndex) {
			return false
		}
	}

	if (conditions.minFavorability !== undefined) {
		if ((gameState.favorability || 0) < conditions.minFavorability) {
			return false
		}
	}

	if (conditions.requireEvent) {
		if (!completedEvents.includes(conditions.requireEvent)) {
			return false
		}
	}

	if (conditions.randomChance !== undefined) {
		if (Math.random() > conditions.randomChance) {
			return false
		}
	}

	return true
}

/**
 * Mark event as completed and award rewards
 */
async function completeEvent(params) {
	const { userId, eventId, choiceIndex, stateId } = params

	if (!userId || !eventId) {
		return { code: -1, msg: '缺少必要参数' }
	}

	const evt = events.find(e => e.id === eventId)
	if (!evt) {
		return { code: -1, msg: '事件不存在' }
	}

	try {
		// Get choice effects
		let choiceEffect = {}
		if (evt.choices && choiceIndex !== undefined && evt.choices[choiceIndex]) {
			choiceEffect = evt.choices[choiceIndex].effect || {}
		}

		// Update game state - add to completed events
		if (stateId) {
			await db.collection('game_states').doc(stateId).update({
				completed_events: dbCmd.push(eventId),
				updated_at: Date.now()
			})
		}

		// Award word reward
		if (evt.reward > 0) {
			await db.collection('users').doc(userId).update({
				word_balance: dbCmd.inc(evt.reward),
				total_words_earned: dbCmd.inc(evt.reward)
			})

			// Record transaction
			await db.collection('word_transactions').add({
				user_id: userId,
				type: 'event_reward',
				amount: evt.reward,
				balance_after: 0,
				description: `完成事件「${evt.name}」奖励`,
				created_at: Date.now()
			})
		}

		return {
			code: 0,
			data: {
				eventId: eventId,
				reward: evt.reward,
				choiceEffect: choiceEffect
			}
		}
	} catch (err) {
		console.error('completeEvent error:', err)
		return { code: -1, msg: '完成事件失败：' + err.message }
	}
}

/**
 * Get event details by ID
 */
async function getEventInfo(params) {
	const { eventId } = params

	if (!eventId) {
		return { code: -1, msg: '缺少事件ID' }
	}

	const evt = events.find(e => e.id === eventId)
	if (!evt) {
		return { code: -1, msg: '事件不存在' }
	}

	return {
		code: 0,
		data: {
			id: evt.id,
			name: evt.name,
			description: evt.description,
			choices: evt.choices,
			reward: evt.reward
		}
	}
}
