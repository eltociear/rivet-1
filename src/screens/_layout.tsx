import { useQuery } from '@tanstack/react-query'
import { Link, Outlet } from 'react-router-dom'

import { Box, Column, Columns, Inline, Row, Rows, Text } from '~/design-system'
import { usePublicClient, useWalletClient } from '~/hooks'
import { usePendingRequestsStore } from '~/zustand'

import PendingRequest from './pending-request'

export default function Layout() {
  const { pendingRequests } = usePendingRequestsStore()
  const pendingRequest = pendingRequests[pendingRequests.length - 1]

  return (
    <Box
      backgroundColor='surface'
      borderWidth='1.5px'
      display='flex'
      style={{
        height: '100vh',
        width: '100%',
        overflowX: 'hidden',
      }}
    >
      <Rows>
        <Row height='content'>
          <Header />
        </Row>
        <Row>
          <Box style={{ overflowY: 'scroll' }} width='full'>
            {pendingRequests.length > 0 ? (
              <PendingRequest request={pendingRequest} />
            ) : (
              <Outlet />
            )}
          </Box>
        </Row>
      </Rows>
    </Box>
  )
}

function Header() {
  const publicClient = usePublicClient()
  const walletClient = useWalletClient()

  const { data: listening, status } = useQuery({
    queryKey: ['listening', publicClient],
    queryFn: async () => {
      try {
        return await publicClient.request({ method: 'net_listening' })
      } catch {
        return false
      }
    },
    refetchInterval: publicClient.pollingInterval,
  })

  const { data: addresses } = useQuery({
    enabled: Boolean(listening),
    queryKey: ['addresses', walletClient],
    queryFn: walletClient.getAddresses,
  })

  // TODO: retrieve selected account from global sync state (zustand).
  const address = addresses?.[0]

  return (
    <Box
      borderColor='primary / 0.1'
      borderBottomWidth='1px'
      width='full'
      style={{ height: '48px' }}
    >
      <Columns alignVertical='center'>
        <Column width='content'>
          <Link to='/network-config'>
            <Box
              backgroundColor={{ default: 'surface', hover: 'surfaceHover' }}
              display='flex'
              flexDirection='row'
              height='full'
              paddingLeft='24px'
              paddingRight='12px'
              style={{ width: '88px' }}
            >
              <Inline alignVertical='center' gap='8px' wrap={false}>
                <Box
                  backgroundColor={
                    status === 'pending'
                      ? 'primary / 0.5'
                      : listening
                      ? 'green'
                      : 'red'
                  }
                  borderWidth='1px'
                  borderRadius='round'
                  marginLeft='-12px'
                  style={{ width: 10, height: 10 }}
                />
                <Text size='14px'>
                  {status === 'pending'
                    ? '…'
                    : listening
                    ? 'Online'
                    : 'Offline'}
                </Text>
              </Inline>
            </Box>
          </Link>
        </Column>
        <Column width='content'>
          <Box
            backgroundColor='primary / 0.1'
            style={{ width: '1px', height: '100%' }}
          />
        </Column>
        <Column>
          <Box
            alignItems='center'
            display='flex'
            height='full'
            paddingLeft='12px'
            width='full'
          >
            {listening && address && (
              <Text weight='medium'>{`${address.slice(0, 6)}…${address.slice(
                -4,
              )}`}</Text>
            )}
          </Box>
        </Column>
      </Columns>
    </Box>
  )
}
