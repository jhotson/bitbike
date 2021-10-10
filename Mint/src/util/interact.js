import { pinJSONToIPFS, pinFileToIPFS, removePinFromIPFS } from "./pinata.js"
import { ethers } from 'ethers'
import itemsMeta from '../constants/items-meta.json'
import { contractAddress } from '../constants/address'
import axios from "axios"
import {chainId} from '../constants/address'
require("dotenv").config()
// const alchemyKey = process.env.REACT_APP_ALCHEMY_KEY
// const { createAlchemyWeb3 } = require("@alch/alchemy-web3")
// const web3 = createAlchemyWeb3(alchemyKey)
// const web3 = new Web3('https://ropsten.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161')
// const clanCount = 5

export const connectWallet = async () => {
  if (window.ethereum) {
    try {
      const chain = await window.ethereum.request({ method: 'eth_chainId' })
      console.log(chain, parseInt(chain, 16), chainId, parseInt(chain, 16) === chainId)
      if (parseInt(chain, 16) == chainId) {
        const addressArray = await window.ethereum.request({
          method: 'eth_requestAccounts',
        })
        console.log(addressArray)
        if (addressArray.length > 0) {
          return {
            address: addressArray[0],
            status: "👆🏽 You can mint new pack now.",
          }
        } else {
          return {
            address: "",
            status: "😥 Connect your wallet account to the site.",
          }
        }
      } else {
        window.ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId:chainId }],
        })
        return {
          address: "",
          status: "😥 Connect your wallet account to the site.",
        }
      }
      
    } catch (err) {
      return {
        address: "",
        status: "😥 " + err.message,
      }
    }
  } else {
    return {
      address: "",
      status: (
        <span>
          <p>
            {" "}
            🦊{" "}
            {/* <a target="_blank" href={`https://metamask.io/download.html`}> */}
              You must install Metamask, a virtual Ethereum wallet, in your
              browser.(https://metamask.io/download.html)
            {/* </a> */}
          </p>
        </span>
      ),
    }
  }
}

export const getCurrentWalletConnected = async () => {
  if (window.ethereum) {
    try {
      const addressArray = await window.ethereum.request({
        method: "eth_accounts",
      })
      const chain = await window.ethereum.request({
        method: "eth_chainId",
      })
      if (addressArray.length > 0 && chain === chainId) {
        return {
          address: addressArray[0],
          status: "👆🏽 You can mint new pack now.",
        }
      } else {
        return {
          address: "",
          status: "🦊 Connect to Metamask and choose the correct chain using the top right button.",
        }
      }
    } catch (err) {
      return {
        address: "",
        status: "😥 " + err.message,
      }
    }
  } else {
    return {
      address: "",
      status: (
        <span>
          <p>
            {" "}
            🦊{" "}
            {/* <a target="_blank" href={`https://metamask.io/download.html`}> */}
              You must install Metamask, a virtual Ethereum wallet, in your
              browser.(https://metamask.io/download.html)
            {/* </a> */}
          </p>
        </span>
      ),
    }
  }
}

// async function loadContract() {
//   return new web3.eth.Contract(contractABI, contractAddress)
// }

export const mintNFT = async (walletAddress) => {
  const infuraProvider = new ethers.providers.InfuraProvider("ropsten")
  const contractABI = require("../contract-abi.json")
  const contract = new ethers.Contract(contractAddress, contractABI, infuraProvider)

  let clanNumber = Math.floor(Math.random() * itemsMeta.count.set)
  const metaData = itemsMeta.set[clanNumber]
  metaData.name = metaData.name + Date.now() // name+timestamp
  const pinataResponseClan = await pinJSONToIPFS(metaData)

// export const mintNFT = async (url, name, description) => {
  // if (url.trim() === "" || name.trim() === "" || description.trim() === "") {
  //   return {
  //     success: false,
  //     status: "❗Please make sure all fields are completed before minting.",
  //   }
  // }
  // //make metadata
  // const metadata = new Object()
  // metadata.name = name
  // metadata.image = url
  // metadata.description = description

  // const pinataResponse = await pinJSONToIPFS(metadata)
  console.log(pinataResponseClan)
  if (!pinataResponseClan.success) {
    return {
      success: false,
      status: "😢 Something went wrong while uploading your tokenURI.",
    }
  }
  const tokenURI = pinataResponseClan.pinataUrl

  // const signer = (new ethers.providers.Web3Provider(window.ethereum)).getSigner()
  // const contractABI = require("../contract-abi.json")
  
  let ABI = ["function mintPack(string memory tokenURI)"]
  let iface = new ethers.utils.Interface(ABI)
  let dataParam = iface.encodeFunctionData("mintPack", [ tokenURI ])

  const transactionParameters = {
    to: contractAddress, // Required except during contract publications.
    from: walletAddress, // must match user's active address.
    data: dataParam
  }

  try {
    const txHash = window.ethereum.request({
      method: "eth_sendTransaction",
      params: [transactionParameters],
    })
    .then(async(data)=>{
      console.log('pack pending--hash', data)
      // const infuraProvider = new ethers.providers.InfuraProvider("ropsten")
      // let abi = [ "event MintPack(address indexed to, uint256 indexed tokenId)" ]
      // let iface = new ethers.utils.Interface(abi)

      // let filter = {
      //   address: contractAddress,
      //   topics: [
      //       ethers.utils.id("MintPack(address,uint256)")
      //   ]
      // }
      // infuraProvider.on(filter, (log, event) => {
      //   if (iface.parseLog(log).args.to === ethers.utils.getAddress(window.ethereum.selectedAddress)) {
      //     console.log('new pack id--', ethers.BigNumber.from(iface.parseLog(log).args.tokenId).toNumber())
      //   }
      // })
      
      contract.on("MintPack(address,uint256)", async(to, newId) => {
        if ( to === ethers.utils.getAddress(walletAddress) ) {
          console.log("newId", ethers.BigNumber.from(newId).toNumber())
          let tokenId = ethers.BigNumber.from(newId).toNumber()
          // let array = [tokenId]
          // console.log(await getMetaList(array))
          return {
            success: true,
            tokenId: tokenId,
          }
        }
      })
      
    })
    .catch(async(error) => {
      console.log(error)
      await removePinFromIPFS(tokenURI)
    })
    
    // return {
    //   success: true,
    //   status:
    //     "✅ Check out your transaction on Etherscan: https://ropsten.etherscan.io/tx/" +
    //     txHash,
    // }
  } catch (error) {
    return {
      success: false,
      status: "😥 Something went wrong: " + error.message,
    }
  }
}



export const getMetaList = async (walletAddress, tokenIds=[]) => {
  if (!walletAddress) {
    return []
  }
  const infuraProvider = new ethers.providers.InfuraProvider("rinkeby")
  const contractABI = require("../contract-abi.json")
  const contract = new ethers.Contract(contractAddress, contractABI, infuraProvider)
  console.log(tokenIds, !tokenIds.length, walletAddress, window.ethereum.selectedAddress)
  if ( !tokenIds.length ) {
    try {
      tokenIds = await contract.tokenIdsOfAccount(walletAddress)
    } catch (error) {
      console.log('network error--', error)
    }
  }
  const metaList = []
  console.log(tokenIds)

  let metas = await Promise.all(tokenIds.map(async(tokenId) => {
      let res = null
      try {
        res = await contract.tokenURI(Number(tokenId))
      } catch(err) {
        console.log('network error--', err)
      }
      console.log('res', res)
      if(res) {
        let response = null
        try {
          response = await axios.get('https://'+res)
        } catch (err) {
          console.log("fetch error: ", err)
        }
        // console.log('response', response)
        if(response) {
          try {
            let resJson = response.data
            // console.log(resJson)
            resJson['id'] = ethers.BigNumber.from(tokenId).toNumber()
            metaList.push(resJson)
          } catch (err) {
            console.log(err)
          }
        }
      }
    })
  )
  .then(()=> {
    // console.log(metaList)
    return metaList
  })
  return metas
}



export const burnPack = async(walletAddress, tokenId, packType) => {
  // get cardlist minted on chain
  const infuraProvider = new ethers.providers.InfuraProvider("ropsten")
  const contractABI = require("../contract-abi.json")
  const contract = new ethers.Contract(contractAddress, contractABI, infuraProvider)
  const cardIndexes = []
  const cardURIs = []
  console.log(packType, !!packType)
  if (!!packType) {
    const totalCardList = []
    try {
      totalCardList = await contract._getCardList()
    } catch (error) {
      console.log('network error--', error)
    }
    const clanCardList = []
    for (let i = 0; i<totalCardList.length; i++) {
      let temp = ethers.BigNumber.from(totalCardList[i]).toNumber() - itemsMeta.cardsum[packType]
      if ( temp >=0 && temp < 10000) {
        clanCardList.push(temp)
      }
    }
    console.log('minted already--', totalCardList, clanCardList)
    
    console.log(ethers.BigNumber.from(Math.floor(Math.random() * itemsMeta.count.card[packType])))
    // get card metadata
    for (;;) {
        if (( itemsMeta.count.card[packType] - clanCardList.length > 6 && cardIndexes.length === 6 ) || (itemsMeta.count.card[packType] - clanCardList.length === cardIndexes.length)) {
          break
        }
  
        let cardNumber = Math.floor(Math.random() * itemsMeta.count.card[packType])
        if ( clanCardList.includes(cardNumber + itemsMeta.cardsum[packType]) || cardIndexes.includes(cardNumber + itemsMeta.cardsum[packType]) ) {
          continue
        }
        const metaData = {}
        metaData.name = packType + cardNumber + "-" + Date.now() // name+timestamp
        metaData.description = packType + " Card"
        metaData.image = 'https://ipfs.io/ipfs/' + itemsMeta.card[packType][cardNumber]
        metaData.attributes = [
          {
              "trait_type": "Collection",
              "value": "Card"
          },
          {
              "trait_type": "Collection Name",
              "value": "Promo"
          }
        ]
        cardIndexes.push(cardNumber + itemsMeta.cardsum[packType])

        // pin metadata to pinata
        const pinataResponseClan = await pinJSONToIPFS(metaData)
        console.log(pinataResponseClan)
        if (!pinataResponseClan.success) {
          console.log("😢 Something went wrong while uploading your tokenURI.")
        } else {
          cardURIs.push(pinataResponseClan.pinataUrl)
        }
    }
  }
  console.log('cardIndexes, cardURIs', cardIndexes, cardURIs)
  let ABI = ["function burn(uint256 tokenId, uint256[] memory cardIndexes, string[] memory cardURIs)"]
  let iface = new ethers.utils.Interface(ABI)
  let dataParam = iface.encodeFunctionData("burn", [ tokenId, cardIndexes, cardURIs ])

  const transactionParameters = {
    to: contractAddress, // Required except during contract publications.
    from: walletAddress, // must match user's active address.
    data: dataParam
  }

  try {
    const txHash = window.ethereum.request({
      method: "eth_sendTransaction",
      params: [transactionParameters],
    })
    .then(async(data)=>{
      console.log('pack burnt--hash', data)
      // const infuraProvider = new ethers.providers.InfuraProvider("ropsten")
      // let abi = [ "event NftBurnt(address indexed from, string indexed tokenUri, uint256[] indexed newIdCount)" ]
      // let abi = [ "event NftBurnt(address indexed from, uint256 newId, uint256 newId2, uint256 newId3, uint256 newId4, uint256 newId5, uint256 newId6)" ]
      // let iface = new ethers.utils.Interface(abi)

      // let filter = {
      //   address: contractAddress,
      //   topics: [
      //       ethers.utils.id("NftBurnt(address,string,uint256[])")
      //   ]
      // }
      // infuraProvider.on(filter, async(log, event) => {
      //   console.log(iface.parseLog(log))
      //   if (iface.parseLog(log).args[0] === ethers.utils.getAddress(window.ethereum.selectedAddress)) {
      //     let tokenUri = ethers.utils.defaultAbiCoder.decode(
      //       [ 'string' ],
      //       ethers.utils.hexDataSlice(iface.parseLog(log).args[1].hash, 4)
      //     )
      //     let newIds = ethers.utils.defaultAbiCoder.decode(
      //       [ 'string' ],
      //       ethers.utils.hexDataSlice(iface.parseLog(log).args[2].hash, 4)
      //     )
      //     console.log(tokenUri)
      //     console.log(newIds)
      //     await removePinFromIPFS(iface.parseLog(log).args.tokenUri)
      //   }
      // })
      // contract.on("NftBurnt(address,string,uint256[])", (from, tokenUri, ids) => {
      // contract.on("NftBurnt(address, string, uint256, uint256, uint256, uint256, uint256, uint256)", (from, tokenUri, id, id1, id2, id3, id4, id5) => {
      contract.on("NftBurnt(address, string, uint256[6])", async(from, tokenUri, bigNumIds) => {
        // console.log(from, tokenUri, id, id1, id2, id3, id4, id5)
        console.log(from, tokenUri, bigNumIds)
        if ( from === ethers.utils.getAddress(window.ethereum.selectedAddress) ) {
          let newIds = []
          // let bigNumIds = [id, id1, id2, id3, id4, id5]
          for (let i=0; i<bigNumIds.length; i++) {
            newIds.push(ethers.BigNumber.from(bigNumIds[i]).toNumber())
          }
          console.log(newIds, tokenUri)
          await removePinFromIPFS(tokenUri)
        }
      })
      
    })
    .catch(async(error) => {
      console.log(error)
      for (let i=0; i<cardURIs.length; i++) {
        await removePinFromIPFS(cardURIs[i])
      }
    })
    
    return {
      success: true,
      status:
        "✅ Check out your transaction on Etherscan: https://ropsten.etherscan.io/tx/" +
        txHash,
    }
  } catch (error) {
    return {
      success: false,
      status: "😥 Something went wrong: " + error.message,
    }
  }
}

export const upload = async() => {
  const reader = new FileReader()
  console.log('sdfsdf')
  reader.onloadend = function() {
    console.log(reader.result)

    // const buf = buffer.Buffer(reader.result) // Convert data into buffer
  }
  const sdf = await pinFileToIPFS('nft.png')
  console.log(sdf)
  // const photo = document.getElementById("photo")
  // reader.readAsArrayBuffer(photo.files[0]) // Read Provided File
}