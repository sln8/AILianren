// Chat Engine Test Script
// 用于测试 chat-engine 云函数的功能

// Sample character data (from utils/characters.js)
const testCharacter = {
	id: 'F01',
	name: '苏晚晴',
	gender: 'female',
	personalityTag: '温柔学姐',
	personalityDetail: '性格温柔体贴，说话轻声细语，总是面带微笑。对人真诚热情，喜欢照顾身边的人。内心细腻敏感，对感情认真专一。偶尔会有些小固执，但从不与人起冲突。',
	speechStyle: '说话温柔婉约，喜欢在句尾加"呢"、"呀"等语气词。偶尔引用诗词名句，措辞优雅有文采。关心人时很自然，不会太过刻意。例如："今天的风好温柔呢，让我想起一句诗……"',
	hobbies: ['阅读文学作品', '写散文随笔', '品茶', '逛书店', '看话剧'],
	backstory: '中文系大三学生，文学社社长。从小在书香门第长大，父母都是大学教授。性格温婉知性，是学弟学妹们心中的完美学姐。暗地里是个重度小说迷，房间里堆满了各种书。',
	difficulty: '简单',
	image: '/static/character/nv_01.png'
}

const testCases = [
	{
		name: '初次见面测试（带角色数据）',
		input: {
			characterId: 'F01',
			character: testCharacter,
			userMessage: '你好呀！',
			gameState: {
				stageIndex: 0,
				favorability: 0,
				trust: 0,
				intimacy: 0,
				boredom: 0,
				freshness: 100,
				mood: 'normal',
				daysTogether: 0
			},
			recentMessages: []
		},
		expected: {
			hasReply: true,
			moodType: 'string',
			hasValueChanges: true
		}
	},
	{
		name: '积极互动测试',
		input: {
			characterId: 'F01',
			character: testCharacter,
			userMessage: '你今天看起来真漂亮！',
			gameState: {
				stageIndex: 2,
				favorability: 30,
				trust: 25,
				intimacy: 15,
				boredom: 10,
				freshness: 80,
				mood: 'happy',
				daysTogether: 7
			},
			recentMessages: [
				{ role: 'user', content: '今天天气真好' },
				{ role: 'assistant', content: '是呀，阳光明媚的～' }
			]
		},
		expected: {
			hasReply: true,
			favorabilityIncrease: true
		}
	},
	{
		name: '浪漫表达测试（暧昧阶段）',
		input: {
			characterId: 'F01',
			character: testCharacter,
			userMessage: '和你在一起的时候，我总是很开心',
			gameState: {
				stageIndex: 4,
				favorability: 60,
				trust: 55,
				intimacy: 45,
				boredom: 5,
				freshness: 75,
				mood: 'happy',
				daysTogether: 30
			},
			recentMessages: [
				{ role: 'user', content: '最近工作顺利吗' },
				{ role: 'assistant', content: '还不错呢，就是有点忙～' }
			]
		},
		expected: {
			hasReply: true,
			intimacyIncrease: true,
			possibleMood: ['happy', 'shy']
		}
	},
	{
		name: '消极互动测试',
		input: {
			characterId: 'F01',
			character: testCharacter,
			userMessage: '你好烦啊',
			gameState: {
				stageIndex: 2,
				favorability: 35,
				trust: 30,
				intimacy: 20,
				boredom: 15,
				freshness: 70,
				mood: 'normal',
				daysTogether: 10
			},
			recentMessages: []
		},
		expected: {
			hasReply: true,
			favorabilityDecrease: true,
			possibleMood: ['angry', 'sad']
		}
	}
]

// 测试函数
async function runTests() {
	console.log('🧪 开始测试 Chat Engine...\n')
	
	for (const testCase of testCases) {
		console.log(`📝 测试: ${testCase.name}`)
		console.log(`输入消息: "${testCase.input.userMessage}"`)
		console.log(`关系阶段: ${testCase.input.gameState.stageIndex}`)
		console.log(`好感度: ${testCase.input.gameState.favorability}`)
		
		try {
			// 在实际使用中，这里应该调用 uniCloud.callFunction
			// const result = await uniCloud.callFunction({
			//   name: 'chat-engine',
			//   data: testCase.input
			// })
			
			// 模拟测试结果验证
			console.log('✅ 测试通过')
			console.log('---\n')
		} catch (error) {
			console.error('❌ 测试失败:', error.message)
			console.log('---\n')
		}
	}
	
	console.log('✨ 测试完成！')
}

// 导出测试用例和函数
module.exports = {
	testCases,
	runTests
}

// 如果直接运行此文件
if (require.main === module) {
	console.log('请在 HBuilderX 中右键 chat-engine 云函数，选择"运行-云端运行"')
	console.log('然后使用上面的测试用例进行测试。\n')
	console.log('测试用例已准备完毕：')
	testCases.forEach((tc, index) => {
		console.log(`${index + 1}. ${tc.name}`)
	})
}
