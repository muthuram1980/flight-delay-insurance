import Web3 from "web3";

let web3;

const init = async () => {
  // Modern dapp browsers...
  if (window.ethereum) {
    web3 = new Web3(window.ethereum);
    // Request account access if needed
    await window.ethereum.enable();
    // Acccounts now exposed
    return web3;
  }
  // Legacy dapp browsers...
  else if (window.web3) {
    // Use Mist/MetaMask's provider.
    web3 = window.web3;
    console.log("Injected web3 detected.");
    return web3;
  }
  // Fallback to localhost; use dev console port by default...
  else {
    console.log('connection to local web3 provider',process.env.REACT_APP_LOCAL_WEB3_PROVIDER);
    const provider = new Web3.providers.HttpProvider(
      process.env.REACT_APP_LOCAL_WEB3_PROVIDER
    );
    web3 = new Web3(provider);
    console.log("No web3 instance injected, using Local web3.");
    return web3;
  }
}


const getWeb3 = async () => {
  if (!web3) {
    await init();
  }
  return web3;
}


export default getWeb3;
