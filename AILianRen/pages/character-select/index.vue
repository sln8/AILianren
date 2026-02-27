<template>
	<view class="character-page">
		<view class="header">
			<text class="title">选择你的恋人</text>
			<text class="subtitle">每个人都有独特的性格，选择你心动的那位</text>
		</view>
		<scroll-view scroll-y class="character-grid-scroll">
			<view class="character-grid">
				<CharacterCard
					v-for="char in filteredCharacters"
					:key="char.id"
					:character="char"
					@select="onCharacterSelect"
				/>
			</view>
		</scroll-view>
	</view>
</template>

<script>
import { getCharactersByGender } from '@/utils/characters.js'
import { userStore } from '@/store/user.js'
import { gameStore } from '@/store/game.js'

export default {
	name: 'CharacterSelectPage',
	data() {
		return {
			filteredCharacters: []
		}
	},
	onLoad() {
		const gender = uni.getStorageSync('user_gender') || userStore.state.gender || 'male'
		this.filteredCharacters = getCharactersByGender(gender)
	},
	methods: {
		onCharacterSelect(characterId) {
			gameStore.initGame(characterId)
			uni.setStorageSync('active_game', characterId)
			userStore.addWords(500, 'first_lover')
			uni.navigateTo({ url: '/pages/game/chat' })
		}
	}
}
</script>

<style scoped>
.character-page {
	width: 100vw;
	height: 100vh;
	background: linear-gradient(180deg, #0f0c29 0%, #302b63 50%, #24243e 100%);
	display: flex;
	flex-direction: column;
}

.header {
	padding: 60rpx 40rpx 30rpx;
	display: flex;
	flex-direction: column;
	align-items: center;
}

.title {
	font-size: 44rpx;
	color: #ffffff;
	font-weight: 700;
	margin-bottom: 16rpx;
}

.subtitle {
	font-size: 28rpx;
	color: rgba(255, 255, 255, 0.5);
	text-align: center;
}

.character-grid-scroll {
	flex: 1;
	padding: 20rpx 0;
}

.character-grid {
	display: flex;
	flex-direction: row;
	flex-wrap: wrap;
	justify-content: center;
	gap: 30rpx;
	padding: 0 20rpx 40rpx;
}
</style>
