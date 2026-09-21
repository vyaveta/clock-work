import LoginForm from "@/features/auth/components/signin"
import { requireUnauth } from "@/lib/auth-utils"

const Login = async () => {

  await requireUnauth()
  
  return (
    <LoginForm />
  )
}

export default Login