import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button.jsx'
import { Input } from '@/components/ui/input.jsx'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.jsx'
import { Badge } from '@/components/ui/badge.jsx'
import { Separator } from '@/components/ui/separator.jsx'
import { ScrollArea } from '@/components/ui/scroll-area.jsx'
import Live2DCharacter from './components/Live2DCharacter.jsx'
import { 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX, 
  Send, 
  Settings, 
  Brain, 
  Wifi, 
  WifiOff,
  Bot,
  User,
  Heart,
  Sparkles,
  Video,
  VideoOff
} from 'lucide-react'
import './App.css'

function App() {
  // State management
  const [messages, setMessages] = useState([])
  const [inputMessage, setInputMessage] = useState('')
  const [isConnected, setIsConnected] = useState(false)
  const [isVoiceEnabled, setIsVoiceEnabled] = useState(false)
  const [isMemoryEnabled, setIsMemoryEnabled] = useState(true)
  const [connectionAttempts, setConnectionAttempts] = useState(0)
  const [aiProvider, setAiProvider] = useState('openai')
  const [memoryStats, setMemoryStats] = useState({ shortTerm: 0, longTerm: 0 })
  
  // Character state
  const [isCharacterVisible, setIsCharacterVisible] = useState(true)
  const [characterExpression, setCharacterExpression] = useState('neutral')
  const [isListening, setIsListening] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  
  // Refs
  const wsRef = useRef(null)
  const messagesEndRef = useRef(null)
  const reconnectTimeoutRef = useRef(null)

  // WebSocket connection with enhanced stability
  const connectWebSocket = () => {
    try {
      // Try to connect to backend WebSocket
      wsRef.current = new WebSocket('ws://localhost:6121/ws')
      
      wsRef.current.onopen = () => {
        console.log('🔗 Connected to AIRI Backend')
        setIsConnected(true)
        setConnectionAttempts(0)
        
        // Send initial message
        addMessage('system', 'Connected to AIRI Backend! All features are ready.', {
          provider: 'system',
          features: ['voice', 'memory', 'openai', 'gemini']
        })
      }

      wsRef.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          handleWebSocketMessage(data)
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error)
        }
      }

      wsRef.current.onclose = () => {
        console.log('❌ WebSocket disconnected')
        setIsConnected(false)
        
        // Enhanced reconnection with exponential backoff
        const delay = Math.min(1000 * Math.pow(2, connectionAttempts), 30000)
        setConnectionAttempts(prev => prev + 1)
        
        addMessage('system', `Connection lost. Reconnecting in ${delay/1000}s... (attempt ${connectionAttempts + 1})`)
        
        reconnectTimeoutRef.current = setTimeout(() => {
          connectWebSocket()
        }, delay)
      }

      wsRef.current.onerror = (error) => {
        console.error('🚨 WebSocket error:', error)
        addMessage('system', 'WebSocket connection error. Retrying...', { type: 'error' })
      }

    } catch (error) {
      console.error('Failed to create WebSocket connection:', error)
      addMessage('system', 'Failed to connect to backend. Please ensure the server is running.', { type: 'error' })
    }
  }

  // Handle WebSocket messages
  const handleWebSocketMessage = (data) => {
    switch (data.type) {
      case 'connected':
        addMessage('airi', 'Hello! I\'m AIRI and I\'m ready to chat with you! 🤖✨', {
          provider: 'system',
          features: data.data.features
        })
        break
        
      case 'ai_response':
        addMessage('airi', data.data.content, {
          provider: data.data.metadata?.provider || 'openai',
          model: data.data.metadata?.model || 'gpt-4'
        })
        
        // Speak the response if voice is enabled
        if (isVoiceEnabled) {
          speakText(data.data.content)
        }
        break
        
      case 'pong':
        console.log('🏓 Pong received')
        break
        
      case 'error':
        addMessage('system', `Error: ${data.data.message}`, { type: 'error' })
        break
        
      default:
        console.log('Unknown message type:', data.type)
    }
  }

  // Add message to chat
  const addMessage = (sender, content, metadata = {}) => {
    const message = {
      id: Date.now() + Math.random(),
      sender,
      content,
      timestamp: new Date(),
      metadata
    }
    
    setMessages(prev => [...prev, message])
    
    // Update memory stats if memory is enabled
    if (isMemoryEnabled && sender !== 'system') {
      setMemoryStats(prev => ({
        shortTerm: Math.min(prev.shortTerm + 1, 50),
        longTerm: prev.longTerm + (Math.random() > 0.8 ? 1 : 0) // Simulate promotion
      }))
    }
  }

  // Send message
  const sendMessage = () => {
    if (!inputMessage.trim()) return
    
    // Add user message to chat
    addMessage('user', inputMessage)
    
    // Send to WebSocket if connected
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'input:text',
        data: { text: inputMessage }
      }))
    } else {
      // Fallback response if not connected
      setTimeout(() => {
        addMessage('airi', `I received your message: "${inputMessage}". However, I'm not connected to the backend right now. Please check the connection!`, {
          provider: 'fallback'
        })
      }, 1000)
    }
    
    setInputMessage('')
  }

  // Voice synthesis
  const speakText = (text) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text)
      utterance.rate = 1.0
      utterance.pitch = 1.0
      utterance.volume = 1.0
      
      // Try to use a nice voice
      const voices = speechSynthesis.getVoices()
      const preferredVoice = voices.find(voice => 
        voice.name.includes('Samantha') || 
        voice.name.includes('Karen') || 
        voice.name.includes('Female')
      )
      if (preferredVoice) {
        utterance.voice = preferredVoice
      }
      
      speechSynthesis.speak(utterance)
    }
  }

  // Toggle voice
  const toggleVoice = () => {
    setIsVoiceEnabled(prev => !prev)
    if (!isVoiceEnabled) {
      speakText("Voice synthesis enabled!")
    }
  }

  // Toggle memory
  const toggleMemory = () => {
    setIsMemoryEnabled(prev => !prev)
    addMessage('system', `Memory system ${!isMemoryEnabled ? 'enabled' : 'disabled'}`)
  }

  // Send heartbeat
  const sendHeartbeat = () => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'ping' }))
    }
  }

  // Effects
  useEffect(() => {
    connectWebSocket()
    
    // Heartbeat interval
    const heartbeatInterval = setInterval(sendHeartbeat, 30000)
    
    return () => {
      clearInterval(heartbeatInterval)
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
      }
      if (wsRef.current) {
        wsRef.current.close()
      }
    }
  }, [])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Handle Enter key
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 text-white">
      {/* Header */}
      <div className="border-b border-white/20 bg-black/20 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-pink-500 to-purple-500 rounded-full flex items-center justify-center">
                <Sparkles className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-pink-400 to-purple-400 bg-clip-text text-transparent">
                  AIRI Enhanced
                </h1>
                <p className="text-sm text-gray-300">AI-Powered Live Character</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              {/* Connection Status */}
              <Badge variant={isConnected ? "default" : "destructive"} className="flex items-center space-x-1">
                {isConnected ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
                <span>{isConnected ? 'Connected' : `Reconnecting... (${connectionAttempts})`}</span>
              </Badge>
              
              {/* Voice Toggle */}
              <Button
                variant={isVoiceEnabled ? "default" : "outline"}
                size="sm"
                onClick={toggleVoice}
                className="flex items-center space-x-1"
              >
                {isVoiceEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                <span>Voice</span>
              </Button>
              
              {/* Memory Toggle */}
              <Button
                variant={isMemoryEnabled ? "default" : "outline"}
                size="sm"
                onClick={toggleMemory}
                className="flex items-center space-x-1"
              >
                <Brain className="w-4 h-4" />
                <span>Memory</span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 max-w-7xl">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-4">
            {/* Memory Stats */}
            <Card className="bg-black/40 border-white/20 backdrop-blur-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center space-x-2">
                  <Brain className="w-5 h-5" />
                  <span>Memory</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <div className="flex justify-between text-sm">
                    <span>Short-term</span>
                    <span>{memoryStats.shortTerm}/50</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2 mt-1">
                    <div 
                      className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${(memoryStats.shortTerm / 50) * 100}%` }}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm">
                    <span>Long-term</span>
                    <span>{memoryStats.longTerm}/500</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2 mt-1">
                    <div 
                      className="bg-purple-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${(memoryStats.longTerm / 500) * 100}%` }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* AI Provider */}
            <Card className="bg-black/40 border-white/20 backdrop-blur-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">AI Provider</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Badge variant="default" className="w-full justify-center">
                    OpenAI GPT-4
                  </Badge>
                  <Badge variant="outline" className="w-full justify-center">
                    Google Gemini
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Features */}
            <Card className="bg-black/40 border-white/20 backdrop-blur-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Features</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Voice Synthesis</span>
                  <Badge variant={isVoiceEnabled ? "default" : "secondary"}>
                    {isVoiceEnabled ? "ON" : "OFF"}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Memory System</span>
                  <Badge variant={isMemoryEnabled ? "default" : "secondary"}>
                    {isMemoryEnabled ? "ON" : "OFF"}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">WebSocket</span>
                  <Badge variant={isConnected ? "default" : "destructive"}>
                    {isConnected ? "CONNECTED" : "DISCONNECTED"}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">3D Character</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsCharacterVisible(!isCharacterVisible)}
                    className="h-6 px-2"
                  >
                    {isCharacterVisible ? <Video className="w-3 h-3" /> : <VideoOff className="w-3 h-3" />}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Character Display */}
          <div className="lg:col-span-1">
            <Card className="bg-black/40 border-white/20 backdrop-blur-sm h-[600px]">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center space-x-2">
                  <Heart className="w-5 h-5 text-pink-400" />
                  <span>AIRI</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-1 p-2">
                <Live2DCharacter
                  isVisible={isCharacterVisible}
                  expression={characterExpression}
                  isListening={isListening}
                  isSpeaking={isSpeaking}
                />
              </CardContent>
            </Card>
          </div>

          {/* Main Chat Area */}
          <div className="lg:col-span-3">
            <Card className="bg-black/40 border-white/20 backdrop-blur-sm h-[600px] flex flex-col">
              <CardHeader className="pb-3">
                <CardTitle className="text-xl flex items-center space-x-2">
                  <Bot className="w-6 h-6" />
                  <span>Chat with AIRI</span>
                </CardTitle>
                <CardDescription className="text-gray-300">
                  Your AI companion with voice, memory, and real-time interaction
                </CardDescription>
              </CardHeader>
              
              <CardContent className="flex-1 flex flex-col space-y-4">
                {/* Messages */}
                <ScrollArea className="flex-1 pr-4">
                  <div className="space-y-4">
                    {messages.length === 0 && (
                      <div className="text-center text-gray-400 py-8">
                        <Bot className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p>Start a conversation with AIRI!</p>
                        <p className="text-sm mt-2">Try saying "Hello" or ask about her features</p>
                      </div>
                    )}
                    
                    {messages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[80%] rounded-lg px-4 py-2 ${
                            message.sender === 'user'
                              ? 'bg-blue-600 text-white'
                              : message.sender === 'system'
                              ? 'bg-gray-600 text-gray-200'
                              : 'bg-purple-600 text-white'
                          }`}
                        >
                          <div className="flex items-center space-x-2 mb-1">
                            {message.sender === 'user' ? (
                              <User className="w-4 h-4" />
                            ) : message.sender === 'airi' ? (
                              <Bot className="w-4 h-4" />
                            ) : (
                              <Settings className="w-4 h-4" />
                            )}
                            <span className="text-xs opacity-75">
                              {message.sender === 'user' ? 'You' : message.sender === 'airi' ? 'AIRI' : 'System'}
                            </span>
                            {message.metadata?.provider && (
                              <Badge variant="secondary" className="text-xs">
                                {message.metadata.provider}
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm">{message.content}</p>
                          <p className="text-xs opacity-50 mt-1">
                            {message.timestamp.toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                    ))}
                    <div ref={messagesEndRef} />
                  </div>
                </ScrollArea>

                <Separator className="bg-white/20" />

                {/* Input Area */}
                <div className="flex space-x-2">
                  <Input
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Type your message to AIRI..."
                    className="flex-1 bg-white/10 border-white/20 text-white placeholder:text-gray-400"
                  />
                  <Button 
                    onClick={sendMessage}
                    disabled={!inputMessage.trim()}
                    className="bg-purple-600 hover:bg-purple-700"
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

export default App

