# Project: Vaulted Assets (GOLD/SILVER)

## Overview
This project is a comprehensive TypeScript React application designed for secure blockchain wallet management. Its primary purpose is to provide advanced multi-chain redemption capabilities and robust transaction debugging across both Ethereum and Solana blockchain networks. The application aims to streamline secure wallet interactions and offers sophisticated event processing for real-time and historic blockchain data. The business vision is to provide a robust, reliable, and user-friendly platform for managing digital assets and transactions across multiple blockchain ecosystems, targeting users who require high fidelity in their blockchain interactions and debugging capabilities.

## System Architecture
The application is built as a full-stack TypeScript React application.

### Frontend
- **Framework**: React
- **Language**: TypeScript
- **State Management/Data Fetching**: TanStack Query
- **Styling**: Tailwind CSS
- **UI/UX Decisions**: Not explicitly defined, but implied by the use of React and Tailwind CSS for a modern, component-based design.

### Backend
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose for ORM.
- **Core Architectural Patterns**:
    - **Separate Blockchain Listeners**: Dedicated services for Ethereum and Solana ensure modularity and scalability for multi-chain support.
    - **Layered Architecture**: Clear separation between API endpoints, services (e.g., blockchain listeners), and the storage layer.
    - **Event-Driven Processing**: Emphasis on real-time and historic event processing from blockchain networks.
    - **Robust Data Consistency**: Implemented retry mechanisms with exponential backoff for concurrent operations and standardized data formats (e.g., `userId` as `ObjectId`) to prevent data integrity issues.
    - **Debugging Focus**: Dedicated API endpoints and extensive logging for transaction analysis and debugging.


- **Blockchain Networks**: Ethereum, Solana
- **Database**: MongoDB
- **Payment Processing**: MoonPay integration for secure fiat-to-crypto payments with server-side signed URLs
- **Frontend Libraries**: React, TanStack Query, Tailwind CSS
- **Backend Libraries**: Express.js, Mongoose (for MongoDB ORM), @moonpay/moonpay-node for payment processing
- **Blockchain Interaction Libraries**: Specific libraries for Ethereum (e.g., web3.js, ethers.js - implied) and Solana (e.g., web3.js, Anchor - implied by IDL usage) are used for blockchain event listening and transaction interaction.