<template>
	<view class="relationship-page">
		<scroll-view scroll-y class="scroll-area">
			<!-- Character Info -->
			<view class="char-section">
				<image v-if="character" :src="character.image" class="char-avatar" mode="aspectFill" />
				<view v-else class="char-avatar avatar-placeholder">
					<text class="avatar-placeholder-text">?</text>
				</view>
				<text class="char-name">{{ character ? character.name : '未知' }}</text>
				<view class="personality-tag">
					<text class="tag-text">{{ character ? character.personalityTag : '' }}</text>
				</view>
			</view>

			<!-- Current Stage -->
			<view class="stage-section">
				<text class="stage-emoji">{{ stageEmoji }}</text>
				<text class="stage-name">{{ gameState.relationshipStage }}</text>
				<view class="progress-bar-wrap">
					<view class="progress-bar-bg">
						<view class="progress-bar-fill" :style="{ width: progressPercent + '%' }"></view>
					</view>
					<text class="progress-text">{{ progressPercent }}%</text>
				</view>
				<text class="stage-goal">🎯 {{ stageInfo.goal }}</text>
			</view>

			<!-- Stats Grid -->
			<view class="stats-section">
				<text class="section-title">关系数据</text>
				<view class="stat-card" v-for="stat in stats" :key="stat.label">
					<view class="stat-header">
						<text class="stat-icon">{{ stat.icon }}</text>
						<text class="stat-label">{{ stat.label }}</text>
						<text class="stat-value">{{ stat.value }}/100</text>
					</view>
					<view class="stat-bar-bg">
						<view class="stat-bar-fill" :style="{ width: stat.value + '%', background: stat.color }"></view>
					</view>
				</view>
			</view>

			<!-- Info Cards -->
			<view class="info-section">
				<view class="info-card">
					<text class="info-icon">📅</text>
					<text class="info-label">在一起天数</text>
					<text class="info-value">{{ gameState.daysTogether }} 天</text>
				</view>
				<view class="info-card">
					<text class="info-icon">💬</text>
					<text class="info-label">互动次数</text>
					<text class="info-value">{{ gameState.totalInteractions }} 次</text>
				</view>
				<view class="info-card">
					<text class="info-icon">{{ moodEmoji }}</text>
					<text class="info-label">当前心情</text>
					<text class="info-value">{{ moodText }}</text>
				</view>
			</view>

			<!-- Back Button -->
			<view class="btn-wrap">
				<view class="back-btn" @tap="goBack">
					<text class="back-btn-text">💬 返回聊天</text>
				</view>
			</view>
		</scroll-view>
	</view>
</template>

<script>
import { gameStore } from '@/store/game.js'
import { getCharacterById } from '@/utils/characters.js'

const MOOD_MAP = {
	normal: { emoji: '😊', text: '平静' },
	happy: { emoji: '😄', text: '开心' },
	sad: { emoji: '😢', text: '难过' },
	angry: { emoji: '😠', text: '生气' },
	shy: { emoji: '😳', text: '害羞' },
	excited: { emoji: '🤩', text: '兴奋' }
}

const STAGE_EMOJIS = {
	'陌生人': '👋', '认识': '🤝', '熟悉': '😊', '好友': '🫂',
	'暧昧': '💗', '表白': '💌', '恋人': '💕', '求婚': '💍',
	'新婚': '🎊', '育儿': '👶', '10年婚姻': '🏡',
	'20年婚姻': '🌳', '30年婚姻': '🌅', '白头偕老': '👴👵'
}

export default {
	name: 'RelationshipPage',
	data() {
		return {
			gameState: gameStore.state,
			character: null,
			stageInfo: { goal: '', nextThreshold: null, isMaxStage: false }
		}
	},
	computed: {
		stageEmoji() {
			return STAGE_EMOJIS[this.gameState.relationshipStage] || '❓'
		},
		progressPercent() {
			if (this.stageInfo.isMaxStage) return 100
			const current = this.gameState.favorability
			const currentStage = gameStore.STAGES[this.gameState.stageIndex]
			const nextMin = this.stageInfo.nextThreshold
			if (nextMin === null) return 100
			const range = nextMin - currentStage.min
			if (range <= 0) return 100
			return Math.min(100, Math.round(((current - currentStage.min) / range) * 100))
		},
		stats() {
			return [
				{ icon: '❤️', label: '好感度', value: this.gameState.favorability, color: 'linear-gradient(90deg, #ff6b6b, #ee5a24)' },
				{ icon: '🤝', label: '信任度', value: this.gameState.trust, color: 'linear-gradient(90deg, #54a0ff, #2e86de)' },
				{ icon: '💕', label: '亲密度', value: this.gameState.intimacy, color: 'linear-gradient(90deg, #ff9ff3, #f368e0)' },
				{ icon: '😴', label: '倦怠值', value: this.gameState.boredom, color: this.gameState.boredom > 60 ? 'linear-gradient(90deg, #ff4757, #c0392b)' : 'linear-gradient(90deg, #ffa502, #e67e22)' },
				{ icon: '✨', label: '新鲜感', value: this.gameState.freshness, color: 'linear-gradient(90deg, #7bed9f, #2ed573)' }
			]
		},
		moodEmoji() {
			return (MOOD_MAP[this.gameState.currentMood] || MOOD_MAP.normal).emoji
		},
		moodText() {
			return (MOOD_MAP[this.gameState.currentMood] || MOOD_MAP.normal).text
		}
	},
	onLoad() {
		gameStore.loadGame()
		this.character = getCharacterById(this.gameState.characterId)
		this.stageInfo = gameStore.getStageInfo()
	},
	methods: {
		goBack() {
			uni.navigateBack()
		}
	}
}
</script>

<style scoped>
.relationship-page {
	width: 100vw;
	height: 100vh;
	background: linear-gradient(180deg, #1a1a2e 0%, #16213e 100%);
}

.scroll-area {
	height: 100vh;
	padding-bottom: 60rpx;
}

.char-section {
	display: flex;
	flex-direction: column;
	align-items: center;
	padding: 50rpx 0 30rpx;
}

.char-avatar {
	width: 150rpx;
	height: 150rpx;
	border-radius: 75rpx;
	border: 4rpx solid rgba(255, 255, 255, 0.3);
}

.avatar-placeholder {
	display: flex;
	align-items: center;
	justify-content: center;
	background: rgba(255, 255, 255, 0.1);
}

.avatar-placeholder-text {
	font-size: 60rpx;
	color: rgba(255, 255, 255, 0.3);
}

.char-name {
	font-size: 40rpx;
	color: #ffffff;
	font-weight: 700;
	margin-top: 20rpx;
}

.personality-tag {
	margin-top: 12rpx;
	padding: 6rpx 24rpx;
	border-radius: 30rpx;
	background: rgba(255, 255, 255, 0.1);
}

.tag-text {
	font-size: 24rpx;
	color: rgba(255, 255, 255, 0.7);
}

.stage-section {
	display: flex;
	flex-direction: column;
	align-items: center;
	margin: 20rpx 30rpx;
	padding: 30rpx;
	background: rgba(255, 255, 255, 0.08);
	border-radius: 20rpx;
}

.stage-emoji {
	font-size: 64rpx;
}

.stage-name {
	font-size: 36rpx;
	color: #ffffff;
	font-weight: 700;
	margin-top: 10rpx;
}

.progress-bar-wrap {
	width: 100%;
	display: flex;
	flex-direction: row;
	align-items: center;
	margin-top: 20rpx;
	padding: 0 20rpx;
}

.progress-bar-bg {
	flex: 1;
	height: 16rpx;
	background: rgba(255, 255, 255, 0.1);
	border-radius: 8rpx;
	overflow: hidden;
}

.progress-bar-fill {
	height: 100%;
	background: linear-gradient(90deg, #f6d365, #fda085);
	border-radius: 8rpx;
	transition: width 0.3s;
}

.progress-text {
	font-size: 24rpx;
	color: rgba(255, 255, 255, 0.6);
	margin-left: 16rpx;
	width: 80rpx;
	text-align: right;
}

.stage-goal {
	font-size: 26rpx;
	color: rgba(255, 255, 255, 0.5);
	margin-top: 16rpx;
}

.stats-section {
	margin: 20rpx 30rpx;
	padding: 30rpx;
	background: rgba(255, 255, 255, 0.08);
	border-radius: 20rpx;
}

.section-title {
	font-size: 30rpx;
	color: #ffffff;
	font-weight: 600;
	margin-bottom: 24rpx;
}

.stat-card {
	margin-bottom: 24rpx;
}

.stat-card:last-child {
	margin-bottom: 0;
}

.stat-header {
	display: flex;
	flex-direction: row;
	align-items: center;
	margin-bottom: 10rpx;
}

.stat-icon {
	font-size: 28rpx;
	margin-right: 10rpx;
}

.stat-label {
	font-size: 26rpx;
	color: rgba(255, 255, 255, 0.8);
	flex: 1;
}

.stat-value {
	font-size: 26rpx;
	color: rgba(255, 255, 255, 0.6);
}

.stat-bar-bg {
	height: 12rpx;
	background: rgba(255, 255, 255, 0.1);
	border-radius: 6rpx;
	overflow: hidden;
}

.stat-bar-fill {
	height: 100%;
	border-radius: 6rpx;
	transition: width 0.3s;
}

.info-section {
	display: flex;
	flex-direction: row;
	justify-content: space-between;
	margin: 20rpx 30rpx;
	gap: 16rpx;
}

.info-card {
	flex: 1;
	display: flex;
	flex-direction: column;
	align-items: center;
	padding: 24rpx 10rpx;
	background: rgba(255, 255, 255, 0.08);
	border-radius: 20rpx;
}

.info-icon {
	font-size: 40rpx;
}

.info-label {
	font-size: 22rpx;
	color: rgba(255, 255, 255, 0.5);
	margin-top: 10rpx;
}

.info-value {
	font-size: 28rpx;
	color: #ffffff;
	font-weight: 600;
	margin-top: 6rpx;
}

.btn-wrap {
	padding: 30rpx 30rpx 60rpx;
}

.back-btn {
	display: flex;
	align-items: center;
	justify-content: center;
	height: 88rpx;
	background: linear-gradient(135deg, #667eea, #764ba2);
	border-radius: 44rpx;
}

.back-btn-text {
	font-size: 30rpx;
	color: #ffffff;
	font-weight: 600;
}
</style>
