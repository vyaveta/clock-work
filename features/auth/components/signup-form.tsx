"use client"

import { Controller, useForm } from "react-hook-form"
import z from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import { useRouter } from "next/navigation"
import { useState } from "react"
import Link from "next/link"
import { EyeIcon, EyeOffIcon, MailIcon } from "lucide-react"

import {
    Field,
    FieldError,
    FieldGroup,
    FieldLabel,
    FieldSeparator,
} from "@/components/ui/field"

import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { authClient } from "@/lib/auth-client"
import Image from "next/image"
import { getAuthErrorMessage } from "@/features/auth/lib/auth-error-message"

const signupSchema = z
    .object({
        name: z.string().min(1, "Name is required"),
        email: z.email("Please enter a valid email address"),
        password: z
            .string()
            .min(8, "Password must be at least 8 characters"),
        confirmPassword: z.string().min(1, "Please confirm your password"),
    })
    .refine((data) => data.password === data.confirmPassword, {
        message: "Passwords do not match",
        path: ["confirmPassword"],
    })

type SignupSchema = z.infer<typeof signupSchema>

const SignupForm = () => {
    const router = useRouter()
    const [showPassword, setShowPassword] = useState(false)
    const [showConfirmPassword, setShowConfirmPassword] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const form = useForm<SignupSchema>({
        resolver: zodResolver(signupSchema),
        defaultValues: {
            name: "",
            email: "",
            password: "",
            confirmPassword: "",
        },
    })

    const isPending = form.formState.isSubmitting

    const onSubmit = async (values: SignupSchema) => {
        setError(null)
        try {
            const { error: authError } = await authClient.signUp.email({
                email: values.email,
                name: values.name,
                password: values.password,
            })

            if (authError) {
                setError(getAuthErrorMessage(authError, "We couldn’t create your account. Please try again."))
                return
            }

            router.push("/")
            router.refresh()
        } catch (error) {
            setError(getAuthErrorMessage(error, "We couldn’t create your account. Please try again."))
        }
    }

    const handleSocialSignup = async (provider: "google" | "github") => {
        setError(null)
        try {
            const { error: authError } = await authClient.signIn.social({ provider, callbackURL: "/" })
            if (authError) {
                setError(getAuthErrorMessage(authError, `We couldn’t sign up with ${provider === "google" ? "Google" : "GitHub"}. Please try again.`))
            }
        } catch (error) {
            setError(getAuthErrorMessage(error, `We couldn’t sign up with ${provider === "google" ? "Google" : "GitHub"}. Please try again.`))
        }
    }

    return (
        <div className="flex w-full flex-col gap-6">
            <Card>
                <CardHeader className="text-center">
                    <CardTitle className="text-xl">Create an account</CardTitle>
                    <CardDescription>
                        Get started by creating your account
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid gap-6">
                        {/* Social signup buttons */}
                        <div className="flex flex-col gap-3">
                            <Button
                                variant="outline"
                                size="lg"
                                className="w-full"
                                type="button"
                                disabled={isPending}
                                onClick={() => handleSocialSignup("github")}
                            >
                               <Image src={"/logos/github.svg"} width={20} height={20} alt="Github"/>
                                Continue with GitHub
                            </Button>
                            <Button
                                variant="outline"
                                size="lg"
                                className="w-full"
                                type="button"
                                disabled={isPending}
                                onClick={() => handleSocialSignup("google")}
                            >
                               <Image src={"/logos/google.svg"} width={20} height={20} alt="Google"/>
                                Continue with Google
                            </Button>
                        </div>

                        <FieldSeparator>or</FieldSeparator>

                        {/* Email/password form */}
                        <form onSubmit={form.handleSubmit(onSubmit)}>
                            <FieldGroup>
                                <Controller
                                    name="name"
                                    control={form.control}
                                    render={({ field, fieldState }) => (
                                        <Field data-invalid={fieldState.invalid || undefined}>
                                            <FieldLabel htmlFor="signup-name">
                                                Name
                                            </FieldLabel>
                                            <Input
                                                {...field}
                                                id="signup-name"
                                                placeholder="John Doe"
                                                autoComplete="name"
                                                aria-invalid={fieldState.invalid}
                                                disabled={isPending}
                                            />
                                            {fieldState.invalid && (
                                                <FieldError
                                                    errors={[fieldState.error]}
                                                />
                                            )}
                                        </Field>
                                    )}
                                />
                                <Controller
                                    name="email"
                                    control={form.control}
                                    render={({ field, fieldState }) => (
                                        <Field data-invalid={fieldState.invalid || undefined}>
                                            <FieldLabel htmlFor="signup-email">
                                                Email
                                            </FieldLabel>
                                            <Input
                                                {...field}
                                                id="signup-email"
                                                type="email"
                                                placeholder="you@example.com"
                                                autoComplete="email"
                                                aria-invalid={fieldState.invalid}
                                                disabled={isPending}
                                            />
                                            {fieldState.invalid && (
                                                <FieldError
                                                    errors={[fieldState.error]}
                                                />
                                            )}
                                        </Field>
                                    )}
                                />
                                <Controller
                                    name="password"
                                    control={form.control}
                                    render={({ field, fieldState }) => (
                                        <Field data-invalid={fieldState.invalid || undefined}>
                                            <FieldLabel htmlFor="signup-password">
                                                Password
                                            </FieldLabel>
                                            <div className="relative">
                                                <Input
                                                    {...field}
                                                    id="signup-password"
                                                    type={showPassword ? "text" : "password"}
                                                    placeholder="••••••••"
                                                    autoComplete="new-password"
                                                    aria-invalid={fieldState.invalid}
                                                    disabled={isPending}
                                                    className="pr-9"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setShowPassword((v) => !v)}
                                                    className="absolute inset-y-0 right-0 flex items-center pr-2.5 text-muted-foreground transition-colors hover:text-foreground"
                                                    tabIndex={-1}
                                                    aria-label={showPassword ? "Hide password" : "Show password"}
                                                >
                                                    {showPassword ? (
                                                        <EyeOffIcon className="size-4" />
                                                    ) : (
                                                        <EyeIcon className="size-4" />
                                                    )}
                                                </button>
                                            </div>
                                            {fieldState.invalid && (
                                                <FieldError
                                                    errors={[fieldState.error]}
                                                />
                                            )}
                                        </Field>
                                    )}
                                />
                                <Controller
                                    name="confirmPassword"
                                    control={form.control}
                                    render={({ field, fieldState }) => (
                                        <Field data-invalid={fieldState.invalid || undefined}>
                                            <FieldLabel htmlFor="signup-confirm-password">
                                                Confirm Password
                                            </FieldLabel>
                                            <div className="relative">
                                                <Input
                                                    {...field}
                                                    id="signup-confirm-password"
                                                    type={showConfirmPassword ? "text" : "password"}
                                                    placeholder="••••••••"
                                                    autoComplete="new-password"
                                                    aria-invalid={fieldState.invalid}
                                                    disabled={isPending}
                                                    className="pr-9"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setShowConfirmPassword((v) => !v)}
                                                    className="absolute inset-y-0 right-0 flex items-center pr-2.5 text-muted-foreground transition-colors hover:text-foreground"
                                                    tabIndex={-1}
                                                    aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                                                >
                                                    {showConfirmPassword ? (
                                                        <EyeOffIcon className="size-4" />
                                                    ) : (
                                                        <EyeIcon className="size-4" />
                                                    )}
                                                </button>
                                            </div>
                                            {fieldState.invalid && (
                                                <FieldError
                                                    errors={[fieldState.error]}
                                                />
                                            )}
                                        </Field>
                                    )}
                                />

                                {error && (
                                    <div role="alert" aria-live="polite" className="rounded-lg border border-destructive/20 bg-destructive/5 px-3 py-2 text-sm text-destructive">
                                        {error}
                                    </div>
                                )}

                                <Button
                                    type="submit"
                                    size="lg"
                                    className="w-full"
                                    disabled={isPending}
                                >
                                    {isPending ? (
                                        <>
                                            <Spinner />
                                            Creating account…
                                        </>
                                    ) : (
                                        <>
                                            <MailIcon />
                                            Sign up with Email
                                        </>
                                    )}
                                </Button>
                            </FieldGroup>
                        </form>
                    </div>
                </CardContent>
                <CardFooter className="justify-center">
                    <p className="text-sm text-muted-foreground">
                        Already have an account?{" "}
                        <Link
                            href="/signin"
                            className="font-medium text-foreground underline-offset-4 hover:underline"
                        >
                            Sign in
                        </Link>
                    </p>
                </CardFooter>
            </Card>
        </div>
    )
}

export default SignupForm
