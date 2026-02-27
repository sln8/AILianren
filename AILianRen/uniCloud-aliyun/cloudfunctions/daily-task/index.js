'use strict';
const db = uniCloud.database()
const dbCmd = db.command

const DAILY_LOGIN_BONUS = 200
const STREAK_BONUS_PER_DAY = 50
const MAX_STREAK_BONUS = 200
const SEVEN_DAY_STREAK_BONUS = 1000

exports.main = async (event, context) => {
	const { action, ...params } = event

	switch (action) {
		case 'checkIn':
			return await checkIn(params)
		case 'getStatus':
			return await getStatus(params)
		default:
			return { code: -1, msg: '未知操作: ' + action }
	}
}

/**
 * Daily check-in with streak tracking
 */
async function checkIn(params) {
	const { userId } = params

	if (!userId) {
		return { code: -1, msg: '缺少用户ID' }
	}

	const today = getTodayStr()
	const yesterday = getYesterdayStr()

	try {
		// Get user info
		const userRes = await db.collection('users').doc(userId).get()
		if (!userRes.data || userRes.data.length === 0) {
			return { code: -1, msg: '用户不存在' }
		}

		const user = userRes.data[0]

		// Check if already checked in today
		if (user.last_login_date === today) {
			return { code: -1, msg: '今日已签到', data: { streak: user.login_streak || 1 } }
		}

		// Calculate streak
		let streak = 1
		if (user.last_login_date === yesterday) {
			streak = (user.login_streak || 0) + 1
		}

		// Calculate reward
		const streakBonus = Math.min((streak - 1) * STREAK_BONUS_PER_DAY, MAX_STREAK_BONUS)
		let totalReward = DAILY_LOGIN_BONUS + streakBonus

		// 7-day streak bonus
		let sevenDayBonus = false
		if (streak > 0 && streak % 7 === 0) {
			totalReward += SEVEN_DAY_STREAK_BONUS
			sevenDayBonus = true
		}

		// Update user
		await db.collection('users').doc(userId).update({
			last_login_date: today,
			login_streak: streak,
			word_balance: dbCmd.inc(totalReward),
			total_words_earned: dbCmd.inc(totalReward)
		})

		// Record transaction
		let description = `每日签到奖励（连续${streak}天）`
		if (sevenDayBonus) {
			description += ` + 7天连续签到奖励${SEVEN_DAY_STREAK_BONUS}字`
		}

		await db.collection('word_transactions').add({
			user_id: userId,
			type: 'daily_login',
			amount: totalReward,
			balance_after: 0,
			description: description,
			created_at: Date.now()
		})

		return {
			code: 0,
			data: {
				reward: totalReward,
				baseReward: DAILY_LOGIN_BONUS,
				streakBonus: streakBonus,
				sevenDayBonus: sevenDayBonus ? SEVEN_DAY_STREAK_BONUS : 0,
				streak: streak
			}
		}
	} catch (err) {
		console.error('checkIn error:', err)
		return { code: -1, msg: '签到失败：' + err.message }
	}
}

/**
 * Get daily task status
 */
async function getStatus(params) {
	const { userId } = params

	if (!userId) {
		return { code: -1, msg: '缺少用户ID' }
	}

	const today = getTodayStr()

	try {
		const userRes = await db.collection('users').doc(userId).get()
		if (!userRes.data || userRes.data.length === 0) {
			return { code: -1, msg: '用户不存在' }
		}

		const user = userRes.data[0]
		const checkedInToday = user.last_login_date === today

		// Get today's ad count
		const adCountRes = await db.collection('ad_records').where({
			user_id: userId,
			date: today
		}).count()

		return {
			code: 0,
			data: {
				checkedIn: checkedInToday,
				streak: user.login_streak || 0,
				wordBalance: user.word_balance || 0,
				adsWatchedToday: adCountRes.total || 0,
				adsLimit: 15
			}
		}
	} catch (err) {
		console.error('getStatus error:', err)
		return { code: -1, msg: '查询失败：' + err.message }
	}
}

function getTodayStr() {
	const now = new Date(Date.now() + 8 * 3600 * 1000)
	return now.toISOString().slice(0, 10)
}

function getYesterdayStr() {
	const now = new Date(Date.now() + 8 * 3600 * 1000 - 86400000)
	return now.toISOString().slice(0, 10)
}
