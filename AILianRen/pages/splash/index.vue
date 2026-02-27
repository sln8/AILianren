<template>
	<view class="splash-page" :class="{ 'fade-in': visible }">
		<view class="logo-area">
			<text class="heart-icon">💕</text>
			<text class="game-title">这些年我们追过的AI恋人</text>
			<text class="subtitle">每一次心动，都是独一无二的故事</text>
		</view>
		<view class="btn-area">
			<view class="start-btn" @tap="handleStart">
				<text class="start-btn-text">开始游戏</text>
			</view>
		</view>
	</view>
</template>

<script>
export default {
	name: 'SplashPage',
	data() {
		return {
			visible: false
		}
	},
	onLoad() {
		setTimeout(() => {
			this.visible = true
		}, 100)
	},
	methods: {
		handleStart() {
			const gender = uni.getStorageSync('user_gender')
			if (gender) {
				const activeGame = uni.getStorageSync('active_game')
				if (activeGame) {
					uni.navigateTo({ url: '/pages/game/chat' })
				} else {
					uni.navigateTo({ url: '/pages/character-select/index' })
				}
			} else {
				uni.navigateTo({ url: '/pages/gender-select/index' })
			}
		}
	}
}
</script>

<style scoped>
.splash-page {
	width: 100vw;
	height: 100vh;
	background: linear-gradient(180deg, #0f0c29 0%, #302b63 50%, #24243e 100%);
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	opacity: 0;
	transition: opacity 0.8s ease-in-out;
}

.splash-page.fade-in {
	opacity: 1;
}

.logo-area {
	display: flex;
	flex-direction: column;
	align-items: center;
	margin-bottom: 120rpx;
}

.heart-icon {
	font-size: 100rpx;
	margin-bottom: 40rpx;
}

.game-title {
	font-size: 48rpx;
	color: #ffffff;
	font-weight: 700;
	text-align: center;
	margin-bottom: 20rpx;
}

.subtitle {
	font-size: 28rpx;
	color: rgba(255, 255, 255, 0.5);
	text-align: center;
}

.btn-area {
	position: absolute;
	bottom: 160rpx;
	left: 0;
	right: 0;
	display: flex;
	justify-content: center;
}

.start-btn {
	width: 400rpx;
	height: 96rpx;
	background: linear-gradient(135deg, #ff6b6b, #ee5a24);
	border-radius: 48rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	box-shadow: 0 8rpx 30rpx rgba(255, 107, 107, 0.4);
}

.start-btn-text {
	font-size: 34rpx;
	color: #ffffff;
	font-weight: 600;
	letter-spacing: 4rpx;
}
</style>
