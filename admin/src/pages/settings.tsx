import * as React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useChatSettings, type ChatTheme, type ChatRowColors } from "@/contexts/chat-settings-context"
import { cn } from "@/lib/utils"

const themeOptions: { value: ChatTheme; label: string; description: string }[] = [
  {
    value: "default",
    label: "Default",
    description: "Balanced contrast for comfortable viewing"
  },
  {
    value: "high-contrast",
    label: "High Contrast",
    description: "Strong contrast for better readability"
  },
  {
    value: "subtle",
    label: "Subtle",
    description: "Low contrast for a cleaner look"
  },
  {
    value: "custom",
    label: "Custom",
    description: "Define your own colors"
  }
]

function ThemePreview({ theme, customColors }: { theme: ChatTheme; customColors: ChatRowColors }) {
  const getColors = (): ChatRowColors => {
    if (theme === 'custom') return customColors

    const themeColorSets: Record<ChatTheme, ChatRowColors> = {
      default: { evenRow: "bg-muted/50", oddRow: "bg-background" },
      "high-contrast": { evenRow: "bg-muted/80", oddRow: "bg-background" },
      subtle: { evenRow: "bg-muted/20", oddRow: "bg-background" },
      custom: customColors
    }

    return themeColorSets[theme]
  }

  const colors = getColors()

  return (
    <div className="space-y-1 border rounded-lg overflow-hidden">
      <div className="text-xs px-3 py-2 bg-muted/30 font-medium">Preview</div>
      {[0, 1, 2, 3].map((index) => (
        <div
          key={index}
          className={cn(
            "px-4 py-3",
            index % 2 === 0 ? colors.evenRow : colors.oddRow
          )}
        >
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">
              {index % 2 === 0 ? "Alice Johnson" : "Bob Smith"}
            </span>
            <span className="text-xs text-muted-foreground">
              {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
          <div className="mt-1">
            <p className="text-sm">This is a sample message row {index + 1}</p>
          </div>
        </div>
      ))}
    </div>
  )
}

function CustomColorInputs({
  customColors,
  onCustomColorsChange
}: {
  customColors: ChatRowColors
  onCustomColorsChange: (colors: ChatRowColors) => void
}) {
  const handleColorChange = (type: 'evenRow' | 'oddRow', value: string) => {
    onCustomColorsChange({
      ...customColors,
      [type]: value
    })
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="even-row-color">Even Row Color (CSS class)</Label>
        <Input
          id="even-row-color"
          value={customColors.evenRow}
          onChange={(e) => handleColorChange('evenRow', e.target.value)}
          placeholder="e.g., bg-blue-100, bg-muted/30"
        />
        <p className="text-xs text-muted-foreground">
          Use Tailwind CSS background classes like bg-muted/50, bg-blue-100, etc.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="odd-row-color">Odd Row Color (CSS class)</Label>
        <Input
          id="odd-row-color"
          value={customColors.oddRow}
          onChange={(e) => handleColorChange('oddRow', e.target.value)}
          placeholder="e.g., bg-background, bg-gray-50"
        />
        <p className="text-xs text-muted-foreground">
          Use Tailwind CSS background classes like bg-background, bg-gray-50, etc.
        </p>
      </div>
    </div>
  )
}

export function SettingsPage() {
  const { settings, updateSettings } = useChatSettings()
  const [tempCustomColors, setTempCustomColors] = React.useState<ChatRowColors>(settings.customColors)

  const handleThemeChange = (theme: ChatTheme) => {
    updateSettings({ theme })
  }

  const handleSaveCustomColors = () => {
    updateSettings({ customColors: tempCustomColors })
  }

  return (
    <div className="space-y-6 p-6">
      <Card>
        <CardHeader>
          <CardTitle>Chat Appearance</CardTitle>
          <CardDescription>
            Customize how chat messages are displayed
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-3">
            <Label>Color Theme</Label>
            <Select value={settings.theme} onValueChange={handleThemeChange}>
              <SelectTrigger>
                <SelectValue placeholder="Select a theme" />
              </SelectTrigger>
              <SelectContent>
                {themeOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    <div>
                      <div className="font-medium">{option.label}</div>
                      <div className="text-xs text-muted-foreground">{option.description}</div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {settings.theme === 'custom' && (
            <div className="space-y-4">
              <CustomColorInputs
                customColors={tempCustomColors}
                onCustomColorsChange={setTempCustomColors}
              />
              <Button onClick={handleSaveCustomColors} size="sm">
                Apply Custom Colors
              </Button>
            </div>
          )}

          <div className="space-y-2">
            <Label>Preview</Label>
            <ThemePreview theme={settings.theme} customColors={settings.customColors} />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}