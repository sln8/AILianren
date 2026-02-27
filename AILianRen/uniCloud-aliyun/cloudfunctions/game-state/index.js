'use strict';
const db = uniCloud.database()
const dbCmd = db.command

exports.main = async (event, context) => {
	const { action, ...params } = event

	switch (action) {
		case 'save':
			return await saveState(params)
		case 'load':
			return await loadState(params)
		case 'archive':
			return await archiveState(params)
		case 'list':
			return await listStates(params)
		default:
			return { code: -1, msg: '未知操作: ' + action }
	}
}

/**
 * Save game state
 */
async function saveState(params) {
	const { userId, characterId, state } = params

	if (!userId || !characterId || !state) {
		return { code: -1, msg: '缺少必要参数' }
	}

	try {
		// Check if existing save for this user + character
		const existing = await db.collection('game_states').where({
			user_id: userId,
			character_id: characterId,
			is_archived: false
		}).limit(1).get()

		const saveData = {
			user_id: userId,
			character_id: characterId,
			stage_index: state.stageIndex || 0,
			favorability: state.favorability || 0,
			trust: state.trust || 0,
			intimacy: state.intimacy || 0,
			boredom: state.boredom || 0,
			freshness: state.freshness || 100,
			mood: state.mood || 'normal',
			days_together: state.daysTogether || 0,
			total_interactions: state.totalInteractions || 0,
			completed_events: state.completedEvents || [],
			milestones: state.milestones || [],
			is_archived: false,
			updated_at: Date.now()
		}

		if (existing.data && existing.data.length > 0) {
			// Update existing save
			await db.collection('game_states').doc(existing.data[0]._id).update(saveData)
			return { code: 0, data: { id: existing.data[0]._id }, msg: '保存成功' }
		} else {
			// Create new save
			saveData.created_at = Date.now()
			const addRes = await db.collection('game_states').add(saveData)
			return { code: 0, data: { id: addRes.id }, msg: '保存成功' }
		}
	} catch (err) {
		console.error('saveState error:', err)
		return { code: -1, msg: '保存失败：' + err.message }
	}
}

/**
 * Load game state for user
 */
async function loadState(params) {
	const { userId, characterId, stateId } = params

	if (!userId) {
		return { code: -1, msg: '缺少用户ID' }
	}

	try {
		let query

		if (stateId) {
			query = db.collection('game_states').doc(stateId)
		} else if (characterId) {
			query = db.collection('game_states').where({
				user_id: userId,
				character_id: characterId,
				is_archived: false
			}).limit(1)
		} else {
			return { code: -1, msg: '需要提供角色ID或存档ID' }
		}

		const res = await query.get()
		const data = res.data

		if (data && data.length > 0) {
			const state = data[0]
			// Verify ownership
			if (state.user_id !== userId) {
				return { code: -1, msg: '无权访问该存档' }
			}
			return { code: 0, data: state }
		}

		return { code: 0, data: null, msg: '无存档数据' }
	} catch (err) {
		console.error('loadState error:', err)
		return { code: -1, msg: '加载失败：' + err.message }
	}
}

/**
 * Archive (end) current game
 */
async function archiveState(params) {
	const { userId, stateId } = params

	if (!userId || !stateId) {
		return { code: -1, msg: '缺少必要参数' }
	}

	try {
		// Verify ownership
		const res = await db.collection('game_states').doc(stateId).get()
		if (!res.data || res.data.length === 0) {
			return { code: -1, msg: '存档不存在' }
		}

		if (res.data[0].user_id !== userId) {
			return { code: -1, msg: '无权操作该存档' }
		}

		await db.collection('game_states').doc(stateId).update({
			is_archived: true,
			archived_at: Date.now(),
			updated_at: Date.now()
		})

		return { code: 0, msg: '存档已归档' }
	} catch (err) {
		console.error('archiveState error:', err)
		return { code: -1, msg: '归档失败：' + err.message }
	}
}

/**
 * List all game saves for user
 */
async function listStates(params) {
	const { userId, includeArchived } = params

	if (!userId) {
		return { code: -1, msg: '缺少用户ID' }
	}

	try {
		const whereCondition = { user_id: userId }
		if (!includeArchived) {
			whereCondition.is_archived = false
		}

		const res = await db.collection('game_states')
			.where(whereCondition)
			.orderBy('updated_at', 'desc')
			.limit(50)
			.get()

		return { code: 0, data: res.data || [] }
	} catch (err) {
		console.error('listStates error:', err)
		return { code: -1, msg: '查询失败：' + err.message }
	}
}
