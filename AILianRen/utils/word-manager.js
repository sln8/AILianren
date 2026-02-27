import { userStore } from '../store/user.js'

const EVENT_REWARDS = {
  first_lover: 500,
  new_stage: 300,
  event_complete: 200,
  login_streak_7: 1000
}

export function checkBalance(needed) {
  return userStore.state.wordBalance >= needed
}

export function consumeWords(text, isAI = false) {
  // Messages cost 1 word per character
  const cost = text.length
  return userStore.spendWords(cost)
}

export function getWordsFromAd() {
  userStore.addWords(800, 'ad_reward')
  userStore.watchedAd()
}

export function getEventReward(type) {
  const amount = EVENT_REWARDS[type]
  if (amount) {
    userStore.addWords(amount, 'event_' + type)
    return amount
  }
  return 0
}
