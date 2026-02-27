<template>
	<view class="settings-page">
		<scroll-view scroll-y class="scroll-area">
			<view class="header">
				<text class="title">⚙️ 设置</text>
			</view>

			<!-- Toggle Settings -->
			<view class="section">
				<view class="setting-row">
					<text class="setting-icon">🔊</text>
					<text class="setting-label">音效</text>
					<switch :checked="soundEnabled" @change="toggleSound" color="#667eea" />
				</view>
				<view class="setting-row">
					<text class="setting-icon">🔔</text>
					<text class="setting-label">通知</text>
					<switch :checked="notificationEnabled" @change="toggleNotification" color="#667eea" />
				</view>
			</view>

			<!-- Game Info -->
			<view class="section">
				<text class="section-title">游戏信息</text>
				<view class="card">
					<view class="info-row">
						<text class="info-label">当前恋人</text>
						<text class="info-value">{{ characterName }}</text>
					</view>
					<view class="info-row">
						<text class="info-label">关系阶段</text>
						<text class="info-value">{{ gameState.relationshipStage }}</text>
					</view>
					<view class="info-row no-border">
						<text class="info-label">游戏天数</text>
						<text class="info-value">{{ gameState.daysTogether }} 天</text>
					</view>
				</view>
			</view>

			<!-- Actions -->
			<view class="section">
				<text class="section-title">操作</text>
				<view class="action-btn warning-btn" @tap="changeLover">
					<text class="action-text">🔄 更换恋人</text>
					<text class="action-hint">当前进度将重置，需观看广告</text>
				</view>
				<view class="action-btn danger-btn" @tap="resetGame">
					<text class="action-text">🗑️ 重新开始</text>
					<text class="action-hint">清除所有数据，回到最初</text>
				</view>
			</view>

			<!-- About -->
			<view class="section">
				<text class="section-title">关于</text>
				<view class="card">
					<view class="info-row">
						<text class="info-label">游戏名称</text>
						<text class="info-value">这些年我们追过的AI恋人</text>
					</view>
					<view class="info-row no-border">
						<text class="info-label">版本</text>
						<text class="info-value">1.0.0</text>
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
import { gameStore } from '@/store/game.js'
import { getCharacterById } from '@/utils/characters.js'

export default {
	name: 'SettingsPage',
	data() {
		return {
			gameState: gameStore.state,
			soundEnabled: true,
			notificationEnabled: true,
			characterName: '未选择'
		}
	},
	onLoad() {
		userStore.initUser()
		gameStore.loadGame()
		this.soundEnabled = userStore.state.settings.soundEnabled
		this.notificationEnabled = userStore.state.settings.notificationEnabled
		const char = getCharacterById(this.gameState.characterId)
		if (char) this.characterName = char.name
	},
	methods: {
		toggleSound(e) {
			this.soundEnabled = e.detail.value
			userStore.state.settings.soundEnabled = this.soundEnabled
			userStore.saveToStorage()
		},
		toggleNotification(e) {
			this.notificationEnabled = e.detail.value
			userStore.state.settings.notificationEnabled = this.notificationEnabled
			userStore.saveToStorage()
		},
		changeLover() {
			uni.showModal({
				title: '更换恋人',
				content: '当前游戏进度将重置，需要观看一段广告才能更换。确定要更换吗？',
				confirmText: '确定更换',
				confirmColor: '#e67e22',
				success: (res) => {
					if (res.confirm) {
						uni.navigateTo({ url: '/pages/character-select/index' })
					}
				}
			})
		},
		resetGame() {
			uni.showModal({
				title: '重新开始',
				content: '这将清除所有游戏数据，包括角色、聊天记录和进度。此操作不可撤销！',
				confirmText: '确定重置',
				confirmColor: '#e74c3c',
				success: (res) => {
					if (res.confirm) {
						uni.clearStorageSync()
						uni.reLaunch({ url: '/pages/splash/index' })
					}
				}
			})
		},
		goBack() {
			uni.navigateBack()
		}
	}
}
</script>

<style scoped>
.settings-page {
	width: 100vw;
	height: 100vh;
	background: linear-gradient(180deg, #1a1a2e 0%, #16213e 100%);
}

.scroll-area {
	height: 100vh;
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

.section {
	margin: 10rpx 30rpx 20rpx;
}

.section-title {
	font-size: 28rpx;
	color: rgba(255, 255, 255, 0.5);
	margin-bottom: 16rpx;
}

.setting-row {
	display: flex;
	flex-direction: row;
	align-items: center;
	padding: 24rpx;
	background: rgba(255, 255, 255, 0.08);
	border-radius: 20rpx;
	margin-bottom: 12rpx;
}

.setting-icon {
	font-size: 36rpx;
	margin-right: 16rpx;
}

.setting-label {
	flex: 1;
	font-size: 30rpx;
	color: #ffffff;
}

.card {
	background: rgba(255, 255, 255, 0.08);
	border-radius: 20rpx;
	padding: 4rpx 24rpx;
}

.info-row {
	display: flex;
	flex-direction: row;
	justify-content: space-between;
	align-items: center;
	padding: 24rpx 0;
	border-bottom: 1rpx solid rgba(255, 255, 255, 0.06);
}

.info-row.no-border {
	border-bottom: none;
}

.info-label {
	font-size: 28rpx;
	color: rgba(255, 255, 255, 0.7);
}

.info-value {
	font-size: 28rpx;
	color: #ffffff;
	font-weight: 500;
}

.action-btn {
	display: flex;
	flex-direction: column;
	align-items: center;
	padding: 28rpx;
	border-radius: 20rpx;
	margin-bottom: 16rpx;
}

.warning-btn {
	background: rgba(230, 126, 34, 0.2);
	border: 1rpx solid rgba(230, 126, 34, 0.4);
}

.danger-btn {
	background: rgba(231, 76, 60, 0.2);
	border: 1rpx solid rgba(231, 76, 60, 0.4);
}

.action-text {
	font-size: 30rpx;
	color: #ffffff;
	font-weight: 600;
}

.action-hint {
	font-size: 22rpx;
	color: rgba(255, 255, 255, 0.4);
	margin-top: 6rpx;
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
