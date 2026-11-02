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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { zodResolver } from "@hookform/resolvers/zod"
import { Controller, useForm } from "react-hook-form"
import z from "zod"
import { useEffect } from "react"
import { isValidEndpoint } from "@/lib/url-utils"
import type { VariableInfo } from "@/lib/workflow-variables"

export const AVAILABLE_MODELS = [
  "gemini-1.5-flash",
  "gemini-1.5-flash-8b",
  "gemini-1.5-pro",
  "gemini-1.0-pro",
  "gemini-pro",
]

const httpRequestSchema = z.object({
  model: z.enum(AVAILABLE_MODELS),
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

export type GeminiFormType = z.infer<typeof httpRequestSchema>

interface HttpRequestDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (values: GeminiFormType) => void
  defaultValues?: Partial<GeminiFormType>
  /** Variables available from upstream nodes in the workflow graph */
  availableVariables?: VariableInfo[]
}



export const GeminiDialog = ({
  open,
  onOpenChange,
  onSubmit,
  defaultValues,
  availableVariables = [],
}: HttpRequestDialogProps) => {
  const form = useForm<GeminiFormType>({
    resolver: zodResolver(httpRequestSchema),
    defaultValues: {
      variableName: defaultValues?.variableName ?? "",
      model: defaultValues?.model ?? AVAILABLE_MODELS[0],
      systemPrompt: defaultValues?.systemPrompt ?? "",
      userPrompt: defaultValues?.userPrompt ?? "",
    },
  })

  const watchVariableName = form.watch("variableName") || "gemini"

  const handleSubmit = (values: z.infer<typeof httpRequestSchema>) => {
    onSubmit(values)
    onOpenChange(false)
  }


  useEffect(() => {
    if (open) {
      form.reset({
        variableName: defaultValues?.variableName ?? "",
        model: defaultValues?.model ?? AVAILABLE_MODELS[0],
        systemPrompt: defaultValues?.systemPrompt ?? "",
        userPrompt: defaultValues?.userPrompt ?? "",
      })
    }
  }, [open, defaultValues])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="min-w-2xl ">
        <DialogHeader>
          <DialogTitle>Gemini</DialogTitle>
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
                  <FieldLabel htmlFor="http-variableName">Choose model</FieldLabel>
                 <Select
                 onValueChange={field.onChange}
                 defaultValue={field.value}
                 >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a model" />
                  </SelectTrigger>

                  <SelectContent>
                    {
                      AVAILABLE_MODELS.map((model, i) => (
                        <SelectItem key={`model${i}`} value={model}>
                          {model}
                        </SelectItem>
                      ))
                    }
                  </SelectContent>

                 </Select>
                  <FieldDescription>
                   The google gemini model to use for this completion
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
