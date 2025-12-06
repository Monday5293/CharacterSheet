import * as React from 'react'
import { useState, useRef } from 'react'
import { CovertAgent } from '../types/character'
import '../styles/CoverAgentSheet.css'

const CovertAgentSheet: React.FC = () => {
  const [agent, setAgent] = useState<CovertAgent>({
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
  })

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
  const [maxIntoxication, setMaxIntoxication] = useState(0)
  const [currentHealth, setCurrentHealth] = useState(10)

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
  const [bottles, setBottles] = useState(() =>
    Array.from({ length: 6 }, (_, i) => ({ image: '', name: `酒${i + 1}` }))
  )
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
    <div className="covert-agent-sheet">
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
                <div className="attr-name">{getSocialAttributeLabel(key)}</div>
                <div className="attr-description">
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
                    <div className="background-image-placeholder">点击上传背景图像</div>
                  )}
                </div>
                <input ref={backgroundFileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleBackgroundImageSelect} />
              </>
            )}
          </div>
        </div>
      </div>
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
