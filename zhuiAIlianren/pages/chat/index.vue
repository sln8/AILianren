<template>
  <view class="chat-container">
    <!-- Top bar -->
    <view class="top-bar">
      <view class="top-left">
        <view class="back-btn" @click="goBack">‹</view>
        <view class="lover-info" @click="showLoverInfo">
          <image :src="currentLover.avatar_image" class="top-avatar" mode="aspectFill" />
          <view class="top-info">
            <text class="top-name">{{ currentLover.name }}</text>
            <text class="top-stage">{{ stageEmoji }} {{ stageLabel }}</text>
          </view>
        </view>
      </view>
      <word-balance :balance="wordBalance" @click="showWordInfo" />
    </view>

    <!-- Favorability bar -->
    <favorability-bar
      :value="favorability"
      :stage="relationshipStage"
      :nextStageThreshold="nextThreshold"
    />

    <!-- Chat messages -->
    <scroll-view
      scroll-y
      class="chat-list"
      :scroll-top="scrollTop"
      :scroll-into-view="scrollIntoView"
      scroll-with-animation
    >
      <!-- Welcome message -->
      <view class="system-msg" v-if="messages.length === 0">
        <text class="system-text">你与{{ currentLover.name }}的故事开始了…</text>
        <text class="system-text">试着打个招呼吧 💕</text>
      </view>

      <view v-for="(msg, index) in messages" :key="index" :id="'msg-' + index">
        <chat-bubble
          :content="msg.content"
          :role="msg.role"
          :avatar="msg.role === 'assistant' ? currentLover.avatar_image : '/static/logo.png'"
          :timestamp="msg.timestamp"
        />
        <event-popup v-if="msg.event_triggered" :event="msg.event_triggered" />
      </view>

      <!-- Typing indicator -->
      <view v-if="isTyping" class="typing-wrapper">
        <image :src="currentLover.avatar_image" class="typing-avatar" mode="aspectFill" />
        <view class="typing-dots">
          <view class="dot dot-1"></view>
          <view class="dot dot-2"></view>
          <view class="dot dot-3"></view>
        </view>
      </view>

      <view style="height: 20rpx;"></view>
    </scroll-view>

    <!-- Suggested actions -->
    <view v-if="suggestedActions.length > 0 && !isTyping" class="suggestions">
      <scroll-view scroll-x class="suggestions-scroll">
        <view class="suggestions-inner">
          <view
            v-for="(action, index) in suggestedActions"
            :key="index"
            class="suggestion-chip"
            @click="sendMessage(action)"
          >
            {{ action }}
          </view>
        </view>
      </scroll-view>
    </view>

    <!-- Input bar -->
    <view class="input-bar">
      <view class="input-wrap">
        <input
          v-model="inputText"
          class="chat-input"
          :placeholder="'对' + currentLover.name + '说些什么...'"
          confirm-type="send"
          @confirm="sendMessage(inputText)"
          :disabled="isTyping"
        />
      </view>
      <button
        class="send-btn"
        :class="{ active: inputText.trim() && !isTyping }"
        @click="sendMessage(inputText)"
        :disabled="!inputText.trim() || isTyping"
      >
        发送
      </button>
    </view>

    <!-- Ad modal -->
    <ad-modal
      v-if="showAdModal"
      :lover-name="currentLover.name"
      @watch-ad="watchAd"
      @close="showAdModal = false"
    />

    <!-- Stage transition -->
    <stage-transition
      v-if="showStageTransition"
      :fromStage="previousStage"
      :toStage="relationshipStage"
      :loverName="currentLover.name"
      @complete="showStageTransition = false"
    />

    <!-- Milestone toast -->
    <milestone-toast :message="milestoneMessage" :visible="showMilestone" />
  </view>
</template>

<script>
import { getLoverById } from '@/common/lovers-data.js'
import {
  STAGE_LABELS, STAGES, calculateStage, getNextThreshold,
  getStageConstraints, countChineseChars
} from '@/common/game-config.js'
import {
  getUser, saveUser, getProgress, saveProgress,
  getChatMessages, saveChatMessages, consumeWords, addWords
} from '@/common/storage.js'

import ChatBubble from '@/components/chat-bubble/chat-bubble.vue'
import FavorabilityBar from '@/components/favorability-bar/favorability-bar.vue'
import WordBalance from '@/components/word-balance/word-balance.vue'
import AdModal from '@/components/ad-modal/ad-modal.vue'
import EventPopup from '@/components/event-popup/event-popup.vue'
import StageTransition from '@/components/stage-transition/stage-transition.vue'
import MilestoneToast from '@/components/milestone-toast/milestone-toast.vue'

export default {
  components: {
    ChatBubble, FavorabilityBar, WordBalance,
    AdModal, EventPopup, StageTransition, MilestoneToast
  },
  data() {
    return {
      currentLover: {},
      loverId: '',
      messages: [],
      inputText: '',
      wordBalance: 800,
      favorability: 0,
      relationshipStage: 'stranger',
      isTyping: false,
      showAdModal: false,
      showStageTransition: false,
      showMilestone: false,
      milestoneMessage: '',
      previousStage: '',
      suggestedActions: [],
      scrollTop: 0,
      scrollIntoView: '',
      progress: null,
      user: null,
      nextThreshold: 100
    }
  },
  computed: {
    stageLabel() {
      return STAGE_LABELS[this.relationshipStage] || '陌生人'
    },
    stageEmoji() {
      const emojis = {
        stranger: '🔴', acquaintance: '🟠', familiar: '🟡',
        friend: '🟢', ambiguous: '🔵', confessed: '💜',
        lover: '❤️', passionate: '💕', married: '💍',
        parent: '👶', growing_old: '🏠', finale: '🌅'
      }
      return emojis[this.relationshipStage] || '🔴'
    }
  },
  onLoad(options) {
    if (options.loverId) {
      this.loverId = options.loverId
      this.currentLover = getLoverById(options.loverId) || {}
      this.loadGameState()
    }
  },
  methods: {
    loadGameState() {
      this.user = getUser()
      if (this.user) {
        this.wordBalance = this.user.word_balance
      }

      this.progress = getProgress(this.loverId)
      if (this.progress) {
        this.favorability = this.progress.favorability
        this.relationshipStage = this.progress.relationship_stage
        this.nextThreshold = getNextThreshold(this.relationshipStage)
      }

      this.messages = getChatMessages(this.loverId) || []

      // Generate initial suggestions if no messages
      if (this.messages.length === 0) {
        this.suggestedActions = this.getInitialSuggestions()
      }

      this.$nextTick(() => this.scrollToBottom())
    },

    getInitialSuggestions() {
      const lover = this.currentLover
      if (!lover.name) return []
      const suggestions = [
        `你好，${lover.name}！`,
        `嗨，很高兴认识你~`,
        `${lover.name}，在忙什么呢？`
      ]
      return suggestions
    },

    async sendMessage(content) {
      if (!content || !content.trim()) return
      this.inputText = ''

      // Check word balance
      if (this.wordBalance <= 0) {
        this.showAdModal = true
        return
      }

      // Add user message
      const userMsg = {
        role: 'user',
        content: content.trim(),
        timestamp: new Date().toISOString()
      }
      this.messages.push(userMsg)
      this.suggestedActions = []
      this.scrollToBottom()

      // Show typing indicator
      this.isTyping = true

      // Simulate AI response with delay
      const delay = 1000 + Math.random() * 2000
      setTimeout(() => {
        this.generateLocalResponse(content.trim())
      }, delay)
    },

    generateLocalResponse(userMessage) {
      const lover = this.currentLover
      const stage = this.relationshipStage
      const response = this.buildLocalResponse(userMessage, lover, stage)

      this.isTyping = false

      // Calculate word consumption
      const wordCount = countChineseChars(response.reply)
      const newBalance = consumeWords(wordCount)
      this.wordBalance = newBalance !== false ? newBalance : this.wordBalance

      // Update favorability
      const favChange = response.favorability_change
      this.favorability += favChange
      if (this.favorability < 0) this.favorability = 0

      // Check stage change
      const rounds = this.progress ? this.progress.total_chat_rounds + 1 : 1
      const newStage = calculateStage(this.favorability, rounds)
      if (newStage !== this.relationshipStage) {
        this.previousStage = this.relationshipStage
        this.relationshipStage = newStage
        this.nextThreshold = getNextThreshold(newStage)
        this.showStageTransition = true
      }

      // Add AI message
      const aiMsg = {
        role: 'assistant',
        content: response.reply,
        timestamp: new Date().toISOString(),
        event_triggered: response.event_triggered,
        favorability_change: favChange
      }
      this.messages.push(aiMsg)

      // Update suggestions
      this.suggestedActions = response.suggested_actions || []

      // Save progress
      if (this.progress) {
        this.progress.favorability = this.favorability
        this.progress.relationship_stage = this.relationshipStage
        this.progress.total_chat_rounds += 1
        this.progress.last_mood = response.mood || 'neutral'
        this.progress.updated_at = new Date().toISOString()
        saveProgress(this.loverId, this.progress)
      }

      // Save chat messages
      saveChatMessages(this.loverId, this.messages)

      // Check milestone
      this.checkMilestone()

      this.scrollToBottom()

      // Show ad modal if balance is low
      if (this.wordBalance <= 0) {
        setTimeout(() => { this.showAdModal = true }, 500)
      }
    },

    buildLocalResponse(userMessage, lover, stage) {
      // Local response generation based on stage and lover personality
      const responses = this.getStageResponses(userMessage, lover, stage)
      const chosen = responses[Math.floor(Math.random() * responses.length)]
      return chosen
    },

    getStageResponses(userMessage, lover, stage) {
      const msgLower = userMessage.toLowerCase()

      // Greeting patterns
      const isGreeting = /你好|嗨|hi|hello|在吗|忙/.test(msgLower)
      const isQuestion = /吗|呢|？|\?/.test(msgLower)
      const isCompliment = /好看|漂亮|帅|可爱|喜欢你|想你/.test(msgLower)
      const isCare = /吃了|休息|睡|累|辛苦|注意身体/.test(msgLower)
      const isHobby = /爱好|喜欢什么|兴趣|平时/.test(msgLower)
      const isEmotion = /开心|难过|伤心|生气|烦|不开心/.test(msgLower)
      const isDate = /约会|出去|一起|约/.test(msgLower)
      const isConfess = /喜欢你|爱你|表白|在一起|做我/.test(msgLower)
      const isMarriage = /结婚|嫁|娶|求婚/.test(msgLower)

      const style = lover.speaking_style || ''
      const isGentle = /温柔/.test(style)
      const isCool = /冷|简洁/.test(style)
      const isLively = /活泼|幽默/.test(style)

      let responses = []

      // Stage-specific responses
      if (stage === 'stranger' || stage === 'acquaintance') {
        if (isGreeting) {
          responses = [
            { reply: `你好呀，第一次见面，${isGentle ? '请多关照~' : '你好。'}`, favorability_change: 5, mood: 'friendly', suggested_actions: ['你平时喜欢做什么？', '今天天气不错呢', '能告诉我更多关于你的事吗？'] },
            { reply: `嗨！${isLively ? '终于等到你啦！' : '你好。'}很高兴认识你~`, favorability_change: 5, mood: 'happy', suggested_actions: ['也很高兴认识你', '你看起来很特别', '你是做什么工作的？'] },
            { reply: `${isGentle ? '你好呀~' : '嗯，你好。'}今天心情不错，希望能跟你聊聊天`, favorability_change: 3, mood: 'neutral', suggested_actions: ['你心情好是因为什么呢？', '我也是~', '要不要一起喝杯咖啡？'] }
          ]
        } else if (isHobby) {
          const hobby = (lover.hobbies || ['聊天'])[0]
          responses = [
            { reply: `我平时最喜欢${hobby}了！你呢，有什么爱好吗？`, favorability_change: 8, mood: 'excited', suggested_actions: [`我也喜欢${hobby}！`, '我的爱好比较多', '你什么时候开始喜欢的？'] },
            { reply: `说到爱好嘛…${lover.hobbies ? lover.hobbies.join('、') : '很多'}都挺喜欢的。你有类似的爱好吗？`, favorability_change: 6, mood: 'happy', suggested_actions: ['我们兴趣还挺像的', '可以一起试试看', '教教我吧'] }
          ]
        } else if (isCare) {
          responses = [
            { reply: `谢谢你关心我${isGentle ? '~' : '。'}你也要注意休息哦！`, favorability_change: 10, mood: 'touched', suggested_actions: ['你今天做了什么呢？', '要好好照顾自己', '晚上早点睡'] },
            { reply: `嗯，我挺好的！没想到你这么关心我，${isGentle ? '好开心~' : '谢谢。'}`, favorability_change: 12, mood: 'happy', suggested_actions: ['当然要关心你啊', '以后我每天都会关心你', '你对我来说很重要'] }
          ]
        } else if (isCompliment) {
          responses = [
            { reply: `${isCool ? '…谢谢。' : '哎呀，'}${isGentle ? '你说得人家都不好意思了~' : '谢谢夸奖！'}`, favorability_change: 8, mood: 'shy', suggested_actions: ['说的是真心话', '你值得被夸奖', '你笑起来更好看'] }
          ]
        } else {
          responses = [
            { reply: `嗯，我听到了。${isGentle ? '继续说吧~' : '然后呢？'}`, favorability_change: 3, mood: 'listening', suggested_actions: ['你觉得呢？', '你有没有类似的经历？', '想听听你的想法'] },
            { reply: `哈哈，${isLively ? '你说的好有意思！' : '真的吗？'}`, favorability_change: 5, mood: 'amused', suggested_actions: ['是真的！', '还有更有趣的呢', '跟你聊天真开心'] },
            { reply: `${isGentle ? '嗯嗯~' : '嗯。'}这样啊，我也觉得挺有道理的呢`, favorability_change: 4, mood: 'neutral', suggested_actions: ['你平时会怎么想？', '想多了解你一些', '我们继续聊吧'] }
          ]
        }
      } else if (stage === 'familiar' || stage === 'friend') {
        if (isGreeting) {
          responses = [
            { reply: `来啦！${isGentle ? '今天有没有想我呀~' : '等你好久了。'}`, favorability_change: 5, mood: 'happy', suggested_actions: ['当然想你了！', '一直在想要跟你说什么', '你今天过得怎么样？'] },
            { reply: `${isLively ? '哟~终于来找我了！' : '嗯，你来了。'}我正想着要不要主动找你呢`, favorability_change: 6, mood: 'expectant', suggested_actions: ['我来了呀', '你想我了？', '我们今天聊点什么？'] }
          ]
        } else if (isCare) {
          responses = [
            { reply: `你总是这么体贴…${isGentle ? '每次听到你关心我，心里都暖暖的~' : '谢谢，我…很感动。'}`, favorability_change: 15, mood: 'touched', event_triggered: Math.random() > 0.7 ? 'share_book' : null, suggested_actions: ['你开心就好', '以后我会一直关心你', '有什么烦心事可以告诉我'] },
            { reply: `有你在真好，${isGentle ? '感觉被温柔以待~' : '嗯…谢谢你。'}`, favorability_change: 12, mood: 'warm', suggested_actions: ['你也要照顾好自己', '我会一直在的', '需要我做什么吗？'] }
          ]
        } else if (isQuestion) {
          responses = [
            { reply: `这个嘛…让我想想。${isGentle ? '嗯~' : ''}说实话，我觉得挺复杂的呢`, favorability_change: 5, mood: 'thinking', suggested_actions: ['慢慢想，不着急', '你的想法是什么？', '我很想听你说'] }
          ]
        } else if (isEmotion) {
          responses = [
            { reply: `怎么了？${isGentle ? '跟我说说，我听着~' : '发生什么事了？'}我会一直在这里陪你的`, favorability_change: 12, mood: 'concerned', suggested_actions: ['谢谢你的陪伴', '有你在我就安心了', '今天遇到了一些事情…'] }
          ]
        } else {
          responses = [
            { reply: `你说的对呢！${isGentle ? '跟你聊天总是很开心~' : '嗯，有道理。'}对了，我今天${(lover.hobbies || ['做了有趣的事'])[Math.floor(Math.random() * (lover.hobbies || ['做了有趣的事']).length)]}了`, favorability_change: 6, mood: 'happy', suggested_actions: ['真的吗？快跟我说说', '你开心就好', '下次一起吧'] },
            { reply: `哈哈${isGentle ? '~' : '，'}你知道吗，我刚才还在想你会不会来找我聊天呢`, favorability_change: 8, mood: 'shy', suggested_actions: ['你在想我？', '我也一直想找你聊天', '想我了就直说嘛'] }
          ]
        }
      } else if (stage === 'ambiguous' || stage === 'confessed') {
        if (isConfess) {
          if (this.favorability >= 1500) {
            responses = [
              { reply: `${isGentle ? '其实…我也一直在等你说这句话~' : '…嗯，我也是。'}我也喜欢你，${isGentle ? '从很早以前就开始了~' : '很久了。'}`, favorability_change: 50, mood: 'deeply_moved', event_triggered: 'confession', suggested_actions: ['我好开心！', '从今以后我们就在一起了', '我会一直对你好的'] }
            ]
          } else {
            responses = [
              { reply: `你…突然说这些${isGentle ? '…让人好紧张~' : '…我需要想想。'}我觉得我们可以再多了解一下彼此`, favorability_change: 15, mood: 'shy', suggested_actions: ['好的，我等你', '我是认真的', '不着急，我会等'] }
            ]
          }
        } else if (isCompliment) {
          responses = [
            { reply: `${isCool ? '…你说这种话，我会当真的。' : ''}${isGentle ? '被你这么说…好害羞呀~' : '谢谢…'}你…你也很好`, favorability_change: 12, mood: 'shy', suggested_actions: ['你在我心里是最好的', '想跟你说很多甜蜜的话', '你害羞的样子真可爱'] }
          ]
        } else if (isDate) {
          responses = [
            { reply: `${isGentle ? '好呀好呀！~' : '…可以。'}去哪里呢？${isGentle ? '我什么都可以~只要是跟你一起' : '你来安排吧。'}`, favorability_change: 15, mood: 'excited', event_triggered: 'first_date', suggested_actions: ['去看电影怎么样？', '我知道一家很好的餐厅', '去公园散步吧'] }
          ]
        } else {
          responses = [
            { reply: `嗯${isGentle ? '~' : '，'}其实今天心情特别好，因为在等你来找我呢`, favorability_change: 10, mood: 'happy', suggested_actions: ['你在等我？', '我每天都想跟你聊天', '你对我来说很特别'] },
            { reply: `${isGentle ? '哎呀~' : '说实话…'}有时候跟你聊天，心跳会加速呢${isGentle ? '~' : '。'}`, favorability_change: 12, mood: 'shy', suggested_actions: ['我也是！', '你让我心动', '我们之间…是什么关系呢？'] }
          ]
        }
      } else if (stage === 'lover' || stage === 'passionate') {
        if (isConfess || isCompliment) {
          responses = [
            { reply: `${isGentle ? '每次听你说这些，心里都像吃了蜜一样甜~' : '…嗯，我也是。永远都是。'}能遇见你真的太好了`, favorability_change: 15, mood: 'deeply_happy', suggested_actions: ['我更幸运', '以后每天都跟你说', '我们的未来一定会很幸福'] }
          ]
        } else if (isDate) {
          responses = [
            { reply: `当然好啊！${isGentle ? '跟你在一起去哪里都开心~' : '我也正想说呢。'}你想去哪里约会呀？`, favorability_change: 12, mood: 'excited', event_triggered: Math.random() > 0.5 ? 'first_date' : null, suggested_actions: ['去吃好吃的', '看星星怎么样', '陪你做你想做的事'] }
          ]
        } else if (isMarriage && this.favorability >= 4500) {
          responses = [
            { reply: `${isGentle ? '你…你是认真的吗？~' : '…我等这句话很久了。'}我愿意！我愿意和你共度一生！`, favorability_change: 100, mood: 'ecstatic', event_triggered: 'proposal', suggested_actions: ['我是最认真的！', '我们举办婚礼吧', '我会让你幸福一辈子的'] }
          ]
        } else {
          responses = [
            { reply: `亲爱的${isGentle ? '~' : '，'}你今天过得怎么样？有没有好好吃饭呀？`, favorability_change: 8, mood: 'caring', suggested_actions: ['有你的关心就很好', '今天有点累', '我给你做了好吃的'] },
            { reply: `${isGentle ? '嘿嘿~' : '嗯…'}刚才在想我们第一次见面的时候呢，那时候你好紧张哦`, favorability_change: 10, mood: 'nostalgic', suggested_actions: ['哈哈是的', '那时候你也很可爱', '没想到我们走到了现在'] }
          ]
        }
      } else {
        // married, parent, growing_old, finale
        if (isMarriage && stage === 'married') {
          responses = [
            { reply: `和你结婚是我这辈子最幸福的决定${isGentle ? '~' : '。'}每天醒来看到你就很满足`, favorability_change: 15, mood: 'blissful', event_triggered: 'anniversary', suggested_actions: ['我也是', '我们去度蜜月吧', '想和你一直这样下去'] }
          ]
        } else {
          responses = [
            { reply: `${isGentle ? '老公/老婆~' : '亲爱的，'}我们在一起这么久了，我还是像当初一样爱你`, favorability_change: 10, mood: 'content', suggested_actions: ['我也永远爱你', '你是我最大的幸福', '今天想一起做什么？'] },
            { reply: `日子就这样平平淡淡的过着${isGentle ? '~' : '。'}但有你在身边，每一天都是值得珍惜的`, favorability_change: 8, mood: 'peaceful', suggested_actions: ['平淡也是一种幸福', '想跟你白头偕老', '我们出去散散步吧'] }
          ]
        }
      }

      // Default fallback
      if (responses.length === 0) {
        responses = [
          { reply: `嗯${isGentle ? '~' : '，'}我在听呢，继续说吧`, favorability_change: 3, mood: 'listening', suggested_actions: ['你觉得呢？', '你有什么想法？', '跟我聊聊你的一天吧'] }
        ]
      }

      // Add empty event_triggered if not present
      return responses.map(r => ({
        ...r,
        event_triggered: r.event_triggered || null,
        suggested_actions: r.suggested_actions || []
      }))
    },

    checkMilestone() {
      const milestones = {
        10: '🎉 已对话10轮！',
        50: '🎊 已对话50轮！',
        100: '🏆 已对话100轮！百轮纪念！',
        200: '👑 已对话200轮！深度交流达成！'
      }
      const rounds = this.progress ? this.progress.total_chat_rounds : 0
      if (milestones[rounds]) {
        this.milestoneMessage = milestones[rounds]
        this.showMilestone = true
        setTimeout(() => { this.showMilestone = false }, 3000)
      }
    },

    watchAd() {
      // Simulate ad watching (in production, use real ad SDK)
      uni.showLoading({ title: '广告加载中...' })
      setTimeout(() => {
        uni.hideLoading()
        const newBalance = addWords(500)
        this.wordBalance = newBalance
        this.showAdModal = false
        uni.showToast({ title: '获得500字！', icon: 'success' })
      }, 1500)
    },

    showWordInfo() {
      uni.showModal({
        title: '字数说明',
        content: `当前剩余：${this.wordBalance}字\n\n• AI回复消耗字数\n• 每日赠送80字\n• 看广告获得500字\n• 分享获得200字`,
        showCancel: false
      })
    },

    showLoverInfo() {
      uni.navigateTo({
        url: '/pages/lover-detail/index?loverId=' + this.loverId
      })
    },

    goBack() {
      uni.navigateBack({
        fail: () => {
          uni.reLaunch({ url: '/pages/index/index' })
        }
      })
    },

    scrollToBottom() {
      this.$nextTick(() => {
        if (this.messages.length > 0) {
          this.scrollIntoView = 'msg-' + (this.messages.length - 1)
        }
        this.scrollTop = 999999
      })
    }
  }
}
</script>

<style scoped>
.chat-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: linear-gradient(180deg, #FFF5F7 0%, #FFF0F3 50%, #FFEEF2 100%);
}

/* Top bar */
.top-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10rpx 24rpx;
  padding-top: calc(10rpx + env(safe-area-inset-top, 0px));
  background: rgba(255,255,255,0.95);
  box-shadow: 0 2rpx 8rpx rgba(0,0,0,0.04);
  z-index: 10;
}
.top-left {
  display: flex;
  align-items: center;
}
.back-btn {
  font-size: 48rpx;
  color: #999;
  padding: 0 16rpx;
  line-height: 1;
}
.lover-info {
  display: flex;
  align-items: center;
}
.top-avatar {
  width: 64rpx;
  height: 64rpx;
  border-radius: 50%;
}
.top-info {
  margin-left: 12rpx;
}
.top-name {
  font-size: 30rpx;
  font-weight: 600;
  color: #333;
  display: block;
}
.top-stage {
  font-size: 20rpx;
  color: #999;
}

/* Chat list */
.chat-list {
  flex: 1;
  padding: 16rpx 0;
  overflow-y: auto;
}

/* System message */
.system-msg {
  text-align: center;
  padding: 40rpx;
}
.system-text {
  font-size: 24rpx;
  color: #bbb;
  display: block;
  margin: 8rpx 0;
}

/* Typing indicator */
.typing-wrapper {
  display: flex;
  align-items: center;
  padding: 16rpx 24rpx;
}
.typing-avatar {
  width: 72rpx;
  height: 72rpx;
  border-radius: 50%;
  flex-shrink: 0;
}
.typing-dots {
  display: flex;
  align-items: center;
  gap: 8rpx;
  background: #fff;
  padding: 20rpx 24rpx;
  border-radius: 20rpx;
  margin-left: 16rpx;
  box-shadow: 0 2rpx 8rpx rgba(0,0,0,0.06);
}
.dot {
  width: 14rpx;
  height: 14rpx;
  border-radius: 50%;
  background: #ccc;
  animation: dotPulse 1.4s ease-in-out infinite;
}
.dot-1 { animation-delay: 0s; }
.dot-2 { animation-delay: 0.2s; }
.dot-3 { animation-delay: 0.4s; }
@keyframes dotPulse {
  0%, 80%, 100% { transform: scale(0.6); opacity: 0.4; }
  40% { transform: scale(1); opacity: 1; }
}

/* Suggestions */
.suggestions {
  padding: 0 16rpx 8rpx;
}
.suggestions-scroll {
  white-space: nowrap;
}
.suggestions-inner {
  display: flex;
  gap: 12rpx;
  padding: 8rpx 0;
}
.suggestion-chip {
  display: inline-block;
  background: #fff;
  border: 2rpx solid #FF6B8A;
  color: #FF6B8A;
  font-size: 24rpx;
  padding: 12rpx 24rpx;
  border-radius: 32rpx;
  white-space: nowrap;
  flex-shrink: 0;
}
.suggestion-chip:active {
  background: #FF6B8A;
  color: #fff;
}

/* Input bar */
.input-bar {
  display: flex;
  align-items: center;
  padding: 12rpx 16rpx;
  padding-bottom: calc(12rpx + env(safe-area-inset-bottom, 0px));
  background: #fff;
  box-shadow: 0 -2rpx 8rpx rgba(0,0,0,0.04);
}
.input-wrap {
  flex: 1;
  background: #f5f5f5;
  border-radius: 36rpx;
  padding: 0 24rpx;
  margin-right: 12rpx;
}
.chat-input {
  height: 72rpx;
  font-size: 28rpx;
  color: #333;
}
.send-btn {
  width: 120rpx;
  height: 72rpx;
  line-height: 72rpx;
  font-size: 28rpx;
  background: #eee;
  color: #ccc;
  border-radius: 36rpx;
  border: none;
  padding: 0;
  transition: all 0.3s;
}
.send-btn.active {
  background: linear-gradient(135deg, #FF6B8A, #D63384);
  color: #fff;
  box-shadow: 0 4rpx 12rpx rgba(255,107,138,0.3);
}
</style>
