import SignupForm from "@/features/auth/components/signup-form"
import { requireUnauth } from "@/lib/auth-utils"

const Signup = async () => {

  await requireUnauth()

  return (
    <SignupForm />
  )
}

export default Signup
