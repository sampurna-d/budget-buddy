# Budget Buddy

A modern, AI-powered personal finance management application built with React Native and Expo.

## Features

### 🏦 Bank Integration
- Seamless bank account linking through Plaid API
- Automatic transaction syncing
- Support for multiple bank accounts
- Real-time balance updates

### 💰 Transaction Management
- Automatic transaction categorization using AI
- Manual transaction entry support
- Detailed transaction history
- Smart category mapping for Plaid transactions

### 📊 Budgeting
- Monthly budget setting by category
- Visual budget progress tracking
- Interactive progress bars
- Hidden amounts for privacy (tap to reveal)
- Color-coded budget status indicators

### 🤖 AI-Powered Features
- Smart transaction categorization
- Spending pattern analysis
- Personalized financial insights
- AI-generated saving recommendations

### 📱 User Experience
- Clean, modern interface
- Intuitive navigation
- Real-time updates
- Privacy-focused design
- Responsive across devices

## Technology Stack

### Frontend
- React Native
- Expo
- TypeScript
- React Navigation
- React Native Paper

### Backend
- Node.js
- Express
- Supabase (PostgreSQL)
- Plaid API
- Kluster AI

### AI/ML
- OpenAI API integration
- Custom AI service implementation
- Machine learning for transaction categorization

## Getting Started

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn
- Expo CLI
- Supabase account
- Plaid developer account
- Klauster AI API key

### Installation

1. Clone the repository:
\`\`\`bash
git clone https://github.com/yourusername/budget-buddy.git
cd budget-buddy
\`\`\`

2. Install dependencies:
\`\`\`bash
cd budget-buddy
npm install
\`\`\`

3. Set up environment variables:
Create a \`.env\` file in both the root and server directories with the following variables:

Root \`.env\`:
\`\`\`
AI_BASE_URL=your_kluster_ai_base_url
KLUSTER_API_KEY=your_kluster_ai_api_key
\`\`\`

Server \`.env\`:
\`\`\`
PLAID_CLIENT_ID=your_plaid_client_id
PLAID_SECRET=your_plaid_secret
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_KEY=your_supabase_service_key
\`\`\`

4. Start the development server:
\`\`\`bash
npm start
\`\`\`

## Areas for Improvement

### 1. AI Integration
- Implement async inference for complex AI operations
- Add caching for AI responses
- Improve error handling for AI service failures
- Implement retry mechanisms with exponential backoff

### 2. Performance
- Implement transaction pagination
- Add data caching
- Optimize large list rendering
- Implement virtual scrolling for long lists

### 3. Security
- Add biometric authentication
- Implement end-to-end encryption for sensitive data
- Add two-factor authentication
- Improve API key management

### 4. User Experience
- Add offline mode support
- Implement data synchronization
- Add export functionality for transactions
- Improve loading states and animations

### 5. Testing
- Add unit tests
- Implement integration tests
- Add end-to-end testing
- Improve test coverage

### 6. Documentation
- Add API documentation
- Improve code comments
- Add contribution guidelines
- Create user documentation

### 7. Features
- Add recurring transaction support
- Implement bill splitting
- Add investment tracking
- Implement goals and savings targets
- Add multi-currency support

## Contributing

We welcome contributions! Please see our [Contributing Guidelines](CONTRIBUTING.md) for details.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- [Plaid](https://plaid.com/) for banking integration
- [Supabase](https://supabase.io/) for backend services
- [Klauster AI](https://kluster.ai/) for AI capabilities
- [Expo](https://expo.dev/) for the development framework

## Support

For support, please open an issue in the GitHub repository or contact our support team at support@budgetbuddy.com. 