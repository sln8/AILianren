<script>
	export default {
		onLaunch: function() {
			console.log('App Launch')
			// Initialize user store on app launch
			try {
				const userStore = require('@/store/user.js')
				userStore.default.initUser()
			} catch (e) {
				console.log('User store init:', e.message)
			}
		},
		onShow: function() {
			console.log('App Show')
		},
		onHide: function() {
			console.log('App Hide')
		}
	}
</script>

<style>
	/* 全局样式 - AI恋人游戏 */
	page {
		background-color: #1a1a2e;
		color: #ffffff;
		font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif;
		min-height: 100vh;
	}

	/* 隐藏滚动条 */
	::-webkit-scrollbar {
		display: none;
		width: 0;
		height: 0;
	}

	/* 通用渐变按钮 */
	.btn-gradient {
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		color: #ffffff;
		border: none;
		border-radius: 50rpx;
		padding: 24rpx 60rpx;
		font-size: 32rpx;
		font-weight: bold;
		text-align: center;
	}

	.btn-gradient:active {
		opacity: 0.85;
		transform: scale(0.97);
	}

	/* 卡片通用样式 */
	.card {
		background: rgba(255, 255, 255, 0.08);
		border-radius: 20rpx;
		padding: 30rpx;
		margin-bottom: 20rpx;
	}

	/* 文字省略 */
	.text-ellipsis {
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
</style>
