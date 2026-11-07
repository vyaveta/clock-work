"use client"

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Textarea } from "@/components/ui/textarea"
import { zodResolver } from "@hookform/resolvers/zod"
import { Controller, useForm } from "react-hook-form"
import z from "zod"
import { useEffect, useState } from "react"
import type { VariableInfo } from "@/lib/workflow-variables"
import { Check, ChevronsUpDown, LoaderCircle, Search } from "lucide-react"

type GroqModelOption = {
  id: string
  displayName: string
  description: string
  badges: string[]
}

const GroqSchema = z.object({
  model: z.string().min(1, { message: "Choose a Groq model" }),
  systemPrompt: z.string().optional(),
  userPrompt: z.string().min(1, { message: "user prompt is required " }),
  variableName: z
    .string()
    .min(1, { message: " Variable name is required" })
    .regex(/^[A-Za-z_$][A-Za-z0-9_$]*$/, {
      message:
        "variable name must start with a letter or underscore and contains only letters, numbers and underscores.",
    }),
})

export type GroqFormType = z.infer<typeof GroqSchema>

interface HttpRequestDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (values: GroqFormType) => void
  defaultValues?: Partial<GroqFormType>
  /** Variables available from upstream nodes in the workflow graph */
  availableVariables?: VariableInfo[]
}



export const GroqDialog = ({
  open,
  onOpenChange,
  onSubmit,
  defaultValues,
  availableVariables = [],
}: HttpRequestDialogProps) => {
  const [availableModels, setAvailableModels] = useState<GroqModelOption[]>([])
  const [modelsError, setModelsError] = useState<string | null>(null)
  const [modelsLoading, setModelsLoading] = useState(false)
  const [modelsLoaded, setModelsLoaded] = useState(false)
  const [modelPickerOpen, setModelPickerOpen] = useState(false)
  const [modelSearch, setModelSearch] = useState("")

  useEffect(() => {
    if (!open) return

    const controller = new AbortController()
    setModelsLoading(true)
    setModelsError(null)

    fetch("/api/groq/models", { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error("Could not load Groq models")
        return (await response.json()) as { models: GroqModelOption[] }
      })
      .then(({ models }) => {
        setAvailableModels(models)
        setModelsLoaded(true)
      })
      .catch((error: unknown) => {
        if (error instanceof Error && error.name === "AbortError") return
        setModelsError(error instanceof Error ? error.message : "Could not load Groq models")
      })
      .finally(() => {
        if (!controller.signal.aborted) setModelsLoading(false)
      })

    return () => controller.abort()
  }, [open])

  const models = availableModels.some((model) => model.id === defaultValues?.model)
    ? availableModels
    : !modelsLoaded && defaultValues?.model
      ? [{ id: defaultValues.model, displayName: defaultValues.model, description: "Previously selected model", badges: ["Text"] }, ...availableModels]
      : availableModels

  const filteredModels = models.filter((model) =>
    `${model.id} ${model.displayName} ${model.description} ${model.badges.join(" ")}`
      .toLowerCase()
      .includes(modelSearch.trim().toLowerCase()),
  )

  const form = useForm<GroqFormType>({
    resolver: zodResolver(GroqSchema),
    defaultValues: {
      variableName: defaultValues?.variableName ?? "",
      model: defaultValues?.model ?? "",
      systemPrompt: defaultValues?.systemPrompt ?? "",
      userPrompt: defaultValues?.userPrompt ?? "",
    },
  })

  const watchVariableName = form.watch("variableName") || "groq"

  const handleSubmit = (values: z.infer<typeof GroqSchema>) => {
    onSubmit(values)
    onOpenChange(false)
  }


  useEffect(() => {
    if (open) {
      form.reset({
        variableName: defaultValues?.variableName ?? "",
        model: defaultValues?.model ?? "",
        systemPrompt: defaultValues?.systemPrompt ?? "",
        userPrompt: defaultValues?.userPrompt ?? "",
      })
    }
  }, [open, defaultValues])

  useEffect(() => {
    if (!open || !modelsLoaded || availableModels.length === 0) return
    const currentModel = form.getValues("model")
    if (availableModels.some((model) => model.id === currentModel)) return

    const recommendedModel = availableModels.find((model) => model.id === "openai/gpt-oss-20b")
    form.setValue("model", recommendedModel?.id ?? availableModels[0].id, { shouldValidate: true })
  }, [open, modelsLoaded, availableModels, form])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[calc(100dvh-2rem)] min-w-2xl overflow-y-auto overscroll-contain">
        <DialogHeader>
          <DialogTitle>Groq</DialogTitle>
          <DialogDescription>
            Configure the AI model and prompt
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6 mt-4">
          <FieldGroup>

            <Controller
              name="variableName"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="http-variableName">Variable name</FieldLabel>
                  <Input
                    {...field}
                    id="http-variableName"
                    placeholder={watchVariableName}
                    aria-invalid={fieldState.invalid}
                  />
                  <FieldDescription>
                    The results of this node will be stored in a variable to use in other nodes
                    {`{{${watchVariableName}.httpResponse.data}}`}
                  </FieldDescription>
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
            <Controller
              name="model"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel>Choose model</FieldLabel>
                    <Popover open={modelPickerOpen} onOpenChange={(nextOpen) => {
                      setModelPickerOpen(nextOpen)
                      if (nextOpen) setModelSearch("")
                    }}>
                    <PopoverTrigger asChild>
                      <Button
                        type="button"
                        variant="outline"
                        role="combobox"
                        aria-expanded={modelPickerOpen}
                        className="h-auto min-h-10 w-full justify-between py-2 text-left font-normal"
                      >
                        <span className="flex min-w-0 flex-col items-start gap-0.5">
                          <span className="flex min-w-0 items-center gap-2">
                            <span className="truncate">{models.find((model) => model.id === field.value)?.displayName ?? "Search Groq models…"}</span>
                          </span>
                          {field.value && <span className="truncate text-xs text-muted-foreground">{field.value}</span>}
                        </span>
                        <ChevronsUpDown className="ml-2 size-4 shrink-0 text-muted-foreground" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="max-h-[calc(100dvh-2rem)] w-(--radix-popover-trigger-width) min-w-80 overflow-hidden p-0" align="start">
                      <div className="flex items-center gap-2 border-b px-3">
                        <Search className="size-4 shrink-0 text-muted-foreground" />
                        <Input
                          autoFocus
                          aria-label="Search Groq models"
                          placeholder="Search models or capabilities…"
                          value={modelSearch}
                          onChange={(event) => setModelSearch(event.target.value)}
                          className="h-10 border-0 px-0 shadow-none focus-visible:ring-0"
                        />
                      </div>
                      <div
                        role="listbox"
                        aria-label="Groq models"
                        className="overscroll-contain"
                        style={{ height: "min(18rem, 50dvh)", overflowY: "auto", scrollbarGutter: "stable" }}
                        onWheel={(event) => {
                          const list = event.currentTarget
                          const maxScroll = list.scrollHeight - list.clientHeight
                          const nextScroll = Math.max(0, Math.min(maxScroll, list.scrollTop + event.deltaY))

                          if (maxScroll > 0 && nextScroll !== list.scrollTop) {
                            event.preventDefault()
                            event.stopPropagation()
                            list.scrollTop = nextScroll
                          }
                        }}
                      >
                        {modelsLoading && (
                          <div className="flex h-full items-center justify-center gap-2 text-sm text-muted-foreground">
                            <LoaderCircle className="size-4 animate-spin" /> Loading Groq models…
                          </div>
                        )}
                        {!modelsLoading && filteredModels.length === 0 && (
                          <div className="px-3 py-8 text-center text-sm text-muted-foreground">
                            {models.length === 0 ? "No Groq models are available." : "No models match your search."}
                          </div>
                        )}
                        {!modelsLoading && filteredModels.map((model) => (
                          <button
                            key={model.id}
                            type="button"
                            role="option"
                            aria-selected={field.value === model.id}
                            onClick={() => {
                              field.onChange(model.id)
                              setModelPickerOpen(false)
                            }}
                            className="flex w-full items-start gap-2 border-b px-3 py-2.5 text-left transition-colors last:border-0 hover:bg-accent focus-visible:bg-accent focus-visible:outline-none"
                          >
                            <span className="mt-0.5 flex size-4 shrink-0 items-center justify-center">
                              {field.value === model.id && <Check className="size-4" />}
                            </span>
                            <span className="flex min-w-0 flex-1 flex-col gap-1">
                              <span className="flex flex-wrap items-center gap-1.5">
                                <span className="font-medium">{model.displayName}</span>
                                {model.badges.map((badge) => (
                                  <Badge key={badge} variant="secondary" className={`h-5 px-1.5 text-[10px] ${badge === "Free" ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400" : ""}`}>{badge}</Badge>
                                ))}
                              </span>
                              <span className="truncate text-xs text-muted-foreground">{model.id}</span>
                              {model.description && <span className="line-clamp-2 text-xs text-muted-foreground">{model.description}</span>}
                            </span>
                          </button>
                        ))}
                      </div>
                    </PopoverContent>
                  </Popover>
                  {modelsLoading && <FieldDescription>Loading available Groq models…</FieldDescription>}
                  {modelsError && <FieldError>{modelsError}</FieldError>}
                  {!modelsLoading && !modelsError && models.length === 0 && (
                    <FieldDescription>No Groq models are available for this API key.</FieldDescription>
                  )}
                  <FieldDescription>
                   Choose a Groq-hosted text model for this completion.
                  </FieldDescription>
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
           
              <Controller
                name="systemPrompt"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="system-prompt">System Prompt (Optional)</FieldLabel>
                    <Textarea
                      {...field}
                      id="system-prompt"
                      placeholder='You are a helpful assistant'
                      className="min-h-20 font-mono text-sm"
                      aria-invalid={fieldState.invalid}
                    />
                    <FieldDescription>
                      Set the behaviour of the assistant. Use <code className="bg-muted px-1 rounded text-xs">{"{{variable}}"}</code> for string
                      values or <code className="bg-muted px-1 rounded text-xs">{"{{json variable}}"}</code> to embed objects.
                    </FieldDescription>
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />
              <Controller
                name="userPrompt"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="user-prompt">User Prompt</FieldLabel>
                    <Textarea
                      {...field}
                      id="user-prompt"
                      placeholder='Summarize this text {{json httpResponse.data}}'
                      className="min-h-30 font-mono text-sm"
                      aria-invalid={fieldState.invalid}
                    />
                    <FieldDescription>
                      The prompt to send to AI. Use <code className="bg-muted px-1 rounded text-xs">{"{{variable}}"}</code> for string
                      values or <code className="bg-muted px-1 rounded text-xs">{"{{json variable}}"}</code> to embed objects.
                    </FieldDescription>
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />

            {/* Available variables from upstream nodes */}
            {availableVariables.length > 0 && (
              <div className="rounded-md border bg-muted/40 p-3 space-y-2">
                <p className="text-xs font-medium text-muted-foreground">
                  Variables from previous nodes
                </p>
                <ul className="space-y-1">
                  {availableVariables.map((v) => (
                    <li key={v.path} className="flex items-start gap-2 text-xs">
                      <code className="bg-background border rounded px-1 py-0.5 font-mono shrink-0 select-all">
                        {`{{${v.path}}}`}
                      </code>
                      <span className="text-muted-foreground">{v.description}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </FieldGroup>

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit">Save</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
