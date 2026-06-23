"use client"

import { Controller, useForm } from "react-hook-form"
import z from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { authClient } from "@/lib/auth-client"
import Link from "next/link"
import { MailIcon } from "lucide-react"

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
import Image from "next/image"

const loginSchema = z.object({
    email: z.email("Please enter a valid email address"),
    password: z.string().min(1, "Password is required"),
})

type LoginSchema = z.infer<typeof loginSchema>

const LoginForm = () => {
    const router = useRouter()
    const [error, setError] = useState<string | null>(null)

    const form = useForm<LoginSchema>({
        resolver: zodResolver(loginSchema),
        defaultValues: {
            email: "",
            password: "",
        },
    })

    const isPending = form.formState.isSubmitting

    const onSubmit = async (values: LoginSchema) => {
        setError(null)
        const { error } = await authClient.signIn.email({
            email: values.email,
            password: values.password,
        })

        if (error) {
            setError(error.message ?? "Something went wrong. Please try again.")
        } else {
            router.push("/")
        }
    }

    const handleGoogleLogin = async () => {
        await authClient.signIn.social({
            provider: "google",
            callbackURL: "/",
        })
    }

    const handleGithubLogin = async () => {
        await authClient.signIn.social({
            provider: "github",
            callbackURL: "/",
        })
    }

    return (
        <div className="flex w-full flex-col gap-6">
            <Card>
                <CardHeader className="text-center">
                    <CardTitle className="text-xl">Welcome back</CardTitle>
                    <CardDescription>
                        Sign in to your account to continue
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid gap-6">
                        {/* Social login buttons */}
                        <div className="flex flex-col gap-3">
                            <Button
                                variant="outline"
                                size="lg"
                                className="w-full"
                                type="button"
                                disabled={isPending}
                                onClick={handleGithubLogin}
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
                                onClick={handleGoogleLogin}
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
                                    name="email"
                                    control={form.control}
                                    render={({ field, fieldState }) => (
                                        <Field data-invalid={fieldState.invalid || undefined}>
                                            <FieldLabel htmlFor="login-email">
                                                Email
                                            </FieldLabel>
                                            <Input
                                                {...field}
                                                id="login-email"
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
                                            <div className="flex items-center justify-between">
                                                <FieldLabel htmlFor="login-password">
                                                    Password
                                                </FieldLabel>
                                                <Link
                                                    href="/forgot-password"
                                                    className="text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
                                                >
                                                    Forgot password?
                                                </Link>
                                            </div>
                                            <Input
                                                {...field}
                                                id="login-password"
                                                type="password"
                                                placeholder="••••••••"
                                                autoComplete="current-password"
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

                                {error && (
                                    <div
                                        role="alert"
                                        className="rounded-lg border border-destructive/20 bg-destructive/5 px-3 py-2 text-sm text-destructive"
                                    >
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
                                            Signing in…
                                        </>
                                    ) : (
                                        <>
                                            <MailIcon />
                                            Sign in with Email
                                        </>
                                    )}
                                </Button>
                            </FieldGroup>
                        </form>
                    </div>
                </CardContent>
                <CardFooter className="justify-center">
                    <p className="text-sm text-muted-foreground">
                        Don&apos;t have an account?{" "}
                        <Link
                            href="/signup"
                            className="font-medium text-foreground underline-offset-4 hover:underline"
                        >
                            Sign up
                        </Link>
                    </p>
                </CardFooter>
            </Card>
        </div>
    )
}

export default LoginForm