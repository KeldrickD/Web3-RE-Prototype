import { database } from "./firebase"
import { ENVS } from "./configurations"

const normalizeWallet = (walletAddress) => walletAddress?.toLowerCase()

const getStakeEntriesSnapshot = async (walletAddress) => {
  if (!walletAddress) {
    return null
  }

  const walletKey = normalizeWallet(walletAddress)
  return database.ref(`/stakes/${walletKey}/entries`).once("value")
}

const calculateRewards = (amount, startTime, endTime) => {
  const now = Math.floor(Date.now() / 1000)
  const effectiveEnd = Math.min(now, endTime)
  const daysStaked = Math.max(0, (effectiveEnd - startTime) / 86400)
  const apr = ENVS.STAKE_APR
  return (amount * apr * daysStaked) / 365
}

export const getStakeSummary = async (walletAddress) => {
  const snapshot = await getStakeEntriesSnapshot(walletAddress)
  if (!snapshot || !snapshot.exists()) {
    return { totalActive: 0, totalRewards: 0, entries: [] }
  }

  const entries = []
  let totalActive = 0
  let totalRewards = 0

  snapshot.forEach((child) => {
    const entry = child.val()
    const endTime = entry.startTime + entry.durationDays * 86400
    const isActive = !entry.claimed && Date.now() / 1000 < endTime
    const reward = calculateRewards(entry.amount, entry.startTime, endTime)

    if (isActive) {
      totalActive += entry.amount
    }
    totalRewards += reward

    entries.push({
      id: child.key,
      ...entry,
      endTime,
      reward,
      isActive,
    })
  })

  return { totalActive, totalRewards, entries }
}

export const hasMinimumStake = async (walletAddress, minimumAmount = ENVS.STAKE_MIN_AMOUNT) => {
  const summary = await getStakeSummary(walletAddress)
  return summary.totalActive >= minimumAmount
}

export const createStakeEntry = async ({ walletAddress, amount, durationDays }) => {
  const walletKey = normalizeWallet(walletAddress)
  const entry = {
    amount,
    durationDays,
    startTime: Math.floor(Date.now() / 1000),
    claimed: false,
    createdAt: new Date().toISOString(),
  }

  await database.ref(`/stakes/${walletKey}/entries`).push(entry)
  return entry
}

export const claimStakeEntry = async (walletAddress, entryId) => {
  const walletKey = normalizeWallet(walletAddress)
  const entryRef = database.ref(`/stakes/${walletKey}/entries/${entryId}`)
  await entryRef.update({
    claimed: true,
    claimedAt: new Date().toISOString(),
  })
}
