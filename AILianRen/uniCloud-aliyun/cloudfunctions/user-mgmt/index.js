'use strict';
const db = uniCloud.database()
const dbCmd = db.command

exports.main = async (event, context) => {
	const { action, ...params } = event

	switch (action) {
		case 'login':
			return await login(params, context)
		case 'updateGender':
			return await updateGender(params, context)
		case 'getProfile':
			return await getProfile(params, context)
		case 'updateSettings':
			return await updateSettings(params, context)
		default:
			return { code: -1, msg: '未知操作: ' + action }
	}
}

/**
 * Login - create or get user by openid/platform
 */
async function login(params, context) {
	const { platform } = params
	const { PLATFORM, APPID, DEVICEID } = context.CLIENTINFO || {}
	const uid = context.CLIENTINFO && context.CLIENTINFO.uid

	try {
		// Check if user already exists
		const userRes = await db.collection('users').where({
			platform: platform || PLATFORM || 'unknown',
			device_id: DEVICEID || ''
		}).limit(1).get()

		if (userRes.data && userRes.data.length > 0) {
			// Existing user - update last login
			const user = userRes.data[0]
			await db.collection('users').doc(user._id).update({
				last_login_at: Date.now(),
				login_count: dbCmd.inc(1)
			})
			return { code: 0, data: user }
		}

		// Create new user
		const newUser = {
			platform: platform || PLATFORM || 'unknown',
			device_id: DEVICEID || '',
			gender: '',
			nickname: '恋爱小白',
			word_balance: 2000, // Initial bonus
			total_words_earned: 2000,
			total_words_spent: 0,
			login_streak: 1,
			last_login_date: getTodayStr(),
			login_count: 1,
			settings: {
				sound_enabled: true,
				music_enabled: true,
				notification_enabled: true
			},
			created_at: Date.now(),
			last_login_at: Date.now()
		}

		const addRes = await db.collection('users').add(newUser)
		newUser._id = addRes.id
		return { code: 0, data: newUser, isNew: true }
	} catch (err) {
		console.error('login error:', err)
		return { code: -1, msg: '登录失败：' + err.message }
	}
}

/**
 * Update user gender
 */
async function updateGender(params, context) {
	const { userId, gender } = params
	// Use context uid for auth when available
	const authUid = context.CLIENTINFO && context.CLIENTINFO.uid
	const targetId = authUid || userId

	if (!targetId || !gender) {
		return { code: -1, msg: '缺少必要参数' }
	}

	if (!['male', 'female'].includes(gender)) {
		return { code: -1, msg: '性别参数无效' }
	}

	try {
		await db.collection('users').doc(targetId).update({
			gender: gender
		})
		return { code: 0, msg: '性别更新成功' }
	} catch (err) {
		console.error('updateGender error:', err)
		return { code: -1, msg: '更新失败：' + err.message }
	}
}

/**
 * Get user profile
 */
async function getProfile(params, context) {
	const { userId } = params
	const authUid = context.CLIENTINFO && context.CLIENTINFO.uid
	const targetId = authUid || userId

	if (!targetId) {
		return { code: -1, msg: '缺少用户ID' }
	}

	try {
		const res = await db.collection('users').doc(targetId).get()
		if (res.data && res.data.length > 0) {
			return { code: 0, data: res.data[0] }
		}
		return { code: -1, msg: '用户不存在' }
	} catch (err) {
		console.error('getProfile error:', err)
		return { code: -1, msg: '获取失败：' + err.message }
	}
}

/**
 * Update user settings
 */
async function updateSettings(params, context) {
	const { userId, settings } = params
	const authUid = context.CLIENTINFO && context.CLIENTINFO.uid
	const targetId = authUid || userId

	if (!targetId || !settings) {
		return { code: -1, msg: '缺少必要参数' }
	}

	try {
		const updateData = {}
		if (typeof settings.sound_enabled === 'boolean') {
			updateData['settings.sound_enabled'] = settings.sound_enabled
		}
		if (typeof settings.music_enabled === 'boolean') {
			updateData['settings.music_enabled'] = settings.music_enabled
		}
		if (typeof settings.notification_enabled === 'boolean') {
			updateData['settings.notification_enabled'] = settings.notification_enabled
		}

		if (Object.keys(updateData).length === 0) {
			return { code: -1, msg: '没有有效的设置项' }
		}

		await db.collection('users').doc(targetId).update(updateData)
		return { code: 0, msg: '设置更新成功' }
	} catch (err) {
		console.error('updateSettings error:', err)
		return { code: -1, msg: '更新失败：' + err.message }
	}
}

function getTodayStr() {
	const now = new Date(Date.now() + 8 * 3600 * 1000) // UTC+8
	return now.toISOString().slice(0, 10)
}
