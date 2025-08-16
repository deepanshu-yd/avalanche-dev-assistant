# Smart Contracts on Avalanche

Avalanche's C-Chain is fully compatible with Ethereum, allowing you to deploy Solidity smart contracts with minimal changes.

## Development Environment Setup

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- MetaMask or similar wallet

### Installing Hardhat

```bash
npm install --save-dev hardhat
npx hardhat init
```

### Network Configuration

Add Avalanche networks to your `hardhat.config.js`:

```javascript
module.exports = {
  solidity: "0.8.19",
  networks: {
    avalanche: {
      url: "https://api.avax.network/ext/bc/C/rpc",
      chainId: 43114,
      accounts: [process.env.PRIVATE_KEY]
    },
    fuji: {
      url: "https://api.avax-test.network/ext/bc/C/rpc",
      chainId: 43113,
      accounts: [process.env.PRIVATE_KEY]
    }
  }
};
```

## Smart Contract Example

Here's a simple token contract:

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract MyToken extends ERC20 {
    constructor(uint256 initialSupply) ERC20("MyToken", "MTK") {
        _mint(msg.sender, initialSupply);
    }
}
```

## Deployment

Deploy your contract to Fuji testnet:

```bash
npx hardhat run scripts/deploy.js --network fuji
```

## Best Practices

- Always test on Fuji testnet first
- Use OpenZeppelin contracts for security
- Implement proper access controls
- Consider gas optimization techniques
