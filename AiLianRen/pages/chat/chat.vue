<template>
  <!-- 主对话页面 - 游戏核心玩法 -->
  <view class="chat-page" :class="{ 'night-mode': isNightMode }">
    <!-- 背景：AI恋人形象 -->
    <view class="bg-avatar-wrapper">
      <image
        class="bg-avatar"
        :src="currentCharacter ? currentCharacter.avatar : ''"
        mode="aspectFill"
      ></image>
      <view class="bg-overlay"></view>
    </view>

    <!-- 顶部状态栏 -->
    <view class="status-bar">
      <view class="status-row">
        <view class="status-item">
          <text class="status-icon">❤️</text>
          <text class="status-value">{{ loverData.favorScore || 0 }}</text>
        </view>
        <view class="status-item">
          <text class="status-icon">📝</text>
          <text class="status-value">{{ userInfo.wordsBalance || 0 }}</text>
        </view>
      </view>
      <view class="status-row">
        <view class="status-item">
          <text class="status-label">阶段：</text>
          <text class="status-stage">{{ loverData.stageName || '陌生人' }}</text>
        </view>
        <view class="status-item">
          <text class="status-label">Day </text>
          <text class="status-value">{{ loverData.daysTogether || 1 }}</text>
        </view>
      </view>
    </view>

    <!-- 好感度变化飘字动画 -->
    <view v-if="showFavorChange" class="favor-float" :class="favorChangeValue > 0 ? 'positive' : 'negative'">
      <text class="favor-float-text">
        {{ favorChangeValue > 0 ? '+' + favorChangeValue + ' ❤️' : favorChangeValue + ' 💔' }}
      </text>
    </view>

    <!-- 对话气泡区域 -->
    <scroll-view
      class="chat-area"
      scroll-y
      :scroll-top="scrollTop"
      :scroll-with-animation="true"
      @scrolltoupper="loadMoreHistory"
    >
      <view class="chat-content">
        <!-- 阶段提示 -->
        <view v-if="stageHint" class="stage-hint-bubble">
          <text class="stage-hint-text">💡 {{ stageHint }}</text>
        </view>

        <!-- 消息列表 -->
        <view
          v-for="(msg, index) in messages"
          :key="index"
          class="message-wrapper"
          :class="msg.role === 'user' ? 'msg-right' : 'msg-left'"
        >
          <!-- AI消息 -->
          <view v-if="msg.role === 'assistant'" class="msg-bubble ai-bubble">
            <view class="ai-name-row">
              <text class="msg-name">{{ currentCharacter ? currentCharacter.name : '' }}</text>
              <text v-if="msg.emotion && msg.emotion !== 'neutral'" class="emotion-indicator">{{ getEmotionEmoji(msg.emotion) }}</text>
            </view>
            <text class="msg-text">{{ msg.displayText || msg.content }}</text>
          </view>
          <!-- 玩家消息 -->
          <view v-else class="msg-bubble user-bubble">
            <text class="msg-text">{{ msg.content }}</text>
          </view>
        </view>

        <!-- AI正在输入指示器 -->
        <view v-if="isTyping" class="message-wrapper msg-left">
          <view class="msg-bubble ai-bubble typing-bubble">
            <text class="msg-name">{{ currentCharacter ? currentCharacter.name : '' }}</text>
            <view class="typing-dots">
              <view class="dot dot-1"></view>
              <view class="dot dot-2"></view>
              <view class="dot dot-3"></view>
            </view>
          </view>
        </view>
      </view>
    </scroll-view>

    <!-- 底部输入区域 -->
    <view class="input-area">
      <!-- 功能按钮栏 -->
      <view class="action-bar">
        <view class="action-btn" @tap="getMoreWords">
          <text class="action-icon">💎</text>
          <text class="action-label">获取字数</text>
        </view>
        <view class="action-btn" @tap="showDiary">
          <text class="action-icon">📖</text>
          <text class="action-label">恋人日记</text>
        </view>
        <view class="action-btn" @tap="showTimeline = true">
          <text class="action-icon">📅</text>
          <text class="action-label">时间线</text>
        </view>
        <view class="action-btn" @tap="goSettings">
          <text class="action-icon">⚙️</text>
          <text class="action-label">设置</text>
        </view>
      </view>

      <!-- 输入框和发送按钮 -->
      <view class="input-row">
        <input
          class="msg-input"
          v-model="inputText"
          :placeholder="inputPlaceholder"
          :disabled="isTyping || !hasEnoughWords"
          confirm-type="send"
          @confirm="sendMessage"
          :adjust-position="true"
        />
        <view
          class="send-btn"
          :class="{ disabled: !canSend }"
          @tap="sendMessage"
        >
          <text class="send-btn-text">发送</text>
        </view>
      </view>
    </view>

    <!-- ==================== 弹窗层 ==================== -->

    <!-- 字数不足弹窗 -->
    <view v-if="showWordsModal" class="modal-overlay" @tap="showWordsModal = false">
      <view class="modal-card" @tap.stop>
        <text class="modal-title">💎 字数不足</text>
        <text class="modal-desc">当前剩余字数不够发送消息了，快来获取更多字数吧！</text>
        <view class="modal-info">
          <text class="modal-info-text">当前字数：{{ userInfo.wordsBalance || 0 }}</text>
          <text class="modal-info-text">今日已看广告：{{ dailyData.adsWatched || 0 }}/{{ adDailyLimit }}</text>
        </view>
        <view class="modal-actions">
          <view class="modal-btn primary" @tap="watchAdForWords">
            <text class="modal-btn-text">🎬 看广告 +1000字</text>
          </view>
          <view class="modal-btn secondary" @tap="shareForWordsAction">
            <text class="modal-btn-text">📤 分享 +300字</text>
          </view>
        </view>
        <view class="modal-close" @tap="showWordsModal = false">
          <text class="modal-close-text">稍后再说</text>
        </view>
      </view>
    </view>

    <!-- 阶段推进弹窗 -->
    <view v-if="showStageModal" class="modal-overlay">
      <view class="modal-card stage-modal" @tap.stop>
        <text class="stage-modal-emoji">🎉</text>
        <text class="stage-modal-title">关系升级！</text>
        <text class="stage-modal-stage">{{ stageAdvanceInfo.newStageName }}</text>
        <text class="stage-modal-desc">{{ stageAdvanceInfo.description }}</text>
        <view v-if="stageAdvanceInfo.event" class="stage-event">
          <text class="stage-event-title">📜 {{ stageAdvanceInfo.event.name }}</text>
          <text class="stage-event-desc">{{ stageAdvanceInfo.event.description }}</text>
        </view>
        <view class="modal-btn primary" @tap="closeStageModal">
          <text class="modal-btn-text">继续旅程 ❤️</text>
        </view>
      </view>
    </view>

    <!-- 恋人日记弹窗 -->
    <view v-if="showDiaryModal" class="modal-overlay" @tap="showDiaryModal = false">
      <view class="modal-card diary-modal" @tap.stop>
        <text class="modal-title">📖 {{ currentCharacter ? currentCharacter.name : '' }}的日记</text>
        <scroll-view class="diary-content" scroll-y>
          <text class="diary-text">{{ diaryContent }}</text>
        </scroll-view>
        <view class="modal-close" @tap="showDiaryModal = false">
          <text class="modal-close-text">关闭</text>
        </view>
      </view>
    </view>

    <!-- 死亡/结局弹窗 -->
    <view v-if="showEndingModal" class="modal-overlay">
      <view class="modal-card ending-modal" @tap.stop>
        <text class="ending-emoji">{{ endingInfo.isDeath ? '🕯️' : '🌅' }}</text>
        <text class="ending-title">{{ endingInfo.title }}</text>
        <text class="ending-desc">{{ endingInfo.description }}</text>
        <view class="ending-stats">
          <text class="ending-stat">在一起 {{ loverData.daysTogether || 0 }} 天</text>
          <text class="ending-stat">对话 {{ loverData.totalRounds || 0 }} 轮</text>
          <text class="ending-stat">最终好感度 {{ loverData.favorScore || 0 }}</text>
        </view>
        <view class="modal-actions">
          <view class="modal-btn primary" @tap="restartWithNewLover">
            <text class="modal-btn-text">选择新恋人</text>
          </view>
          <view class="modal-btn secondary" @tap="viewMemories">
            <text class="modal-btn-text">珍藏回忆</text>
          </view>
        </view>
      </view>
    </view>

    <!-- 新手引导弹窗 -->
    <view v-if="showGuide" class="modal-overlay" @tap="closeGuide">
      <view class="modal-card guide-modal" @tap.stop>
        <text class="guide-emoji">👋</text>
        <text class="modal-title">欢迎来到AI恋人！</text>
        <text class="modal-desc">试着跟TA打个招呼吧～\n输入你想说的话，点击发送开始对话</text>
        <view class="guide-tips">
          <text class="guide-tip">💡 每次对话会消耗字数</text>
          <text class="guide-tip">❤️ 好感度会随对话变化</text>
          <text class="guide-tip">🎯 努力提升关系阶段吧</text>
        </view>
        <view class="modal-btn primary" @tap="closeGuide">
          <text class="modal-btn-text">开始聊天 💬</text>
        </view>
      </view>
    </view>

    <!-- 特殊日期横幅 -->
    <view v-if="specialDateInfo" class="special-date-banner">
      <text class="special-date-text">🎉 今天是{{ specialDateInfo.name }}！</text>
    </view>

    <!-- 时间线弹窗 -->
    <view v-if="showTimeline" class="modal-overlay" @tap="showTimeline = false">
      <view class="modal-card timeline-modal" @tap.stop>
        <text class="modal-title">📅 我们的故事</text>
        <scroll-view class="timeline-content" scroll-y>
          <view v-for="(event, index) in getTimelineEvents()" :key="index" class="timeline-item">
            <view class="timeline-dot"></view>
            <view class="timeline-line" v-if="index < getTimelineEvents().length - 1"></view>
            <view class="timeline-info">
              <text class="timeline-icon">{{ event.icon }}</text>
              <text class="timeline-title">{{ event.title }}</text>
            </view>
          </view>
          <view v-if="getTimelineEvents().length === 0" class="timeline-empty">
            <text class="timeline-empty-text">还没有故事发生，继续聊天吧～</text>
          </view>
        </scroll-view>
        <view class="modal-close" @tap="showTimeline = false">
          <text class="modal-close-text">关闭</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script>
/**
 * 主对话页面组件
 * 游戏的核心页面，实现：
 * 1. 与AI恋人的自由文字对话
 * 2. 好感度数值的实时变化展示
 * 3. 关系阶段的推进与事件触发
 * 4. 字数经济系统（消耗与获取）
 * 5. 打字效果、飘字动画等交互效果
 */
import { getCharacterById } from '@/config/characters.js'
import { STAGES, getAiMaxWords } from '@/config/stages.js'
import { AI_CONFIG, AD_CONFIG, GAME_CONFIG } from '@/config/api.js'
import {
  getUserInfo, saveUserInfo,
  getCurrentLover, saveCurrentLover,
  getChatHistory, saveChatHistory,
  getDailyData, saveDailyData,
  getGameSettings
} from '@/utils/storage.js'
import {
  buildSystemPrompt, parseAiResponse,
  updateLoverStats, checkStageAdvance,
  attemptConfession, attemptProposal,
  calculateFavorDecay, generateOfflineMessage,
  getSpecialDateGreeting
} from '@/utils/game-logic.js'
import {
  showRewardedVideoAd, showInterstitialAd,
  shareForWords, getRemainingAdCount
} from '@/utils/ad-manager.js'
import { detectSensitiveWords, getSensitiveWarningMessage } from '@/utils/sensitive-filter.js'

// 中文字符平均占用约3个token
const CHINESE_CHAR_TOKEN_RATIO = 3
// scroll-view滚动到底部的触发值（交替切换以强制触发滚动）
const SCROLL_BOTTOM_A = 99999
const SCROLL_BOTTOM_B = 100000

export default {
  data() {
    return {
      // ===== 核心数据 =====
      userInfo: {},           // 用户信息（昵称、字数余额等）
      loverData: {},          // 恋人档案数据（好感度、阶段等）
      currentCharacter: null, // 当前角色配置信息（来自characters.js）
      messages: [],           // 消息列表（完整对话历史）
      inputText: '',          // 输入框文本
      dailyData: {},          // 每日数据（广告次数、签到等）

      // ===== UI状态 =====
      isTyping: false,           // AI是否正在输入（显示打字指示器）
      scrollTop: 0,              // 聊天区域滚动位置
      showFavorChange: false,    // 是否显示好感度变化飘字
      favorChangeValue: 0,       // 好感度变化值（正数或负数）
      stageHint: '',             // 阶段提示文字（AI返回的引导）

      // ===== 弹窗状态 =====
      showWordsModal: false,     // 字数不足弹窗
      showStageModal: false,     // 阶段推进弹窗
      showDiaryModal: false,     // 恋人日记弹窗
      showEndingModal: false,    // 结局弹窗
      stageAdvanceInfo: {},      // 阶段推进信息（新阶段名、描述、事件）
      diaryContent: '',          // 日记内容文本
      endingInfo: {},            // 结局信息（标题、描述、是否死亡）

      // ===== 配置 =====
      adDailyLimit: AD_CONFIG.DAILY_AD_LIMIT, // 每日广告观看上限
      settings: {},               // 游戏设置（打字效果开关等）
      // ===== 新手引导 =====
      showGuide: false,          // 是否显示新手引导
      // ===== 表情系统 =====
      currentEmotion: 'neutral', // AI当前情绪状态
      // ===== 日夜模式 =====
      isNightMode: false,        // 是否为夜间模式
      // ===== 时间线 =====
      showTimeline: false,       // 是否显示时间线弹窗
      // ===== 特殊日期 =====
      specialDateInfo: null      // 今日特殊日期信息
    }
  },

  computed: {
    /**
     * 判断字数是否充足（至少需要10字够发一条短消息+AI回复）
     */
    hasEnoughWords() {
      return (this.userInfo.wordsBalance || 0) >= 10
    },

    /**
     * 判断是否可以发送消息
     * 需同时满足：有输入内容、AI未在回复中、字数充足
     */
    canSend() {
      return this.inputText.trim().length > 0 && !this.isTyping && this.hasEnoughWords
    },

    /**
     * 输入框占位文本（根据当前状态动态切换）
     */
    inputPlaceholder() {
      if (!this.hasEnoughWords) return '字数不足，请获取更多字数...'
      if (this.isTyping) return '对方正在输入...'
      return '说点什么吧...'
    }
  },

  onLoad() {
    // 页面首次加载时初始化所有数据
    this.initPage()
    // 检查日夜模式
    this.checkDayNightMode()
    // 检查特殊日期
    this.specialDateInfo = getSpecialDateGreeting()
  },

  onShow() {
    // 页面每次显示时刷新每日数据（从其他页面返回时）
    this.dailyData = getDailyData()
    // 检查并发放每日免费字数
    this.claimDailyWords()
  },

  methods: {
    /**
     * 初始化页面
     * 加载用户数据、恋人数据、角色配置、聊天历史
     * 如果数据缺失则跳转到对应页面
     */
    initPage() {
      // 加载用户信息，如果没有则跳转欢迎页
      this.userInfo = getUserInfo()
      if (!this.userInfo || !this.userInfo.currentLoverId) {
        uni.reLaunch({ url: '/pages/welcome/welcome' })
        return
      }

      // 加载恋人档案，如果没有则跳转选人页
      this.loverData = getCurrentLover()
      if (!this.loverData) {
        uni.reLaunch({ url: '/pages/select-lover/select-lover' })
        return
      }

      // 根据恋人档案中的角色ID加载角色配置
      this.currentCharacter = getCharacterById(this.loverData.characterId)
      if (!this.currentCharacter) {
        uni.showToast({ title: '角色数据异常', icon: 'none' })
        return
      }

      // 加载该恋人的聊天历史记录
      this.messages = getChatHistory(this.loverData.id)

      // 加载每日数据和用户设置
      this.dailyData = getDailyData()
      this.settings = getGameSettings()

      // 如果是新开始的恋人（无历史消息），不主动发送开场白
      // 让玩家先主动说话，更符合真实社交场景

      // 等待DOM更新后滚动到底部
      this.$nextTick(() => {
        this.scrollToBottom()
      })
      // 检查新手引导
      this.checkAndShowGuide()
      // 检查离线状态
      this.checkOfflineStatus()
      // 检查特殊日期
      this.checkSpecialDate()
    },

    /**
     * 领取每日免费字数
     * 每天首次打开时自动赠送，避免重复领取
     */
    claimDailyWords() {
      if (!this.dailyData.dailyWordsClaimed) {
        this.userInfo.wordsBalance = (this.userInfo.wordsBalance || 0) + GAME_CONFIG.DAILY_FREE_WORDS
        saveUserInfo(this.userInfo)
        this.dailyData.dailyWordsClaimed = true
        saveDailyData(this.dailyData)
        uni.showToast({
          title: `每日赠送 ${GAME_CONFIG.DAILY_FREE_WORDS} 字数！`,
          icon: 'none'
        })
      }
    },

    /**
     * 发送消息 - 核心对话逻辑
     * 流程：输入检查 → 扣字数 → 调AI接口 → 解析回复 → 更新数值 → 检查阶段
     */
    async sendMessage() {
      // 检查是否可以发送
      if (!this.canSend) {
        if (!this.hasEnoughWords) {
          this.showWordsModal = true
        }
        return
      }

      const message = this.inputText.trim()
      const msgWordCount = message.length

      // 敏感词检测 - 拦截包含不当内容的消息
      const sensitiveResult = detectSensitiveWords(message)
      if (sensitiveResult.hasSensitive) {
        uni.showToast({
          title: getSensitiveWarningMessage(),
          icon: 'none',
          duration: 2000
        })
        return
      }

      // 检查字数是否足够（玩家输入 + 预留AI回复30字）
      if (this.userInfo.wordsBalance < msgWordCount + 30) {
        this.showWordsModal = true
        return
      }

      // 清空输入框（立即响应用户操作）
      this.inputText = ''

      // 添加玩家消息到消息列表
      this.messages.push({
        role: 'user',
        content: message,
        timestamp: new Date().toISOString(),
        wordsCost: msgWordCount
      })

      // 扣除玩家输入的字数
      this.userInfo.wordsBalance -= msgWordCount
      saveUserInfo(this.userInfo)

      // 滚动到底部显示新消息
      this.scrollToBottom()

      // 显示AI正在输入的动画指示器
      this.isTyping = true

      try {
        // 根据当前阶段获取AI最大回复字数
        const aiMaxWords = getAiMaxWords(this.loverData.stage)
        // 构建系统提示词（包含角色设定、关系状态、回复格式要求）
        const systemPrompt = buildSystemPrompt(this.currentCharacter, this.loverData, aiMaxWords, this.currentEmotion)

        // 构建上下文消息数组（系统提示 + 最近对话 + 当前消息）
        const contextMessages = this.buildContextMessages(systemPrompt, message)

        // 调用AI大模型API获取回复
        const aiResponseText = await this.callAiApi(contextMessages, aiMaxWords)

        // 解析AI回复（提取文本、情绪、好感度变化等结构化数据）
        const aiResult = parseAiResponse(aiResponseText)

        // 更新当前情绪状态
        this.currentEmotion = aiResult.emotion

        // 计算并扣除AI回复的字数消耗
        const aiWordCount = aiResult.reply.length
        this.userInfo.wordsBalance = Math.max(0, this.userInfo.wordsBalance - aiWordCount)
        this.userInfo.wordsTotalUsed = (this.userInfo.wordsTotalUsed || 0) + msgWordCount + aiWordCount
        saveUserInfo(this.userInfo)

        // 隐藏输入指示器
        this.isTyping = false

        // 添加AI回复消息（带逐字打字效果）
        await this.addAiMessageWithTyping(aiResult.reply, aiResult.emotion)

        // 如果好感度有变化，显示飘字动画
        if (aiResult.favor_change !== 0) {
          this.showFavorFloat(aiResult.favor_change)
        }

        // 更新恋人档案数值（好感度、对话轮数等）
        this.loverData = updateLoverStats(this.loverData, aiResult)
        // 注意：性格成长修正已在云函数(chat-send)中统一应用，客户端不重复处理
        this.loverData.totalWordsConsumed = (this.loverData.totalWordsConsumed || 0) + msgWordCount + aiWordCount
        this.loverData.lastChatAt = new Date().toISOString()

        // 显示阶段提示（AI返回的关系引导文字）
        if (aiResult.stage_hint) {
          this.stageHint = aiResult.stage_hint
          setTimeout(() => { this.stageHint = '' }, 5000)
        }

        // 检查是否满足阶段推进条件
        const advanceResult = checkStageAdvance(this.loverData, this.loverData.favorScore)
        if (advanceResult.canAdvance && advanceResult.nextStage) {
          if (advanceResult.nextStage.id === 20) {
            // 阶段20为死亡告别，触发结局
            this.handleDeath()
          } else {
            // 正常阶段推进，展示升级弹窗
            this.handleStageAdvance(advanceResult)
          }
        }

        // 检查AI是否触发了剧情事件
        if (aiResult.event_trigger) {
          this.handleEventTrigger(aiResult.event_trigger)
        }

        // 持久化保存恋人数据和聊天历史
        saveCurrentLover(this.loverData)
        saveChatHistory(this.loverData.id, this.messages)

      } catch (error) {
        console.error('对话出错:', error)
        this.isTyping = false
        // 出错时退还玩家输入的字数
        this.userInfo.wordsBalance += msgWordCount
        saveUserInfo(this.userInfo)
        uni.showToast({
          title: '网络异常，请稍后再试',
          icon: 'none'
        })
      }
    },

    /**
     * 构建发送给AI的上下文消息数组
     * 包含系统提示词 + 关系摘要 + 最近20轮对话 + 当前消息
     * @param {string} systemPrompt - 系统提示词
     * @param {string} currentMessage - 当前用户消息
     * @returns {Array} 消息数组（符合OpenAI格式）
     */
    buildContextMessages(systemPrompt, currentMessage) {
      const contextMsgs = [
        { role: 'system', content: systemPrompt }
      ]

      // 如果有关系摘要，作为额外系统消息提供给AI
      if (this.loverData.relationshipSummary) {
        contextMsgs.push({
          role: 'system',
          content: `【关系摘要】${this.loverData.relationshipSummary}`
        })
      }

      // 取最近20轮（约40条消息）作为对话上下文
      const recentMessages = this.messages.slice(-40)
      for (const msg of recentMessages) {
        if (msg.role === 'user' || msg.role === 'assistant') {
          contextMsgs.push({
            role: msg.role,
            content: msg.content
          })
        }
      }

      // 添加当前用户消息
      contextMsgs.push({
        role: 'user',
        content: currentMessage
      })

      return contextMsgs
    },

    /**
     * 调用豆包大模型API
     * 通过云函数(ai-proxy)转发请求，避免域名限制和API Key暴露
     * @param {Array} messages - 消息数组
     * @param {number} maxWords - 最大回复字数
     * @returns {Promise<string>} AI回复文本
     */
    callAiApi(messages, maxWords) {
      return new Promise((resolve, reject) => {
        uniCloud.callFunction({
          name: 'ai-proxy',
          data: {
            messages: messages,
            maxTokens: maxWords * CHINESE_CHAR_TOKEN_RATIO,
            temperature: AI_CONFIG.TEMPERATURE,
            top_p: AI_CONFIG.TOP_P
          },
          success: (res) => {
            if (res.result && res.result.code === 0) {
              resolve(res.result.reply)
            } else {
              console.error('AI API返回异常:', res)
              reject(new Error(res.result ? res.result.msg : 'AI服务暂时不可用'))
            }
          },
          fail: (err) => {
            console.error('AI API请求失败:', err)
            reject(err)
          }
        })
      })
    },

    /**
     * 添加AI消息（直接添加，无打字效果）
     * 用于开场白等不需要打字动画的场景
     * @param {string} content - 消息内容
     * @param {string} emotion - 情绪标签（neutral/happy/shy等）
     */
    addAiMessage(content, emotion) {
      this.messages.push({
        role: 'assistant',
        content: content,
        displayText: content,
        emotion: emotion || 'neutral',
        timestamp: new Date().toISOString()
      })
      this.$nextTick(() => this.scrollToBottom())
      saveChatHistory(this.loverData.id, this.messages)
    },

    /**
     * 添加AI消息（带逐字打字效果）
     * 每50ms显示一个字符，模拟真人打字的感觉
     * @param {string} content - 消息内容
     * @param {string} emotion - 情绪标签
     * @returns {Promise} 打字完成后resolve
     */
    addAiMessageWithTyping(content, emotion) {
      return new Promise((resolve) => {
        // 如果用户关闭了打字效果，直接显示完整消息
        if (!this.settings.typingEffect) {
          this.addAiMessage(content, emotion)
          resolve()
          return
        }

        // 创建消息对象，displayText从空字符串开始逐字填充
        const msgObj = {
          role: 'assistant',
          content: content,
          displayText: '',
          emotion: emotion || 'neutral',
          timestamp: new Date().toISOString()
        }
        this.messages.push(msgObj)
        const msgIndex = this.messages.length - 1

        // 逐字显示效果（每50ms追加一个字符）
        let charIndex = 0
        const typingInterval = setInterval(() => {
          if (charIndex < content.length) {
            // 使用展开运算符创建新对象以触发Vue响应式更新
            this.messages[msgIndex] = {
              ...this.messages[msgIndex],
              displayText: content.substring(0, charIndex + 1)
            }
            charIndex++
            this.scrollToBottom()
          } else {
            clearInterval(typingInterval)
            resolve()
          }
        }, 50)
      })
    },

    /**
     * 显示好感度变化飘字动画
     * 正数显示 +N ❤️（粉色），负数显示 -N 💔（灰色）
     * 动画持续2秒后自动消失
     * @param {number} change - 好感度变化值
     */
    showFavorFloat(change) {
      this.favorChangeValue = change
      this.showFavorChange = true
      setTimeout(() => {
        this.showFavorChange = false
      }, 2000)
    },

    /**
     * 滚动聊天区域到底部
     * 通过切换scrollTop值触发scroll-view滚动
     */
    scrollToBottom() {
      this.$nextTick(() => {
        this.scrollTop = this.scrollTop === SCROLL_BOTTOM_A ? SCROLL_BOTTOM_B : SCROLL_BOTTOM_A
      })
    },

    /**
     * 加载更多历史消息（下拉触顶时触发）
     * 当前使用本地存储，暂不支持服务端分页
     */
    loadMoreHistory() {
      console.log('已是最早的消息')
    },

    // ==================== 字数获取相关 ====================

    /**
     * 打开字数获取弹窗
     */
    getMoreWords() {
      this.showWordsModal = true
    },

    /**
     * 观看激励视频广告获取字数
     * 调用广告管理器，成功后增加字数余额
     */
    async watchAdForWords() {
      try {
        const result = await showRewardedVideoAd()
        if (result.success) {
          this.userInfo.wordsBalance = (this.userInfo.wordsBalance || 0) + result.reward
          saveUserInfo(this.userInfo)
          this.dailyData = getDailyData()
          uni.showToast({ title: result.message, icon: 'success' })
          this.showWordsModal = false
        } else {
          uni.showToast({ title: result.message, icon: 'none' })
        }
      } catch (e) {
        uni.showToast({ title: '广告加载失败', icon: 'none' })
      }
    },

    /**
     * 分享给好友获取字数
     */
    async shareForWordsAction() {
      try {
        const result = await shareForWords()
        if (result.success) {
          this.userInfo.wordsBalance = (this.userInfo.wordsBalance || 0) + result.reward
          saveUserInfo(this.userInfo)
          this.dailyData = getDailyData()
          uni.showToast({ title: result.message, icon: 'success' })
          this.showWordsModal = false
        } else {
          uni.showToast({ title: result.message, icon: 'none' })
        }
      } catch (e) {
        uni.showToast({ title: '分享失败', icon: 'none' })
      }
    },

    // ==================== 阶段推进相关 ====================

    /**
     * 处理关系阶段推进
     * 更新恋人档案、展示升级弹窗、触发插屏广告
     * @param {Object} advanceResult - checkStageAdvance返回的推进结果
     */
    handleStageAdvance(advanceResult) {
      const nextStage = advanceResult.nextStage

      // 更新恋人的阶段数据
      this.loverData.stage = nextStage.id
      this.loverData.stageName = nextStage.name
      this.loverData.stageStartRound = this.loverData.totalRounds
      if (!this.loverData.eventsCompleted) {
        this.loverData.eventsCompleted = []
      }
      // 记录已完成的事件，避免重复触发
      if (advanceResult.event && !this.loverData.eventsCompleted.includes(advanceResult.event.id)) {
        this.loverData.eventsCompleted.push(advanceResult.event.id)
      }

      // 准备阶段推进弹窗数据
      this.stageAdvanceInfo = {
        newStageName: nextStage.name,
        description: nextStage.description,
        event: advanceResult.event
      }
      this.showStageModal = true

      // 阶段推进时展示插屏广告（变现时机）
      showInterstitialAd()

      // 持久化保存更新后的恋人数据
      saveCurrentLover(this.loverData)
    },

    /**
     * 关闭阶段推进弹窗
     */
    closeStageModal() {
      this.showStageModal = false
    },

    /**
     * 处理AI触发的剧情事件
     * 将事件记录到已完成列表，避免重复触发
     * @param {string} eventId - 事件ID
     */
    handleEventTrigger(eventId) {
      if (!this.loverData.eventsCompleted) {
        this.loverData.eventsCompleted = []
      }
      if (!this.loverData.eventsCompleted.includes(eventId)) {
        this.loverData.eventsCompleted.push(eventId)
      }
      saveCurrentLover(this.loverData)
    },

    /**
     * 处理死亡事件（阶段20）
     * 标记恋人状态为dead，展示告别结局弹窗
     */
    handleDeath() {
      this.loverData.stage = 20
      this.loverData.stageName = '死亡告别'
      this.loverData.status = 'dead'
      saveCurrentLover(this.loverData)

      this.endingInfo = {
        isDeath: true,
        title: '永远的告别',
        description: `${this.currentCharacter.name}离开了这个世界，但你们之间的爱与回忆将永远留存。`
      }
      this.showEndingModal = true
    },

    /**
     * 结局后选择新恋人
     * 清除当前恋人ID，跳转到角色选择页
     */
    restartWithNewLover() {
      this.showEndingModal = false
      this.userInfo.currentLoverId = null
      saveUserInfo(this.userInfo)
      uni.reLaunch({
        url: '/pages/select-lover/select-lover'
      })
    },

    /**
     * 结局后查看回忆录
     * 展示关键记忆的摘要列表
     */
    viewMemories() {
      const memories = (this.loverData.keyMemories || [])
        .map(m => `· ${m.summary}`)
        .join('\n')
      this.diaryContent = memories || '你们一起走过了漫长的人生旅途...'
      this.showEndingModal = false
      this.showDiaryModal = true
    },

    // ==================== 恋人日记 ====================

    /**
     * 显示恋人日记
     * 消耗一定字数，生成当前阶段对应的日记内容
     */
    showDiary() {
      // 检查字数是否足够支付日记查看费用
      if (this.userInfo.wordsBalance < GAME_CONFIG.DIARY_COST) {
        uni.showToast({ title: `查看日记需要${GAME_CONFIG.DIARY_COST}字数`, icon: 'none' })
        return
      }

      // 根据当前阶段生成日记内容
      const stage = STAGES.find(s => s.id === this.loverData.stage)
      const char = this.currentCharacter
      this.diaryContent = this.generateDiary(char, this.loverData, stage)

      // 扣除查看日记的字数
      this.userInfo.wordsBalance -= GAME_CONFIG.DIARY_COST
      saveUserInfo(this.userInfo)

      this.showDiaryModal = true
    },

    /**
     * 生成恋人日记内容
     * 每个阶段都有对应的日记模板，融入玩家昵称增加代入感
     * @param {Object} char - 角色信息
     * @param {Object} lover - 恋人数据
     * @param {Object} stage - 当前阶段配置
     * @returns {string} 日记文本
     */
    generateDiary(char, lover, stage) {
      // 20个阶段对应20篇日记，从初遇到生死
      const diaries = {
        1: `今天遇到了一个有趣的人，不知道为什么，总觉得和TA有种说不清的缘分...`,
        2: `和${this.userInfo.nickname}又聊了几次，感觉TA是个还不错的人。希望能更了解TA一些。`,
        3: `和${this.userInfo.nickname}越来越熟了，聊天的时候会不自觉地笑。TA好像能懂我说的话。`,
        4: `${this.userInfo.nickname}已经是我的好朋友了。有什么事都想第一个告诉TA，这种感觉真好。`,
        5: `最近心跳总是加速...不会是...不不不，我们只是朋友！（但为什么会在意TA看别人呢...）`,
        6: `听到${this.userInfo.nickname}的告白，心跳得好快...`,
        7: `和${this.userInfo.nickname}在一起的每一天都好幸福，希望时间能过得慢一点。`,
        8: `热恋的感觉真好，每天都像在做梦一样甜蜜~`,
        9: `虽然会吵架，但我知道我们都在为这段感情努力。爱就是学会包容吧。`,
        10: `如果${this.userInfo.nickname}向我求婚...我会怎么回答呢？（脸红）`,
        11: `今天穿上了婚纱/西装，我嫁/娶了这世上最好的人。`,
        12: `新婚的每一天都充满惊喜，感谢你出现在我的生命中。`,
        13: `小生命的到来让我们的家更完整了。看着宝宝的脸，感觉一切辛苦都值得。`,
        14: `当孩子第一次叫"爸爸/妈妈"的时候，我的眼泪忍不住流了下来。`,
        15: `转眼十年了，平淡但真实。${this.userInfo.nickname}，感谢你一直在我身边。`,
        16: `孩子长大了，家里变得安静了。但是有你在，就不会觉得寂寞。`,
        17: `退休了，终于有更多时间陪伴彼此了。想和你一起去看看这个世界。`,
        18: `金婚了！五十年的风风雨雨，每一步都有你。此生有你，足矣。`,
        19: `如果有来生，我还想和你一起走过这漫长的一生。白头偕老，就是最好的结局。`,
        20: `再见了...感谢你给了我最美好的一生。不要太难过，带着我的爱，好好生活。`
      }
      return diaries[lover.stage] || `今天是和${this.userInfo.nickname}在一起的第${lover.daysTogether}天，心里暖暖的。`
    },

    // ==================== 新手引导 ====================

    /**
     * 检查并显示新手引导
     */
    checkAndShowGuide() {
      const guideShown = uni.getStorageSync('ailianren_guide_shown')
      if (!guideShown && this.messages.length === 0) {
        this.showGuide = true
        uni.setStorageSync('ailianren_guide_shown', true)
      }
    },

    /**
     * 关闭新手引导
     */
    closeGuide() {
      this.showGuide = false
    },

    // ==================== 日夜模式 ====================

    /**
     * 检查当前时间并设置日夜模式（19:00-06:00为夜间）
     */
    checkDayNightMode() {
      const NIGHT_START = 19
      const NIGHT_END = 6
      const hour = new Date().getHours()
      this.isNightMode = hour >= NIGHT_START || hour < NIGHT_END
    },

    // ==================== 离线消息与好感度衰减 ====================

    /**
     * 检查离线状态并处理好感度衰减和离线消息
     */
    checkOfflineStatus() {
      if (!this.loverData || !this.loverData.lastChatAt) return

      const decayResult = calculateFavorDecay(this.loverData)

      if (decayResult.decayed && decayResult.decay > 0) {
        // 应用好感度衰减
        this.loverData.favorScore = Math.max(0, (this.loverData.favorScore || 0) - decayResult.decay)
        saveCurrentLover(this.loverData)

        uni.showToast({
          title: `好久不见，好感度-${decayResult.decay}`,
          icon: 'none',
          duration: 2000
        })
      }

      // 生成离线消息
      if (decayResult.daysAway >= 1 && this.currentCharacter) {
        const offlineMsg = generateOfflineMessage(
          this.currentCharacter.name,
          decayResult.daysAway,
          this.loverData.stage
        )
        if (offlineMsg) {
          setTimeout(() => {
            this.addAiMessage(offlineMsg, 'missing')
            this.currentEmotion = 'missing'
          }, 500)
        }
      }
    },

    // ==================== 特殊日期 ====================

    /**
     * 检查并显示特殊日期问候
     */
    checkSpecialDate() {
      if (!this.specialDateInfo || !this.currentCharacter) return

      const todayKey = `special_date_${new Date().toISOString().split('T')[0]}`
      const alreadyShown = uni.getStorageSync(todayKey)
      if (alreadyShown) return

      uni.setStorageSync(todayKey, true)
      setTimeout(() => {
        this.addAiMessage(
          `${this.specialDateInfo.greeting}`,
          'happy'
        )
        this.currentEmotion = 'happy'
      }, 1000)
    },

    // ==================== 时间线 ====================

    /**
     * 获取关系时间线事件
     */
    getTimelineEvents() {
      const events = []
      const completed = this.loverData.eventsCompleted || []
      
      if (this.loverData.createdAt) {
        events.push({
          date: this.loverData.createdAt,
          title: '初次相遇',
          icon: '🌟'
        })
      }
      
      if (completed.includes('EVT002')) {
        events.push({ title: '交换联系方式', icon: '📱' })
      }
      if (completed.includes('EVT003')) {
        events.push({ title: '第一次一起吃饭', icon: '🍽️' })
      }
      if (completed.includes('EVT006')) {
        events.push({ title: '月光下的告白', icon: '💕' })
      }
      if (completed.includes('EVT007')) {
        events.push({ title: '第一次约会', icon: '🎬' })
      }
      if (completed.includes('EVT012')) {
        events.push({ title: '浪漫求婚', icon: '💍' })
      }
      if (completed.includes('EVT013')) {
        events.push({ title: '婚礼进行曲', icon: '👰' })
      }
      if (completed.includes('EVT015')) {
        events.push({ title: '新生命降临', icon: '👶' })
      }
      if (completed.includes('EVT020')) {
        events.push({ title: '金婚典礼', icon: '🏆' })
      }
      
      return events
    },

    /**
     * 获取情绪对应的表情符号
     */
    getEmotionEmoji(emotion) {
      const emojiMap = {
        happy: '😊',
        shy: '😳',
        sad: '😢',
        angry: '😤',
        surprised: '😲',
        worried: '😟',
        missing: '🥺',
        jealous: '😒',
        nostalgic: '🥹',
        proud: '😌',
        curious: '🤔',
        neutral: ''
      }
      return emojiMap[emotion] || ''
    },

    // ==================== 页面导航 ====================

    /**
     * 跳转到设置页
     */
    goSettings() {
      uni.navigateTo({
        url: '/pages/settings/settings'
      })
    }
  }
}
</script>

<style scoped>
/* ==================== 页面整体布局 ==================== */
.chat-page {
  height: 100vh;
  display: flex;
  flex-direction: column;
  position: relative;
  background: #0a0a1a;
}

/* ==================== 背景恋人形象（全屏） ==================== */
.bg-avatar-wrapper {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 0;
}

.bg-avatar {
  width: 100%;
  height: 100%;
}

/* 背景渐变遮罩，保证上方状态栏和下方输入区的文字可读性 */
.bg-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(
    180deg,
    rgba(10, 10, 26, 0.6) 0%,
    rgba(10, 10, 26, 0.3) 30%,
    rgba(10, 10, 26, 0.5) 60%,
    rgba(10, 10, 26, 0.9) 100%
  );
}

/* ==================== 顶部状态栏（半透明浮动） ==================== */
.status-bar {
  position: relative;
  z-index: 10;
  margin: 20rpx 24rpx 0;
  padding: 16rpx 24rpx;
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(20rpx);
  border-radius: 20rpx;
  border: 1rpx solid rgba(255, 255, 255, 0.08);
}

.status-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6rpx;
}

.status-row:last-child {
  margin-bottom: 0;
}

.status-item {
  display: flex;
  align-items: center;
}

.status-icon {
  font-size: 24rpx;
  margin-right: 8rpx;
}

.status-label {
  font-size: 22rpx;
  color: rgba(255, 255, 255, 0.5);
}

.status-value {
  font-size: 26rpx;
  color: #ffffff;
  font-weight: bold;
}

.status-stage {
  font-size: 26rpx;
  color: #ff9dbd;
  font-weight: bold;
}

/* ==================== 好感度飘字动画 ==================== */
.favor-float {
  position: fixed;
  top: 240rpx;
  left: 50%;
  transform: translateX(-50%);
  z-index: 100;
  animation: float-up 2s ease-out forwards;
}

.favor-float-text {
  font-size: 48rpx;
  font-weight: bold;
}

/* 正面好感度变化（粉色发光） */
.favor-float.positive .favor-float-text {
  color: #ff6b9d;
  text-shadow: 0 0 20rpx rgba(255, 107, 157, 0.5);
}

/* 负面好感度变化（灰色） */
.favor-float.negative .favor-float-text {
  color: #8b8b8b;
  text-shadow: 0 0 20rpx rgba(139, 139, 139, 0.5);
}

/* 飘字上浮淡出动画 */
@keyframes float-up {
  0% { opacity: 1; transform: translateX(-50%) translateY(0); }
  100% { opacity: 0; transform: translateX(-50%) translateY(-120rpx); }
}

/* ==================== 对话气泡区域 ==================== */
.chat-area {
  flex: 1;
  position: relative;
  z-index: 5;
  padding: 20rpx 24rpx;
  overflow: hidden;
}

.chat-content {
  min-height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  padding-bottom: 20rpx;
}

/* 阶段提示气泡（居中显示） */
.stage-hint-bubble {
  align-self: center;
  padding: 12rpx 30rpx;
  background: rgba(255, 255, 255, 0.08);
  border-radius: 30rpx;
  margin-bottom: 20rpx;
}

.stage-hint-text {
  font-size: 24rpx;
  color: rgba(255, 255, 255, 0.6);
}

/* 消息行通用样式 */
.message-wrapper {
  display: flex;
  margin-bottom: 20rpx;
}

/* 玩家消息靠右 */
.msg-right {
  justify-content: flex-end;
}

/* AI消息靠左 */
.msg-left {
  justify-content: flex-start;
}

.msg-bubble {
  max-width: 75%;
  padding: 20rpx 28rpx;
  border-radius: 24rpx;
  position: relative;
}

/* AI消息气泡（紫色半透明 + 毛玻璃效果） */
.ai-bubble {
  background: rgba(147, 112, 219, 0.25);
  backdrop-filter: blur(10rpx);
  border: 1rpx solid rgba(147, 112, 219, 0.2);
  border-radius: 4rpx 24rpx 24rpx 24rpx;
}

.msg-name {
  font-size: 22rpx;
  color: rgba(192, 132, 252, 0.8);
  display: block;
  margin-bottom: 6rpx;
}

/* 玩家消息气泡（蓝色半透明） */
.user-bubble {
  background: rgba(59, 130, 246, 0.3);
  backdrop-filter: blur(10rpx);
  border: 1rpx solid rgba(59, 130, 246, 0.2);
  border-radius: 24rpx 4rpx 24rpx 24rpx;
}

.msg-text {
  font-size: 28rpx;
  color: rgba(255, 255, 255, 0.9);
  line-height: 1.6;
  word-break: break-all;
}

/* AI正在输入的动画指示器 */
.typing-bubble {
  min-width: 140rpx;
}

.typing-dots {
  display: flex;
  gap: 10rpx;
  padding: 10rpx 0;
}

/* 三个跳动的小圆点 */
.dot {
  width: 14rpx;
  height: 14rpx;
  background: rgba(192, 132, 252, 0.6);
  border-radius: 50%;
  animation: dot-bounce 1.4s ease-in-out infinite;
}

.dot-1 { animation-delay: 0s; }
.dot-2 { animation-delay: 0.2s; }
.dot-3 { animation-delay: 0.4s; }

@keyframes dot-bounce {
  0%, 80%, 100% { transform: scale(0.6); opacity: 0.4; }
  40% { transform: scale(1); opacity: 1; }
}

/* ==================== 底部输入区域 ==================== */
.input-area {
  position: relative;
  z-index: 10;
  padding: 16rpx 24rpx;
  padding-bottom: calc(16rpx + env(safe-area-inset-bottom));
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(30rpx);
  border-top: 1rpx solid rgba(255, 255, 255, 0.05);
}

/* 功能按钮栏（获取字数、日记、设置） */
.action-bar {
  display: flex;
  justify-content: space-around;
  margin-bottom: 16rpx;
}

.action-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 8rpx 20rpx;
}

.action-btn:active {
  opacity: 0.6;
}

.action-icon {
  font-size: 32rpx;
  margin-bottom: 4rpx;
}

.action-label {
  font-size: 20rpx;
  color: rgba(255, 255, 255, 0.5);
}

/* 输入框行（输入框 + 发送按钮） */
.input-row {
  display: flex;
  align-items: center;
  gap: 16rpx;
}

.msg-input {
  flex: 1;
  height: 76rpx;
  background: rgba(255, 255, 255, 0.08);
  border: 1rpx solid rgba(255, 255, 255, 0.12);
  border-radius: 38rpx;
  padding: 0 28rpx;
  font-size: 28rpx;
  color: #ffffff;
}

/* 渐变色发送按钮 */
.send-btn {
  width: 120rpx;
  height: 76rpx;
  background: linear-gradient(135deg, #ff6b9d, #c084fc);
  border-radius: 38rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.send-btn:active {
  transform: scale(0.95);
}

.send-btn.disabled {
  opacity: 0.4;
}

.send-btn-text {
  font-size: 28rpx;
  color: #ffffff;
  font-weight: bold;
}

/* ==================== 弹窗通用样式 ==================== */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-card {
  width: 85%;
  max-width: 600rpx;
  background: linear-gradient(135deg, #1a1a3e, #2a1a4e);
  border-radius: 32rpx;
  padding: 48rpx 40rpx;
  border: 1rpx solid rgba(255, 255, 255, 0.1);
  display: flex;
  flex-direction: column;
  align-items: center;
}

.modal-title {
  font-size: 36rpx;
  font-weight: bold;
  color: #ffffff;
  margin-bottom: 16rpx;
}

.modal-desc {
  font-size: 26rpx;
  color: rgba(255, 255, 255, 0.6);
  text-align: center;
  line-height: 1.6;
  margin-bottom: 24rpx;
}

.modal-info {
  width: 100%;
  padding: 16rpx 24rpx;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 16rpx;
  margin-bottom: 24rpx;
}

.modal-info-text {
  font-size: 24rpx;
  color: rgba(255, 255, 255, 0.5);
  display: block;
  margin-bottom: 6rpx;
}

.modal-actions {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}

.modal-btn {
  width: 100%;
  height: 88rpx;
  border-radius: 44rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.modal-btn.primary {
  background: linear-gradient(135deg, #ff6b9d, #c084fc);
}

.modal-btn.secondary {
  background: rgba(255, 255, 255, 0.1);
  border: 1rpx solid rgba(255, 255, 255, 0.2);
}

.modal-btn:active {
  transform: scale(0.96);
}

.modal-btn-text {
  font-size: 28rpx;
  color: #ffffff;
  font-weight: bold;
}

.modal-close {
  margin-top: 20rpx;
  padding: 10rpx 20rpx;
}

.modal-close-text {
  font-size: 26rpx;
  color: rgba(255, 255, 255, 0.4);
}

/* ==================== 阶段推进弹窗 ==================== */
.stage-modal .stage-modal-emoji {
  font-size: 80rpx;
  margin-bottom: 16rpx;
}

.stage-modal-title {
  font-size: 40rpx;
  font-weight: bold;
  color: #ffffff;
  margin-bottom: 12rpx;
}

/* 阶段名称使用渐变色文字 */
.stage-modal-stage {
  font-size: 48rpx;
  font-weight: bold;
  background: linear-gradient(135deg, #ff6b9d, #c084fc);
  -webkit-background-clip: text;
  color: transparent;
  margin-bottom: 16rpx;
}

.stage-modal-desc {
  font-size: 26rpx;
  color: rgba(255, 255, 255, 0.6);
  margin-bottom: 24rpx;
  text-align: center;
}

/* 阶段事件卡片（左侧粉色边框） */
.stage-event {
  width: 100%;
  padding: 20rpx 24rpx;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 16rpx;
  margin-bottom: 24rpx;
  border-left: 4rpx solid #ff6b9d;
}

.stage-event-title {
  font-size: 28rpx;
  color: #ff9dbd;
  font-weight: bold;
  display: block;
  margin-bottom: 8rpx;
}

.stage-event-desc {
  font-size: 24rpx;
  color: rgba(255, 255, 255, 0.5);
}

/* ==================== 恋人日记弹窗 ==================== */
.diary-modal {
  max-height: 70vh;
}

.diary-content {
  width: 100%;
  max-height: 400rpx;
  margin-bottom: 20rpx;
}

.diary-text {
  font-size: 28rpx;
  color: rgba(255, 255, 255, 0.7);
  line-height: 1.8;
  font-style: italic;
}

/* ==================== 结局弹窗 ==================== */
.ending-modal {
  text-align: center;
}

.ending-emoji {
  font-size: 100rpx;
  margin-bottom: 20rpx;
}

.ending-title {
  font-size: 44rpx;
  font-weight: bold;
  color: #ffffff;
  margin-bottom: 16rpx;
}

.ending-desc {
  font-size: 26rpx;
  color: rgba(255, 255, 255, 0.6);
  line-height: 1.6;
  margin-bottom: 24rpx;
}

.ending-stats {
  width: 100%;
  padding: 20rpx;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 16rpx;
  margin-bottom: 24rpx;
}

.ending-stat {
  font-size: 24rpx;
  color: rgba(255, 255, 255, 0.5);
  display: block;
  margin-bottom: 8rpx;
}

/* ==================== 日夜模式 ==================== */
.chat-page.night-mode .bg-overlay {
  background: linear-gradient(
    180deg,
    rgba(5, 5, 20, 0.75) 0%,
    rgba(5, 5, 20, 0.4) 30%,
    rgba(5, 5, 20, 0.6) 60%,
    rgba(5, 5, 20, 0.95) 100%
  );
}

.chat-page.night-mode .status-bar {
  background: rgba(0, 0, 0, 0.55);
}

.chat-page.night-mode .input-area {
  background: rgba(0, 0, 0, 0.75);
}

/* ==================== 表情指示器 ==================== */
.ai-name-row {
  display: flex;
  align-items: center;
  gap: 8rpx;
  margin-bottom: 6rpx;
}

.emotion-indicator {
  font-size: 24rpx;
  animation: emotion-pop 0.3s ease-out;
}

@keyframes emotion-pop {
  0% { transform: scale(0); }
  50% { transform: scale(1.3); }
  100% { transform: scale(1); }
}

/* ==================== 新手引导 ==================== */
.guide-modal {
  text-align: center;
}

.guide-emoji {
  font-size: 80rpx;
  margin-bottom: 16rpx;
}

.guide-tips {
  width: 100%;
  padding: 20rpx 24rpx;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 16rpx;
  margin-bottom: 24rpx;
}

.guide-tip {
  font-size: 24rpx;
  color: rgba(255, 255, 255, 0.6);
  display: block;
  margin-bottom: 10rpx;
  text-align: left;
}

.guide-tip:last-child {
  margin-bottom: 0;
}

/* ==================== 特殊日期横幅 ==================== */
.special-date-banner {
  position: fixed;
  top: 180rpx;
  left: 50%;
  transform: translateX(-50%);
  z-index: 15;
  padding: 10rpx 30rpx;
  background: linear-gradient(135deg, rgba(255, 107, 157, 0.3), rgba(192, 132, 252, 0.3));
  backdrop-filter: blur(10rpx);
  border-radius: 30rpx;
  border: 1rpx solid rgba(255, 255, 255, 0.15);
}

.special-date-text {
  font-size: 22rpx;
  color: rgba(255, 255, 255, 0.8);
}

/* ==================== 时间线 ==================== */
.timeline-modal {
  max-height: 70vh;
}

.timeline-content {
  width: 100%;
  max-height: 500rpx;
  padding: 20rpx 0;
}

.timeline-item {
  display: flex;
  align-items: center;
  position: relative;
  padding-left: 40rpx;
  margin-bottom: 30rpx;
}

.timeline-dot {
  position: absolute;
  left: 0;
  width: 16rpx;
  height: 16rpx;
  background: linear-gradient(135deg, #ff6b9d, #c084fc);
  border-radius: 50%;
}

.timeline-line {
  position: absolute;
  left: 7rpx;
  top: 20rpx;
  width: 2rpx;
  height: 40rpx;
  background: rgba(255, 255, 255, 0.15);
}

.timeline-info {
  display: flex;
  align-items: center;
  gap: 12rpx;
}

.timeline-icon {
  font-size: 28rpx;
}

.timeline-title {
  font-size: 26rpx;
  color: rgba(255, 255, 255, 0.8);
}

.timeline-empty {
  padding: 40rpx;
  text-align: center;
}

.timeline-empty-text {
  font-size: 26rpx;
  color: rgba(255, 255, 255, 0.4);
}
</style>
