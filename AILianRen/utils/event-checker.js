const EVENTS = [
  {
    id: 'EVT_FIRST_MEET',
    name: '初次相识',
    description: '你们正式认识了',
    check: (s) => s.stageIndex >= 1
  },
  {
    id: 'EVT_HELP_REQUEST',
    name: '请求帮忙',
    description: '对方向你寻求帮助',
    check: (s) => s.stageIndex >= 2 && s.favorability >= 30
  },
  {
    id: 'EVT_FIRST_DATE',
    name: '第一次约会',
    description: '你们第一次单独出去',
    check: (s) => s.stageIndex >= 2 && s.favorability >= 35
  },
  {
    id: 'EVT_MISUNDERSTANDING',
    name: '误会风波',
    description: '一场误会考验着你们的关系',
    check: (s) => s.stageIndex >= 3 && Math.random() < 0.1
  },
  {
    id: 'EVT_AMBIGUOUS_SIGNAL',
    name: '暧昧信号',
    description: '对方释放出暧昧的信号',
    check: (s) => s.stageIndex >= 4 && s.favorability >= 60
  },
  {
    id: 'EVT_RIVAL_APPEARS',
    name: '情敌出现',
    description: '有人开始对TA表示好感',
    check: (s) => s.stageIndex >= 4 && Math.random() < 0.05
  },
  {
    id: 'EVT_CONFESSION_TIME',
    name: '告白时刻',
    description: '是时候表达心意了',
    check: (s) => s.stageIndex >= 5 && s.favorability >= 78
  },
  {
    id: 'EVT_MEET_PARENTS',
    name: '见家长',
    description: '对方邀请你见家长',
    check: (s) => s.stageIndex >= 6 && s.favorability >= 88
  },
  {
    id: 'EVT_PROPOSAL',
    name: '求婚',
    description: '准备向对方求婚',
    check: (s) => s.stageIndex >= 7 && s.favorability >= 92
  },
  {
    id: 'EVT_WEDDING',
    name: '婚礼',
    description: '举办你们的婚礼',
    check: (s, completed) => completed.includes('EVT_PROPOSAL')
  },
  {
    id: 'EVT_BABY',
    name: '迎接新生命',
    description: '你们的宝宝要出生了',
    check: (s) => s.stageIndex >= 9 && s.favorability >= 88
  },
  {
    id: 'EVT_SEVEN_YEAR_ITCH',
    name: '七年之痒',
    description: '婚姻生活遇到了瓶颈',
    check: (s) => s.stageIndex >= 10
  }
]

export function checkForEvents(gameState) {
  const completed = gameState.eventsCompleted || []
  const triggered = []

  for (const event of EVENTS) {
    if (completed.includes(event.id)) continue
    if (event.check(gameState, completed)) {
      triggered.push({
        id: event.id,
        name: event.name,
        description: event.description
      })
    }
  }

  return triggered
}
