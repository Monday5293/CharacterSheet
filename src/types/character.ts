// 潜务代理角色数据类型定义
export interface CovertAgent {
  // 基础信息
  codename: string
  realName: string
  avatar?: string
  age: number
  gender: string
  birthPlace: string
  experience: number
  
  // 黑市币
  initialBlackCoin: number
  currentIntoxication: number
  settledBlackCoin: number
  remainingBlackCoin: number
  
  // 社会属性
  socialAttributes: {
    wealth: number         // 财富
    power: number          // 权力
    prestige: number       // 声望
    network: number        // 人脉
  }
  socialAttributeDescriptions: {
    wealth: string         // 财富描述
    power: string          // 权力描述
    prestige: string       // 声望描述
    network: string        // 人脉描述
  }
  // 酒类代币
  alcoholTokens: {
    red: number
    yellow: number
    blue: number
    green: number
  }
  
  // 健康状况
  health: {
    current: number
    max: number
    stress: number
    trauma: string[]
  }
  
  // 装备与资源
  equipment: {
    weapons: string[]
    gadgets: string[]
    documents: string[]
    contacts: string[]
  }
  
  // 技能专长
  specialties: string[]
  
  // 任务记录
  missions: Mission[]
  
  // 秘密信息
  secrets: {
    coverIdentity: string
    knownAliases: string[]
    weaknesses: string[]
    objectives: string[]
  }
}

export interface Mission {
  id: string
  name: string
  status: 'completed' | 'failed' | 'ongoing' | 'aborted'
  difficulty: number
  outcome: string
  date: string
}

export type ClearanceLevel = 1 | 2 | 3 | 4 | 5

// 属性类型辅助
export type AttributeKey = keyof CovertAgent['socialAttributes']

// 装备类型辅助
export type EquipmentCategory = keyof CovertAgent['equipment']

// 健康状态类型辅助
export type HealthField = keyof CovertAgent['health']
