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

const httpRequestSchema = z.object({
  method: z.enum(["GET", "PUT", "PATCH", "POST", "DELETE", "HEAD", "OPTIONS", "TRACE", "CONNECT"]),
  endpoint: z.string().min(1,{ message: "Please enter a valid URL" }),
  body: z.string().optional(),
  variableName: z.string().min(1, { message: " Variable name is required" }).regex(/^[A-Za-z_$][A-Za-z0-9_$]*$/, { message: 'variable name must start with a letter or underscore and contains only letters, numbers and underscores.' })
})

export type HttpRequestFormType = z.infer<typeof httpRequestSchema>

interface HttpRequestDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (values: HttpRequestFormType) => void
  defaultValues?: Partial<HttpRequestFormType>
}



export const HttpRequestDialog = ({
  open,
  onOpenChange,
  onSubmit,
  defaultValues,
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
      <DialogContent>
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
                    Static URL or use {"{{variables}}"} for simple values or {"{{json variable}}"} to stringify objects.
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
                      Request body. Supports {"{{variables}}"} and {"{{json variable}}"}.
                    </FieldDescription>
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />
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