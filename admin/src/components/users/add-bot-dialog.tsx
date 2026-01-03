import * as React from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Plus, X } from "lucide-react"
import { cn } from "@/lib/utils"
import type { Bot } from "@/lib/mock-data"

interface AddBotDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onAddBot: (bot: Omit<Bot, 'id' | 'createdDate' | 'lastUsed' | 'totalConversations'> | Bot) => void
  editingBot?: Bot
}

const predefinedTools = [
  "search_knowledge_base",
  "create_ticket",
  "escalate_to_human",
  "product_search",
  "price_calculator",
  "schedule_demo",
  "document_templates",
  "grammar_check",
  "technical_glossary",
  "send_email",
  "web_search",
  "image_generation",
  "code_execution",
  "database_query"
]

export function AddBotDialog({
  open,
  onOpenChange,
  onAddBot,
  editingBot
}: AddBotDialogProps) {
  const [formData, setFormData] = React.useState({
    name: "",
    url: "",
    apiKey: "",
    temperature: 0.7,
    modelId: "",
    persona: "",
    memory: true,
    tools: [] as string[],
    status: "active" as Bot['status']
  })

  const [newTool, setNewTool] = React.useState("")
  const [errors, setErrors] = React.useState<Record<string, string>>({})

  React.useEffect(() => {
    if (editingBot) {
      setFormData({
        name: editingBot.name,
        url: editingBot.url,
        apiKey: editingBot.apiKey,
        temperature: editingBot.temperature,
        modelId: editingBot.modelId,
        persona: editingBot.persona,
        memory: editingBot.memory,
        tools: [...editingBot.tools],
        status: editingBot.status
      })
    } else {
      setFormData({
        name: "",
        url: "",
        apiKey: "",
        temperature: 0.7,
        modelId: "",
        persona: "",
        memory: true,
        tools: [],
        status: "active"
      })
    }
    setErrors({})
  }, [editingBot, open])

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.name.trim()) {
      newErrors.name = "Bot name is required"
    }

    if (!formData.url.trim()) {
      newErrors.url = "API URL is required"
    } else {
      try {
        new URL(formData.url)
      } catch {
        newErrors.url = "Please enter a valid URL"
      }
    }

    if (!formData.apiKey.trim()) {
      newErrors.apiKey = "API Key is required"
    }

    if (!formData.modelId.trim()) {
      newErrors.modelId = "Model ID is required"
    }

    if (!formData.persona.trim()) {
      newErrors.persona = "Persona is required"
    }

    if (formData.temperature < 0 || formData.temperature > 2) {
      newErrors.temperature = "Temperature must be between 0 and 2"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    const botData = {
      ...formData,
      avatar: formData.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    }

    if (editingBot) {
      onAddBot({
        ...editingBot,
        ...botData
      })
    } else {
      onAddBot(botData)
    }

    onOpenChange(false)
  }

  const handleInputChange = (field: keyof typeof formData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }))
    }
  }

  const addTool = (tool: string) => {
    if (tool && !formData.tools.includes(tool)) {
      setFormData(prev => ({
        ...prev,
        tools: [...prev.tools, tool]
      }))
    }
    setNewTool("")
  }

  const removeTool = (tool: string) => {
    setFormData(prev => ({
      ...prev,
      tools: prev.tools.filter(t => t !== tool)
    }))
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {editingBot ? "Edit AI Bot" : "Add New AI Bot"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Bot Name */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Bot Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              className={cn(
                "w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary",
                errors.name && "border-red-500 focus:ring-red-500"
              )}
              placeholder="e.g., Customer Support AI"
            />
            {errors.name && (
              <p className="text-sm text-red-500 mt-1">{errors.name}</p>
            )}
          </div>

          {/* API URL */}
          <div>
            <label className="block text-sm font-medium mb-2">
              API URL *
            </label>
            <input
              type="url"
              value={formData.url}
              onChange={(e) => handleInputChange('url', e.target.value)}
              className={cn(
                "w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary",
                errors.url && "border-red-500 focus:ring-red-500"
              )}
              placeholder="https://api.openai.com/v1"
            />
            {errors.url && (
              <p className="text-sm text-red-500 mt-1">{errors.url}</p>
            )}
          </div>

          {/* API Key */}
          <div>
            <label className="block text-sm font-medium mb-2">
              API Key *
            </label>
            <input
              type="password"
              value={formData.apiKey}
              onChange={(e) => handleInputChange('apiKey', e.target.value)}
              className={cn(
                "w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary",
                errors.apiKey && "border-red-500 focus:ring-red-500"
              )}
              placeholder="sk-..."
            />
            {errors.apiKey && (
              <p className="text-sm text-red-500 mt-1">{errors.apiKey}</p>
            )}
          </div>

          {/* Model ID */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Model ID *
            </label>
            <input
              type="text"
              value={formData.modelId}
              onChange={(e) => handleInputChange('modelId', e.target.value)}
              className={cn(
                "w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary",
                errors.modelId && "border-red-500 focus:ring-red-500"
              )}
              placeholder="gpt-4, claude-3-sonnet, etc."
            />
            {errors.modelId && (
              <p className="text-sm text-red-500 mt-1">{errors.modelId}</p>
            )}
          </div>

          {/* Temperature */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Temperature: {formData.temperature}
            </label>
            <input
              type="range"
              min="0"
              max="2"
              step="0.1"
              value={formData.temperature}
              onChange={(e) => handleInputChange('temperature', parseFloat(e.target.value))}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>Conservative (0)</span>
              <span>Balanced (1)</span>
              <span>Creative (2)</span>
            </div>
            {errors.temperature && (
              <p className="text-sm text-red-500 mt-1">{errors.temperature}</p>
            )}
          </div>

          {/* Memory */}
          <div>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.memory}
                onChange={(e) => handleInputChange('memory', e.target.checked)}
                className="rounded"
              />
              <span className="text-sm font-medium">Enable Memory</span>
            </label>
            <p className="text-xs text-muted-foreground mt-1">
              Allow the bot to remember previous conversations
            </p>
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Status
            </label>
            <select
              value={formData.status}
              onChange={(e) => handleInputChange('status', e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          {/* Tools */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Available Tools
            </label>

            {/* Add Tool Section */}
            <div className="space-y-2 mb-3">
              <div className="flex gap-2">
                <select
                  value={newTool}
                  onChange={(e) => setNewTool(e.target.value)}
                  className="flex-1 px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="">Select a predefined tool...</option>
                  {predefinedTools
                    .filter(tool => !formData.tools.includes(tool))
                    .map(tool => (
                      <option key={tool} value={tool}>{tool}</option>
                    ))}
                </select>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => addTool(newTool)}
                  disabled={!newTool || formData.tools.includes(newTool)}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={newTool}
                  onChange={(e) => setNewTool(e.target.value)}
                  placeholder="Or type a custom tool name..."
                  className="flex-1 px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => addTool(newTool)}
                  disabled={!newTool || formData.tools.includes(newTool)}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Selected Tools */}
            <div className="space-y-2">
              {formData.tools.length === 0 ? (
                <p className="text-sm text-muted-foreground">No tools selected</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {formData.tools.map((tool) => (
                    <span
                      key={tool}
                      className="inline-flex items-center gap-1 px-2 py-1 bg-muted rounded-md text-sm"
                    >
                      {tool}
                      <button
                        type="button"
                        onClick={() => removeTool(tool)}
                        className="text-muted-foreground hover:text-foreground"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Persona */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Persona / System Prompt *
            </label>
            <textarea
              value={formData.persona}
              onChange={(e) => handleInputChange('persona', e.target.value)}
              rows={4}
              className={cn(
                "w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary resize-none",
                errors.persona && "border-red-500 focus:ring-red-500"
              )}
              placeholder="You are a helpful assistant. Describe the bot's personality, role, and behavior guidelines..."
            />
            {errors.persona && (
              <p className="text-sm text-red-500 mt-1">{errors.persona}</p>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit">
              {editingBot ? "Update Bot" : "Create Bot"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}