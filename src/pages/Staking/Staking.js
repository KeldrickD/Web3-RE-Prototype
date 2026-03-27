import "./Staking.css"
import { useCallback, useContext, useEffect, useMemo, useState } from "react"
import { NotificationManager } from "react-notifications"
import { AppContext } from "../../context"
import { ENVS } from "../../helpers/configurations"
import { claimStakeEntry, createStakeEntry, getStakeSummary } from "../../helpers/staking"

const formatNumber = (value) => Number(value).toLocaleString(undefined, { maximumFractionDigits: 2 })

const formatDateTime = (epochSeconds) => {
  const date = new Date(epochSeconds * 1000)
  return date.toLocaleDateString() + " " + date.toLocaleTimeString()
}

export const Staking = () => {
  const { walletAddress } = useContext(AppContext)
  const [amount, setAmount] = useState("")
  const [durationDays, setDurationDays] = useState(ENVS.STAKE_DURATIONS[0])
  const [summary, setSummary] = useState({ totalActive: 0, totalRewards: 0, entries: [] })
  const [loading, setLoading] = useState(false)

  const rewardPreview = useMemo(() => {
    const numericAmount = Number(amount || 0)
    if (!numericAmount) return 0
    return (numericAmount * ENVS.STAKE_APR * durationDays) / 365
  }, [amount, durationDays])

  const fetchSummary = useCallback(async () => {
    if (!walletAddress) {
      setSummary({ totalActive: 0, totalRewards: 0, entries: [] })
      return
    }
    const stakeSummary = await getStakeSummary(walletAddress)
    setSummary(stakeSummary)
  }, [walletAddress])

  useEffect(() => {
    fetchSummary()
  }, [fetchSummary])

  const handleStake = async () => {
    if (!walletAddress) {
      NotificationManager.error("Connect your wallet before staking.")
      return
    }

    const numericAmount = Number(amount)
    if (!numericAmount || numericAmount <= 0) {
      NotificationManager.error("Enter a valid stake amount.")
      return
    }

    setLoading(true)
    try {
      await createStakeEntry({ walletAddress, amount: numericAmount, durationDays })
      NotificationManager.success("Stake recorded. Rewards will accrue over time.")
      setAmount("")
      await fetchSummary()
    } catch (error) {
      NotificationManager.error("Unable to record stake.")
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const handleClaim = async (entryId) => {
    if (!walletAddress) return
    setLoading(true)
    try {
      await claimStakeEntry(walletAddress, entryId)
      NotificationManager.success("Stake marked as claimed.")
      await fetchSummary()
    } catch (error) {
      NotificationManager.error("Unable to claim this stake.")
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="staking-page">
      <div className="staking-hero">
        <h2>Stake to unlock voting + rewards</h2>
        <p>
          Active stake required for voting: <strong>{ENVS.STAKE_MIN_AMOUNT} tokens</strong>. Rewards
          accrue at <strong>{ENVS.STAKE_APR * 100}% APR</strong>.
        </p>
      </div>

      <div className="staking-card">
        <h3>Start a new stake</h3>
        <div className="staking-form">
          <label>
            Amount
            <input
              type="number"
              min="0"
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
              placeholder="Enter amount"
            />
          </label>
          <label>
            Duration
            <select value={durationDays} onChange={(event) => setDurationDays(Number(event.target.value))}>
              {ENVS.STAKE_DURATIONS.map((duration) => (
                <option key={duration} value={duration}>
                  {duration} days
                </option>
              ))}
            </select>
          </label>
          <div className="staking-preview">
            Estimated reward: <strong>{formatNumber(rewardPreview)} tokens</strong>
          </div>
          <button type="button" className="staking-action" onClick={handleStake} disabled={loading}>
            {loading ? "Processing..." : "Confirm Stake"}
          </button>
        </div>
      </div>

      <div className="staking-summary">
        <div>
          <span>Active stake</span>
          <strong>{formatNumber(summary.totalActive)} tokens</strong>
        </div>
        <div>
          <span>Estimated rewards</span>
          <strong>{formatNumber(summary.totalRewards)} tokens</strong>
        </div>
      </div>

      <div className="staking-table">
        <h3>Stake history</h3>
        {summary.entries.length === 0 ? (
          <p className="staking-empty">No stakes recorded yet.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Amount</th>
                <th>Duration</th>
                <th>Started</th>
                <th>Ends</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {summary.entries.map((entry) => {
                const ended = Date.now() / 1000 >= entry.endTime
                const status = entry.claimed ? "Claimed" : ended ? "Ready to claim" : "Active"
                return (
                  <tr key={entry.id}>
                    <td>{formatNumber(entry.amount)}</td>
                    <td>{entry.durationDays} days</td>
                    <td>{formatDateTime(entry.startTime)}</td>
                    <td>{formatDateTime(entry.endTime)}</td>
                    <td>{status}</td>
                    <td>
                      {!entry.claimed && ended ? (
                        <button
                          type="button"
                          className="staking-action small"
                          onClick={() => handleClaim(entry.id)}
                          disabled={loading}
                        >
                          Claim
                        </button>
                      ) : (
                        <span className="staking-muted">—</span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

export default Staking
