<template>
  <!-- 选择恋人页面 - 展示异性AI恋人列表供玩家选择 -->
  <view class="select-page">
    <!-- 背景光晕装饰 -->
    <view class="bg-glow"></view>

    <!-- 顶部标题 -->
    <view class="header">
      <text class="header-title">选择你的命中注定</text>
      <text class="header-subtitle">每个人都有独特的性格和故事</text>
    </view>

    <!-- 角色卡片横向滚动列表 -->
    <scroll-view class="character-scroll" scroll-x :show-scrollbar="false">
      <view class="character-list">
        <view
          v-for="(char, index) in characters"
          :key="char.id"
          class="character-card"
          :class="{ active: selectedId === char.id }"
          @tap="selectCharacter(char)"
        >
          <!-- 角色头像 -->
          <image class="card-avatar" :src="char.avatar" mode="aspectFill"></image>
          <!-- 角色名字 -->
          <text class="card-name">{{ char.name }}</text>
          <!-- 性格标签 -->
          <text class="card-personality">{{ char.personality }}</text>
          <!-- 选中指示器 -->
          <view v-if="selectedId === char.id" class="card-indicator"></view>
        </view>
      </view>
    </scroll-view>

    <!-- 选中角色的详情展示 -->
    <view v-if="selectedCharacter" class="detail-panel">
      <!-- 玻璃态背景卡片 -->
      <view class="detail-card">
        <!-- 角色大头像 -->
        <view class="detail-avatar-wrapper">
          <image class="detail-avatar" :src="selectedCharacter.avatar" mode="aspectFill"></image>
          <view class="avatar-ring"></view>
        </view>

        <!-- 角色信息 -->
        <view class="detail-info">
          <text class="detail-name">{{ selectedCharacter.name }}</text>
          <text class="detail-personality">{{ selectedCharacter.personality }} · {{ selectedCharacter.appearance }}</text>

          <!-- 角色简介 -->
          <text class="detail-background">{{ selectedCharacter.background }}</text>

          <!-- 标签 -->
          <view class="detail-tags">
            <view class="tag" v-for="tag in selectedCharacter.tags" :key="tag">
              <text class="tag-text">{{ tag }}</text>
            </view>
          </view>

          <!-- 爱好 -->
          <view class="detail-hobbies">
            <text class="hobbies-label">喜好：</text>
            <text class="hobbies-text">{{ selectedCharacter.hobbies.join(' · ') }}</text>
          </view>

          <!-- 台词预览 -->
          <view class="detail-quote">
            <text class="quote-mark">"</text>
            <text class="quote-text">{{ selectedCharacter.greeting }}</text>
            <text class="quote-mark">"</text>
          </view>
        </view>

        <!-- 开始追求按钮 -->
        <view class="pursue-btn" @tap="startPursue">
          <text class="pursue-btn-text">开始追求 ❤️</text>
        </view>
      </view>
    </view>

    <!-- 未选择角色时的提示 -->
    <view v-else class="empty-hint">
      <text class="empty-text">👆 点击上方卡片选择你的AI恋人</text>
    </view>
  </view>
</template>

<script>
/**
 * 选择恋人页面组件
 * 负责展示所有可选的AI恋人角色，让玩家选择心仪的对象
 * 根据玩家性别展示异性角色列表
 */
import { getAvailableCharacters } from '@/config/characters.js'
import { saveUserInfo, getUserInfo, saveCurrentLover } from '@/utils/storage.js'
import { GAME_CONFIG } from '@/config/api.js'

export default {
  data() {
    return {
      // 可选角色列表
      characters: [],
      // 当前选中的角色ID
      selectedId: null,
      // 当前选中的角色详细信息
      selectedCharacter: null,
      // 玩家信息
      userInfo: null
    }
  },

  onLoad() {
    // 获取玩家信息
    this.userInfo = getUserInfo()
    if (!this.userInfo || !this.userInfo.gender) {
      // 未找到用户信息，返回欢迎页
      uni.reLaunch({ url: '/pages/welcome/welcome' })
      return
    }

    // 根据玩家性别加载异性角色列表
    this.characters = getAvailableCharacters(this.userInfo.gender)
  },

  methods: {
    /**
     * 选择角色
     * @param {Object} char - 角色信息对象
     */
    selectCharacter(char) {
      this.selectedId = char.id
      this.selectedCharacter = char
      // 轻触反馈
      uni.vibrateShort({ type: 'light' })
    },

    /**
     * 开始追求选中的角色
     * 创建恋人档案并跳转到对话页面
     */
    startPursue() {
      if (!this.selectedCharacter) return

      // 创建恋人档案数据
      const loverData = {
        id: `lover_${Date.now()}`,
        characterId: this.selectedCharacter.id,
        characterName: this.selectedCharacter.name,
        status: 'active',
        stage: 1,
        stageName: '陌生人',
        favorScore: 0,
        intimacyScore: 0,
        trustScore: 50,
        romanceScore: 0,
        rapportScore: 0,
        totalRounds: 0,
        totalWordsConsumed: 0,
        daysTogether: 1,
        eventsCompleted: [],
        relationshipSummary: '',
        keyMemories: [],
        stageStartRound: 0,
        createdAt: new Date().toISOString(),
        lastChatAt: new Date().toISOString()
      }

      // 保存恋人档案到本地
      saveCurrentLover(loverData)

      // 更新用户信息
      this.userInfo.currentLoverId = this.selectedCharacter.id
      this.userInfo.totalLoversPlayed = (this.userInfo.totalLoversPlayed || 0) + 1
      saveUserInfo(this.userInfo)

      // 跳转到对话页面
      uni.reLaunch({
        url: '/pages/chat/chat'
      })
    }
  }
}
</script>

<style scoped>
/* ==================== 页面整体样式 ==================== */
.select-page {
  min-height: 100vh;
  background: linear-gradient(180deg, #0d1b3e 0%, #1a0533 100%);
  padding-bottom: 60rpx;
  position: relative;
}

/* 背景光晕装饰 */
.bg-glow {
  position: fixed;
  top: -200rpx;
  left: 50%;
  transform: translateX(-50%);
  width: 600rpx;
  height: 600rpx;
  background: radial-gradient(circle, rgba(255, 107, 157, 0.15) 0%, transparent 70%);
  pointer-events: none;
  z-index: 0;
}

/* ==================== 顶部标题 ==================== */
.header {
  padding: 80rpx 40rpx 40rpx;
  text-align: center;
  position: relative;
  z-index: 1;
}

.header-title {
  font-size: 44rpx;
  font-weight: bold;
  color: #ffffff;
  display: block;
  margin-bottom: 12rpx;
  letter-spacing: 4rpx;
}

.header-subtitle {
  font-size: 26rpx;
  color: rgba(255, 255, 255, 0.5);
  display: block;
}

/* ==================== 角色卡片滚动列表 ==================== */
.character-scroll {
  width: 100%;
  white-space: nowrap;
  position: relative;
  z-index: 1;
  padding: 20rpx 0;
}

.character-list {
  display: inline-flex;
  padding: 0 30rpx;
  gap: 24rpx;
}

.character-card {
  width: 200rpx;
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  padding: 24rpx 16rpx;
  background: rgba(255, 255, 255, 0.06);
  border: 2rpx solid rgba(255, 255, 255, 0.1);
  border-radius: 24rpx;
  transition: all 0.3s ease;
  position: relative;
}

.character-card.active {
  background: rgba(255, 107, 157, 0.12);
  border-color: rgba(255, 107, 157, 0.5);
  box-shadow: 0 4rpx 30rpx rgba(255, 107, 157, 0.2);
  transform: scale(1.05);
}

.card-avatar {
  width: 120rpx;
  height: 120rpx;
  border-radius: 50%;
  margin-bottom: 16rpx;
  border: 4rpx solid rgba(255, 255, 255, 0.2);
}

.character-card.active .card-avatar {
  border-color: #ff6b9d;
}

.card-name {
  font-size: 28rpx;
  color: #ffffff;
  font-weight: bold;
  margin-bottom: 6rpx;
  white-space: nowrap;
}

.card-personality {
  font-size: 22rpx;
  color: rgba(255, 255, 255, 0.5);
  white-space: nowrap;
}

.card-indicator {
  position: absolute;
  bottom: -4rpx;
  left: 50%;
  transform: translateX(-50%);
  width: 40rpx;
  height: 6rpx;
  background: #ff6b9d;
  border-radius: 3rpx;
}

/* ==================== 角色详情面板 ==================== */
.detail-panel {
  padding: 30rpx 30rpx 0;
  position: relative;
  z-index: 1;
}

.detail-card {
  background: rgba(255, 255, 255, 0.06);
  backdrop-filter: blur(20rpx);
  border: 2rpx solid rgba(255, 255, 255, 0.1);
  border-radius: 32rpx;
  padding: 40rpx 36rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
}

/* 头像区域 */
.detail-avatar-wrapper {
  position: relative;
  margin-bottom: 24rpx;
}

.detail-avatar {
  width: 180rpx;
  height: 180rpx;
  border-radius: 50%;
  border: 4rpx solid rgba(255, 107, 157, 0.5);
}

.avatar-ring {
  position: absolute;
  top: -8rpx;
  left: -8rpx;
  right: -8rpx;
  bottom: -8rpx;
  border-radius: 50%;
  border: 2rpx solid rgba(255, 107, 157, 0.3);
  animation: pulse-ring 2s ease-in-out infinite;
}

@keyframes pulse-ring {
  0%, 100% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.05); opacity: 0.5; }
}

/* 角色信息 */
.detail-info {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.detail-name {
  font-size: 40rpx;
  font-weight: bold;
  color: #ffffff;
  margin-bottom: 8rpx;
}

.detail-personality {
  font-size: 26rpx;
  color: rgba(255, 255, 255, 0.6);
  margin-bottom: 20rpx;
}

.detail-background {
  font-size: 26rpx;
  color: rgba(255, 255, 255, 0.7);
  line-height: 1.6;
  text-align: center;
  margin-bottom: 24rpx;
  white-space: normal;
}

/* 标签 */
.detail-tags {
  display: flex;
  gap: 16rpx;
  margin-bottom: 16rpx;
  flex-wrap: wrap;
  justify-content: center;
}

.tag {
  padding: 8rpx 24rpx;
  background: rgba(255, 107, 157, 0.15);
  border: 1rpx solid rgba(255, 107, 157, 0.3);
  border-radius: 30rpx;
}

.tag-text {
  font-size: 24rpx;
  color: #ff9dbd;
}

/* 爱好 */
.detail-hobbies {
  display: flex;
  align-items: center;
  margin-bottom: 20rpx;
}

.hobbies-label {
  font-size: 24rpx;
  color: rgba(255, 255, 255, 0.5);
}

.hobbies-text {
  font-size: 24rpx;
  color: rgba(255, 255, 255, 0.7);
}

/* 台词引用 */
.detail-quote {
  display: flex;
  align-items: flex-start;
  margin-bottom: 30rpx;
  padding: 20rpx 24rpx;
  background: rgba(255, 255, 255, 0.04);
  border-radius: 16rpx;
  border-left: 4rpx solid rgba(255, 107, 157, 0.5);
  width: 100%;
  box-sizing: border-box;
}

.quote-mark {
  font-size: 36rpx;
  color: rgba(255, 107, 157, 0.5);
  font-style: italic;
  line-height: 1;
}

.quote-text {
  font-size: 26rpx;
  color: rgba(255, 255, 255, 0.6);
  font-style: italic;
  line-height: 1.5;
  flex: 1;
  white-space: normal;
}

/* 开始追求按钮 */
.pursue-btn {
  width: 100%;
  height: 92rpx;
  background: linear-gradient(135deg, #ff6b9d, #c084fc);
  border-radius: 46rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 8rpx 40rpx rgba(255, 107, 157, 0.35);
}

.pursue-btn:active {
  transform: scale(0.96);
}

.pursue-btn-text {
  font-size: 32rpx;
  color: #ffffff;
  font-weight: bold;
  letter-spacing: 4rpx;
}

/* ==================== 空状态提示 ==================== */
.empty-hint {
  padding: 80rpx 40rpx;
  text-align: center;
  position: relative;
  z-index: 1;
}

.empty-text {
  font-size: 28rpx;
  color: rgba(255, 255, 255, 0.4);
}
</style>
