type ErrorRecord = Record<string, unknown>

function asRecord(value: unknown): ErrorRecord | undefined {
  return typeof value === "object" && value !== null
    ? (value as ErrorRecord)
    : undefined
}

const messagesByCode: Record<string, string> = {
  INVALID_EMAIL_OR_PASSWORD: "The email or password is incorrect. Check your details and try again.",
  INVALID_PASSWORD: "The password is incorrect. Check it and try again.",
  EMAIL_NOT_VERIFIED: "Please verify your email address before signing in.",
  USER_ALREADY_EXISTS: "An account with this email already exists. Try signing in instead.",
  USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL: "An account with this email already exists. Try signing in instead.",
  FAILED_TO_CREATE_USER: "We couldn’t create your account. Please check your details and try again.",
  FAILED_TO_CREATE_SESSION: "Your details were accepted, but we couldn’t start your session. Please try signing in.",
  PASSWORD_TOO_SHORT: "Choose a password with at least 8 characters.",
  PASSWORD_TOO_LONG: "Choose a shorter password and try again.",
  INVALID_EMAIL: "Enter a valid email address and try again.",
  EMAIL_PASSWORD_SIGN_UP_DISABLED: "Email sign-up is currently unavailable. Please try a social sign-in option.",
  PROVIDER_NOT_FOUND: "This sign-in provider is unavailable right now. Please try another option.",
  FAILED_TO_GET_USER_INFO: "We couldn’t get your account details from the provider. Please try again.",
  TOO_MANY_REQUESTS: "Too many attempts. Please wait a moment and try again.",
}

export function getAuthErrorMessage(error: unknown, fallback: string) {
  const record = asRecord(error)
  const nestedError = asRecord(record?.error)
  const body = asRecord(record?.body)
  const code = [record?.code, nestedError?.code, body?.code]
    .find((value): value is string => typeof value === "string")
  const status = record?.status ?? nestedError?.status ?? body?.status

  if (code && messagesByCode[code]) return messagesByCode[code]
  if (status === 429) return messagesByCode.TOO_MANY_REQUESTS
  if (typeof status === "number" && status >= 500) {
    return "The sign-in service is temporarily unavailable. Please try again in a moment."
  }

  const rawMessage = [record?.message, nestedError?.message, body?.message]
    .find((value): value is string => typeof value === "string" && value.trim().length > 0)

  if (!rawMessage) return fallback

  const normalizedMessage = rawMessage.toLowerCase()
  if (normalizedMessage.includes("failed to fetch") || normalizedMessage.includes("networkerror")) {
    return "We couldn’t connect to the sign-in service. Check your internet connection and try again."
  }
  if (normalizedMessage.includes("invalid email or password")) {
    return messagesByCode.INVALID_EMAIL_OR_PASSWORD
  }
  if (normalizedMessage.includes("user already exists") || normalizedMessage.includes("email already exists")) {
    return messagesByCode.USER_ALREADY_EXISTS
  }
  if (normalizedMessage.includes("internal server error") || normalizedMessage.includes("server error")) {
    return "The sign-in service is temporarily unavailable. Please try again in a moment."
  }

  return rawMessage
}
