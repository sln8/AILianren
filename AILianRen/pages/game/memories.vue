<template>
	<view class="memories-page">
		<view class="header">
			<text class="title">💖 回忆录</text>
			<text class="subtitle">记录你们的每一个重要时刻</text>
		</view>

		<scroll-view scroll-y class="scroll-area">
			<!-- Timeline -->
			<view v-if="milestones.length > 0" class="timeline">
				<view class="timeline-item" v-for="(item, index) in milestones" :key="index">
					<view class="timeline-left">
						<text class="timeline-date">{{ formatDate(item.date || item.timestamp) }}</text>
					</view>
					<view class="timeline-line">
						<view class="timeline-dot">
							<text class="dot-emoji">{{ typeEmoji(item.type) }}</text>
						</view>
						<view v-if="index < milestones.length - 1" class="timeline-connector"></view>
					</view>
					<view class="timeline-card">
						<text class="card-stage">{{ item.stage || item.name || '事件' }}</text>
						<text v-if="item.summary" class="card-summary">{{ item.summary }}</text>
						<text v-else-if="item.type === 'stage_advance'" class="card-summary">关系升级为「{{ item.stage }}」</text>
					</view>
				</view>
			</view>

			<!-- Empty State -->
			<view v-else class="empty-state">
				<text class="empty-emoji">📖</text>
				<text class="empty-text">还没有回忆，快去创造属于你们的故事吧！</text>
			</view>
		</scroll-view>

		<!-- Back Button -->
		<view class="btn-wrap">
			<view class="back-btn" @tap="goBack">
				<text class="back-btn-text">← 返回</text>
			</view>
		</view>
	</view>
</template>

<script>
import { gameStore } from '@/store/game.js'

export default {
	name: 'MemoriesPage',
	data() {
		return {
			milestones: []
		}
	},
	onLoad() {
		gameStore.loadGame()
		this.milestones = [...(gameStore.state.milestones || [])].reverse()
	},
	methods: {
		typeEmoji(type) {
			const map = { stage_advance: '🎉', event: '📌', special: '⭐' }
			return map[type] || '📌'
		},
		formatDate(dateStr) {
			if (!dateStr) return ''
			if (typeof dateStr === 'number') {
				const d = new Date(dateStr)
				return (d.getMonth() + 1) + '/' + d.getDate()
			}
			const parts = dateStr.split('-')
			if (parts.length >= 3) return parseInt(parts[1]) + '/' + parseInt(parts[2])
			return dateStr
		},
		goBack() {
			uni.navigateBack()
		}
	}
}
</script>

<style scoped>
.memories-page {
	width: 100vw;
	height: 100vh;
	background: linear-gradient(180deg, #1a1a2e 0%, #16213e 100%);
	display: flex;
	flex-direction: column;
}

.header {
	padding: 50rpx 40rpx 30rpx;
	display: flex;
	flex-direction: column;
	align-items: center;
}

.title {
	font-size: 44rpx;
	color: #ffffff;
	font-weight: 700;
}

.subtitle {
	font-size: 26rpx;
	color: rgba(255, 255, 255, 0.5);
	margin-top: 10rpx;
}

.scroll-area {
	flex: 1;
	padding: 20rpx 30rpx;
}

.timeline {
	padding-left: 10rpx;
}

.timeline-item {
	display: flex;
	flex-direction: row;
	margin-bottom: 30rpx;
}

.timeline-left {
	width: 100rpx;
	padding-top: 16rpx;
}

.timeline-date {
	font-size: 24rpx;
	color: rgba(255, 255, 255, 0.5);
}

.timeline-line {
	display: flex;
	flex-direction: column;
	align-items: center;
	width: 60rpx;
}

.timeline-dot {
	width: 50rpx;
	height: 50rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	background: rgba(255, 255, 255, 0.1);
	border-radius: 25rpx;
}

.dot-emoji {
	font-size: 28rpx;
}

.timeline-connector {
	width: 4rpx;
	flex: 1;
	min-height: 40rpx;
	background: rgba(255, 255, 255, 0.15);
	margin-top: 6rpx;
}

.timeline-card {
	flex: 1;
	margin-left: 16rpx;
	padding: 20rpx 24rpx;
	background: rgba(255, 255, 255, 0.08);
	border-radius: 20rpx;
}

.card-stage {
	font-size: 30rpx;
	color: #ffffff;
	font-weight: 600;
}

.card-summary {
	font-size: 24rpx;
	color: rgba(255, 255, 255, 0.6);
	margin-top: 8rpx;
}

.empty-state {
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	padding: 120rpx 40rpx;
}

.empty-emoji {
	font-size: 100rpx;
}

.empty-text {
	font-size: 28rpx;
	color: rgba(255, 255, 255, 0.5);
	text-align: center;
	margin-top: 30rpx;
	line-height: 1.6;
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
