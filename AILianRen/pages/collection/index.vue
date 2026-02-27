<template>
	<view class="collection-page">
		<view class="header">
			<text class="title">📚 角色图鉴</text>
			<text class="subtitle">解锁所有角色，收集每段故事</text>
		</view>

		<scroll-view scroll-y class="scroll-area">
			<view class="char-grid">
				<view
					class="char-item"
					v-for="char in allCharacters"
					:key="char.id"
					@tap="onCharTap(char)"
				>
					<view class="avatar-wrap" :class="{ locked: !isUnlocked(char.id) }">
						<image :src="char.image" class="char-avatar" mode="aspectFill" />
						<view v-if="!isUnlocked(char.id)" class="lock-overlay">
							<text class="lock-icon">🔒</text>
						</view>
					</view>
					<text class="char-name" :class="{ 'name-locked': !isUnlocked(char.id) }">
						{{ isUnlocked(char.id) ? char.name : '???' }}
					</text>
				</view>
			</view>
		</scroll-view>

		<!-- Detail Modal -->
		<view v-if="showModal" class="modal-mask" @tap="showModal = false">
			<view class="modal-content" @tap.stop>
				<image :src="selectedChar.image" class="modal-avatar" mode="aspectFill" />
				<text class="modal-name">{{ selectedChar.name }}</text>
				<view class="modal-tag">
					<text class="modal-tag-text">{{ selectedChar.personalityTag }}</text>
				</view>
				<text class="modal-difficulty">难度: {{ selectedChar.difficulty }}</text>
				<text class="modal-desc">{{ selectedChar.personalityDetail }}</text>
				<view class="modal-hobbies">
					<text class="modal-hobbies-title">爱好</text>
					<view class="hobbies-list">
						<text class="hobby-tag" v-for="(hobby, i) in selectedChar.hobbies" :key="i">{{ hobby }}</text>
					</view>
				</view>
				<view class="modal-close" @tap="showModal = false">
					<text class="modal-close-text">关闭</text>
				</view>
			</view>
		</view>

		<!-- Back Button -->
		<view class="btn-wrap">
			<view class="back-btn" @tap="goBack">
				<text class="back-btn-text">← 返回</text>
			</view>
		</view>
	</view>
</template>

<script>
import { characters } from '@/utils/characters.js'

export default {
	name: 'CollectionPage',
	data() {
		return {
			allCharacters: Object.values(characters),
			unlockedIds: [],
			showModal: false,
			selectedChar: {}
		}
	},
	onLoad() {
		this.loadUnlocked()
	},
	methods: {
		loadUnlocked() {
			const played = uni.getStorageSync('played_characters') || []
			const active = uni.getStorageSync('active_game') || ''
			this.unlockedIds = [...new Set([...played, active].filter(Boolean))]
		},
		isUnlocked(id) {
			return this.unlockedIds.includes(id)
		},
		onCharTap(char) {
			if (this.isUnlocked(char.id)) {
				this.selectedChar = char
				this.showModal = true
			} else {
				uni.showToast({ title: '与TA展开故事后解锁', icon: 'none' })
			}
		},
		goBack() {
			uni.navigateBack()
		}
	}
}
</script>

<style scoped>
.collection-page {
	width: 100vw;
	height: 100vh;
	background: linear-gradient(180deg, #1a1a2e 0%, #16213e 100%);
	display: flex;
	flex-direction: column;
}

.header {
	padding: 50rpx 40rpx 20rpx;
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
	padding: 20rpx 0;
}

.char-grid {
	display: flex;
	flex-direction: row;
	flex-wrap: wrap;
	justify-content: center;
	gap: 30rpx;
	padding: 0 30rpx 30rpx;
}

.char-item {
	display: flex;
	flex-direction: column;
	align-items: center;
	width: 200rpx;
}

.avatar-wrap {
	width: 200rpx;
	height: 200rpx;
	border-radius: 100rpx;
	overflow: hidden;
	position: relative;
	border: 4rpx solid rgba(255, 255, 255, 0.2);
}

.avatar-wrap.locked {
	border-color: rgba(255, 255, 255, 0.1);
}

.char-avatar {
	width: 100%;
	height: 100%;
}

.avatar-wrap.locked .char-avatar {
	opacity: 0.3;
	filter: grayscale(100%);
}

.lock-overlay {
	position: absolute;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	display: flex;
	align-items: center;
	justify-content: center;
	background: rgba(0, 0, 0, 0.4);
}

.lock-icon {
	font-size: 48rpx;
}

.char-name {
	font-size: 26rpx;
	color: #ffffff;
	margin-top: 12rpx;
	font-weight: 500;
}

.char-name.name-locked {
	color: rgba(255, 255, 255, 0.3);
}

/* Modal */
.modal-mask {
	position: fixed;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	background: rgba(0, 0, 0, 0.7);
	display: flex;
	align-items: center;
	justify-content: center;
	z-index: 999;
}

.modal-content {
	width: 600rpx;
	max-height: 80vh;
	background: #1a1a2e;
	border-radius: 30rpx;
	padding: 40rpx;
	display: flex;
	flex-direction: column;
	align-items: center;
	border: 1rpx solid rgba(255, 255, 255, 0.15);
}

.modal-avatar {
	width: 180rpx;
	height: 180rpx;
	border-radius: 90rpx;
	border: 4rpx solid rgba(255, 255, 255, 0.3);
}

.modal-name {
	font-size: 36rpx;
	color: #ffffff;
	font-weight: 700;
	margin-top: 20rpx;
}

.modal-tag {
	margin-top: 12rpx;
	padding: 6rpx 24rpx;
	border-radius: 30rpx;
	background: rgba(255, 255, 255, 0.1);
}

.modal-tag-text {
	font-size: 24rpx;
	color: rgba(255, 255, 255, 0.7);
}

.modal-difficulty {
	font-size: 24rpx;
	color: rgba(255, 255, 255, 0.5);
	margin-top: 10rpx;
}

.modal-desc {
	font-size: 26rpx;
	color: rgba(255, 255, 255, 0.7);
	line-height: 1.6;
	margin-top: 20rpx;
	text-align: center;
}

.modal-hobbies {
	width: 100%;
	margin-top: 20rpx;
}

.modal-hobbies-title {
	font-size: 26rpx;
	color: rgba(255, 255, 255, 0.5);
	margin-bottom: 10rpx;
}

.hobbies-list {
	display: flex;
	flex-direction: row;
	flex-wrap: wrap;
	gap: 10rpx;
}

.hobby-tag {
	font-size: 22rpx;
	color: rgba(255, 255, 255, 0.7);
	background: rgba(255, 255, 255, 0.08);
	padding: 6rpx 16rpx;
	border-radius: 20rpx;
}

.modal-close {
	margin-top: 30rpx;
	padding: 16rpx 60rpx;
	background: rgba(255, 255, 255, 0.1);
	border-radius: 40rpx;
}

.modal-close-text {
	font-size: 28rpx;
	color: #ffffff;
}

/* Back Button */
.btn-wrap {
	padding: 10rpx 30rpx 40rpx;
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
