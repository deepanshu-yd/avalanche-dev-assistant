# Subnets Guide

Subnets are a powerful feature of Avalanche that allows you to create custom blockchain networks tailored to your specific application needs.

## What are Subnets?

A Subnet is a sovereign network that defines its own rules regarding:

- **Membership**: Who can participate as validators
- **Token Economics**: Custom fee structures and rewards
- **Virtual Machine**: Choose from existing VMs or create custom ones
- **Governance**: How network parameters are managed

## Benefits of Subnets

### Customization
- Choose your own virtual machine (EVM, AVM, or custom)
- Set custom gas fees and token economics
- Define validator requirements and rewards

### Performance
- Dedicated resources for your application
- No competition for block space
- Predictable transaction costs

### Compliance
- Implement KYC/AML requirements for validators
- Geographic restrictions if needed
- Private or permissioned networks

## Creating a Subnet

### Step 1: Install Avalanche-CLI

```bash
curl -sSfL https://raw.githubusercontent.com/ava-labs/avalanche-cli/main/scripts/install.sh | sh -s
export PATH=~/bin:$PATH
```

### Step 2: Create Subnet Configuration

```bash
avalanche subnet create mySubnet
```

This will prompt you to configure:
- Virtual Machine type
- Chain ID
- Token symbol and name
- Gas fees and limits

### Step 3: Deploy Locally

```bash
avalanche subnet deploy mySubnet --local
```

### Step 4: Add to MetaMask

Add the local subnet network to MetaMask:
- Network Name: My Subnet
- RPC URL: http://127.0.0.1:9650/ext/bc/[CHAIN-ID]/rpc
- Chain ID: (as configured)
- Symbol: (your token symbol)

## VM Options

### Subnet-EVM
Ethereum-compatible virtual machine with customizable features:
- Custom gas tokens
- Precompiled contracts
- Network upgrades

### Custom VMs
Build your own virtual machine for specialized use cases:
- Gaming applications
- DeFi protocols with custom logic
- Enterprise solutions

## Validator Management

Subnet validators must also validate the Primary Network. Requirements:
- Minimum 2,000 AVAX stake
- Hardware requirements
- Uptime expectations (>80%)

## Use Cases

- **Gaming**: Dedicated gaming chains with custom mechanics
- **DeFi**: Specialized financial applications
- **Enterprise**: Private corporate networks
- **NFTs**: Custom marketplaces with unique features
