<template>
	<view class="words-page">
		<scroll-view scroll-y class="scroll-area">
			<!-- Balance Display -->
			<view class="balance-section">
				<text class="balance-label">✏️ 当前字数</text>
				<text class="balance-value">{{ userState.wordBalance }}</text>
			</view>

			<!-- Get Words Section -->
			<view class="section">
				<text class="section-title">获取字数</text>

				<!-- Watch Ad Card -->
				<view class="card">
					<view class="card-header">
						<text class="card-icon">🎬</text>
						<view class="card-info">
							<text class="card-title">观看广告</text>
							<text class="card-desc">每次 +800 字，每日最多 15 次</text>
						</view>
					</view>
					<view class="card-action">
						<text class="daily-count">今日: {{ dailyAdCount }}/15</text>
						<AdRewardButton :disabled="dailyAdCount >= 15" @watch="watchAd" />
					</view>
				</view>

				<!-- Daily Login Card -->
				<view class="card">
					<view class="card-header">
						<text class="card-icon">📅</text>
						<view class="card-info">
							<text class="card-title">每日登录奖励</text>
							<text class="card-desc">连续登录天数越多，奖励越丰厚</text>
						</view>
					</view>
					<view class="login-info">
						<view class="login-row">
							<text class="login-label">连续登录</text>
							<text class="login-value">{{ userState.consecutiveLoginDays }} 天</text>
						</view>
						<view class="login-row">
							<text class="login-label">今日奖励</text>
							<text class="login-value">{{ dailyBonus }} 字</text>
						</view>
					</view>
				</view>
			</view>

			<!-- Rules Section -->
			<view class="section">
				<text class="section-title">字数说明</text>
				<view class="card">
					<view class="rule-item" v-for="(rule, index) in rules" :key="index">
						<text class="rule-dot">•</text>
						<text class="rule-text">{{ rule }}</text>
					</view>
				</view>
			</view>

			<!-- Achievement Rewards Section -->
			<view class="section">
				<text class="section-title">获取更多字数</text>
				<view class="card">
					<view class="reward-item" v-for="(reward, index) in rewards" :key="index">
						<text class="reward-icon">{{ reward.icon }}</text>
						<text class="reward-desc">{{ reward.desc }}</text>
						<text class="reward-amount">+{{ reward.amount }}</text>
					</view>
				</view>
			</view>

			<!-- Back Button -->
			<view class="btn-wrap">
				<view class="back-btn" @tap="goBack">
					<text class="back-btn-text">← 返回</text>
				</view>
			</view>
		</scroll-view>
	</view>
</template>

<script>
import { userStore } from '@/store/user.js'
import AdRewardButton from '@/components/AdRewardButton.vue'

export default {
	name: 'WordsShopPage',
	components: {
		AdRewardButton
	},
	data() {
		return {
			userState: userStore.state,
			dailyAdCount: 0,
			rules: [
				'发送消息按实际字数扣除',
				'AI回复按生成字数扣除',
				'单条消息上限200字',
				'AI回复上限300字'
			],
			rewards: [
				{ icon: '🎉', desc: '关系升级到新阶段', amount: 300 },
				{ icon: '📌', desc: '完成特殊事件', amount: 200 },
				{ icon: '🔥', desc: '连续登录7天', amount: 1000 },
				{ icon: '💯', desc: '互动次数达到100', amount: 300 },
				{ icon: '⭐', desc: '首次进入恋人阶段', amount: 500 }
			]
		}
	},
	computed: {
		dailyBonus() {
			const streak = Math.min(this.userState.consecutiveLoginDays * 20, 200)
			return 200 + streak
		}
	},
	onLoad() {
		userStore.initUser()
		this.loadDailyAdCount()
	},
	methods: {
		loadDailyAdCount() {
			const today = new Date().toISOString().slice(0, 10)
			const stored = uni.getStorageSync('daily_ad_count') || {}
			this.dailyAdCount = stored.date === today ? (stored.count || 0) : 0
		},
		watchAd() {
			if (this.dailyAdCount >= 15) {
				uni.showToast({ title: '今日次数已用完', icon: 'none' })
				return
			}
			userStore.addWords(800, 'ad_reward')
			userStore.watchedAd()
			this.dailyAdCount += 1
			const today = new Date().toISOString().slice(0, 10)
			uni.setStorageSync('daily_ad_count', { date: today, count: this.dailyAdCount })
			uni.showToast({ title: '+800 字数', icon: 'success' })
		},
		goBack() {
			uni.navigateBack()
		}
	}
}
</script>

<style scoped>
.words-page {
	width: 100vw;
	height: 100vh;
	background: linear-gradient(180deg, #1a1a2e 0%, #16213e 100%);
}

.scroll-area {
	height: 100vh;
}

.balance-section {
	display: flex;
	flex-direction: column;
	align-items: center;
	padding: 50rpx 0 40rpx;
}

.balance-label {
	font-size: 30rpx;
	color: rgba(255, 255, 255, 0.6);
}

.balance-value {
	font-size: 80rpx;
	color: #f6d365;
	font-weight: 700;
	margin-top: 10rpx;
}

.section {
	margin: 10rpx 30rpx 20rpx;
}

.section-title {
	font-size: 30rpx;
	color: #ffffff;
	font-weight: 600;
	margin-bottom: 16rpx;
}

.card {
	background: rgba(255, 255, 255, 0.08);
	border-radius: 20rpx;
	padding: 24rpx;
	margin-bottom: 16rpx;
}

.card-header {
	display: flex;
	flex-direction: row;
	align-items: center;
}

.card-icon {
	font-size: 44rpx;
	margin-right: 16rpx;
}

.card-info {
	flex: 1;
	display: flex;
	flex-direction: column;
}

.card-title {
	font-size: 28rpx;
	color: #ffffff;
	font-weight: 600;
}

.card-desc {
	font-size: 22rpx;
	color: rgba(255, 255, 255, 0.5);
	margin-top: 4rpx;
}

.card-action {
	display: flex;
	flex-direction: row;
	align-items: center;
	justify-content: space-between;
	margin-top: 20rpx;
}

.daily-count {
	font-size: 24rpx;
	color: rgba(255, 255, 255, 0.5);
}

.login-info {
	margin-top: 16rpx;
}

.login-row {
	display: flex;
	flex-direction: row;
	justify-content: space-between;
	padding: 10rpx 0;
}

.login-label {
	font-size: 26rpx;
	color: rgba(255, 255, 255, 0.6);
}

.login-value {
	font-size: 26rpx;
	color: #f6d365;
	font-weight: 600;
}

.rule-item {
	display: flex;
	flex-direction: row;
	align-items: flex-start;
	padding: 8rpx 0;
}

.rule-dot {
	font-size: 26rpx;
	color: rgba(255, 255, 255, 0.4);
	margin-right: 12rpx;
}

.rule-text {
	font-size: 26rpx;
	color: rgba(255, 255, 255, 0.7);
	flex: 1;
}

.reward-item {
	display: flex;
	flex-direction: row;
	align-items: center;
	padding: 12rpx 0;
	border-bottom: 1rpx solid rgba(255, 255, 255, 0.06);
}

.reward-item:last-child {
	border-bottom: none;
}

.reward-icon {
	font-size: 32rpx;
	margin-right: 16rpx;
}

.reward-desc {
	font-size: 26rpx;
	color: rgba(255, 255, 255, 0.7);
	flex: 1;
}

.reward-amount {
	font-size: 28rpx;
	color: #7bed9f;
	font-weight: 600;
}

.btn-wrap {
	padding: 20rpx 30rpx 60rpx;
}

.back-btn {
	display: flex;
	align-items: center;
	justify-content: center;
	height: 88rpx;
	background: rgba(255, 255, 255, 0.1);
	border-radius: 44rpx;
}

.back-btn-text {
	font-size: 30rpx;
	color: #ffffff;
	font-weight: 600;
}
</style>
