require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { Configuration, PlaidApi, PlaidEnvironments } = require('plaid');
const { supabase } = require('./supabase');

const app = express();

// Configure CORS to accept connections from your React Native app
app.use(cors({
  origin: '*', // Be more restrictive in production
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type']
}));

app.use(express.json());

const plaidConfig = new Configuration({
  basePath: PlaidEnvironments.sandbox,
  baseOptions: {
    headers: {
      'PLAID-CLIENT-ID': process.env.PLAID_CLIENT_ID,
      'PLAID-SECRET': process.env.PLAID_SECRET,
    },
  },
});

const plaidClient = new PlaidApi(plaidConfig);

// Add a health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.post('/api/plaid/create-link-token', async (req, res) => {
  try {
    const { userId } = req.body;
    console.log('Received request to create link token for user:', userId);
    
    const request = {
      user: { client_user_id: userId },
      client_name: 'Budget Buddy',
      products: ['transactions'],
      country_codes: ['US'],
      language: 'en'
    };

    console.log('Making request to Plaid with config:', request);
    const response = await plaidClient.linkTokenCreate(request);
    console.log('Received response from Plaid:', response.data);
    res.json(response.data);
  } catch (error) {
    console.error('Error creating link token:', error);
    res.status(500).json({ error: error.message });
  }
});

// Add a new endpoint to exchange public token
app.post('/api/plaid/exchange-public-token', async (req, res) => {
  try {
    const { public_token, userId } = req.body;
    console.log('Exchanging public token for user:', userId);

    // Exchange public token for access token
    const exchangeResponse = await plaidClient.itemPublicTokenExchange({
      public_token: public_token
    });

    const accessToken = exchangeResponse.data.access_token;
    const itemId = exchangeResponse.data.item_id;

    // Get account information
    const accountsResponse = await plaidClient.accountsGet({
      access_token: accessToken
    });

    // Get item information (including institution)
    const itemResponse = await plaidClient.itemGet({
      access_token: accessToken
    });

    const institutionResponse = await plaidClient.institutionsGetById({
      institution_id: itemResponse.data.item.institution_id,
      country_codes: ['US']
    });

    const institution = institutionResponse.data.institution;

    // Format accounts with all necessary information
    const accounts = accountsResponse.data.accounts.map(account => ({
      id: account.account_id,
      name: account.name,
      type: account.type,
      subtype: account.subtype,
      mask: account.mask,
      user_id: userId,
      balance_available: account.balances.available,
      balance_current: account.balances.current,
      created_at: new Date().toISOString()
    }));

    console.log('Formatted accounts:', accounts);

    // Structure the response properly
    res.json({ 
      success: true, 
      accounts,
      institution: {
        id: institution.institution_id,
        name: institution.name
      },
      access_token: accessToken,
      item_id: itemId  // This is the Plaid item_id we need
    });
  } catch (error) {
    console.error('Error exchanging public token:', error);
    res.status(500).json({ error: error.message });
  }
});

// Add a new endpoint to fetch transactions
app.post('/api/plaid/transactions', async (req, res) => {
  try {
    const { userId, startDate, endDate } = req.body;
    console.log('Fetching transactions for user:', userId);

    // Get all plaid items (access tokens) for the user
    const { data: items, error: itemsError } = await supabase
      .from('plaid_items')
      .select('plaid_access_token')
      .eq('user_id', userId);

    if (itemsError) throw itemsError;

    if (!items || items.length === 0) {
      return res.json({ transactions: [] });
    }

    // For each access token, fetch transactions
    const allTransactions = await Promise.all(
      items.map(async (item) => {
        const now = new Date();
        const thirtyDaysAgo = new Date(now.setDate(now.getDate() - 30));
        
        const request = {
          access_token: item.plaid_access_token,
          start_date: startDate || thirtyDaysAgo.toISOString().split('T')[0],
          end_date: endDate || new Date().toISOString().split('T')[0],
          options: {
            include_personal_finance_category: true
          }
        };

        const response = await plaidClient.transactionsGet(request);
        return response.data.transactions;
      })
    );

    // Flatten and sort all transactions
    const transactions = allTransactions
      .flat()
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    res.json({ transactions });
  } catch (error) {
    console.error('Error fetching transactions:', error);
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 3000;
// Listen on all network interfaces
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Server is accessible at:`);
  console.log(`  - http://localhost:${PORT}`);
  console.log(`  - http://127.0.0.1:${PORT}`);
  console.log(`  - http://10.0.2.2:${PORT} (Android Emulator)`);
}); 