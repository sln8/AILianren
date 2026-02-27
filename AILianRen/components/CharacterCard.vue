<template>
	<view class="character-card" @tap="handleSelect">
		<image :src="character.image" class="character-image" mode="aspectFill" />
		<view class="card-overlay">
			<text class="character-name">{{ character.name }}</text>
			<text class="personality-tag">{{ character.personalityTag }}</text>
			<view class="difficulty-stars">
				<text v-for="i in 5" :key="i" class="star">{{ i <= character.difficulty ? '★' : '☆' }}</text>
			</view>
		</view>
	</view>
</template>

<script>
export default {
	name: 'CharacterCard',
	props: {
		character: {
			type: Object,
			required: true
		}
	},
	emits: ['select'],
	methods: {
		handleSelect() {
			this.$emit('select', this.character.id);
		}
	}
}
</script>

<style scoped>
.character-card {
	width: 400rpx;
	height: 560rpx;
	border-radius: 20rpx;
	overflow: hidden;
	position: relative;
	flex-shrink: 0;
}

.character-image {
	width: 100%;
	height: 100%;
	position: absolute;
	top: 0;
	left: 0;
}

.card-overlay {
	position: absolute;
	bottom: 0;
	left: 0;
	right: 0;
	padding: 40rpx 24rpx 24rpx;
	background: linear-gradient(to top, rgba(0, 0, 0, 0.85) 0%, rgba(0, 0, 0, 0.4) 60%, transparent 100%);
	display: flex;
	flex-direction: column;
	align-items: flex-start;
}

.character-name {
	font-size: 36rpx;
	font-weight: 700;
	color: #ffffff;
	margin-bottom: 8rpx;
}

.personality-tag {
	font-size: 24rpx;
	color: rgba(255, 255, 255, 0.7);
	margin-bottom: 12rpx;
}

.difficulty-stars {
	display: flex;
	flex-direction: row;
}

.star {
	font-size: 26rpx;
	color: #ffd700;
	margin-right: 4rpx;
}
</style>
