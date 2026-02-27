<template>
	<view class="chat-page">
		<!-- Character Background -->
		<image v-if="character" :src="character.image" class="character-bg" mode="aspectFill" />
		<view class="bg-overlay"></view>

		<!-- Top Bar -->
		<view class="top-bar">
			<view class="top-left" @tap="goSettings">
				<text class="menu-icon">≡</text>
			</view>
			<view class="top-center">
				<text class="char-name">{{ character ? character.name : '' }}</text>
			</view>
			<view class="top-right">
				<text class="fav-display">❤️ {{ gameState.favorability }}</text>
				<WordBalanceTag :balance="wordBalance" />
			</view>
		</view>

		<!-- Chat Area -->
		<view class="chat-area">
			<scroll-view
				scroll-y
				class="chat-scroll"
				:scroll-into-view="scrollToId"
				:scroll-with-animation="true"
			>
				<view class="chat-messages">
					<view
						v-for="(msg, index) in messages"
						:key="msg.timestamp + '_' + index"
						:id="'msg_' + index"
					>
						<ChatBubble
							:message="msg"
							:characterAvatar="character ? character.image : ''"
						/>
					</view>
					<!-- Loading indicator -->
					<view v-if="isLoading" class="loading-wrap">
						<view class="typing-indicator">
							<view class="dot dot1"></view>
							<view class="dot dot2"></view>
							<view class="dot dot3"></view>
						</view>
					</view>
					<view id="msg_bottom" style="height: 20rpx;"></view>
				</view>
			</scroll-view>
		</view>

		<!-- Input Area -->
		<view class="input-bar">
			<view v-if="wordBalance < 500 && wordBalance > 0" class="word-warning">
				<text class="warning-text">⚠️ 字数余额不足500，请注意节省用字</text>
			</view>
			<view v-if="wordBalance <= 0" class="input-row input-row-center">
				<text class="no-words-hint">字数已用完，看广告获取更多字数</text>
				<AdRewardButton :disabled="!canWatchAdNow" @watch="watchAd" />
			</view>
			<view v-else class="input-row">
				<input
					class="msg-input"
					v-model="inputText"
					placeholder="说点什么吧..."
					placeholder-style="color: rgba(255,255,255,0.35)"
					:maxlength="200"
					confirm-type="send"
					@confirm="sendMessage"
					:disabled="isLoading"
				/>
				<view :class="['send-btn', (!inputText.trim() || isLoading) ? 'send-btn-disabled' : '']" @tap="sendMessage">
					<text class="send-icon">📤</text>
				</view>
			</view>
		</view>

		<!-- Event Popup -->
		<EventPopup :show="showEvent" :event="currentEvent" @close="onEventClose" />
	</view>
</template>

<script>
import { chatStore } from '@/store/chat.js'
import { gameStore } from '@/store/game.js'
import { userStore } from '@/store/user.js'
import { getCharacterById } from '@/utils/characters.js'
import { checkForEvents } from '@/utils/event-checker.js'
import { consumeWords, checkBalance, getWordsFromAd } from '@/utils/word-manager.js'
import { showRewardAd, canWatchAd } from '@/utils/ad-manager.js'

// Reply pools keyed by stage category
const STAGE_REPLIES = {
	stranger: [
		{ reply: '你好，有什么事吗？', mood: 'neutral', favorability_change: 1, trust_change: 0, intimacy_change: 0, boredom_change: 0, freshness_change: -1 },
		{ reply: '嗯……你是？我们认识吗？', mood: 'curious', favorability_change: 1, trust_change: 0, intimacy_change: 0, boredom_change: 0, freshness_change: -1 },
		{ reply: '你好呀，我好像在哪见过你。', mood: 'friendly', favorability_change: 2, trust_change: 1, intimacy_change: 0, boredom_change: 0, freshness_change: -1 },
		{ reply: '不好意思，我有点忙，改天再聊？', mood: 'neutral', favorability_change: 0, trust_change: 0, intimacy_change: 0, boredom_change: 1, freshness_change: -2 },
		{ reply: '哦，好吧。', mood: 'neutral', favorability_change: 0, trust_change: 0, intimacy_change: 0, boredom_change: 1, freshness_change: -1 },
		{ reply: '谢谢你跟我打招呼，很少有人会主动跟我说话呢。', mood: 'touched', favorability_change: 2, trust_change: 1, intimacy_change: 0, boredom_change: 0, freshness_change: 0 },
		{ reply: '你好，今天天气不错呢。', mood: 'friendly', favorability_change: 1, trust_change: 0, intimacy_change: 0, boredom_change: 0, freshness_change: -1 },
		{ reply: '嗯？你找我有事？', mood: 'curious', favorability_change: 1, trust_change: 0, intimacy_change: 0, boredom_change: 0, freshness_change: -1 }
	],
	acquaintance: [
		{ reply: '又见面了，最近怎么样？', mood: 'friendly', favorability_change: 1, trust_change: 1, intimacy_change: 0, boredom_change: 0, freshness_change: -1 },
		{ reply: '对了，你平时喜欢做什么呀？', mood: 'curious', favorability_change: 2, trust_change: 1, intimacy_change: 1, boredom_change: -1, freshness_change: 0 },
		{ reply: '和你聊天挺开心的，你是个有趣的人呢。', mood: 'happy', favorability_change: 2, trust_change: 1, intimacy_change: 1, boredom_change: -1, freshness_change: 0 },
		{ reply: '你吃饭了吗？别忘了按时吃饭哦。', mood: 'caring', favorability_change: 2, trust_change: 1, intimacy_change: 0, boredom_change: 0, freshness_change: -1 },
		{ reply: '哈哈，你说话真有意思。', mood: 'amused', favorability_change: 2, trust_change: 0, intimacy_change: 1, boredom_change: -1, freshness_change: 0 },
		{ reply: '今天课好多，好累啊……', mood: 'tired', favorability_change: 1, trust_change: 1, intimacy_change: 1, boredom_change: 0, freshness_change: -1 },
		{ reply: '你有没有看过那部电影？我觉得还不错。', mood: 'cheerful', favorability_change: 1, trust_change: 0, intimacy_change: 1, boredom_change: -1, freshness_change: 0 },
		{ reply: '谢谢你愿意听我说这些，你人真好。', mood: 'grateful', favorability_change: 2, trust_change: 2, intimacy_change: 1, boredom_change: -1, freshness_change: 0 }
	],
	familiar: [
		{ reply: '你来了！我刚才还在想你呢。', mood: 'happy', favorability_change: 2, trust_change: 1, intimacy_change: 2, boredom_change: -1, freshness_change: 0 },
		{ reply: '其实我很少跟人说这些，但跟你说好像很自然。', mood: 'trusting', favorability_change: 3, trust_change: 2, intimacy_change: 2, boredom_change: -1, freshness_change: 0 },
		{ reply: '你知道吗，我小时候有个梦想……算了，说了你别笑话我。', mood: 'shy', favorability_change: 2, trust_change: 2, intimacy_change: 2, boredom_change: -1, freshness_change: 0 },
		{ reply: '下次一起去吃火锅吧？我知道一家特别好吃的店！', mood: 'excited', favorability_change: 2, trust_change: 1, intimacy_change: 2, boredom_change: -2, freshness_change: 1 },
		{ reply: '我今天心情不太好，跟你说说就好多了。', mood: 'comforted', favorability_change: 2, trust_change: 2, intimacy_change: 2, boredom_change: -1, freshness_change: 0 },
		{ reply: '你总是能说到我心坎里去呢。', mood: 'touched', favorability_change: 3, trust_change: 2, intimacy_change: 2, boredom_change: -1, freshness_change: 0 },
		{ reply: '有你在，感觉日子都变有趣了。', mood: 'happy', favorability_change: 2, trust_change: 1, intimacy_change: 2, boredom_change: -2, freshness_change: 1 },
		{ reply: '我把这首歌分享给你，我觉得你一定会喜欢。', mood: 'cheerful', favorability_change: 2, trust_change: 1, intimacy_change: 2, boredom_change: -1, freshness_change: 1 }
	],
	friend: [
		{ reply: '有你这个朋友真好，我说真的。', mood: 'sincere', favorability_change: 2, trust_change: 2, intimacy_change: 1, boredom_change: -1, freshness_change: 0 },
		{ reply: '我跟你说个秘密，你可不能告诉别人哦。', mood: 'trusting', favorability_change: 3, trust_change: 3, intimacy_change: 2, boredom_change: -2, freshness_change: 1 },
		{ reply: '遇到不开心的事我第一个就想找你聊。', mood: 'dependent', favorability_change: 3, trust_change: 2, intimacy_change: 2, boredom_change: -1, freshness_change: 0 },
		{ reply: '你最近有没有觉得……我们的关系好像不太一样了？', mood: 'thoughtful', favorability_change: 2, trust_change: 1, intimacy_change: 3, boredom_change: -2, freshness_change: 1 },
		{ reply: '不管以后怎样，你都是我最重要的人之一。', mood: 'serious', favorability_change: 3, trust_change: 2, intimacy_change: 2, boredom_change: -1, freshness_change: 0 },
		{ reply: '我给你带了你喜欢吃的，别嫌弃啊！', mood: 'happy', favorability_change: 2, trust_change: 1, intimacy_change: 2, boredom_change: -1, freshness_change: 0 },
		{ reply: '你有难题尽管找我，我一定帮你想办法。', mood: 'supportive', favorability_change: 2, trust_change: 2, intimacy_change: 1, boredom_change: -1, freshness_change: 0 },
		{ reply: '今天在路上看到一个东西想到你了，下次给你看。', mood: 'cheerful', favorability_change: 2, trust_change: 1, intimacy_change: 2, boredom_change: -1, freshness_change: 1 }
	],
	ambiguous: [
		{ reply: '你……你怎么总盯着我看，我会不好意思的。', mood: 'shy', favorability_change: 3, trust_change: 1, intimacy_change: 3, boredom_change: -2, freshness_change: 1 },
		{ reply: '和你在一起的时候，心跳好像会加速呢……', mood: 'blushing', favorability_change: 3, trust_change: 1, intimacy_change: 3, boredom_change: -2, freshness_change: 1 },
		{ reply: '你今天有空吗？我想……就我们两个出去走走。', mood: 'nervous', favorability_change: 3, trust_change: 2, intimacy_change: 3, boredom_change: -2, freshness_change: 1 },
		{ reply: '别人问我们什么关系，我都不知道该怎么回答……', mood: 'confused', favorability_change: 2, trust_change: 1, intimacy_change: 3, boredom_change: -1, freshness_change: 0 },
		{ reply: '刚才你不小心碰到我的手，我的脸一下就红了。', mood: 'shy', favorability_change: 3, trust_change: 1, intimacy_change: 3, boredom_change: -2, freshness_change: 1 },
		{ reply: '我好像……开始在意你看别人的眼神了。', mood: 'jealous', favorability_change: 2, trust_change: 1, intimacy_change: 3, boredom_change: -1, freshness_change: 0 },
		{ reply: '你觉得……我们之间算什么？', mood: 'serious', favorability_change: 2, trust_change: 2, intimacy_change: 3, boredom_change: -1, freshness_change: 0 },
		{ reply: '今天做了个梦，梦到你了……不、不告诉你梦到什么了！', mood: 'flustered', favorability_change: 3, trust_change: 1, intimacy_change: 3, boredom_change: -2, freshness_change: 1 }
	],
	confession: [
		{ reply: '我想了很久……我好像真的喜欢你。', mood: 'sincere', favorability_change: 3, trust_change: 2, intimacy_change: 3, boredom_change: -2, freshness_change: 1 },
		{ reply: '你……你不要突然对我那么好，我会当真的。', mood: 'vulnerable', favorability_change: 3, trust_change: 2, intimacy_change: 3, boredom_change: -2, freshness_change: 1 },
		{ reply: '如果我说我想一直和你在一起，你会觉得太快了吗？', mood: 'nervous', favorability_change: 3, trust_change: 2, intimacy_change: 3, boredom_change: -2, freshness_change: 1 },
		{ reply: '每次看到你笑，我就觉得这个世界真美好。', mood: 'loving', favorability_change: 3, trust_change: 2, intimacy_change: 3, boredom_change: -2, freshness_change: 1 },
		{ reply: '我不想只做朋友了……你明白我的意思吗？', mood: 'serious', favorability_change: 3, trust_change: 2, intimacy_change: 3, boredom_change: -2, freshness_change: 1 },
		{ reply: '你是我见过最特别的人，我想认真对待你。', mood: 'earnest', favorability_change: 3, trust_change: 2, intimacy_change: 3, boredom_change: -2, freshness_change: 1 }
	],
	lover: [
		{ reply: '亲爱的，今天想我了没？', mood: 'sweet', favorability_change: 2, trust_change: 1, intimacy_change: 2, boredom_change: -1, freshness_change: 0 },
		{ reply: '能和你在一起，是我最幸运的事。', mood: 'loving', favorability_change: 3, trust_change: 2, intimacy_change: 3, boredom_change: -2, freshness_change: 0 },
		{ reply: '我给你准备了一个小惊喜，你猜猜是什么？', mood: 'excited', favorability_change: 2, trust_change: 1, intimacy_change: 2, boredom_change: -2, freshness_change: 2 },
		{ reply: '好想现在就见到你，抱抱你。', mood: 'missing', favorability_change: 3, trust_change: 1, intimacy_change: 3, boredom_change: -1, freshness_change: 0 },
		{ reply: '和你在一起的每一天都很幸福，谢谢你出现在我的生命里。', mood: 'grateful', favorability_change: 3, trust_change: 2, intimacy_change: 2, boredom_change: -1, freshness_change: 0 },
		{ reply: '以后一起去旅行吧，我想和你看遍世界的风景。', mood: 'dreamy', favorability_change: 2, trust_change: 1, intimacy_change: 2, boredom_change: -2, freshness_change: 2 },
		{ reply: '吵架了也不怕，因为我知道我们会和好的。', mood: 'confident', favorability_change: 2, trust_change: 2, intimacy_change: 2, boredom_change: -1, freshness_change: 0 },
		{ reply: '你笑的样子，我永远都看不腻。', mood: 'adoring', favorability_change: 3, trust_change: 1, intimacy_change: 3, boredom_change: -2, freshness_change: 1 }
	],
	married: [
		{ reply: '老婆/老公，今天晚饭想吃什么？我来做。', mood: 'domestic', favorability_change: 2, trust_change: 1, intimacy_change: 2, boredom_change: -1, freshness_change: 0 },
		{ reply: '谢谢你一直陪在我身边，真的很感恩。', mood: 'grateful', favorability_change: 2, trust_change: 2, intimacy_change: 2, boredom_change: -1, freshness_change: 0 },
		{ reply: '虽然日子平淡了一些，但有你就很好。', mood: 'content', favorability_change: 2, trust_change: 2, intimacy_change: 1, boredom_change: 0, freshness_change: -1 },
		{ reply: '今天看到我们以前的照片，好怀念那时候。', mood: 'nostalgic', favorability_change: 2, trust_change: 1, intimacy_change: 2, boredom_change: -1, freshness_change: 1 },
		{ reply: '不管发生什么，我都不会放开你的手。', mood: 'devoted', favorability_change: 3, trust_change: 2, intimacy_change: 2, boredom_change: -1, freshness_change: 0 },
		{ reply: '一起变老也很浪漫呢，你觉得呢？', mood: 'romantic', favorability_change: 2, trust_change: 1, intimacy_change: 2, boredom_change: -1, freshness_change: 1 },
		{ reply: '周末一起去逛超市吧，家里好像缺点东西了。', mood: 'casual', favorability_change: 1, trust_change: 1, intimacy_change: 1, boredom_change: 0, freshness_change: -1 },
		{ reply: '你辛苦了，今天早点休息吧。晚安，我爱你。', mood: 'tender', favorability_change: 2, trust_change: 1, intimacy_change: 2, boredom_change: -1, freshness_change: 0 }
	]
}

// Map stage names to reply pool keys
const STAGE_TO_POOL = {
	'陌生人': 'stranger',
	'认识': 'acquaintance',
	'熟悉': 'familiar',
	'好友': 'friend',
	'暧昧': 'ambiguous',
	'表白': 'confession',
	'恋人': 'lover',
	'求婚': 'lover',
	'新婚': 'married',
	'育儿': 'married',
	'10年婚姻': 'married',
	'20年婚姻': 'married',
	'30年婚姻': 'married',
	'白头偕老': 'married'
}

// Speech style modifiers per character personality tag
const SPEECH_MODIFIERS = {
	'温柔学姐': (r) => r.replace(/。$/, '呢。').replace(/！$/, '呀！'),
	'元气少女': (r) => r + (Math.random() > 0.5 ? ' ٩(๑❛ᴗ❛๑)۶' : '！！'),
	'冰山美人': (r) => r.replace(/^.{0,2}/, '……').replace(/呢|呀|哦/g, ''),
	'邻家女孩': (r) => '那个……' + r.replace(/！/g, '……'),
	'文艺女青年': (r) => r + (Math.random() > 0.5 ? '，像一首未完的诗。' : ''),
	'温柔学长': (r) => r.replace(/？$/, '？别担心。'),
	'阳光男孩': (r) => (Math.random() > 0.5 ? '嘿！' : '哈哈，') + r,
	'高冷男神': (r) => r.length > 15 ? r.slice(0, 12) + '。' : r.replace(/！/g, '。'),
	'邻家男孩': (r) => r + (Math.random() > 0.5 ? '哈哈哈' : ' 23333'),
	'文艺青年': (r) => r + (Math.random() > 0.5 ? '……让我为你写首歌。' : '')
}

// Contextual keyword matching for more relevant replies
function getContextualBoost(userMessage) {
	const boosts = { favorability_change: 0, trust_change: 0, intimacy_change: 0 }
	const msg = userMessage.toLowerCase()
	if (/关心|担心|在意|心疼/.test(msg)) { boosts.favorability_change += 1; boosts.trust_change += 1 }
	if (/喜欢|爱|想你|想念/.test(msg)) { boosts.favorability_change += 1; boosts.intimacy_change += 1 }
	if (/谢谢|感谢|感恩/.test(msg)) { boosts.trust_change += 1 }
	if (/对不起|抱歉|不好意思/.test(msg)) { boosts.trust_change += 1 }
	if (/无聊|烦|讨厌/.test(msg)) { boosts.favorability_change -= 1; boosts.boredom_change = 2 }
	return boosts
}

function getSimulatedReply(character, gameState, userMessage) {
	const pool = STAGE_REPLIES[STAGE_TO_POOL[gameState.relationshipStage] || 'stranger']
	let chosen = pool[Math.floor(Math.random() * pool.length)]
	// Deep copy
	chosen = JSON.parse(JSON.stringify(chosen))

	// Apply speech style modifier
	const modifier = SPEECH_MODIFIERS[character.personalityTag]
	if (modifier) {
		try { chosen.reply = modifier(chosen.reply) } catch (e) { /* keep original */ }
	}

	// Apply contextual boosts
	const boosts = getContextualBoost(userMessage)
	chosen.favorability_change = (chosen.favorability_change || 0) + (boosts.favorability_change || 0)
	chosen.trust_change = (chosen.trust_change || 0) + (boosts.trust_change || 0)
	chosen.intimacy_change = (chosen.intimacy_change || 0) + (boosts.intimacy_change || 0)
	if (boosts.boredom_change) chosen.boredom_change = (chosen.boredom_change || 0) + boosts.boredom_change

	// Clamp changes
	chosen.favorability_change = Math.max(0, Math.min(5, chosen.favorability_change))

	return chosen
}

export default {
	name: 'GameChat',
	data() {
		return {
			inputText: '',
			character: null,
			messages: [],
			isLoading: false,
			showEvent: false,
			currentEvent: { name: '', description: '' },
			scrollToId: '',
			wordBalance: 0,
			canWatchAdNow: true
		}
	},
	computed: {
		gameState() {
			return gameStore.state
		}
	},
	methods: {
		sendMessage() {
			const text = this.inputText.trim()
			if (!text) return
			if (text.length > 200) {
				uni.showToast({ title: '消息最多200字', icon: 'none' })
				return
			}
			if (!checkBalance(text.length)) {
				uni.showToast({ title: '字数余额不足', icon: 'none' })
				return
			}

			consumeWords(text)
			this.wordBalance = userStore.state.wordBalance

			chatStore.addMessage('user', text)
			this.messages = [...chatStore.state.messages]
			this.inputText = ''
			this.scrollToBottom()

			this.isLoading = true
			// Simulate network delay
			setTimeout(() => {
				this.generateAIReply(text)
			}, 800 + Math.random() * 1200)
		},

		generateAIReply(userMessage) {
			const result = getSimulatedReply(this.character, gameStore.state, userMessage)

			// Consume words for AI reply
			consumeWords(result.reply, true)
			this.wordBalance = userStore.state.wordBalance

			chatStore.addMessage('assistant', result.reply, {
				mood: result.mood,
				valueChanges: {
					favorability_change: result.favorability_change,
					trust_change: result.trust_change,
					intimacy_change: result.intimacy_change,
					boredom_change: result.boredom_change,
					freshness_change: result.freshness_change
				}
			})
			this.messages = [...chatStore.state.messages]

			// Update game values
			gameStore.updateValues({
				favorability_change: result.favorability_change,
				trust_change: result.trust_change,
				intimacy_change: result.intimacy_change,
				boredom_change: result.boredom_change,
				freshness_change: result.freshness_change,
				mood: result.mood
			})

			// Check for events
			const triggered = checkForEvents(gameStore.state)
			if (triggered.length > 0) {
				const evt = triggered[0]
				gameStore.addEvent(evt.id)
				this.currentEvent = evt
				this.showEvent = true
			}

			// Save state
			chatStore.saveMessages(this.character.id)
			gameStore.saveToStorage()

			this.isLoading = false
			this.scrollToBottom()
		},

		watchAd() {
			showRewardAd(
				() => {
					getWordsFromAd()
					this.wordBalance = userStore.state.wordBalance
					this.canWatchAdNow = canWatchAd()
					uni.showToast({ title: '+800字数', icon: 'none' })
				},
				(msg) => {
					uni.showToast({ title: msg || '广告加载失败', icon: 'none' })
				}
			)
		},

		onEventClose() {
			this.showEvent = false
			// Award event completion words
			const { getEventReward } = require('@/utils/word-manager.js')
			const amount = getEventReward('event_complete')
			if (amount > 0) {
				this.wordBalance = userStore.state.wordBalance
				uni.showToast({ title: `事件完成 +${amount}字数`, icon: 'none' })
			}
		},

		scrollToBottom() {
			this.$nextTick(() => {
				this.scrollToId = ''
				setTimeout(() => {
					this.scrollToId = 'msg_bottom'
				}, 50)
			})
		},

		goSettings() {
			uni.navigateTo({ url: '/pages/settings/index' })
		}
	},

	onLoad() {
		userStore.initUser()
		this.wordBalance = userStore.state.wordBalance
		this.canWatchAdNow = canWatchAd()

		// Load game state
		gameStore.loadGame()
		const charId = gameStore.state.characterId || uni.getStorageSync('selected_character_id')
		if (charId) {
			this.character = getCharacterById(charId)
			chatStore.loadMessages(charId)
			this.messages = [...chatStore.state.messages]
		}

		this.scrollToBottom()
	},

	onShow() {
		this.wordBalance = userStore.state.wordBalance
		this.canWatchAdNow = canWatchAd()
	}
}
</script>

<style scoped>
.chat-page {
	width: 100%;
	height: 100vh;
	position: relative;
	overflow: hidden;
	background: #1a1a2e;
}

/* Character Background */
.character-bg {
	position: absolute;
	top: 0;
	left: 0;
	width: 100%;
	height: 100%;
	z-index: 0;
}

.bg-overlay {
	position: absolute;
	top: 0;
	left: 0;
	width: 100%;
	height: 100%;
	background: linear-gradient(
		to bottom,
		rgba(0, 0, 0, 0.2) 0%,
		rgba(0, 0, 0, 0.1) 30%,
		rgba(0, 0, 0, 0.3) 50%,
		rgba(0, 0, 0, 0.6) 100%
	);
	z-index: 1;
}

/* Top Bar */
.top-bar {
	position: fixed;
	top: 0;
	left: 0;
	right: 0;
	display: flex;
	flex-direction: row;
	align-items: center;
	justify-content: space-between;
	padding: 60rpx 24rpx 20rpx;
	background: rgba(0, 0, 0, 0.35);
	backdrop-filter: blur(10px);
	z-index: 10;
}

.top-left {
	width: 80rpx;
	height: 80rpx;
	display: flex;
	align-items: center;
	justify-content: center;
}

.menu-icon {
	font-size: 48rpx;
	color: #ffffff;
}

.top-center {
	flex: 1;
	text-align: center;
}

.char-name {
	font-size: 34rpx;
	font-weight: 700;
	color: #ffffff;
	letter-spacing: 2rpx;
}

.top-right {
	display: flex;
	flex-direction: row;
	align-items: center;
	gap: 16rpx;
}

.fav-display {
	font-size: 26rpx;
	color: #ffffff;
	margin-right: 8rpx;
}

/* Chat Area */
.chat-area {
	position: fixed;
	bottom: 140rpx;
	left: 0;
	right: 0;
	height: 55vh;
	z-index: 5;
}

.chat-scroll {
	width: 100%;
	height: 100%;
	background: linear-gradient(
		to bottom,
		transparent 0%,
		rgba(0, 0, 0, 0.4) 15%,
		rgba(0, 0, 0, 0.5) 100%
	);
}

.chat-messages {
	padding: 24rpx 0 20rpx;
}

/* Loading / Typing Indicator */
.loading-wrap {
	display: flex;
	padding: 20rpx 36rpx;
}

.typing-indicator {
	display: flex;
	flex-direction: row;
	align-items: center;
	gap: 10rpx;
	background: rgba(255, 255, 255, 0.15);
	border-radius: 20rpx;
	padding: 18rpx 28rpx;
}

.dot {
	width: 14rpx;
	height: 14rpx;
	border-radius: 50%;
	background: rgba(255, 255, 255, 0.6);
	animation: dotPulse 1.4s infinite ease-in-out both;
}

.dot2 {
	animation-delay: 0.16s;
}

.dot3 {
	animation-delay: 0.32s;
}

@keyframes dotPulse {
	0%, 80%, 100% {
		transform: scale(0.6);
		opacity: 0.4;
	}
	40% {
		transform: scale(1);
		opacity: 1;
	}
}

/* Input Bar */
.input-bar {
	position: fixed;
	bottom: 0;
	left: 0;
	right: 0;
	padding: 16rpx 24rpx;
	padding-bottom: calc(16rpx + env(safe-area-inset-bottom));
	background: rgba(20, 20, 40, 0.85);
	backdrop-filter: blur(20px);
	z-index: 10;
}

.word-warning {
	padding: 8rpx 20rpx 12rpx;
}

.warning-text {
	font-size: 22rpx;
	color: #ff6b6b;
}

.input-row {
	display: flex;
	flex-direction: row;
	align-items: center;
	gap: 16rpx;
}

.input-row-center {
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 16rpx;
	padding: 12rpx 0;
}

.no-words-hint {
	font-size: 24rpx;
	color: rgba(255, 255, 255, 0.5);
	margin-bottom: 8rpx;
}

.msg-input {
	flex: 1;
	height: 76rpx;
	background: rgba(255, 255, 255, 0.1);
	border-radius: 38rpx;
	padding: 0 32rpx;
	font-size: 28rpx;
	color: #ffffff;
}

.send-btn {
	width: 76rpx;
	height: 76rpx;
	border-radius: 50%;
	background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
	display: flex;
	align-items: center;
	justify-content: center;
	flex-shrink: 0;
}

.send-btn-disabled {
	opacity: 0.4;
}

.send-icon {
	font-size: 36rpx;
}
</style>
