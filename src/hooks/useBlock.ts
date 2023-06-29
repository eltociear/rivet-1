import { useQuery } from '@tanstack/react-query'
import type { Block } from 'viem'

import { queryClient } from '~/react-query'
import { useNetwork } from '~/zustand'

import { useNetworkStatus } from './useNetworkStatus'
import { usePublicClient } from './usePublicClient'

export function useBlockQueryOptions({
  refetchInterval,
}: { refetchInterval?: number } = {}) {
  const { network } = useNetwork()
  const { data: chainId } = useNetworkStatus()
  const publicClient = usePublicClient()
  return {
    enabled: Boolean(chainId),
    queryKey: ['block', publicClient.key],
    async queryFn() {
      const blockNumber = await publicClient.getBlockNumber({ maxAge: 0 })
      const prevBlock = queryClient.getQueryData([
        'block',
        publicClient.key,
      ]) as Block

      if (blockNumber && prevBlock && prevBlock.number === blockNumber)
        return prevBlock || null

      queryClient.invalidateQueries({ queryKey: ['balance'] })
      queryClient.invalidateQueries({ queryKey: ['nonce'] })
      queryClient.invalidateQueries({ queryKey: ['txpool'] })

      const block = await publicClient.getBlock({ blockNumber })

      queryClient.setQueryData(['blocks', publicClient.key], (data: any) => {
        if (data?.pages?.[0]) {
          data.pages[0].unshift(block)
          return data
        }
      })

      return block || null
    },
    gcTime: 0,
    refetchInterval: refetchInterval ?? (network.blockTime * 1_000 || 4_000),
  }
}

export function useBlock({
  refetchInterval,
}: { refetchInterval?: number } = {}) {
  const queryOptions = useBlockQueryOptions({ refetchInterval })
  return useQuery(queryOptions)
}
