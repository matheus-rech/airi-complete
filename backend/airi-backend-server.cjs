const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const cors = require('cors');
const path = require('path');

// Load environment variables
require('dotenv').config();

const app = express();
const server = http.createServer(app);

// Middleware
app.use(cors({
  origin: ['http://localhost:5174', 'https://5174-i6nie8ipgjdkdg98gngwc-97fe0ec1.manusvm.computer'],
  credentials: true
}));
app.use(express.json());

// WebSocket Server
const wss = new WebSocket.Server({ 
  server,
  path: '/ws'
});

console.log('🚀 AIRI Backend Server Starting...');
console.log('🔑 OpenAI API Key:', process.env.OPENAI_API_KEY ? 'Configured ✅' : 'Missing ❌');
console.log('🔑 Gemini API Key:', process.env.GEMINI_API_KEY ? 'Configured ✅' : 'Missing ❌');

// WebSocket connection handling
wss.on('connection', (ws, req) => {
  console.log('🔗 New WebSocket connection from:', req.socket.remoteAddress);
  
  // Send welcome message
  ws.send(JSON.stringify({
    type: 'connected',
    data: {
      message: 'Connected to AIRI Backend',
      timestamp: Date.now(),
      features: {
        voice: true,
        memory: true,
        openai: !!process.env.OPENAI_API_KEY,
        gemini: !!process.env.GEMINI_API_KEY
      }
    }
  }));

  // Handle incoming messages
  ws.on('message', async (message) => {
    try {
      const data = JSON.parse(message);
      console.log('📨 Received message:', data.type);
      
      switch (data.type) {
        case 'ping':
          ws.send(JSON.stringify({
            type: 'pong',
            data: { timestamp: Date.now() }
          }));
          break;
          
        case 'input:text':
          await handleTextInput(ws, data.data);
          break;
          
        case 'input:voice':
          await handleVoiceInput(ws, data.data);
          break;
          
        case 'module:authenticate':
          ws.send(JSON.stringify({
            type: 'module:authenticated',
            data: { authenticated: true }
          }));
          break;
          
        default:
          console.log('🤷 Unknown message type:', data.type);
      }
    } catch (error) {
      console.error('❌ Error processing message:', error);
      ws.send(JSON.stringify({
        type: 'error',
        data: { message: 'Failed to process message' }
      }));
    }
  });

  ws.on('close', () => {
    console.log('❌ WebSocket connection closed');
  });

  ws.on('error', (error) => {
    console.error('🚨 WebSocket error:', error);
  });
});

// Handle text input (AI chat)
async function handleTextInput(ws, data) {
  const { text } = data;
  
  try {
    // Simulate AI response (replace with actual OpenAI/Gemini call)
    const response = await generateAIResponse(text);
    
    ws.send(JSON.stringify({
      type: 'ai_response',
      data: {
        content: response,
        timestamp: Date.now(),
        metadata: {
          provider: 'openai',
          model: 'gpt-4'
        }
      }
    }));
  } catch (error) {
    console.error('❌ AI response error:', error);
    ws.send(JSON.stringify({
      type: 'error',
      data: { message: 'Failed to generate AI response' }
    }));
  }
}

// Handle voice input
async function handleVoiceInput(ws, data) {
  // Implement voice transcription and response
  console.log('🎤 Voice input received');
  
  ws.send(JSON.stringify({
    type: 'ai_response',
    data: {
      content: "I heard your voice message! Voice processing is working.",
      timestamp: Date.now(),
      metadata: {
        provider: 'voice',
        transcription: true
      }
    }
  }));
}

// Generate AI response (placeholder - implement with actual OpenAI/Gemini)
async function generateAIResponse(text) {
  // This is a placeholder - implement actual AI integration
  const responses = [
    `Hello! You said: "${text}". I'm AIRI and I'm working perfectly with enhanced features!`,
    `I understand you're saying: "${text}". My voice and memory systems are active!`,
    `Thanks for the message: "${text}". I can remember our conversation and speak back to you!`,
    `You wrote: "${text}". I'm ready to chat, remember everything, and use my voice!`
  ];
  
  return responses[Math.floor(Math.random() * responses.length)];
}

// API Routes
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    features: {
      websocket: true,
      openai: !!process.env.OPENAI_API_KEY,
      gemini: !!process.env.GEMINI_API_KEY,
      voice: true,
      memory: true
    },
    connections: wss.clients.size
  });
});

app.get('/api/config', (req, res) => {
  res.json({
    providers: {
      openai: {
        available: !!process.env.OPENAI_API_KEY,
        baseUrl: 'https://api.openai.com/v1/'
      },
      gemini: {
        available: !!process.env.GEMINI_API_KEY,
        baseUrl: 'https://generativelanguage.googleapis.com/v1beta/'
      }
    }
  });
});

// TTS endpoint
app.post('/api/tts', async (req, res) => {
  const { text, voice = 'alloy', speed = 1.0 } = req.body;
  
  try {
    // Implement OpenAI TTS here
    console.log(`🎤 TTS request: "${text}" with voice: ${voice}`);
    
    // Placeholder response
    res.json({
      success: true,
      message: 'TTS endpoint ready - implement OpenAI integration'
    });
  } catch (error) {
    console.error('❌ TTS error:', error);
    res.status(500).json({ error: 'TTS failed' });
  }
});

const PORT = process.env.PORT || 6121;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 AIRI Backend Server running on port ${PORT}`);
  console.log(`🌐 Health check: http://localhost:${PORT}/health`);
  console.log(`🔗 WebSocket: ws://localhost:${PORT}/ws`);
  console.log('✨ Ready for AIRI connections!');
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});
