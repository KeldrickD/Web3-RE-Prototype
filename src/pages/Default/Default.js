import "./Default.css"
import React from "react"

import advertiseImg from "../../assets/img/advertise.png"

import banner1Img from "../../assets/img/banner1.jpg"
import banner2Img from "../../assets/img/banner2.jpg"
import banner3Img from "../../assets/img/banner3.jpg"
import banner4Img from "../../assets/img/banner4.jpg"

import Promoted from "../../components/PromotedCoins/Promoted"
import Filter from "../../components/Filter/Filter"

const opportunities = [
  {
    title: "Dubai Marina Fractional Tower",
    location: "Dubai, UAE",
    yield: "8.4% APY",
    status: "Live",
  },
  {
    title: "Lisbon Coastal Apartments",
    location: "Lisbon, Portugal",
    yield: "6.9% APY",
    status: "Funding",
  },
  {
    title: "Austin Mixed-Use Portfolio",
    location: "Austin, USA",
    yield: "7.6% APY",
    status: "Governance Vote",
  },
]

export const Default = () => {
  return (
    <div className="defaultMainDiv">
      <section className="realEstateHero">
        <div>
          <h1>Discover tokenized real estate opportunities</h1>
          <p>
            Explore verified properties, stake governance tokens for rewards, and help govern partner
            campaigns.
          </p>
        </div>
        <div className="heroStats">
          <div>
            <span>Total Properties</span>
            <strong>128</strong>
          </div>
          <div>
            <span>Total Value Locked</span>
            <strong>$42.7M</strong>
          </div>
          <div>
            <span>Active Campaigns</span>
            <strong>14</strong>
          </div>
        </div>
      </section>

      <div className="headerImgDiv">
        <img src={advertiseImg} alt="Partner promotion" />
      </div>

      <section className="opportunitiesGrid">
        {opportunities.map((item) => (
          <div key={item.title} className="opportunityCard">
            <h3>{item.title}</h3>
            <p>{item.location}</p>
            <div className="opportunityMeta">
              <span>{item.yield}</span>
              <span>{item.status}</span>
            </div>
          </div>
        ))}
      </section>

      <div className="bannerAreaDiv">
        <div className="banner1Div">
          <img src={banner1Img} className="first" alt="Partner banner one" />
          <img src={banner4Img} className="second" alt="Partner banner one alternate" />
        </div>
        <div className="banner2Div">
          <img src={banner2Img} className="first" alt="Partner banner two" />
          <img src={banner3Img} className="second" alt="Partner banner two alternate" />
        </div>
        <div className="banner3Div">
          <img src={banner1Img} className="first" alt="Partner banner three" />
          <img src={banner3Img} className="second" alt="Partner banner three alternate" />
        </div>
      </div>

      <Promoted title="Promoted" filter="promoted" caption="" />
      <Filter />

      <div className="allCoinDiv" />
    </div>
  )
}

export default Default
