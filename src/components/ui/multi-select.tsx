import * as React from "react"
import { X, ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export interface MultiSelectOption {
  value: string
  label: string
  description?: string
}

interface MultiSelectProps {
  options: MultiSelectOption[]
  selected: string[]
  onChange: (selected: string[]) => void
  placeholder?: string
  searchPlaceholder?: string
  className?: string
  maxDisplayed?: number
}

export function MultiSelect({
  options = [],
  selected = [],
  onChange,
  placeholder = "Sélectionner...",
  searchPlaceholder = "Rechercher...",
  className,
  maxDisplayed = 3
}: MultiSelectProps) {
  const [open, setOpen] = React.useState(false)
  const [search, setSearch] = React.useState("")

  const filteredOptions = options.filter(option =>
    option?.label?.toLowerCase()?.includes(search.toLowerCase()) ||
    option?.description?.toLowerCase()?.includes(search.toLowerCase())
  )

  const handleSelect = (value: string) => {
    if (selected.includes(value)) {
      onChange(selected.filter((item) => item !== value))
    } else {
      onChange([...selected, value])
    }
  }

  const handleRemove = (value: string) => {
    onChange(selected.filter((item) => item !== value))
  }

  const handleClear = () => {
    onChange([])
  }

  const displayedSelected = selected.slice(0, maxDisplayed)
  const remainingCount = selected.length - maxDisplayed

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className={cn("justify-between min-h-10 h-auto", className)}
        >
          <div className="flex flex-wrap gap-1 flex-1 text-left">
            {selected.length === 0 && (
              <span className="text-muted-foreground">{placeholder}</span>
            )}
            {displayedSelected.map((value) => {
              const option = options.find((opt) => opt.value === value)
              return (
                <Badge
                  key={value}
                  variant="secondary"
                  className="mr-1 mb-1 text-xs"
                >
                  {option?.label}
                  <X
                    className="ml-1 h-3 w-3 cursor-pointer"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleRemove(value)
                    }}
                  />
                </Badge>
              )
            })}
            {remainingCount > 0 && (
              <Badge variant="secondary" className="mr-1 mb-1 text-xs">
                +{remainingCount} autres
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            {selected.length > 0 && (
              <X
                className="h-4 w-4 cursor-pointer text-muted-foreground hover:text-foreground"
                onClick={(e) => {
                  e.stopPropagation()
                  handleClear()
                }}
              />
            )}
            <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
          </div>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-80 p-2" align="start">
        <div className="mb-2">
          <Input
            placeholder={searchPlaceholder}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-8"
          />
        </div>
        <div className="max-h-64 overflow-auto">
          {filteredOptions.length === 0 ? (
            <div className="text-center text-sm text-muted-foreground py-2">
              Aucun résultat trouvé
            </div>
          ) : (
            filteredOptions.map((option) => (
              <DropdownMenuItem
                key={option.value}
                onSelect={(e) => {
                  e.preventDefault()
                  handleSelect(option.value)
                }}
                className="cursor-pointer flex items-start gap-2 p-2"
              >
                <Checkbox
                  checked={selected.includes(option.value)}
                  className="mt-0.5"
                />
                <div className="flex flex-col flex-1">
                  <span className="text-sm">{option.label}</span>
                  {option.description && (
                    <span className="text-xs text-muted-foreground">
                      {option.description}
                    </span>
                  )}
                </div>
              </DropdownMenuItem>
            ))
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
} 