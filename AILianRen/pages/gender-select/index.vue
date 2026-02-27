<template>
	<view class="gender-page">
		<text class="title">你是...</text>
		<view class="cards-wrapper">
			<view class="gender-card male-card" @tap="selectGender('male')">
				<text class="gender-icon">👨</text>
				<text class="gender-label">男生</text>
				<text class="gender-sub">寻找你的AI女友</text>
			</view>
			<view class="gender-card female-card" @tap="selectGender('female')">
				<text class="gender-icon">👩</text>
				<text class="gender-label">女生</text>
				<text class="gender-sub">寻找你的AI男友</text>
			</view>
		</view>
	</view>
</template>

<script>
import { userStore } from '@/store/user.js'

export default {
	name: 'GenderSelectPage',
	methods: {
		selectGender(gender) {
			userStore.setGender(gender)
			uni.setStorageSync('user_gender', gender)
			uni.navigateTo({ url: '/pages/character-select/index' })
		}
	}
}
</script>

<style scoped>
.gender-page {
	width: 100vw;
	height: 100vh;
	background: linear-gradient(180deg, #0f0c29 0%, #302b63 50%, #24243e 100%);
	display: flex;
	flex-direction: column;
	align-items: center;
	padding-top: 200rpx;
}

.title {
	font-size: 60rpx;
	color: #ffffff;
	font-weight: 700;
	margin-bottom: 80rpx;
}

.cards-wrapper {
	display: flex;
	flex-direction: row;
	justify-content: center;
	gap: 40rpx;
}

.gender-card {
	width: 300rpx;
	height: 400rpx;
	border-radius: 24rpx;
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
}

.male-card {
	background: linear-gradient(135deg, #667eea, #764ba2);
}

.female-card {
	background: linear-gradient(135deg, #f093fb, #f5576c);
}

.gender-icon {
	font-size: 100rpx;
	margin-bottom: 24rpx;
}

.gender-label {
	font-size: 40rpx;
	color: #ffffff;
	font-weight: 700;
	margin-bottom: 16rpx;
}

.gender-sub {
	font-size: 24rpx;
	color: rgba(255, 255, 255, 0.7);
}
</style>
