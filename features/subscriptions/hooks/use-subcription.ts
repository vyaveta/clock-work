import { useQuery } from "@tanstack/react-query"
import { authClient } from "@/lib/auth-client"

export const useSubcription = () => {
    return useQuery({
        queryKey: ['subscription'],
        queryFn: async () => {
            const { data } = await authClient.customer.state()
            return data
        }
    })
}

export const useHasActiveSubcription = () => {
    const { data: customerState, isLoading, ...rest } = useSubcription()

    const hasActiveSubscription = customerState?.activeSubscriptions && customerState.activeSubscriptions.length > 0;

    return { hasActiveSubscription, subscription: customerState?.activeSubscriptions?.[0], isLoading, ...rest }
}