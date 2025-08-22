const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Supabase configuration
const supabaseUrl = process.env.SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'your-anon-key';

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseKey);

// Database schema and operations
class SupabaseManager {
  constructor() {
    this.supabase = supabase;
  }

  // Initialize database tables
  async initializeTables() {
    try {
      console.log('🗄️ Initializing Supabase database tables...');
      
      // Note: These would typically be created via Supabase SQL editor
      // This is for reference and local development
      const tables = {
        users: `
          CREATE TABLE IF NOT EXISTS users (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            username VARCHAR(50) UNIQUE NOT NULL,
            email VARCHAR(100) UNIQUE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            preferences JSONB DEFAULT '{}'::jsonb
          );
        `,
        conversations: `
          CREATE TABLE IF NOT EXISTS conversations (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            user_id UUID REFERENCES users(id) ON DELETE CASCADE,
            title VARCHAR(200),
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            metadata JSONB DEFAULT '{}'::jsonb
          );
        `,
        messages: `
          CREATE TABLE IF NOT EXISTS messages (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
            sender VARCHAR(20) NOT NULL CHECK (sender IN ('user', 'airi', 'system')),
            content TEXT NOT NULL,
            message_type VARCHAR(20) DEFAULT 'text',
            metadata JSONB DEFAULT '{}'::jsonb,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          );
        `,
        memories: `
          CREATE TABLE IF NOT EXISTS memories (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            user_id UUID REFERENCES users(id) ON DELETE CASCADE,
            conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
            memory_type VARCHAR(20) DEFAULT 'short_term' CHECK (memory_type IN ('short_term', 'long_term')),
            content TEXT NOT NULL,
            importance_score FLOAT DEFAULT 0.5,
            embedding VECTOR(1536), -- For semantic search
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            accessed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            access_count INTEGER DEFAULT 1
          );
        `,
        character_states: `
          CREATE TABLE IF NOT EXISTS character_states (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            user_id UUID REFERENCES users(id) ON DELETE CASCADE,
            character_name VARCHAR(50) DEFAULT 'AIRI',
            personality JSONB DEFAULT '{}'::jsonb,
            current_mood VARCHAR(20) DEFAULT 'neutral',
            voice_settings JSONB DEFAULT '{}'::jsonb,
            appearance_settings JSONB DEFAULT '{}'::jsonb,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          );
        `
      };

      console.log('📋 Database schema ready for Supabase deployment');
      return { success: true, tables: Object.keys(tables) };
      
    } catch (error) {
      console.error('❌ Failed to initialize database:', error);
      return { success: false, error: error.message };
    }
  }

  // User management
  async createUser(userData) {
    try {
      const { data, error } = await this.supabase
        .from('users')
        .insert([{
          username: userData.username,
          email: userData.email,
          preferences: userData.preferences || {}
        }])
        .select()
        .single();

      if (error) throw error;
      
      console.log('👤 User created:', data.username);
      return { success: true, user: data };
    } catch (error) {
      console.error('❌ Failed to create user:', error);
      return { success: false, error: error.message };
    }
  }

  async getUser(userId) {
    try {
      const { data, error } = await this.supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;
      return { success: true, user: data };
    } catch (error) {
      console.error('❌ Failed to get user:', error);
      return { success: false, error: error.message };
    }
  }

  // Conversation management
  async createConversation(userId, title = 'New Conversation') {
    try {
      const { data, error } = await this.supabase
        .from('conversations')
        .insert([{
          user_id: userId,
          title: title,
          metadata: { created_by: 'airi-system' }
        }])
        .select()
        .single();

      if (error) throw error;
      
      console.log('💬 Conversation created:', data.id);
      return { success: true, conversation: data };
    } catch (error) {
      console.error('❌ Failed to create conversation:', error);
      return { success: false, error: error.message };
    }
  }

  async getConversations(userId, limit = 50) {
    try {
      const { data, error } = await this.supabase
        .from('conversations')
        .select('*')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return { success: true, conversations: data };
    } catch (error) {
      console.error('❌ Failed to get conversations:', error);
      return { success: false, error: error.message };
    }
  }

  // Message management
  async saveMessage(conversationId, sender, content, messageType = 'text', metadata = {}) {
    try {
      const { data, error } = await this.supabase
        .from('messages')
        .insert([{
          conversation_id: conversationId,
          sender: sender,
          content: content,
          message_type: messageType,
          metadata: metadata
        }])
        .select()
        .single();

      if (error) throw error;
      
      // Update conversation timestamp
      await this.supabase
        .from('conversations')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', conversationId);

      return { success: true, message: data };
    } catch (error) {
      console.error('❌ Failed to save message:', error);
      return { success: false, error: error.message };
    }
  }

  async getMessages(conversationId, limit = 100) {
    try {
      const { data, error } = await this.supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true })
        .limit(limit);

      if (error) throw error;
      return { success: true, messages: data };
    } catch (error) {
      console.error('❌ Failed to get messages:', error);
      return { success: false, error: error.message };
    }
  }

  // Memory management
  async saveMemory(userId, conversationId, content, memoryType = 'short_term', importanceScore = 0.5) {
    try {
      const { data, error } = await this.supabase
        .from('memories')
        .insert([{
          user_id: userId,
          conversation_id: conversationId,
          memory_type: memoryType,
          content: content,
          importance_score: importanceScore
        }])
        .select()
        .single();

      if (error) throw error;
      
      console.log(`🧠 ${memoryType} memory saved:`, content.substring(0, 50) + '...');
      return { success: true, memory: data };
    } catch (error) {
      console.error('❌ Failed to save memory:', error);
      return { success: false, error: error.message };
    }
  }

  async getMemories(userId, memoryType = null, limit = 50) {
    try {
      let query = this.supabase
        .from('memories')
        .select('*')
        .eq('user_id', userId)
        .order('accessed_at', { ascending: false })
        .limit(limit);

      if (memoryType) {
        query = query.eq('memory_type', memoryType);
      }

      const { data, error } = await query;
      if (error) throw error;
      
      return { success: true, memories: data };
    } catch (error) {
      console.error('❌ Failed to get memories:', error);
      return { success: false, error: error.message };
    }
  }

  async promoteMemory(memoryId) {
    try {
      const { data, error } = await this.supabase
        .from('memories')
        .update({ 
          memory_type: 'long_term',
          importance_score: 0.8,
          accessed_at: new Date().toISOString()
        })
        .eq('id', memoryId)
        .select()
        .single();

      if (error) throw error;
      
      console.log('⬆️ Memory promoted to long-term:', memoryId);
      return { success: true, memory: data };
    } catch (error) {
      console.error('❌ Failed to promote memory:', error);
      return { success: false, error: error.message };
    }
  }

  // Character state management
  async saveCharacterState(userId, characterData) {
    try {
      const { data, error } = await this.supabase
        .from('character_states')
        .upsert([{
          user_id: userId,
          character_name: characterData.name || 'AIRI',
          personality: characterData.personality || {},
          current_mood: characterData.mood || 'neutral',
          voice_settings: characterData.voice || {},
          appearance_settings: characterData.appearance || {},
          updated_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (error) throw error;
      
      console.log('🎭 Character state saved for user:', userId);
      return { success: true, characterState: data };
    } catch (error) {
      console.error('❌ Failed to save character state:', error);
      return { success: false, error: error.message };
    }
  }

  async getCharacterState(userId) {
    try {
      const { data, error } = await this.supabase
        .from('character_states')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows returned
      
      return { success: true, characterState: data };
    } catch (error) {
      console.error('❌ Failed to get character state:', error);
      return { success: false, error: error.message };
    }
  }

  // Analytics and insights
  async getMemoryStats(userId) {
    try {
      const { data: shortTerm, error: stError } = await this.supabase
        .from('memories')
        .select('id')
        .eq('user_id', userId)
        .eq('memory_type', 'short_term');

      const { data: longTerm, error: ltError } = await this.supabase
        .from('memories')
        .select('id')
        .eq('user_id', userId)
        .eq('memory_type', 'long_term');

      if (stError || ltError) throw stError || ltError;

      return {
        success: true,
        stats: {
          shortTerm: shortTerm?.length || 0,
          longTerm: longTerm?.length || 0,
          total: (shortTerm?.length || 0) + (longTerm?.length || 0)
        }
      };
    } catch (error) {
      console.error('❌ Failed to get memory stats:', error);
      return { success: false, error: error.message };
    }
  }

  // Health check
  async healthCheck() {
    try {
      const { data, error } = await this.supabase
        .from('users')
        .select('count')
        .limit(1);

      if (error) throw error;
      
      return { 
        success: true, 
        status: 'connected',
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('❌ Supabase health check failed:', error);
      return { 
        success: false, 
        status: 'disconnected',
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }
}

module.exports = { SupabaseManager, supabase };

