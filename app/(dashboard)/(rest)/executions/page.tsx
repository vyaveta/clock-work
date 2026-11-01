import { requireAuth } from "@/lib/auth-utils"
import { connectMongoose } from "@/lib/mongoose"

const Executions = async () => {

    await requireAuth()

     try {
        const connection = await connectMongoose()
        console.log(connection)
      } catch (err) {
console.log('failed to connect to m dbngod', err)
      }

  return (
    <div>Executions</div>
  )
}

export default Executions