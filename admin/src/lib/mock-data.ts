export interface Message {
  id: string
  senderId: string
  senderName: string
  content: string
  timestamp: Date
  isOwn: boolean
}

export interface Chat {
  id: string
  name: string
  avatar?: string
  lastMessage: string
  timestamp: Date
  unreadCount: number
  isOnline: boolean
  messages: Message[]
}

// User types
export interface User {
  id: string
  name: string
  email: string
  avatar?: string
  role: 'admin' | 'user' | 'moderator'
  status: 'active' | 'inactive' | 'pending'
  joinDate: Date
  lastActive: Date
}

export interface Bot {
  id: string
  name: string
  avatar?: string
  url: string
  apiKey: string
  temperature: number
  modelId: string
  persona: string
  memory: boolean
  tools: string[]
  status: 'active' | 'inactive'
  createdDate: Date
  lastUsed: Date
  totalConversations: number
}

// Mock Users
export const mockUsers: User[] = [
  {
    id: "1",
    name: "Alice Johnson",
    email: "alice.johnson@company.com",
    avatar: "AJ",
    role: "admin",
    status: "active",
    joinDate: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000), // 1 year ago
    lastActive: new Date(Date.now() - 5 * 60 * 1000) // 5 minutes ago
  },
  {
    id: "2",
    name: "Bob Smith",
    email: "bob.smith@company.com",
    avatar: "BS",
    role: "user",
    status: "active",
    joinDate: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000), // 6 months ago
    lastActive: new Date(Date.now() - 2 * 60 * 60 * 1000) // 2 hours ago
  },
  {
    id: "3",
    name: "Sarah Wilson",
    email: "sarah.wilson@company.com",
    avatar: "SW",
    role: "moderator",
    status: "active",
    joinDate: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000), // 3 months ago
    lastActive: new Date(Date.now() - 30 * 60 * 1000) // 30 minutes ago
  },
  {
    id: "4",
    name: "Mike Chen",
    email: "mike.chen@company.com",
    avatar: "MC",
    role: "user",
    status: "inactive",
    joinDate: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000), // 2 months ago
    lastActive: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // 1 week ago
  },
  {
    id: "5",
    name: "Emma Davis",
    email: "emma.davis@company.com",
    avatar: "ED",
    role: "user",
    status: "pending",
    joinDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
    lastActive: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000) // 1 day ago
  }
]

// Mock Bots
export const mockBots: Bot[] = [
  {
    id: "bot-1",
    name: "Customer Support AI",
    avatar: "CS",
    url: "https://api.openai.com/v1",
    apiKey: "sk-****...**ab",
    temperature: 0.7,
    modelId: "gpt-4",
    persona: "You are a helpful customer support assistant. Be friendly, professional, and always try to solve customer issues efficiently.",
    memory: true,
    tools: ["search_knowledge_base", "create_ticket", "escalate_to_human"],
    status: "active",
    createdDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 1 month ago
    lastUsed: new Date(Date.now() - 10 * 60 * 1000), // 10 minutes ago
    totalConversations: 1247
  },
  {
    id: "bot-2",
    name: "Sales Assistant",
    avatar: "SA",
    url: "https://api.anthropic.com/v1",
    apiKey: "sk-ant-****...**xy",
    temperature: 0.8,
    modelId: "claude-3-sonnet",
    persona: "You are a knowledgeable sales assistant. Help customers understand our products and guide them through the sales process with enthusiasm and expertise.",
    memory: true,
    tools: ["product_search", "price_calculator", "schedule_demo"],
    status: "active",
    createdDate: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000), // 20 days ago
    lastUsed: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
    totalConversations: 834
  },
  {
    id: "bot-3",
    name: "Technical Writer",
    avatar: "TW",
    url: "https://api.openai.com/v1",
    apiKey: "sk-****...**cd",
    temperature: 0.3,
    modelId: "gpt-4-turbo",
    persona: "You are a technical writing assistant specialized in creating clear, comprehensive documentation. Focus on accuracy and clarity.",
    memory: false,
    tools: ["document_templates", "grammar_check", "technical_glossary"],
    status: "inactive",
    createdDate: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000), // 45 days ago
    lastUsed: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 1 week ago
    totalConversations: 156
  }
]

export const mockChats: Chat[] = [
  {
    id: "1",
    name: "Alice Johnson",
    avatar: "AJ",
    lastMessage: "Hey, can we discuss the project timeline?",
    timestamp: new Date(Date.now() - 5 * 60 * 1000), // 5 minutes ago
    unreadCount: 2,
    isOnline: true,
    messages: [
      {
        id: "1",
        senderId: "alice",
        senderName: "Alice Johnson",
        content: "Hi there! How's the project going?",
        timestamp: new Date(Date.now() - 60 * 60 * 1000), // 1 hour ago
        isOwn: false
      },
      {
        id: "2",
        senderId: "me",
        senderName: "You",
        content: "Going well! Just finished the initial setup.",
        timestamp: new Date(Date.now() - 50 * 60 * 1000), // 50 minutes ago
        isOwn: true
      },
      {
        id: "3",
        senderId: "alice",
        senderName: "Alice Johnson",
        content: "That's great to hear! Can we schedule a review meeting?",
        timestamp: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
        isOwn: false
      },
      {
        id: "4",
        senderId: "alice",
        senderName: "Alice Johnson",
        content: "Hey, can we discuss the project timeline?",
        timestamp: new Date(Date.now() - 5 * 60 * 1000), // 5 minutes ago
        isOwn: false
      }
    ]
  },
  {
    id: "2",
    name: "Bob Smith",
    avatar: "BS",
    lastMessage: "Thanks for the update!",
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
    unreadCount: 0,
    isOnline: false,
    messages: [
      {
        id: "5",
        senderId: "me",
        senderName: "You",
        content: "I've completed the design mockups",
        timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000), // 3 hours ago
        isOwn: true
      },
      {
        id: "6",
        senderId: "bob",
        senderName: "Bob Smith",
        content: "Thanks for the update!",
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
        isOwn: false
      }
    ]
  },
  {
    id: "3",
    name: "Team Channel",
    avatar: "TC",
    lastMessage: "Meeting starts in 10 minutes",
    timestamp: new Date(Date.now() - 10 * 60 * 1000), // 10 minutes ago
    unreadCount: 5,
    isOnline: true,
    messages: [
      {
        id: "7",
        senderId: "sarah",
        senderName: "Sarah Wilson",
        content: "Good morning everyone!",
        timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 hours ago
        isOwn: false
      },
      {
        id: "8",
        senderId: "mike",
        senderName: "Mike Chen",
        content: "Morning! Ready for today's sprint review?",
        timestamp: new Date(Date.now() - 3.5 * 60 * 60 * 1000), // 3.5 hours ago
        isOwn: false
      },
      {
        id: "9",
        senderId: "me",
        senderName: "You",
        content: "Yes, I have the demo ready",
        timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000), // 3 hours ago
        isOwn: true
      },
      {
        id: "10",
        senderId: "sarah",
        senderName: "Sarah Wilson",
        content: "Perfect! Looking forward to it",
        timestamp: new Date(Date.now() - 2.5 * 60 * 60 * 1000), // 2.5 hours ago
        isOwn: false
      },
      {
        id: "11",
        senderId: "sarah",
        senderName: "Sarah Wilson",
        content: "Meeting starts in 10 minutes",
        timestamp: new Date(Date.now() - 10 * 60 * 1000), // 10 minutes ago
        isOwn: false
      }
    ]
  },
  {
    id: "4",
    name: "Emma Davis",
    avatar: "ED",
    lastMessage: "I'll send the files tomorrow",
    timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
    unreadCount: 0,
    isOnline: false,
    messages: [
      {
        id: "12",
        senderId: "emma",
        senderName: "Emma Davis",
        content: "Do you need the design files today?",
        timestamp: new Date(Date.now() - 25 * 60 * 60 * 1000), // 25 hours ago
        isOwn: false
      },
      {
        id: "13",
        senderId: "me",
        senderName: "You",
        content: "Tomorrow would be fine, no rush",
        timestamp: new Date(Date.now() - 24.5 * 60 * 60 * 1000), // 24.5 hours ago
        isOwn: true
      },
      {
        id: "14",
        senderId: "emma",
        senderName: "Emma Davis",
        content: "I'll send the files tomorrow",
        timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000), // 24 hours ago
        isOwn: false
      }
    ]
  }
]