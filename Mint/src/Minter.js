import { useEffect, useState } from "react";
import {
  // burnPack,
  connectWallet,
  getCurrentWalletConnected,
  getMetaList,
  // mintNFT,
} from "./util/interact.js";
import {chainId} from './constants/address';
import { pinJSONToIPFS, removePinFromIPFS } from "./util/pinata.js"
import { ethers } from 'ethers'
import { contractAddress, toAddress } from './constants/address'
import Token from "./components/token";
import WHONETFileReader from './components/UploadFile'
import DataTable from './components/Table'
import Metadatabase from './constants/Metadata.json'
import Web3 from "web3";

const Minter = (props) => {
  const [walletAddress, setWallet] = useState("");
  const [status, setStatus] = useState("");

  const [mintLoading, setMintLoading] = useState(false)

  // const [metaData, setMetaData] = useState([])
  const [newMint, setNewMint] = useState([])
  const [csvData, setCsvData] = useState([])
  const [bearNumber, setBearNumber] = useState(0)
  const [individualNum, setIndividualNum] = useState(0)

  useEffect(async () => {
    const { address, status } = await getCurrentWalletConnected();

    setWallet(address);
    setStatus(status);

    addWalletListener();
  }, []);

  function addWalletListener() {
    if (window.ethereum) {
      window.ethereum.on("accountsChanged", (accounts) => {
        if (accounts.length > 0) {
          setWallet(accounts[0]);
          setStatus("👆🏽 You can mint new pack now.");
        } else {
          setWallet("");
          setStatus("🦊 Connect to Metamask using the top right button.");
        }
      });
      window.ethereum.on("chainChanged", (chain) => {
        connectWalletPressed()
        if (chain !== chainId) {
        }
      });
    } else {
      setStatus(
        <p>
          {" "}
          🦊{" "}
          {/* <a target="_blank" href={`https://metamask.io/download.html`}> */}
            You must install Metamask, a virtual Ethereum wallet, in your
            browser.(https://metamask.io/download.html)
          {/* </a> */}
        </p>
      );
    }
  }

  const connectWalletPressed = async () => {
    const walletResponse = await connectWallet();
    setStatus(walletResponse.status);
    setWallet(walletResponse.address);
  };

  const getMultiHash = async (polarNum) => {
    const metaData = {
        "name": "BitBike #" + polarNum,
        "description": "BitBikes are uniquely generated bicycles. No two are exactly alike, each one is generated with a range of accessories and rarity. Each BitBike can be officially owned by a single person on the blockchain. Owners are free to ride their bike in any virtual world they want. Ride On!",
        "image": "https://gateway.pinata.cloud/ipfs/QmPMcM1aSfs6RmFVH7WpNmt8bzznJPsbxECPQaiFGQ6noY/(" + polarNum + ").png",
        "attributes": [
          {
              "trait_type": "Background",
              "value": Metadatabase[polarNum - 1].Background
          },
          {
              "trait_type": "Frame",
              "value": Metadatabase[polarNum - 1].Frame
          },
          {
            "trait_type": "Crank",
            "value": Metadatabase[polarNum - 1].Crank
          },
          {
          "trait_type": "Wheel",
          "value": Metadatabase[polarNum - 1].Wheel
          },
          {
            "trait_type": "Spoke",
            "value": (Metadatabase[polarNum - 1].Spoke) === "[none]" ? "" : Metadatabase[polarNum - 1].Spoke
          },
          {
            "trait_type": "Seat",
            "value": Metadatabase[polarNum - 1].Seat
          },
          {
            "trait_type": "Bar_Tape",
            "value": Metadatabase[polarNum - 1].Bar_Tape
          },
          {
            "trait_type": "Hub",
            "value": Metadatabase[polarNum - 1].Hub
          },
          {
            "trait_type": "Accessory",
            "value": (Metadatabase[polarNum - 1].Accessory_1) === "[none]" ? "" : Metadatabase[polarNum - 1].Accessory_1
          },
          {
            "trait_type": "Accessory",
            "value": (Metadatabase[polarNum - 1].Accessory_2) === "[none]" ? "" : Metadatabase[polarNum - 1].Accessory_2
          },
          {
            "trait_type": "Accessory",
            "value": (Metadatabase[polarNum - 1].Accessory_3) === "[none]" ? "" : Metadatabase[polarNum - 1].Accessory_3
          },
          {
            "trait_type": "Accessory",
            "value": (Metadatabase[polarNum - 1].Accessory_4) === "[none]" ? "" : Metadatabase[polarNum - 1].Accessory_4
          },
        ]
    }
    if(polarNum === 2448) {
      metaData.image = "https://gateway.pinata.cloud/ipfs/QmYhsuzSvPb653hoNpSgisqstvhxbq6VnxiEYiz5HpNaEw"
    }
    const pinataResponseClan = await pinJSONToIPFS(metaData)
    return pinataResponseClan
  }
  const onMintPressed = async () => {
    setMintLoading(true)

    const contractABI = require("./contract-abi.json")
    window.web3 = new Web3(window.ethereum)
    const contract = new window.web3.eth.Contract(contractABI, contractAddress)

    const totalSupply = await contract.methods.totalSupply().call()

    var nextNum = parseInt(totalSupply) + 1

    var mintArr = []
    var pinataResponseArr = []

    for (var j=nextNum; j < nextNum + 30; j++) {
      mintArr.push(j)
      var pinataResponse = await getMultiHash(j)
      pinataResponseArr.push(pinataResponse.pinataUrl)
    }

    const tokenURI = pinataResponseArr

    console.log(mintArr);
    console.log(tokenURI);
    
    let ABI = ["function mintPack(string[] memory tokenURI, uint256[] memory mintedImg, address _to)"]
    let iface = new ethers.utils.Interface(ABI)
    let dataParam = iface.encodeFunctionData("mintPack", [ tokenURI, mintArr, toAddress])

    const transactionParameters = {
      to: contractAddress, // Required except during contract publications.
      from: walletAddress, // must match user's active address.
      data: dataParam
    }

    try {
      window.ethereum.request({
        method: "eth_sendTransaction",
        params: [transactionParameters],
      })
      .then(async(data)=>{
      
        contract.on("MintPack(address,uint256)", async(to, newId) => {
          setMintLoading(false)
          if ( to === ethers.utils.getAddress(walletAddress) ) {
            let tokenId = ethers.BigNumber.from(newId).toNumber()
            setNewMint([tokenId])
          }
        })
        setBearNumber()
      })
      .catch(async(error) => {
        await removePinFromIPFS(tokenURI)
        setMintLoading(false)
      })
    } catch (error) {
        setStatus("😥 Something went wrong: " + error.message)
        setMintLoading(false)
    }
  }

  
  const onMintIndividual = async () => {
    setMintLoading(true)

    const contractABI = require("./contract-abi.json")
    window.web3 = new Web3(window.ethereum)
    const contract = new window.web3.eth.Contract(contractABI, contractAddress)

    var ImgStatus = await contract.methods.ImgStatus(individualNum).call()
    if(ImgStatus) {
      alert('alerady minted')
      setMintLoading(false)
      return
    }

    const metaData = {
        "name": "BitBike #" + individualNum,
        "description": "BitBikes are uniquely generated bicycles. No two are exactly alike, each one is generated with a range of accessories and rarity. Each BitBike can be officially owned by a single person on the blockchain. Owners are free to ride their bike in any virtual world they want. Ride On!",
        "image": "https://gateway.pinata.cloud/ipfs/QmPMcM1aSfs6RmFVH7WpNmt8bzznJPsbxECPQaiFGQ6noY/(" + individualNum + ").png",
        "attributes": [
          {
            "trait_type": "Background",
            "value": Metadatabase[individualNum - 1].Background
          },
          {
            "trait_type": "Frame",
            "value": Metadatabase[individualNum - 1].Frame
          },
          {
            "trait_type": "Crank",
            "value": Metadatabase[individualNum - 1].Crank
          },
          {
            "trait_type": "Wheel",
            "value": Metadatabase[individualNum - 1].Wheel
          },
          {
            "trait_type": "Spoke",
            "value": (Metadatabase[individualNum - 1].Spoke) === "[none]" ? "" : Metadatabase[individualNum - 1].Spoke
          },
          {
            "trait_type": "Seat",
            "value": Metadatabase[individualNum - 1].Seat
          },
          {
            "trait_type": "Bar_Tape",
            "value": Metadatabase[individualNum - 1].Bar_Tape
          },
          {
            "trait_type": "Hub",
            "value": Metadatabase[individualNum - 1].Hub
          },
          {
            "trait_type": "Accessory",
            "value": (Metadatabase[individualNum - 1].Accessory_1) === "[none]" ? "" : Metadatabase[individualNum - 1].Accessory_1
          },
          {
            "trait_type": "Accessory",
            "value": (Metadatabase[individualNum - 1].Accessory_2) === "[none]" ? "" : Metadatabase[individualNum - 1].Accessory_2
          },
          {
            "trait_type": "Accessory",
            "value": (Metadatabase[individualNum - 1].Accessory_3) === "[none]" ? "" : Metadatabase[individualNum - 1].Accessory_3
          },
          {
            "trait_type": "Accessory",
            "value": (Metadatabase[individualNum - 1].Accessory_4) === "[none]" ? "" : Metadatabase[individualNum - 1].Accessory_4
          },
        ]
    }

    if(individualNum === 2448) {
      metaData.image = "https://gateway.pinata.cloud/ipfs/QmYhsuzSvPb653hoNpSgisqstvhxbq6VnxiEYiz5HpNaEw"
    }

    console.log(metaData);
    const pinataResponseClan = await pinJSONToIPFS(metaData)

    if (!pinataResponseClan.success) {
      setStatus("😢 Something went wrong while uploading your tokenURI.")
      setMintLoading(false)
      return
    }
    const tokenURI = pinataResponseClan.pinataUrl

    console.log(tokenURI);
    
    let ABI = ["function mintPackIndividual(string memory tokenURI, uint256 imgNum, address _to)"]
    let iface = new ethers.utils.Interface(ABI)
    let dataParam = iface.encodeFunctionData("mintPackIndividual", [ tokenURI, individualNum, toAddress])

    const transactionParameters = {
      to: contractAddress, // Required except during contract publications.
      from: walletAddress, // must match user's active address.
      data: dataParam
    }

    try {
      window.ethereum.request({
        method: "eth_sendTransaction",
        params: [transactionParameters],
      })
      .then(async(data)=>{
      
        contract.on("MintPack(address,uint256)", async(to, newId) => {
          setMintLoading(false)
          if ( to === ethers.utils.getAddress(walletAddress) ) {
            let tokenId = ethers.BigNumber.from(newId).toNumber()
            setNewMint([tokenId])
          }
        })
        setBearNumber()
      })
      .catch(async(error) => {
        await removePinFromIPFS(tokenURI)
        setMintLoading(false)
      })
    } catch (error) {
        setStatus("😥 Something went wrong: " + error.message)
        setMintLoading(false)
    }
  }

  // const handleSetCsvData = (data) => {
  //   setCsvData(data)
  // }

  return (
    <div className="Minter">
      <button id="walletButton" onClick={connectWalletPressed}>
        {walletAddress.length > 0 ? (
          "Connected: " +
          String(walletAddress).substring(0, 6) +
          "..." +
          String(walletAddress).substring(38)
        ) : (
          <span>Connect Wallet</span>
        )}
      </button>

      <input type="text" placeholder="Number to mint..." onChange={(e) => setBearNumber(parseInt(e.target.value))} />
      {/* <p>Max mint number is 20...</p> */}
      { mintLoading? 
        "Loading.."
        :
        <button id="mintButton" onClick={onMintPressed}>
          Mint NFT
        </button>
      }

     
      <br></br>

      <p />

      <>
        <input type="text" placeholder="Exact Bike Number to mint..." onChange={(e) => setIndividualNum(parseInt(e.target.value))} />
        { mintLoading? 
          "Loading.."
          :
          <button id="mintButton" onClick={onMintIndividual}>
            Mint Exact NFT
          </button>
        }
      </>

      <p id="status" style={{ color: "red" }}>
        {status}
      </p>

      {/* <p />

      <WHONETFileReader handleSetCsvData={handleSetCsvData} />
      <p />
      <DataTable csvData={csvData}/> */}
    </div>
  );
};

export default Minter;