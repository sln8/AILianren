'use strict';
const db = uniCloud.database()
const dbCmd = db.command

const AD_REWARD_WORDS = 800
const DAILY_AD_LIMIT = 15

exports.main = async (event, context) => {
	const { action, ...params } = event

	switch (action) {
		case 'claimReward':
			return await claimReward(params)
		case 'getDailyCount':
			return await getDailyCount(params)
		default:
			return { code: -1, msg: '未知操作: ' + action }
	}
}

/**
 * Claim ad reward - verify ad watched, add words to balance
 */
async function claimReward(params) {
	const { userId, adType, platform } = params

	if (!userId) {
		return { code: -1, msg: '缺少用户ID' }
	}

	const today = getTodayStr()

	try {
		// Check daily ad count
		const countRes = await db.collection('ad_records').where({
			user_id: userId,
			date: today
		}).count()

		const dailyCount = countRes.total || 0

		if (dailyCount >= DAILY_AD_LIMIT) {
			return { code: -1, msg: '今日广告观看次数已达上限', data: { dailyCount, limit: DAILY_AD_LIMIT } }
		}

		// Record ad watch
		await db.collection('ad_records').add({
			user_id: userId,
			ad_type: adType || 'rewarded_video',
			platform: platform || 'unknown',
			reward_words: AD_REWARD_WORDS,
			date: today,
			created_at: Date.now()
		})

		// Add words to user balance
		await db.collection('users').doc(userId).update({
			word_balance: dbCmd.inc(AD_REWARD_WORDS),
			total_words_earned: dbCmd.inc(AD_REWARD_WORDS)
		})

		// Read updated balance for accurate transaction record
		const userRes = await db.collection('users').doc(userId).field({ word_balance: true }).get()
		const newBalance = (userRes.data && userRes.data.length > 0) ? userRes.data[0].word_balance : 0

		// Record word transaction
		await db.collection('word_transactions').add({
			user_id: userId,
			type: 'ad_reward',
			amount: AD_REWARD_WORDS,
			balance_after: newBalance,
			description: '观看广告奖励',
			created_at: Date.now()
		})

		return {
			code: 0,
			data: {
				reward: AD_REWARD_WORDS,
				dailyCount: dailyCount + 1,
				dailyLimit: DAILY_AD_LIMIT
			}
		}
	} catch (err) {
		console.error('claimReward error:', err)
		return { code: -1, msg: '领取奖励失败：' + err.message }
	}
}

/**
 * Get today's ad watch count
 */
async function getDailyCount(params) {
	const { userId } = params

	if (!userId) {
		return { code: -1, msg: '缺少用户ID' }
	}

	const today = getTodayStr()

	try {
		const countRes = await db.collection('ad_records').where({
			user_id: userId,
			date: today
		}).count()

		return {
			code: 0,
			data: {
				dailyCount: countRes.total || 0,
				dailyLimit: DAILY_AD_LIMIT,
				rewardPerAd: AD_REWARD_WORDS
			}
		}
	} catch (err) {
		console.error('getDailyCount error:', err)
		return { code: -1, msg: '查询失败：' + err.message }
	}
}

function getTodayStr() {
	const now = new Date(Date.now() + 8 * 3600 * 1000) // UTC+8
	return now.toISOString().slice(0, 10)
}
