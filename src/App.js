import React, { useState, useEffect } from 'react'
import { newKitFromWeb3 } from '@celo/contractkit'
import BigNumber from "bignumber.js";
import Web3 from 'web3';
import erc20ABI from "./contracts/erc20.abi.json"
import requestsABI from "./contracts/requests.abi.json"
const requestsContractAddress = "";
const cUsdContractAddress = "0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1";

const App = () => {
  const [kit, setKit] = useState("")
  const [address, setAddress] = useState("")
  const [requestsContract, setRequestsContract] = useState("")
  const [requestReceiver, setRequestReceiver] = useState("")
  const [requestAmount, setRequestAmount] = useState(0);
  const [outgoingRequests, setOutgoingRequests] = useState([])
  const [incomingRequests, setIncomingRequests] = useState([])

  async function connectWallet() {
    if (window.celo) {
      try {
        await window.celo.enable();
        const web3 = new Web3(window.celo);
        let kit = newKitFromWeb3(web3)
        const account = await kit.web3.eth.getAccounts();
        const defaultAccount = account[0];
        kit.defaultAccount = defaultAccount;
        setKit(kit)
        setAddress(defaultAccount)
      } catch (e) {
        console.log(e)
      }
    } else {
      alert("Please install CeloExtensionWallet to continue with this app")
    }
  }

  async function connectContract() {
    try {
      const requests = new kit.web3.eth.Contract(requestsABI, requestsContractAddress);
      setRequestsContract(requests)
    } catch (e) {
      console.log(e)
    }
  }

  async function sendRequest() {
    try {
      await requestsContract.methods.makeRequest(requestReceiver, requestAmount).send({ from: kit.defaultAccount })
    } catch (error) {
      console.log(error)
    }
  }

  async function getIncomingRequest() {
    try {
      const requests = await requestsContract.methods.loadIncomingRequests().call({ from: kit.defaultAccount })
      const incomingRequests = await Promise.all(
        requests.map(request => {
          return {
            id: request.requestId,
            from: request.from,
            to: request.to,
            amount: request.amount,
            completed: request.completed
          }
        })
      );
      setIncomingRequests(incomingRequests)
    } catch (error) {
      console.log(error)
    }
  }

  async function getOutgoingRequests() {
    try {
      const requests = await requestsContract.methods.loadOutgoingRequests().call({ from: kit.defaultAccount })
      const outgoingRequests = await Promise.all(
        requests.map(request => {
          return {
            id: request.requestId,
            from: request.from,
            to: request.to,
            amount: request.amount,
            completed: request.completed
          }
        })
      );
      setOutgoingRequests(outgoingRequests)
    } catch (error) {
      console.log(error)
    }
  }

  async function approveRequestAmount(amount) {    
    const requestAmount = new BigNumber(amount).shiftedBy(18)
    const cusdContract = new kit.web3.eth.Contract(
      erc20ABI,
      cUsdContractAddress
    );
    await cusdContract.methods
      .approve(requestsContractAddress, requestAmount)
      .send({ from: kit.defaultAccount });
  }

  async function grantRequest(requestId, requestAmount) {
    try {
      await approveRequestAmount(requestAmount);
      await requestsContract.methods.completeRequest(requestId).send({ from: kit.defaultAccount })
    } catch (e) {
      console.log(e)
    }
  }

    useEffect(() => {
      connectWallet()
    }, [])

    useEffect(() => {
      if (kit && address) {
        connectContract()
      }
    }, [kit, address])

    useEffect(() => {
      if (requestsContract) {
        getOutgoingRequests();
        getIncomingRequest();
      }
    }, [requestsContract])

  return (
    <div className='w-5/6 bg-red-100 m-auto min-h-screen'>
      <div className='bg-green-200 p-2 m-[auto] w-fit rounded-md font-mono'>{address}</div>
      <div className='flex gap-[10px] w-full justify-around mt-[30px]'>
        <div className='bg-gray-300 w-[400px] min-h-[400px] rounded-md flex gap-[10px] flex-col'>
          <div className='text-lg text-center underline'>Incoming Requests</div>
          {
            incomingRequests.map(r => (
              <div className='bg-gray-200 mx-[10px] rounded-sm p-[5px]'>
                <span className='text-xs font-mono'>{r.from}</span> is requesting for <span className='underline'>{r.amount}</span> cUSD
                {r.completed ? <div className='font-mono text-xs underline mt-[10px]'>Granted</div> : 
                <input type={"button"} className="block bg-green-600 py-[5px] px-[15px] rounded-md mt-[15px] ml-[auto] mr-[5px] mb-[5px]" value="Grant" onClick={() => grantRequest(r.id, r.amount)} />}
                </div>
            ))
          }
        </div>
        <div className='bg-green-200 w-[400px] rounded-md flex flex-col gap-[10px]'>
          <div className='text-lg text-center underline'>Make a request for cUSD</div>
          <input type="number" onChange={e => setRequestAmount(e.target.value)} placeholder='How many cUSD are you requesting for?' className='text-sm p-[10px] m-[5px] m-[10px]' />
          <input type="text" onChange={e => setRequestReceiver(e.target.value)} placeholder='Who are you requesting cUSD from? (Enter wallet address)' className='text-sm p-[10px] m-[5px] m-[10px]' />
          <input type="button" value={"Send"} onClick={() => sendRequest()} className="rounded-md bg-indigo-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm m-[10px]" />
        </div>
        <div className='bg-yellow-200 w-[400px] rounded-md flex gap-[10px] flex-col'>
          <div className='text-lg text-center underline'>Outgoing Requests</div>
          {
          outgoingRequests.map(r => (
            <div className='bg-gray-200 mx-[10px] rounded-sm p-[5px] '>
              You are requesting <span className='underline'>{r.amount}</span> cUSD from <span className='text-xs font-mono'>{r.from}</span>
              <div className='font-mono text-xs underline mt-[10px]'>{r.completed? "Completed": "Pending..."}</div>
            </div>
          ))
        }
        </div>
      </div>
    </div>
  )
}

export default App