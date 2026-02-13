import "./Governance.css"
import { useContext, useEffect, useState } from "react"
import { NotificationManager } from "react-notifications"
import { AppContext } from "../../context"
import { database } from "../../helpers/firebase"

const nowEpoch = () => Math.floor(Date.now() / 1000)

export const Governance = () => {
  const { walletAddress } = useContext(AppContext)
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [durationDays, setDurationDays] = useState(5)
  const [proposals, setProposals] = useState([])

  useEffect(() => {
    const ref = database.ref("/governanceProposals")
    ref.on("value", (snapshot) => {
      if (!snapshot.exists()) {
        setProposals([])
        return
      }

      const rows = []
      const data = snapshot.val()
      for (let id in data) {
        rows.push({ id, ...data[id] })
      }
      rows.sort((a, b) => b.createdAt - a.createdAt)
      setProposals(rows)
    })

    return () => ref.off()
  }, [])

  const createProposal = async () => {
    if (!walletAddress) {
      NotificationManager.error("Connect wallet before creating proposals.")
      return
    }
    if (!title || !description) {
      NotificationManager.error("Title and description are required.")
      return
    }

    const startTime = nowEpoch()
    const endTime = startTime + Number(durationDays) * 86400

    await database.ref("/governanceProposals").push({
      title,
      description,
      proposer: walletAddress,
      createdAt: startTime,
      startTime,
      endTime,
      forVotes: 0,
      againstVotes: 0,
      voters: {},
      executed: false,
      status: "Active",
    })

    setTitle("")
    setDescription("")
    NotificationManager.success("Proposal created.")
  }

  const castVote = async (proposal, support) => {
    if (!walletAddress) {
      NotificationManager.error("Connect wallet before voting.")
      return
    }
    if (proposal.voters && proposal.voters[walletAddress]) {
      NotificationManager.error("You already voted on this proposal.")
      return
    }
    if (proposal.executed || nowEpoch() > proposal.endTime) {
      NotificationManager.error("Voting period is closed.")
      return
    }

    const nextFor = proposal.forVotes + (support ? 1 : 0)
    const nextAgainst = proposal.againstVotes + (support ? 0 : 1)

    await database.ref(`/governanceProposals/${proposal.id}`).update({
      forVotes: nextFor,
      againstVotes: nextAgainst,
      voters: {
        ...(proposal.voters || {}),
        [walletAddress]: support ? "for" : "against",
      },
    })
  }

  const executeProposal = async (proposal) => {
    if (proposal.executed) return
    if (nowEpoch() <= proposal.endTime) {
      NotificationManager.error("Proposal still in voting period.")
      return
    }
    if (proposal.forVotes <= proposal.againstVotes) {
      NotificationManager.error("Proposal did not pass.")
      return
    }

    await database.ref(`/governanceProposals/${proposal.id}`).update({
      executed: true,
      executedAt: nowEpoch(),
      status: "Executed",
    })
    NotificationManager.success("Proposal marked executed.")
  }

  return (
    <div className="governance-page">
      <div className="governance-hero">
        <h2>Real Estate Governance</h2>
        <p>
          Create and vote on community proposals for property listings, treasury strategy, and partner
          campaigns.
        </p>
      </div>

      <div className="governance-composer">
        <h3>Create proposal</h3>
        <input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Proposal title" />
        <textarea
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          placeholder="Describe proposed action"
        />
        <div className="governance-row">
          <label>
            Voting duration
            <select value={durationDays} onChange={(event) => setDurationDays(Number(event.target.value))}>
              <option value={3}>3 days</option>
              <option value={5}>5 days</option>
              <option value={7}>7 days</option>
            </select>
          </label>
          <button type="button" onClick={createProposal}>
            Submit proposal
          </button>
        </div>
      </div>

      <div className="governance-list">
        {proposals.length === 0 ? (
          <p>No proposals yet.</p>
        ) : (
          proposals.map((proposal) => {
            const closed = nowEpoch() > proposal.endTime
            const passed = proposal.forVotes > proposal.againstVotes

            return (
              <div className="governance-card" key={proposal.id}>
                <h4>{proposal.title}</h4>
                <p>{proposal.description}</p>
                <div className="governance-meta">
                  <span>For: {proposal.forVotes}</span>
                  <span>Against: {proposal.againstVotes}</span>
                  <span>{closed ? "Closed" : "Active"}</span>
                </div>
                <div className="governance-actions">
                  <button type="button" onClick={() => castVote(proposal, true)} disabled={closed || proposal.executed}>
                    Vote For
                  </button>
                  <button type="button" onClick={() => castVote(proposal, false)} disabled={closed || proposal.executed}>
                    Vote Against
                  </button>
                  <button
                    type="button"
                    onClick={() => executeProposal(proposal)}
                    disabled={!closed || !passed || proposal.executed}
                  >
                    Execute
                  </button>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}

export default Governance
