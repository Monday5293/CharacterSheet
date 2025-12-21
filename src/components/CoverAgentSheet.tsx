import * as React from 'react'
import { useState, useRef, useEffect } from 'react'
import { CovertAgent } from '../types/character'
import '../styles/CoverAgentSheet.css'
import html2pdf from 'html2pdf.js'

const CovertAgentSheet: React.FC = () => {
  const STORAGE_KEY = 'covert-agent-data'

  const defaultAgent: CovertAgent = {
    codename: '',
    realName: '',
    age: 0,
    gender: '',
    birthPlace: '',
    experience: 0,
    initialBlackCoin: 0,
    currentIntoxication: 0,
    settledBlackCoin: 0,
    remainingBlackCoin: 0,
    socialAttributes: {
      wealth: 0,
      power: 0,
      prestige: 0,
      network: 0
    },
    avatar: '',
    socialAttributeDescriptions: {
      wealth: '',
      power: '',
      prestige: '',
      network: ''
    },
    alcoholTokens: {
      red: 0,
      yellow: 0,
      blue: 0,
      green: 0
    },
    profession: {
      name: '',
      adjectives: ['', '', '', '', '']
    },
    backpack: '',
    skillAdjectives: Array(10).fill(''),
    nouns: Array(10).fill(''),
    background: '',
    backgroundImage: '',
    health: {
      current: 10,
      max: 10,
      stress: 0,
      trauma: []
    },
    equipment: {
      weapons: [],
      gadgets: [],
      documents: [],
      contacts: []
    },
    specialties: [],
    missions: [],
    secrets: {
      coverIdentity: '',
      knownAliases: [],
      weaknesses: [],
      objectives: []
    }
  }

  // 多角色卡管理 - 初始化从 localStorage 加载
  const [agents, setAgents] = useState<{ [key: string]: CovertAgent }>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        const data = JSON.parse(saved)
        return data.agents || { 'default': defaultAgent }
      }
      return { 'default': defaultAgent }
    } catch (e) {
      console.error('Failed to load saved data:', e)
      return { 'default': defaultAgent }
    }
  })

  const [currentAgentId, setCurrentAgentId] = useState<string>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        const data = JSON.parse(saved)
        return data.currentAgentId || 'default'
      }
      return 'default'
    } catch {
      return 'default'
    }
  })

  const agent = agents[currentAgentId]

  // 当 agents 或 currentAgentId 改变时，自动保存到 localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        agents,
        currentAgentId
      }))
    } catch (e) {
      console.error('Failed to save data:', e)
    }
  }, [agents, currentAgentId])

  // 更新当前角色卡
  const updateAgent = (updatedAgent: CovertAgent) => {
    setAgents(prev => ({
      ...prev,
      [currentAgentId]: updatedAgent
    }))
  }

  // 切换到不同的角色卡
  const switchAgent = (agentId: string) => {
    if (agentId in agents) {
      setCurrentAgentId(agentId)
      setShowCardSwitchMenu(false)
    }
  }

  // 创建新角色卡
  const createNewAgent = () => {
    const newId = `agent-${Date.now()}`
    setAgents(prev => ({
      ...prev,
      [newId]: {
        ...defaultAgent,
        codename: `特工-${Object.keys(prev).length + 1}`
      }
    }))
    switchAgent(newId)
  }

  // 删除角色卡
  const deleteAgent = (agentId: string) => {
    if (Object.keys(agents).length === 1) {
      alert('至少要保留一个角色卡')
      return
    }
    const newAgents = { ...agents }
    delete newAgents[agentId]
    setAgents(newAgents)
    
    if (currentAgentId === agentId) {
      const firstAgentId = Object.keys(newAgents)[0]
      setCurrentAgentId(firstAgentId)
    }
  }

  // setAgent包装器 - 保持向后兼容
  const setAgent = (updateFn: (prev: CovertAgent) => CovertAgent) => {
    updateAgent(updateFn(agent))
  }

  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const [showAvatarCropper, setShowAvatarCropper] = useState(false)
  const [tempImageUrl, setTempImageUrl] = useState('')
  const [cropRect, setCropRect] = useState({ x: 0, y: 0, width: 100, height: 150 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const cropperRef = useRef<HTMLDivElement | null>(null)
  const startRectRef = useRef<{ x: number; y: number; width: number; height: number } | null>(null)
  const [draggingHandle, setDraggingHandle] = useState<'move' | 'nw' | 'ne' | 'sw' | 'se' | null>(null)
  const ASPECT_RATIO = 9 / 16
  const MIN_CROP_SIZE = 40

  // 背景图像处理
  const backgroundFileInputRef = useRef<HTMLInputElement | null>(null)
  const [showBackgroundCropper, setShowBackgroundCropper] = useState(false)
  const [tempBackgroundImageUrl, setTempBackgroundImageUrl] = useState('')
  const [backgroundCropRect, setBackgroundCropRect] = useState({ x: 0, y: 0, width: 100, height: 150 })
  const [backgroundIsDragging, setBackgroundIsDragging] = useState(false)
  const [backgroundDragStart, setBackgroundDragStart] = useState({ x: 0, y: 0 })
  const backgroundCropperRef = useRef<HTMLDivElement | null>(null)
  const backgroundStartRectRef = useRef<{ x: number; y: number; width: number; height: number } | null>(null)
  const [backgroundDraggingHandle, setBackgroundDraggingHandle] = useState<'move' | 'nw' | 'ne' | 'sw' | 'se' | null>(null)
  const BACKGROUND_ASPECT_RATIO = 3 / 4
  const BACKGROUND_MIN_CROP_SIZE = 40

  // 追踪最高醉意值和独立生命值
  const [maxIntoxication, setMaxIntoxication] = useState(() => {
    try {
      const saved = localStorage.getItem('covert-agent-maxIntoxication')
      return saved ? parseInt(saved) : 0
    } catch {
      return 0
    }
  })
  const [currentHealth, setCurrentHealth] = useState(() => {
    try {
      const saved = localStorage.getItem('covert-agent-currentHealth')
      return saved ? parseInt(saved) : 10
    } catch {
      return 10
    }
  })

  // 保存 maxIntoxication 和 currentHealth
  useEffect(() => {
    localStorage.setItem('covert-agent-maxIntoxication', maxIntoxication.toString())
  }, [maxIntoxication])

  useEffect(() => {
    localStorage.setItem('covert-agent-currentHealth', currentHealth.toString())
  }, [currentHealth])

  const handleAvatarSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files && e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result as string
      setTempImageUrl(result)
      setShowAvatarCropper(true)
      // 初始化裁剪框使其填充预览区域
      const img = new Image()
      img.onload = () => {
        const previewWidth = 400
        const previewHeight = 600
        let cropWidth = previewWidth * 0.8
        let cropHeight = cropWidth / ASPECT_RATIO
      
        if (cropHeight > previewHeight * 0.8) {
          cropHeight = previewHeight * 0.8
          cropWidth = cropHeight * ASPECT_RATIO
        }
      
        setCropRect({
          x: (previewWidth - cropWidth) / 2,
          y: (previewHeight - cropHeight) / 2,
          width: cropWidth,
          height: cropHeight
        })
      }
      img.src = result
    }
    reader.readAsDataURL(file)
  }

  const openAvatarDialog = () => {
    if (fileInputRef.current) fileInputRef.current.click()
  }

  const handleCropStart = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
    setDraggingHandle('move')
    setDragStart({ x: e.clientX, y: e.clientY })
    // store the rect at drag start so moves use the stable starting values
    startRectRef.current = { ...cropRect }
  }

  const handleCropStartHandle = (e: React.MouseEvent, handle: 'nw' | 'ne' | 'sw' | 'se') => {
    e.preventDefault()
    // prevent the parent .crop-box onMouseDown from overriding this as a "move"
    e.stopPropagation()
    setIsDragging(true)
    setDraggingHandle(handle)
    setDragStart({ x: e.clientX, y: e.clientY })
    // store the rect at drag start so resizing calculations are stable
    startRectRef.current = { ...cropRect }
  }

  const handleCropMove = (e: React.MouseEvent) => {
    if (!isDragging || !cropperRef.current) return
    const deltaX = e.clientX - dragStart.x
    const deltaY = e.clientY - dragStart.y
    const container = cropperRef.current.getBoundingClientRect()
    const containerWidth = container.width
    const containerHeight = container.height

    // Use the rect snapshot saved at drag start for stable calculations
    const start = startRectRef.current ?? cropRect

    if (draggingHandle === 'move') {
      const newX = Math.max(0, Math.min(start.x + deltaX, containerWidth - start.width))
      const newY = Math.max(0, Math.min(start.y + deltaY, containerHeight - start.height))
      setCropRect({ ...start, x: newX, y: newY })
    } else if (draggingHandle) {
      let newX = start.x
      let newY = start.y
      let newWidth = start.width
      let newHeight = start.height

      // compute tentative width/height depending on which corner is dragged
      if (draggingHandle === 'nw') {
        newWidth = start.width - deltaX
        newHeight = start.height - deltaY
      } else if (draggingHandle === 'ne') {
        newWidth = start.width + deltaX
        newHeight = start.height - deltaY
      } else if (draggingHandle === 'sw') {
        newWidth = start.width - deltaX
        newHeight = start.height + deltaY
      } else if (draggingHandle === 'se') {
        newWidth = start.width + deltaX
        newHeight = start.height + deltaY
      }

      // enforce aspect ratio by basing height on width
      newWidth = Math.max(MIN_CROP_SIZE, newWidth)
      newHeight = newWidth / ASPECT_RATIO

      // adjust x/y when left/top edges moved
      if (draggingHandle === 'nw') {
        newX = start.x + (start.width - newWidth)
        newY = start.y + (start.height - newHeight)
      } else if (draggingHandle === 'ne') {
        newX = start.x
        newY = start.y + (start.height - newHeight)
      } else if (draggingHandle === 'sw') {
        newX = start.x + (start.width - newWidth)
        newY = start.y
      } else if (draggingHandle === 'se') {
        newX = start.x
        newY = start.y
      }

      // clamp to container bounds
      if (newX < 0) {
        newX = 0
      }
      if (newY < 0) {
        newY = 0
      }
      if (newX + newWidth > containerWidth) {
        newWidth = containerWidth - newX
        newWidth = Math.max(MIN_CROP_SIZE, newWidth)
        newHeight = newWidth / ASPECT_RATIO
      }
      if (newY + newHeight > containerHeight) {
        newHeight = containerHeight - newY
        newHeight = Math.max(MIN_CROP_SIZE / ASPECT_RATIO, newHeight)
        newWidth = newHeight * ASPECT_RATIO
      }

      setCropRect({ x: newX, y: newY, width: newWidth, height: newHeight })
    }
  }

  const handleCropEnd = () => {
    setIsDragging(false)
    setDraggingHandle(null)
  }

  // 酒类展示（6 个方框）
  const BOTTLES_STORAGE_KEY = 'covert-agent-bottles'
  const [bottles, setBottles] = useState(() => {
    try {
      const saved = localStorage.getItem(BOTTLES_STORAGE_KEY)
      return saved ? JSON.parse(saved) : Array.from({ length: 6 }, (_, i) => ({ image: '', name: `酒${i + 1}` }))
    } catch (e) {
      console.error('Failed to load bottles data:', e)
      return Array.from({ length: 6 }, (_, i) => ({ image: '', name: `酒${i + 1}` }))
    }
  })

  // 保存 bottles 到 localStorage
  useEffect(() => {
    try {
      localStorage.setItem(BOTTLES_STORAGE_KEY, JSON.stringify(bottles))
    } catch (e) {
      console.error('Failed to save bottles data:', e)
    }
  }, [bottles])

  const bottleFileInputRef = useRef<HTMLInputElement | null>(null)
  const [currentBottleIndex, setCurrentBottleIndex] = useState<number | null>(null)

  const openBottleDialog = (index: number) => {
    setCurrentBottleIndex(index)
    if (bottleFileInputRef.current) bottleFileInputRef.current.click()
  }

  const handleBottleSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files && e.target.files[0]
    if (!file || currentBottleIndex === null) return
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result as string
      setBottles(prev => {
        const next = [...prev]
        next[currentBottleIndex] = { ...next[currentBottleIndex], image: result }
        return next
      })
      setCurrentBottleIndex(null)
      // clear the input so same file can be reselected later
      if (e.target) e.target.value = ''
    }
    reader.readAsDataURL(file)
  }

  const confirmCrop = () => {
    if (!tempImageUrl) return
    
    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      const scaleX = img.width / (cropperRef.current?.offsetWidth || 200)
      const scaleY = img.height / (cropperRef.current?.offsetHeight || 300)
      
      canvas.width = cropRect.width * scaleX
      canvas.height = cropRect.height * scaleY
      
      const ctx = canvas.getContext('2d')
      if (ctx) {
        ctx.drawImage(
          img,
          cropRect.x * scaleX,
          cropRect.y * scaleY,
          cropRect.width * scaleX,
          cropRect.height * scaleY,
          0,
          0,
          canvas.width,
          canvas.height
        )
      }
      
      setAgent(prev => ({ ...prev, avatar: canvas.toDataURL() }))
      setShowAvatarCropper(false)
      setTempImageUrl('')
    }
    img.src = tempImageUrl
  }

  const cancelCrop = () => {
    setShowAvatarCropper(false)
    setTempImageUrl('')
  }

  // 背景图像处理
  const handleBackgroundImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files && e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result as string
      setTempBackgroundImageUrl(result)
      setShowBackgroundCropper(true)
      // 初始化裁剪框
      const img = new Image()
      img.onload = () => {
        const previewWidth = 400
        const previewHeight = 600
        let cropWidth = previewWidth * 0.8
        let cropHeight = cropWidth / BACKGROUND_ASPECT_RATIO
      
        if (cropHeight > previewHeight * 0.8) {
          cropHeight = previewHeight * 0.8
          cropWidth = cropHeight * BACKGROUND_ASPECT_RATIO
        }
      
        setBackgroundCropRect({
          x: (previewWidth - cropWidth) / 2,
          y: (previewHeight - cropHeight) / 2,
          width: cropWidth,
          height: cropHeight
        })
      }
      img.src = result
    }
    reader.readAsDataURL(file)
  }

  const openBackgroundDialog = () => {
    if (backgroundFileInputRef.current) backgroundFileInputRef.current.click()
  }

  const handleBackgroundCropStart = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setBackgroundIsDragging(true)
    setBackgroundDraggingHandle('move')
    setBackgroundDragStart({ x: e.clientX, y: e.clientY })
    backgroundStartRectRef.current = { ...backgroundCropRect }
  }

  const handleBackgroundCropStartHandle = (e: React.MouseEvent, handle: 'nw' | 'ne' | 'sw' | 'se') => {
    e.preventDefault()
    e.stopPropagation()
    setBackgroundIsDragging(true)
    setBackgroundDraggingHandle(handle)
    setBackgroundDragStart({ x: e.clientX, y: e.clientY })
    backgroundStartRectRef.current = { ...backgroundCropRect }
  }

  const handleBackgroundCropMove = (e: React.MouseEvent) => {
    if (!backgroundIsDragging || !backgroundCropperRef.current) return
    const deltaX = e.clientX - backgroundDragStart.x
    const deltaY = e.clientY - backgroundDragStart.y
    const container = backgroundCropperRef.current.getBoundingClientRect()
    const containerWidth = container.width
    const containerHeight = container.height

    const start = backgroundStartRectRef.current ?? backgroundCropRect

    if (backgroundDraggingHandle === 'move') {
      const newX = Math.max(0, Math.min(start.x + deltaX, containerWidth - start.width))
      const newY = Math.max(0, Math.min(start.y + deltaY, containerHeight - start.height))
      setBackgroundCropRect({ ...start, x: newX, y: newY })
    } else if (backgroundDraggingHandle) {
      let newX = start.x
      let newY = start.y
      let newWidth = start.width
      let newHeight = start.height

      if (backgroundDraggingHandle === 'nw') {
        newWidth = start.width - deltaX
        newHeight = start.height - deltaY
      } else if (backgroundDraggingHandle === 'ne') {
        newWidth = start.width + deltaX
        newHeight = start.height - deltaY
      } else if (backgroundDraggingHandle === 'sw') {
        newWidth = start.width - deltaX
        newHeight = start.height + deltaY
      } else if (backgroundDraggingHandle === 'se') {
        newWidth = start.width + deltaX
        newHeight = start.height + deltaY
      }

      newWidth = Math.max(BACKGROUND_MIN_CROP_SIZE, newWidth)
      newHeight = newWidth / BACKGROUND_ASPECT_RATIO

      if (backgroundDraggingHandle === 'nw') {
        newX = start.x + (start.width - newWidth)
        newY = start.y + (start.height - newHeight)
      } else if (backgroundDraggingHandle === 'ne') {
        newX = start.x
        newY = start.y + (start.height - newHeight)
      } else if (backgroundDraggingHandle === 'sw') {
        newX = start.x + (start.width - newWidth)
        newY = start.y
      } else if (backgroundDraggingHandle === 'se') {
        newX = start.x
        newY = start.y
      }

      if (newX < 0) newX = 0
      if (newY < 0) newY = 0
      if (newX + newWidth > containerWidth) {
        newWidth = containerWidth - newX
        newWidth = Math.max(BACKGROUND_MIN_CROP_SIZE, newWidth)
        newHeight = newWidth / BACKGROUND_ASPECT_RATIO
      }
      if (newY + newHeight > containerHeight) {
        newHeight = containerHeight - newY
        newHeight = Math.max(BACKGROUND_MIN_CROP_SIZE / BACKGROUND_ASPECT_RATIO, newHeight)
        newWidth = newHeight * BACKGROUND_ASPECT_RATIO
      }

      setBackgroundCropRect({ x: newX, y: newY, width: newWidth, height: newHeight })
    }
  }

  const handleBackgroundCropEnd = () => {
    setBackgroundIsDragging(false)
    setBackgroundDraggingHandle(null)
  }

  const confirmBackgroundCrop = () => {
    if (!tempBackgroundImageUrl) return
    
    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      const scaleX = img.width / (backgroundCropperRef.current?.offsetWidth || 200)
      const scaleY = img.height / (backgroundCropperRef.current?.offsetHeight || 300)
      
      canvas.width = backgroundCropRect.width * scaleX
      canvas.height = backgroundCropRect.height * scaleY
      
      const ctx = canvas.getContext('2d')
      if (ctx) {
        ctx.drawImage(
          img,
          backgroundCropRect.x * scaleX,
          backgroundCropRect.y * scaleY,
          backgroundCropRect.width * scaleX,
          backgroundCropRect.height * scaleY,
          0,
          0,
          canvas.width,
          canvas.height
        )
      }
      
      setAgent(prev => ({ ...prev, backgroundImage: canvas.toDataURL() }))
      setShowBackgroundCropper(false)
      setTempBackgroundImageUrl('')
    }
    img.src = tempBackgroundImageUrl
  }

  const cancelBackgroundCrop = () => {
    setShowBackgroundCropper(false)
    setTempBackgroundImageUrl('')
  }

  // 导出功能相关 state
  const [showExportMenu, setShowExportMenu] = useState(false)
  const [showPrintSubMenu, setShowPrintSubMenu] = useState(false)
  const [showCardManageSubMenu, setShowCardManageSubMenu] = useState(false)
  const [showCardSwitchMenu, setShowCardSwitchMenu] = useState(false)
  const [showPrintPreview, setShowPrintPreview] = useState(false)
  const sheetRef = useRef<HTMLDivElement | null>(null)

  // 菜单延迟关闭的计时器
  const printSubMenuTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const cardManageSubMenuTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const cardSwitchMenuTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // 处理打印子菜单的鼠标进入/离开
  const handlePrintSubMenuEnter = () => {
    if (printSubMenuTimeoutRef.current) {
      clearTimeout(printSubMenuTimeoutRef.current)
      printSubMenuTimeoutRef.current = null
    }
    setShowPrintSubMenu(true)
  }

  const handlePrintSubMenuLeave = () => {
    printSubMenuTimeoutRef.current = setTimeout(() => {
      setShowPrintSubMenu(false)
    }, 200)
  }

  // 处理卡包管理子菜单的鼠标进入/离开
  const handleCardManageSubMenuEnter = () => {
    if (cardManageSubMenuTimeoutRef.current) {
      clearTimeout(cardManageSubMenuTimeoutRef.current)
      cardManageSubMenuTimeoutRef.current = null
    }
    setShowCardManageSubMenu(true)
  }

  const handleCardManageSubMenuLeave = () => {
    cardManageSubMenuTimeoutRef.current = setTimeout(() => {
      setShowCardManageSubMenu(false)
    }, 200)
  }

  // 处理切换角色卡三级菜单的鼠标进入/离开
  const handleCardSwitchMenuEnter = () => {
    if (cardSwitchMenuTimeoutRef.current) {
      clearTimeout(cardSwitchMenuTimeoutRef.current)
      cardSwitchMenuTimeoutRef.current = null
    }
    setShowCardSwitchMenu(true)
  }

  const handleCardSwitchMenuLeave = () => {
    cardSwitchMenuTimeoutRef.current = setTimeout(() => {
      setShowCardSwitchMenu(false)
    }, 200)
  }

  // 菜单容器进入时清除所有延迟
  const handleMenuContainerEnter = () => {
    if (printSubMenuTimeoutRef.current) {
      clearTimeout(printSubMenuTimeoutRef.current)
      printSubMenuTimeoutRef.current = null
    }
    if (cardManageSubMenuTimeoutRef.current) {
      clearTimeout(cardManageSubMenuTimeoutRef.current)
      cardManageSubMenuTimeoutRef.current = null
    }
    if (cardSwitchMenuTimeoutRef.current) {
      clearTimeout(cardSwitchMenuTimeoutRef.current)
      cardSwitchMenuTimeoutRef.current = null
    }
  }

  // 导出为 JSON
  const exportJSON = () => {
    const dataToExport = {
      agent,
      bottles,
      maxIntoxication,
      currentHealth,
      exportDate: new Date().toISOString()
    }
    const jsonString = JSON.stringify(dataToExport, null, 2)
    const blob = new Blob([jsonString], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${agent.codename || 'character'}-${new Date().getTime()}.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    setShowExportMenu(false)
  }

  // 导出为 HTML
  const exportHTML = () => {
    if (!sheetRef.current) return
    
    const htmlContent = `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${agent.codename || 'Character'} - 特工档案</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: 'Arial', sans-serif;
      background: #0a0e27;
      color: #fff;
      padding: 20px;
    }
    .container {
      max-width: 1200px;
      margin: 0 auto;
      background: rgba(255, 255, 255, 0.05);
      border-radius: 15px;
      padding: 30px;
      border: 1px solid rgba(0, 255, 136, 0.3);
    }
    h1, h2, h3 {
      color: #00ff88;
      margin-top: 20px;
      margin-bottom: 10px;
      border-bottom: 2px solid #00ff88;
      padding-bottom: 5px;
    }
    .section {
      margin-bottom: 20px;
      background: rgba(0, 0, 0, 0.4);
      padding: 15px;
      border-radius: 8px;
      border: 1px solid rgba(255, 255, 255, 0.1);
    }
    .row {
      display: flex;
      justify-content: space-between;
      margin-bottom: 10px;
      flex-wrap: wrap;
    }
    .field {
      flex: 1;
      min-width: 200px;
      margin-right: 10px;
    }
    .label {
      color: #00ff88;
      font-weight: bold;
      font-size: 0.9em;
    }
    .value {
      color: #fff;
      font-size: 1em;
      margin-top: 3px;
    }
    img {
      max-width: 100%;
      height: auto;
      margin-top: 10px;
      border-radius: 5px;
    }
    .grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 10px;
    }
    .grid-item {
      padding: 8px;
      background: rgba(0, 255, 136, 0.08);
      border: 1px solid rgba(0, 255, 136, 0.2);
      border-radius: 5px;
    }
    @media print {
      body {
        background: white;
      }
      .container {
        background: white;
        border: none;
        box-shadow: none;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>🕵️ 特工档案 - ${agent.codename}</h1>
    
    <div class="section">
      <h2>基本信息</h2>
      <div class="row">
        <div class="field">
          <div class="label">代号</div>
          <div class="value">${agent.codename}</div>
        </div>
        <div class="field">
          <div class="label">玩家</div>
          <div class="value">${agent.realName}</div>
        </div>
        <div class="field">
          <div class="label">年龄</div>
          <div class="value">${agent.age}</div>
        </div>
      </div>
      <div class="row">
        <div class="field">
          <div class="label">性别</div>
          <div class="value">${agent.gender}</div>
        </div>
        <div class="field">
          <div class="label">出生地</div>
          <div class="value">${agent.birthPlace}</div>
        </div>
      </div>
    </div>

    <div class="section">
      <h2>资源与生命值</h2>
      <div class="row">
        <div class="field">
          <div class="label">初始黑市币</div>
          <div class="value">${agent.initialBlackCoin}</div>
        </div>
        <div class="field">
          <div class="label">剩余黑市币</div>
          <div class="value">${agent.remainingBlackCoin}</div>
        </div>
        <div class="field">
          <div class="label">当前醉意值</div>
          <div class="value">${agent.currentIntoxication}</div>
        </div>
        <div class="field">
          <div class="label">当前生命值</div>
          <div class="value">${currentHealth}</div>
        </div>
      </div>
    </div>

    <div class="section">
      <h2>🌟 社会属性</h2>
      <div class="row">
        <div class="field">
          <div class="label">财富</div>
          <div class="value">${agent.socialAttributes.wealth} - ${agent.socialAttributeDescriptions.wealth}</div>
        </div>
        <div class="field">
          <div class="label">权力</div>
          <div class="value">${agent.socialAttributes.power} - ${agent.socialAttributeDescriptions.power}</div>
        </div>
      </div>
      <div class="row">
        <div class="field">
          <div class="label">声望</div>
          <div class="value">${agent.socialAttributes.prestige} - ${agent.socialAttributeDescriptions.prestige}</div>
        </div>
        <div class="field">
          <div class="label">人脉</div>
          <div class="value">${agent.socialAttributes.network} - ${agent.socialAttributeDescriptions.network}</div>
        </div>
      </div>
    </div>

    <div class="section">
      <h2>🥂 酒类代币</h2>
      <div class="row">
        <div class="field">
          <div class="label">红</div>
          <div class="value">${agent.alcoholTokens.red}</div>
        </div>
        <div class="field">
          <div class="label">黄</div>
          <div class="value">${agent.alcoholTokens.yellow}</div>
        </div>
        <div class="field">
          <div class="label">蓝</div>
          <div class="value">${agent.alcoholTokens.blue}</div>
        </div>
        <div class="field">
          <div class="label">绿</div>
          <div class="value">${agent.alcoholTokens.green}</div>
        </div>
      </div>
    </div>

    <div class="section">
      <h2>💼 职业</h2>
      <div class="row">
        <div class="field">
          <div class="label">职业名称</div>
          <div class="value">${agent.profession.name}</div>
        </div>
      </div>
      <div class="row">
        <div class="field">
          <div class="label">形容词</div>
          <div class="value">${agent.profession.adjectives.filter(a => a).join(', ')}</div>
        </div>
      </div>
    </div>

    <div class="section">
      <h2>🎒 背包</h2>
      <div class="value">${agent.backpack.replace(/\n/g, '<br>')}</div>
    </div>

    <div class="section">
      <h2>🎯 技能</h2>
      <div class="grid">
        ${agent.skillAdjectives.map(skill => `<div class="grid-item">${skill || '(空)'}</div>`).join('')}
      </div>
    </div>

    <div class="section">
      <h2>📝 名词</h2>
      <div class="grid">
        ${agent.nouns.map(noun => `<div class="grid-item">${noun || '(空)'}</div>`).join('')}
      </div>
    </div>

    <div class="section">
      <h2>🎭 背景</h2>
      <div class="value">${agent.background.replace(/\n/g, '<br>')}</div>
      ${agent.backgroundImage ? `<img src="${agent.backgroundImage}" alt="背景图像" style="max-height: 300px;">` : ''}
    </div>

    <footer style="margin-top: 40px; text-align: center; color: #888; font-size: 0.9em;">
      <p>导出时间: ${new Date().toLocaleString('zh-CN')}</p>
    </footer>
    
    <!-- 隐藏的角色数据用于导入 -->
    <textarea id="character-data" style="display: none;">${JSON.stringify({ agent, bottles, maxIntoxication, currentHealth }, null, 2)}</textarea>
  </div>
</body>
</html>
    `
    
    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${agent.codename || 'character'}-${new Date().getTime()}.html`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    setShowExportMenu(false)
  }

  // 导出为 PDF
  const exportPDF = async () => {
    if (!sheetRef.current) return
    
    const element = sheetRef.current
    const opt = {
      margin: 10,
      filename: `${agent.codename || 'character'}-${new Date().getTime()}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { orientation: 'portrait', unit: 'mm', format: 'a4' }
    }
    
    try {
      html2pdf().set(opt).from(element).save()
    } catch (error) {
      console.error('PDF export failed:', error)
      alert('PDF 导出失败，请重试')
    }
    setShowExportMenu(false)
  }

  // 打印预览
  const handlePrintPreview = () => {
    setShowPrintPreview(true)
    setShowExportMenu(false)
  }

  // 从JSON导入
  const importFromJSON = async () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json'
    input.onchange = (e: any) => {
      const file = e.target.files[0]
      if (!file) return

      const reader = new FileReader()
      reader.onload = (event: any) => {
        try {
          const data = JSON.parse(event.target.result)
          const importedAgent = data.agent || data
          const newId = `agent-${Date.now()}`
          setAgents(prev => ({
            ...prev,
            [newId]: { ...importedAgent }
          }))
          switchAgent(newId)
          alert(`已成功导入角色卡: ${importedAgent.codename || '未命名'}`)
        } catch (err) {
          alert('JSON文件格式错误，请检查文件')
          console.error(err)
        }
      }
      reader.readAsText(file)
    }
    input.click()
    setShowCardManageSubMenu(false)
  }

  // 从HTML导入（提取JSON数据）
  const importFromHTML = async () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.html'
    input.onchange = (e: any) => {
      const file = e.target.files[0]
      if (!file) return

      const reader = new FileReader()
      reader.onload = (event: any) => {
        try {
          const htmlContent = event.target.result
          // 查找隐藏的JSON数据
          const match = htmlContent.match(/<textarea[^>]*id="character-data"[^>]*>([\s\S]*?)<\/textarea>/)
          if (!match) {
            alert('HTML文件中未找到角色数据，请使用本程序导出的HTML文件')
            return
          }
          const data = JSON.parse(match[1])
          const importedAgent = data.agent || data
          const newId = `agent-${Date.now()}`
          setAgents(prev => ({
            ...prev,
            [newId]: { ...importedAgent }
          }))
          switchAgent(newId)
          alert(`已成功导入角色卡: ${importedAgent.codename || '未命名'}`)
        } catch (err) {
          alert('HTML文件格式错误，请检查文件')
          console.error(err)
        }
      }
      reader.readAsText(file)
    }
    input.click()
    setShowCardManageSubMenu(false)
  }

  // 社会属性处理函数
  const handleAttributeChange = (attribute: keyof CovertAgent['socialAttributes'], value: number) => {
    setAgent(prev => ({
      ...prev,
      socialAttributes: {
        ...prev.socialAttributes,
        [attribute]: Math.max(0, Math.min(10, value))
      }
    }))
  }

  return (
    <div className="covert-agent-sheet" ref={sheetRef}>
      {/* 特工基本信息 */}
      <div className="section agent-info">
        <h2>🕵️ 特工档案</h2>
        <div className="agent-info-wrapper">
          {/* 上层：头像和个人信息左右排列 */}
          <div className="agent-info-top">
            {/* 第一个框：头像 */}
            <div className="agent-info-box avatar-box-container">
              <div className="avatar-column">
                {showAvatarCropper ? (
                  <div className="avatar-cropper-modal">
                    <div className="cropper-container">
                      <div 
                        className="cropper-preview"
                        ref={cropperRef}
                        onMouseMove={handleCropMove}
                        onMouseUp={handleCropEnd}
                        onMouseLeave={handleCropEnd}
                      >
                        <img src={tempImageUrl} alt="crop" className="cropper-image" />
                        <div
                          className="crop-box"
                          style={{
                            left: `${cropRect.x}px`,
                            top: `${cropRect.y}px`,
                            width: `${cropRect.width}px`,
                            height: `${cropRect.height}px`
                          }}
                          onMouseDown={handleCropStart}
                        >
                          <div className="crop-handle crop-handle-nw" onMouseDown={(e) => handleCropStartHandle(e, 'nw')}></div>
                          <div className="crop-handle crop-handle-ne" onMouseDown={(e) => handleCropStartHandle(e, 'ne')}></div>
                          <div className="crop-handle crop-handle-sw" onMouseDown={(e) => handleCropStartHandle(e, 'sw')}></div>
                          <div className="crop-handle crop-handle-se" onMouseDown={(e) => handleCropStartHandle(e, 'se')}></div>
                        </div>
                      </div>
                      <div className="cropper-buttons">
                        <button onClick={confirmCrop} className="crop-confirm">确定</button>
                        <button onClick={cancelCrop} className="crop-cancel">取消</button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="avatar-box" onClick={openAvatarDialog} role="button" aria-label="上传头像">
                      {agent.avatar ? (
                        <img src={agent.avatar} alt="avatar" />
                      ) : (
                        <div className="avatar-placeholder">点击上传头像</div>
                      )}
                    </div>
                    <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleAvatarSelect} />
                  </>
                )}
              </div>
            </div>

            {/* 第二个框：代号、玩家、年龄、性别、出生地 */}
            <div className="agent-info-box personal-info-box">
              <div className="input-group">
                <label>代号:</label>
                <input 
                  type="text" 
                  value={agent.codename}
                  onChange={(e) => setAgent(prev => ({...prev, codename: e.target.value}))}
                  placeholder="输入特工代号"
                />
              </div>
              <div className="input-group">
                <label>玩家:</label>
                <input 
                  type="text" 
                  value={agent.realName}
                  onChange={(e) => setAgent(prev => ({...prev, realName: e.target.value}))}
                  placeholder="输入玩家姓名"
                />
              </div>
              <div className="input-row">
                <div className="input-group">
                  <label>年龄:</label>
                  <input
                    type="number"
                    className="numeric-input"
                    value={agent.age}
                    onChange={(e) => setAgent(prev => ({...prev, age: parseInt(e.target.value) || 0}))}
                    placeholder="输入年龄"
                  />
                </div>
                <div className="input-group">
                  <label>性别:</label>
                  <input 
                    type="text" 
                    value={agent.gender}
                    onChange={(e) => setAgent(prev => ({...prev, gender: e.target.value}))}
                    placeholder="输入性别"
                  />
                </div>
              </div>
              <div className="input-row">
                <div className="input-group">
                  <label>出生地:</label>
                  <input 
                    type="text" 
                    value={agent.birthPlace}
                    onChange={(e) => setAgent(prev => ({...prev, birthPlace: e.target.value}))}
                    placeholder="输入出生地"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* 下层：黑市币与生命值框 */}
          <div className="agent-info-box coins-status-box">
            <div className="input-row">
              <div className="input-group">
                <label>初始黑市币:</label>
                <div className="number-with-controls">
                  <input
                    type="number"
                    className="numeric-input"
                    value={agent.initialBlackCoin}
                    onChange={(e) => setAgent(prev => ({...prev, initialBlackCoin: parseInt(e.target.value) || 0}))}
                    placeholder="输入初始黑市币"
                  />
                  <div className="token-controls">
                    <button onClick={() => setAgent(prev => ({...prev, initialBlackCoin: Math.max(0, prev.initialBlackCoin - 1)}))}>-</button>
                    <button onClick={() => setAgent(prev => ({...prev, initialBlackCoin: prev.initialBlackCoin + 1}))}>+</button>
                  </div>
                </div>
              </div>
              <div className="input-group">
                <label>当前醉意值:</label>
                <div className="number-with-controls">
                  <input
                    type="number"
                    className="numeric-input"
                    value={agent.currentIntoxication}
                    onChange={(e) => {
                      const newIntoxication = parseInt(e.target.value) || 0
                      setAgent(prev => ({...prev, currentIntoxication: newIntoxication}))
                      // 当醉意值增加时，更新最高醉意值和生命值
                      if (newIntoxication > maxIntoxication) {
                        setMaxIntoxication(newIntoxication)
                        setCurrentHealth(10 + newIntoxication)
                      }
                    }}
                    placeholder="输入当前醉意值"
                  />
                  <div className="token-controls">
                    <button onClick={() => {
                      setAgent(prev => ({...prev, currentIntoxication: Math.max(0, prev.currentIntoxication - 1)}))
                    }}>-</button>
                    <button onClick={() => {
                      setAgent(prev => {
                        const newIntoxication = prev.currentIntoxication + 1
                        // 当醉意值增加时，同步增加生命值
                        if (newIntoxication > maxIntoxication) {
                          setMaxIntoxication(newIntoxication)
                          setCurrentHealth(10 + newIntoxication)
                        }
                        return {...prev, currentIntoxication: newIntoxication}
                      })
                    }}>+</button>
                  </div>
                </div>
              </div>
            </div>
            <div className="input-row">
              <div className="input-group">
                <label>剩余黑市币:</label>
                <div className="number-with-controls">
                  <input
                    type="number"
                    className="numeric-input"
                    value={agent.remainingBlackCoin}
                    onChange={(e) => setAgent(prev => ({...prev, remainingBlackCoin: parseInt(e.target.value) || 0}))}
                    placeholder="输入剩余黑市币"
                  />
                  <div className="token-controls">
                    <button onClick={() => setAgent(prev => ({...prev, remainingBlackCoin: Math.max(0, prev.remainingBlackCoin - 1)}))}>-</button>
                    <button onClick={() => setAgent(prev => ({...prev, remainingBlackCoin: prev.remainingBlackCoin + 1}))}>+</button>
                  </div>
                </div>
              </div>
              <div className="input-group">
                <label>当前生命值:</label>
                <div className="number-with-controls">
                  <input
                    type="number"
                    className="numeric-input"
                    value={currentHealth}
                    
                    onChange={(e) => {
                      const newHealth = Math.max(1, parseInt(e.target.value) || 1)
                      setCurrentHealth(newHealth)
                    }}
                    placeholder="手动编辑生命值"
                  />
                  <div className="token-controls">
                    <button onClick={() => setCurrentHealth(prev => Math.max(0, prev - 1))}>-</button>
                    <button onClick={() => setCurrentHealth(prev => prev + 1)}>+</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 社会属性 */}
      <div className="section attributes">
        <h2>🌟 社会属性</h2>
        <div className="social-attributes-list">
          {(['wealth', 'power', 'prestige', 'network'] as const).map((key) => {
            const value = agent.socialAttributes[key]
            return (
              <div key={key} className="social-attribute-row">
                <div className="attr-label">{getSocialAttributeLabel(key)}</div>
                <div className="attr-noun">
                  <label>名词数量：</label>
                  <input 
                    type="text"
                    placeholder="填入对应名词"
                    value={agent.socialAttributeDescriptions[key]}
                    onChange={(e) => setAgent(prev => ({
                      ...prev,
                      socialAttributeDescriptions: {
                        ...prev.socialAttributeDescriptions,
                        [key]: e.target.value
                      }
                    }))}
                  />
                </div>
                <div className="attr-level">
                  <label>等级：</label>
                  <div className="attr-controls">
                    <button 
                      onClick={() => handleAttributeChange(key, value - 1)}
                      disabled={value <= 0}
                    >-</button>
                    <span className="attr-value">{value}</span>
                    <button 
                      onClick={() => handleAttributeChange(key, value + 1)}
                      disabled={value >= 10}
                    >+</button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
        {/* 酒类代币 */}
        <div className="alcohol-tokens">
          <h3>🥂 酒类代币</h3>
          <div className="tokens-grid">
            {(['red','yellow','blue','green'] as const).map((color) => {
              const val = agent.alcoholTokens[color]
              const labels = { red: '红', yellow: '黄', blue: '蓝', green: '绿' }
              return (
                <div key={color} className="token-item social-attribute-row">
                  <div className={`token-label token-${color}`}>{labels[color]}</div>
                  <div className="token-input-wrap">
                    <input
                      type="number"
                      className={`token-input token-${color}`}
                      min={0}
                      value={val}
                      onChange={(e) => setAgent(prev => ({ ...prev, alcoholTokens: { ...prev.alcoholTokens, [color]: parseInt(e.target.value) || 0 } }))}
                    />
                  </div>
                  <div className="token-controls">
                    <button onClick={() => setAgent(prev => ({ ...prev, alcoholTokens: { ...prev.alcoholTokens, [color]: Math.max(0, val - 1) } }))}>-</button>
                    <button onClick={() => setAgent(prev => ({ ...prev, alcoholTokens: { ...prev.alcoholTokens, [color]: val + 1 } }))}>+</button>
                  </div>
                </div>
              )
            })}
          </div>
          <div className="alcohol-divider" />
        </div>
      </div>

      {/* 新增：酒类展示，横跨两列 */}
      <div className="section wine-section">
        <h2>🍶 酒</h2>
        <div className="bottle-grid">
          {bottles.map((b, idx) => (
            <div key={idx} className="bottle-item">
              <div className="bottle-image" onClick={() => openBottleDialog(idx)} role="button" aria-label={`选择${b.name}图片`}>
                {b.image ? (
                  <img src={b.image} alt={b.name} />
                ) : (
                  <div className="bottle-placeholder">点击选择图片</div>
                )}
              </div>
              <div className="bottle-name">{b.name}</div>
            </div>
          ))}
        </div>
        <input ref={bottleFileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleBottleSelect} />
      </div>

      {/* 职业与背包 - 水平排列 */}
      <div className="profession-backpack-container">
        {/* 职业模块 */}
        <div className="section profession-section">
          <h2>💼 职业</h2>
          <div className="profession-content">
            <div className="profession-name-row">
              <label>职业名称</label>
              <input
                type="text"
                className="profession-name-input"
                placeholder="输入职业名称"
                value={agent.profession.name}
                onChange={(e) => setAgent(prev => ({
                  ...prev,
                  profession: { ...prev.profession, name: e.target.value }
                }))}
              />
            </div>
            <div className="profession-adjectives">
              {agent.profession.adjectives.map((adj, idx) => (
                <div key={idx} className="adjective-row">
                  <input
                    type="text"
                    className="adjective-input"
                    placeholder={`形容词 ${idx + 1}`}
                    value={adj}
                    onChange={(e) => setAgent(prev => ({
                      ...prev,
                      profession: {
                        ...prev.profession,
                        adjectives: prev.profession.adjectives.map((a, i) => i === idx ? e.target.value : a)
                      }
                    }))}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 背包模块 */}
        <div className="section backpack-section">
          <h2>🎒 背包</h2>
          <div className="backpack-content">
            <textarea
              className="backpack-textarea"
              placeholder="手动填写背包内容"
              value={agent.backpack}
              onChange={(e) => setAgent(prev => ({
                ...prev,
                backpack: e.target.value
              }))}
            />
          </div>
        </div>
      </div>

      {/* 技能形容词与名词模块 - 水平排列 */}
      <div className="skills-nouns-container">
        {/* 技能形容词模块 */}
        <div className="section skills-section">
          <h2>🎯 技能</h2>
          <div className="skills-grid">
            {agent.skillAdjectives.map((skill, idx) => (
              <div key={idx} className="skill-item">
                <input
                  type="text"
                  className="skill-input"
                  placeholder={`技能 ${idx + 1}`}
                  value={skill}
                  onChange={(e) => setAgent(prev => ({
                    ...prev,
                    skillAdjectives: prev.skillAdjectives.map((s, i) => i === idx ? e.target.value : s)
                  }))}
                />
              </div>
            ))}
          </div>
        </div>

        {/* 名词模块 */}
        <div className="section nouns-section">
          <h2>📝 名词</h2>
          <div className="nouns-grid">
            {agent.nouns.map((noun, idx) => (
              <div key={idx} className="noun-item">
                <input
                  type="text"
                  className="noun-input"
                  placeholder={`名词 ${idx + 1}`}
                  value={noun}
                  onChange={(e) => setAgent(prev => ({
                    ...prev,
                    nouns: prev.nouns.map((n, i) => i === idx ? e.target.value : n)
                  }))}
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 背景模块 - 占据整个宽度 */}
      <div className="section background-section">
        <h2>🎭 背景</h2>
        <div className="background-content">
          {/* 左侧：背景文本区域 */}
          <div className="background-text-area">
            <textarea
              className="background-textarea"
              placeholder="手动填写背景内容"
              value={agent.background}
              onChange={(e) => setAgent(prev => ({
                ...prev,
                background: e.target.value
              }))}
            />
          </div>

          {/* 右侧：背景图像框 */}
          <div className="background-image-container">
            {showBackgroundCropper ? (
              <div className="background-cropper-modal">
                <div className="background-cropper-container">
                  <div 
                    className="background-cropper-preview"
                    ref={backgroundCropperRef}
                    onMouseMove={handleBackgroundCropMove}
                    onMouseUp={handleBackgroundCropEnd}
                    onMouseLeave={handleBackgroundCropEnd}
                  >
                    <img src={tempBackgroundImageUrl} alt="background crop" className="background-cropper-image" />
                    <div
                      className="background-crop-box"
                      style={{
                        left: `${backgroundCropRect.x}px`,
                        top: `${backgroundCropRect.y}px`,
                        width: `${backgroundCropRect.width}px`,
                        height: `${backgroundCropRect.height}px`
                      }}
                      onMouseDown={handleBackgroundCropStart}
                    >
                      <div className="background-crop-handle background-crop-handle-nw" onMouseDown={(e) => handleBackgroundCropStartHandle(e, 'nw')}></div>
                      <div className="background-crop-handle background-crop-handle-ne" onMouseDown={(e) => handleBackgroundCropStartHandle(e, 'ne')}></div>
                      <div className="background-crop-handle background-crop-handle-sw" onMouseDown={(e) => handleBackgroundCropStartHandle(e, 'sw')}></div>
                      <div className="background-crop-handle background-crop-handle-se" onMouseDown={(e) => handleBackgroundCropStartHandle(e, 'se')}></div>
                    </div>
                  </div>
                  <div className="background-cropper-buttons">
                    <button onClick={confirmBackgroundCrop} className="crop-confirm">确定</button>
                    <button onClick={cancelBackgroundCrop} className="crop-cancel">取消</button>
                  </div>
                </div>
              </div>
            ) : (
              <>
                <div className="background-image-box" onClick={openBackgroundDialog} role="button" aria-label="上传背景图像">
                  {agent.backgroundImage ? (
                    <img src={agent.backgroundImage} alt="background" />
                  ) : (
                    <div className="background-image-placeholder">与你最适配的酒，会是....</div>
                  )}
                </div>
                <input ref={backgroundFileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleBackgroundImageSelect} />
              </>
            )}
          </div>
        </div>
      </div>

      {/* 悬浮导出按钮 */}
      <div className="export-floating-button">
        <button 
          className="export-btn"
          onClick={() => setShowExportMenu(!showExportMenu)}
          title="打印/导出功能"
        >
          ⌘
        </button>
        
        {showExportMenu && (
          <div className="export-menu" onMouseEnter={handleMenuContainerEnter}>
            <button 
              className={`export-menu-item has-submenu ${showCardManageSubMenu ? 'active' : ''}`}
              onMouseEnter={handleCardManageSubMenuEnter}
              onMouseLeave={handleCardManageSubMenuLeave}
            >
              <span>卡包管理</span>
              {showCardManageSubMenu && (
                <div className="export-submenu" onMouseEnter={handleMenuContainerEnter} onMouseLeave={handleCardManageSubMenuLeave}>
                  <button 
                    className={`submenu-item has-submenu ${showCardSwitchMenu ? 'active' : ''}`}
                    onMouseEnter={handleCardSwitchMenuEnter}
                    onMouseLeave={handleCardSwitchMenuLeave}
                  >
                    <span>切换角色卡</span>
                    {showCardSwitchMenu && (
                      <div className="export-submenu card-switch-menu" onMouseEnter={handleMenuContainerEnter} onMouseLeave={handleCardSwitchMenuLeave}>
                        <button 
                          onClick={createNewAgent} 
                          className="submenu-item new-card-btn"
                          onMouseEnter={handleMenuContainerEnter}
                          onMouseLeave={handleCardSwitchMenuLeave}
                        >
                          ➕ 新建角色卡
                        </button>
                        <div className="card-list-divider" onMouseEnter={handleMenuContainerEnter}></div>
                        <div className="card-items-container" onMouseEnter={handleMenuContainerEnter} onMouseLeave={handleCardSwitchMenuLeave}>
                          {Object.entries(agents).map(([id, agentData]) => (
                            <button 
                              key={id}
                              onClick={() => switchAgent(id)}
                              className={`submenu-item card-item ${currentAgentId === id ? 'active' : ''}`}
                              onMouseEnter={handleMenuContainerEnter}
                              onMouseLeave={handleCardSwitchMenuLeave}
                            >
                              <span>{agentData.codename || '未命名'}</span>
                              {currentAgentId === id && <span className="active-indicator">✓</span>}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </button>
                  <button onClick={importFromJSON} className="submenu-item">
                    📥 从JSON导入
                  </button>
                  <button onClick={importFromHTML} className="submenu-item">
                    📥 从HTML导入
                  </button>
                </div>
              )}
            </button>
            <button className="export-menu-item">
              <span>存档管理</span>
            </button>
            <button 
              className={`export-menu-item has-submenu ${showPrintSubMenu ? 'active' : ''}`}
              onMouseEnter={handlePrintSubMenuEnter}
              onMouseLeave={handlePrintSubMenuLeave}
            >
              <span>打印</span>
              {showPrintSubMenu && (
                <div className="export-submenu" onMouseEnter={handleMenuContainerEnter} onMouseLeave={handlePrintSubMenuLeave}>
                  <button onClick={exportPDF} className="submenu-item">
                    📑 导出 PDF
                  </button>
                  <button onClick={exportJSON} className="submenu-item">
                    💾 导出 JSON
                  </button>
                  <button onClick={exportHTML} className="submenu-item">
                    📄 导出 HTML
                  </button>
                  <button onClick={handlePrintPreview} className="submenu-item">
                    👁️ 打印预览
                  </button>
                </div>
              )}
            </button>
          </div>
        )}
      </div>

      {/* 打印预览模态框 */}
      {showPrintPreview && (
        <div className="print-preview-modal">
          <div className="print-preview-container">
            <div className="print-preview-header">
              <h2>打印预览</h2>
              <button 
                className="close-btn"
                onClick={() => setShowPrintPreview(false)}
              >
                ✕
              </button>
            </div>
            <div className="print-preview-content">
              <div className="print-preview-sheet">
                <h1>🕵️ 特工档案 - {agent.codename}</h1>
                
                <div className="preview-section">
                  <h2>基本信息</h2>
                  <div className="preview-row">
                    <div className="preview-field">
                      <span className="preview-label">代号:</span>
                      <span className="preview-value">{agent.codename}</span>
                    </div>
                    <div className="preview-field">
                      <span className="preview-label">玩家:</span>
                      <span className="preview-value">{agent.realName}</span>
                    </div>
                    <div className="preview-field">
                      <span className="preview-label">年龄:</span>
                      <span className="preview-value">{agent.age}</span>
                    </div>
                  </div>
                  <div className="preview-row">
                    <div className="preview-field">
                      <span className="preview-label">性别:</span>
                      <span className="preview-value">{agent.gender}</span>
                    </div>
                    <div className="preview-field">
                      <span className="preview-label">出生地:</span>
                      <span className="preview-value">{agent.birthPlace}</span>
                    </div>
                  </div>
                </div>

                <div className="preview-section">
                  <h2>资源与生命值</h2>
                  <div className="preview-row">
                    <div className="preview-field">
                      <span className="preview-label">初始黑市币:</span>
                      <span className="preview-value">{agent.initialBlackCoin}</span>
                    </div>
                    <div className="preview-field">
                      <span className="preview-label">剩余黑市币:</span>
                      <span className="preview-value">{agent.remainingBlackCoin}</span>
                    </div>
                    <div className="preview-field">
                      <span className="preview-label">当前醉意值:</span>
                      <span className="preview-value">{agent.currentIntoxication}</span>
                    </div>
                    <div className="preview-field">
                      <span className="preview-label">当前生命值:</span>
                      <span className="preview-value">{currentHealth}</span>
                    </div>
                  </div>
                </div>

                <div className="preview-section">
                  <h2>社会属性与技能</h2>
                  <div className="preview-row">
                    <div className="preview-field">
                      <span className="preview-label">职业:</span>
                      <span className="preview-value">{agent.profession.name}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="print-preview-footer">
              <button 
                className="btn-print"
                onClick={() => window.print()}
              >
                🖨️ 打印
              </button>
              <button 
                className="btn-close"
                onClick={() => setShowPrintPreview(false)}
              >
                关闭
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// 辅助函数：获取社会属性显示标签
const getSocialAttributeLabel = (key: 'wealth' | 'power' | 'prestige' | 'network'): string => {
  const labels: Record<'wealth' | 'power' | 'prestige' | 'network', string> = {
    wealth: '财富',
    power: '权力',
    prestige: '声望',
    network: '人脉'
  }
  return labels[key] || key
}

export default CovertAgentSheet
