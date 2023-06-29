import * as Tabs from '@radix-ui/react-tabs'
import { Fragment, type ReactNode, useEffect, useMemo, useState } from 'react'
import {
  type Address,
  type Block,
  formatEther,
  hexToBigInt,
  parseEther,
} from 'viem'

import { Container, TabsContent, TabsList } from '~/components'
import {
  Bleed,
  Box,
  Button,
  Columns,
  Inline,
  Input,
  Inset,
  SFSymbol,
  Separator,
  Stack,
  Text,
} from '~/design-system'
import { useBalance, useNonce } from '~/hooks'
import { useBlock } from '~/hooks/useBlock'
import { useBlocks } from '~/hooks/useBlocks'
import { usePrevious } from '~/hooks/usePrevious'
import { useSetBalance } from '~/hooks/useSetBalance'
import { useSetNonce } from '~/hooks/useSetNonce'
import { useTxpool } from '~/hooks/useTxpool'
import { truncateAddress } from '~/utils'
import { useAccount, useNetwork } from '~/zustand'

import * as styles from './index.css'
import OnboardingStart from './onboarding/start'

export default function Index() {
  const { onboarded } = useNetwork()
  if (!onboarded) return <OnboardingStart />
  return (
    <Container verticalInset={false}>
      <Tabs.Root defaultValue='accounts'>
        <TabsList
          items={[
            { label: 'Accounts', value: 'accounts' },
            { label: 'Blocks', value: 'blocks' },
            { label: 'Txpool', value: 'txpool' },
          ]}
        />
        <TabsContent inset={false} value='accounts'>
          <Accounts />
        </TabsContent>
        <TabsContent inset={false} value='blocks'>
          <Blocks />
        </TabsContent>
        <TabsContent value='txpool'>
          <Txpool />
        </TabsContent>
      </Tabs.Root>
    </Container>
  )
}

////////////////////////////////////////////////////////////////////////
// Accounts

function Accounts() {
  const {
    network: { rpcUrl },
  } = useNetwork()
  const { account: activeAccount, accountsForRpcUrl, setAccount } = useAccount()
  const accounts = useMemo(
    () => accountsForRpcUrl({ rpcUrl }),
    [accountsForRpcUrl, rpcUrl],
  )

  return (
    <>
      {accounts.map((account, i) => {
        const active = activeAccount?.address === account.address
        return (
          <Fragment key={i}>
            <Box
              backgroundColor={active ? 'surface/fill/tertiary' : undefined}
              marginHorizontal='-12px'
              paddingHorizontal='12px'
              paddingVertical='16px'
              position='relative'
            >
              {active && (
                <Text
                  color='text/secondary'
                  weight='medium'
                  size='9px'
                  style={{
                    position: 'absolute',
                    top: '8px',
                    right: '8px',
                  }}
                >
                  ACTIVE
                </Text>
              )}
              <Stack gap='16px'>
                <LabelledContent label='Address'>
                  <Text size='12px'>{account.address}</Text>
                </LabelledContent>
                <Columns gap='4px'>
                  <Balance address={account.address} />
                  <Box style={{ width: '50px' }}>
                    <Nonce address={account.address} />
                  </Box>
                </Columns>
              </Stack>
              {!active && (
                <Box
                  position='absolute'
                  style={{ bottom: '16px', right: '12px' }}
                >
                  <SwitchButton onClick={() => setAccount({ account })} />
                </Box>
              )}
            </Box>
            <Box marginHorizontal='-12px'>
              <Separator />
            </Box>
          </Fragment>
        )
      })}
    </>
  )
}

function SwitchButton({ onClick }: { onClick: () => void }) {
  return (
    /* TODO: Extract into `IconButton` */
    <Box
      as='button'
      backgroundColor={{
        hover: 'surface/fill/tertiary',
      }}
      borderColor='surface/invert@0.2'
      borderWidth='1px'
      onClick={onClick}
      style={{
        width: '20px',
        height: '20px',
      }}
      transform={{ hoveractive: 'shrink95' }}
    >
      <SFSymbol size='11px' symbol='arrow.left.arrow.right' weight='semibold' />
    </Box>
  )
}

function Balance({ address }: { address: Address }) {
  const { data: balance } = useBalance({ address })
  const { mutate } = useSetBalance()

  const [value, setValue] = useState(balance ? formatEther(balance) : '')
  useEffect(() => {
    if (balance) setValue(formatEther(balance))
  }, [balance])

  return (
    <LabelledContent label='Balance (ETH)'>
      {balance ? (
        <Bleed top='-2px'>
          <Input
            onChange={(e) => setValue(e.target.value)}
            value={value}
            onBlur={(e) =>
              mutate({
                address,
                value: parseEther(e.target.value as `${number}`),
              })
            }
            height='20px'
          />
        </Bleed>
      ) : null}
    </LabelledContent>
  )
}

function Nonce({ address }: { address: Address }) {
  const { data: nonce } = useNonce({ address })
  const { mutate } = useSetNonce()

  const [value, setValue] = useState(nonce ?? '0')
  useEffect(() => {
    if (nonce) setValue(nonce ?? '0')
  }, [nonce])

  return (
    <LabelledContent label='Nonce'>
      {nonce ? (
        <Bleed top='-2px'>
          <Input
            onChange={(e) => setValue(e.target.value)}
            value={value}
            onBlur={(e) =>
              mutate({
                address,
                nonce: Number(e.target.value),
              })
            }
            height='20px'
          />
        </Bleed>
      ) : null}
    </LabelledContent>
  )
}

////////////////////////////////////////////////////////////////////////
// Accounts

function Blocks() {
  const { data: block } = useBlock()
  const prevBlock = usePrevious(block)

  const { data: infiniteBlocks, fetchNextPage } = useBlocks()
  const blocks = useMemo(
    () => infiniteBlocks?.pages.flat() as Block[] | undefined,
    [infiniteBlocks],
  )

  const { data: txpool } = useTxpool()
  const txpoolTransactions = useMemo(
    () =>
      txpool?.reduce((acc, [_, transactions]) => acc + transactions.length, 0),
    [txpool],
  )

  return (
    <>
      <Box
        marginHorizontal='-12px'
        paddingHorizontal='12px'
        paddingVertical='12px'
        position='relative'
      >
        <Inline wrap={false}>
          <LabelledContent label='Block'>
            <Box style={{ width: '80px' }}>
              {Boolean(block?.number) && (
                <Text size='12px'>{(block?.number! + 1n).toString()}</Text>
              )}
            </Box>
          </LabelledContent>
          <LabelledContent label='Timestamp'>
            <Box style={{ width: '148px' }}>
              <Text color='text/tertiary' size='12px'>
                Pending
              </Text>
            </Box>
          </LabelledContent>
          <LabelledContent label='Transactions'>
            <Text size='12px'>{txpoolTransactions}</Text>
          </LabelledContent>
        </Inline>
      </Box>
      <Box marginHorizontal='-12px'>
        <Separator />
      </Box>
      {blocks?.map((block, i) => (
        <Fragment key={block.number!.toString()}>
          <Box
            // TODO: fix flash
            className={i === 0 && prevBlock && styles.mineBackground}
            marginHorizontal='-12px'
            paddingHorizontal='12px'
            paddingVertical='12px'
            position='relative'
          >
            <Inline wrap={false}>
              <LabelledContent label='Block'>
                <Box style={{ width: '80px' }}>
                  <Text size='12px'>{block.number!.toString()}</Text>
                </Box>
              </LabelledContent>
              <LabelledContent label='Timestamp'>
                <Box style={{ width: '148px' }}>
                  <Text size='12px'>
                    {new Date(
                      Number(block.timestamp! * 1000n),
                    ).toLocaleString()}
                  </Text>
                </Box>
              </LabelledContent>
              <LabelledContent label='Transactions'>
                <Text size='12px'>{block.transactions.length}</Text>
              </LabelledContent>
            </Inline>
          </Box>
          <Box marginHorizontal='-12px'>
            <Separator />
          </Box>
        </Fragment>
      ))}
      <Inset vertical='12px'>
        <Button
          onClick={() => fetchNextPage()}
          variant='stroked fill'
          width='fit'
        >
          Load more
        </Button>
      </Inset>
    </>
  )
}

////////////////////////////////////////////////////////////////////////
// Txpool

function Txpool() {
  const { data: txpool } = useTxpool()

  return (
    <Stack gap='16px'>
      {txpool?.length === 0 && (
        <Text color='text/tertiary'>Txpool is empty</Text>
      )}
      {txpool?.map(([account, transactions]) => {
        return (
          <>
            <Box key={account}>
              <Stack gap='16px'>
                <LabelledContent label='Account'>
                  <Text size='12px'>{account}</Text>
                </LabelledContent>
                <LabelledContent label='Transactions'>
                  <Stack gap='12px'>
                    {transactions.map(({ transaction }) => (
                      <Inline key={transaction.hash} alignHorizontal='justify'>
                        <Text size='12px'>
                          {truncateAddress(transaction.hash)}
                        </Text>
                        <Text size='12px'>
                          {formatEther(hexToBigInt(transaction.value))} ETH
                        </Text>
                      </Inline>
                    ))}
                  </Stack>
                </LabelledContent>
              </Stack>
            </Box>
            <Separator />
          </>
        )
      })}
    </Stack>
  )
}

function LabelledContent({
  children,
  label,
}: { children: ReactNode; label: string }) {
  return (
    <Stack gap='8px' width='fit'>
      <Text color='text/tertiary' size='9px' wrap={false}>
        {label.toUpperCase()}
      </Text>
      <Box>{children}</Box>
    </Stack>
  )
}
