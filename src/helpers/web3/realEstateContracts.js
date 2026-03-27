import { ethers } from "ethers"
import { ENVS } from "../configurations"
import { GOVERNANCE_ABI, PARTNER_CAMPAIGNS_ABI, STAKING_ABI } from "./realEstateAbi"

const getProvider = () => new ethers.providers.Web3Provider(window.ethereum)

export const getStakingContract = () => {
  const signer = getProvider().getSigner()
  return new ethers.Contract(ENVS.RE_STAKING_ADDRESS, STAKING_ABI, signer)
}

export const getGovernanceContract = () => {
  const signer = getProvider().getSigner()
  return new ethers.Contract(ENVS.RE_GOVERNANCE_ADDRESS, GOVERNANCE_ABI, signer)
}

export const getPartnerCampaignsContract = () => {
  const signer = getProvider().getSigner()
  return new ethers.Contract(ENVS.RE_PARTNER_CAMPAIGNS_ADDRESS, PARTNER_CAMPAIGNS_ABI, signer)
}
