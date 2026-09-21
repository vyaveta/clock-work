import { requireAuth } from "@/lib/auth-utils";

interface PageProps {
    params: Promise<{
        credential_id: string;
    }>
}

const CredentialId = async ({params}: PageProps) => {

    await requireAuth()

    const {credential_id} = await params

  return (
    <div>Credential id: {credential_id} </div>
  )
}

export default CredentialId