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

const httpRequestSchema = z.object({
  method: z.enum(["GET", "PUT", "PATCH", "POST", "DELETE", "HEAD", "OPTIONS", "TRACE", "CONNECT"]),
  endpoint: z
    .string()
    .min(1, { message: "Endpoint is required" })
    .refine(isValidEndpoint, {
      message:
        "Must be a valid http(s) URL, or contain a {{template}} if the URL is resolved from a previous node's output",
    }),
  body: z.string().optional(),
  variableName: z
    .string()
    .min(1, { message: " Variable name is required" })
    .regex(/^[A-Za-z_$][A-Za-z0-9_$]*$/, {
      message:
        "variable name must start with a letter or underscore and contains only letters, numbers and underscores.",
    }),
})

export type HttpRequestFormType = z.infer<typeof httpRequestSchema>

interface HttpRequestDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (values: HttpRequestFormType) => void
  defaultValues?: Partial<HttpRequestFormType>
  /** Variables available from upstream nodes in the workflow graph */
  availableVariables?: VariableInfo[]
}



export const HttpRequestDialog = ({
  open,
  onOpenChange,
  onSubmit,
  defaultValues,
  availableVariables = [],
}: HttpRequestDialogProps) => {
  const form = useForm<HttpRequestFormType>({
    resolver: zodResolver(httpRequestSchema),
    defaultValues: {
      variableName: defaultValues?.variableName ?? "",
      endpoint: defaultValues?.endpoint ?? "",
      method: defaultValues?.method ?? "GET",
      body: defaultValues?.body ?? "",
    },
  })

  const watchMethod = form.watch("method")
  const watchVariableName = form.watch("variableName") || "myApiCall"
  const showBodyField = ["POST", "PUT", "PATCH", "CONNECT"].includes(watchMethod)

  const handleSubmit = (values: z.infer<typeof httpRequestSchema>) => {
    onSubmit(values)
    onOpenChange(false)
  }


  useEffect(() => {
    if (open) {
      form.reset({
        variableName: defaultValues?.variableName ?? "",
        endpoint: defaultValues?.endpoint ?? "",
        method: defaultValues?.method ?? "GET",
        body: defaultValues?.body ?? "",
      })
    }
  }, [open, defaultValues])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="min-w-2xl ">
        <DialogHeader>
          <DialogTitle>HTTP Request</DialogTitle>
          <DialogDescription>
            Configure the settings for HTTP request node.
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
                    placeholder="myApiCall"
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

            {/* Method */}
            <Controller
              name="method"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="http-method">Method</FieldLabel>
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                  >
                    <SelectTrigger id="http-method" aria-invalid={fieldState.invalid}>
                      <SelectValue placeholder="Select method" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="GET">GET</SelectItem>
                      <SelectItem value="POST">POST</SelectItem>
                      <SelectItem value="PUT">PUT</SelectItem>
                      <SelectItem value="PATCH">PATCH</SelectItem>
                      <SelectItem value="DELETE">DELETE</SelectItem>
                      <SelectItem value="HEAD">HEAD</SelectItem>
                      <SelectItem value="OPTIONS">OPTIONS</SelectItem>
                      <SelectItem value="TRACE">TRACE</SelectItem>
                      <SelectItem value="CONNECT">CONNECT</SelectItem>
                    </SelectContent>
                  </Select>
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />

            {/* Endpoint */}
            <Controller
              name="endpoint"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="http-endpoint">Endpoint</FieldLabel>
                  <Input
                    {...field}
                    id="http-endpoint"
                    placeholder="https://api.example.com/users"
                    aria-invalid={fieldState.invalid}
                  />
                  <FieldDescription>
                    Enter a static URL, or use <code className="bg-muted px-1 rounded text-xs">{"{{variable}}"}</code> to
                    insert values from previous nodes.
                    {availableVariables.length > 0 && (
                      <> Example: <code className="bg-muted px-1 rounded text-xs">{`https://api.example.com/users/{{${availableVariables[0].path}}}`}</code></>
                    )}
                  </FieldDescription>
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />

            {/* Body (conditional) */}
            {showBodyField && (
              <Controller
                name="body"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="http-body">Body</FieldLabel>
                    <Textarea
                      {...field}
                      id="http-body"
                      placeholder='{"key": "value"}'
                      className="min-h-30 font-mono text-sm"
                      aria-invalid={fieldState.invalid}
                    />
                    <FieldDescription>
                      JSON body. Use <code className="bg-muted px-1 rounded text-xs">{"{{variable}}"}</code> for string
                      values or <code className="bg-muted px-1 rounded text-xs">{"{{json variable}}"}</code> to embed objects.
                    </FieldDescription>
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />
            )}

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
