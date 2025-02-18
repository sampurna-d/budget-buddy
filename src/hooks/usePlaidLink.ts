import { useState, useCallback } from 'react';
import { supabase } from '../config/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Platform } from 'react-native';

interface Account {
  id: string;
  name: string;
  type: string;
  subtype?: string;
  mask?: string;
  user_id: string;
  plaid_item_id: string;
  balance_available: number | null;
  balance_current: number;
  created_at: string;
  last_updated?: string;
}

interface PlaidExchangeResponse {
  success: boolean;
  accounts: Account[];
  institution: {
    id: string;
    name: string;
  };
  access_token: string;
  item_id: string;
}

interface Institution {
  id: string;
  name: string;
  accounts: {
    type: string;
    count: number;
  }[];
}

export const usePlaidLink = () => {
  const [linkToken, setLinkToken] = useState<string | null>(null);
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const { user } = useAuth();

  const loadInstitutions = useCallback(async () => {
    if (!user) return;
    
    try {
      // First get all plaid items (institutions)
      const { data: itemsData, error: itemsError } = await supabase
        .from('plaid_items')
        .select('id, institution_id, institution_name')
        .eq('user_id', user.id);

      if (itemsError) throw itemsError;

      if (!itemsData) {
        setInstitutions([]);
        return;
      }

      // For each institution, get account types and counts
      const institutionsWithAccounts = await Promise.all(
        itemsData.map(async (item) => {
          const { data: accounts, error: accountsError } = await supabase
            .from('plaid_accounts')
            .select('type')
            .eq('plaid_item_id', item.id);

          if (accountsError) throw accountsError;

          // Group accounts by type and count them
          const accountTypes = accounts?.reduce((acc, account) => {
            const existingType = acc.find(t => t.type === account.type);
            if (existingType) {
              existingType.count++;
            } else {
              acc.push({ type: account.type, count: 1 });
            }
            return acc;
          }, [] as { type: string; count: number }[]) || [];

          return {
            id: item.institution_id,
            name: item.institution_name,
            accounts: accountTypes
          };
        })
      );

      setInstitutions(institutionsWithAccounts);
    } catch (error) {
      console.error('Error loading institutions:', error);
    }
  }, [user]);

  const generateLinkToken = useCallback(async () => {
    if (!user) {
      console.log('No user found');
      return;
    }

    try {
      console.log('Generating link token for user:', user.id);
      // Use 10.0.2.2 for Android emulator to connect to host machine
      // Use your machine's IP address for physical devices
      const SERVER_URL = Platform.select({
        android: 'http://10.0.2.2:3000',
        ios: 'http://127.0.0.1:3000',
        default: 'http://localhost:3000'
      });
      
      console.log('Connecting to server at:', SERVER_URL);
      const response = await fetch(`${SERVER_URL}/api/plaid/create-link-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id
        }),
      });

      console.log('Response status:', response.status);
      const data = await response.json();
      console.log('Response data:', data);

      if (!response.ok) {
        const errorMessage = data.error || 'Failed to generate link token';
        console.error('Server error:', errorMessage);
        throw new Error(errorMessage);
      }

      if (!data.link_token) {
        console.error('No link token in response:', data);
        throw new Error('Invalid server response - no link token');
      }

      console.log('Setting link token:', data.link_token);
      setLinkToken(data.link_token);
    } catch (error) {
      console.error('Error generating link token:', error);
      throw error; // Propagate error to component
    }
  }, [user]);

  const exchangePublicToken = useCallback(async (publicToken: string) => {
    if (!user) {
      console.log('No user found');
      return;
    }

    try {
      console.log('Exchanging public token:', publicToken);
      const SERVER_URL = Platform.select({
        android: 'http://10.0.2.2:3000',
        ios: 'http://127.0.0.1:3000',
        default: 'http://localhost:3000'
      });

      const response = await fetch(`${SERVER_URL}/api/plaid/exchange-public-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          public_token: publicToken,
          userId: user.id
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to exchange public token');
      }

      const data = await response.json() as PlaidExchangeResponse;
      console.log('Received response from server:', {
        success: data.success,
        item_id: data.item_id,
        institution: data.institution,
        account_count: data.accounts?.length || 0
      });

      // Strict validation of required fields
      if (!data.item_id || typeof data.item_id !== 'string') {
        console.error('Invalid item_id in Plaid response:', data.item_id);
        throw new Error('Invalid or missing item_id in Plaid response');
      }

      if (!data.access_token || typeof data.access_token !== 'string') {
        console.error('Invalid access_token in Plaid response:', data.access_token);
        throw new Error('Invalid or missing access_token in Plaid response');
      }

      if (!data.institution?.id || !data.institution?.name) {
        console.error('Invalid institution data in Plaid response:', data.institution);
        throw new Error('Invalid or missing institution data in Plaid response');
      }

      // Log the exact data being sent to Supabase
      const now = new Date().toISOString();
      const plaidItemData = {
        user_id: user.id,
        plaid_item_id: data.item_id,
        plaid_access_token: data.access_token,
        institution_id: data.institution.id,
        institution_name: data.institution.name,
        created_at: now,
        last_updated: now
      };
      
      console.log('Creating plaid_item with data:', {
        ...plaidItemData,
        plaid_access_token: '[REDACTED]'
      });

      // Create the plaid_item record
      const { data: itemData, error: itemError } = await supabase
        .from('plaid_items')
        .upsert(plaidItemData, {
          onConflict: 'user_id,plaid_item_id'
        })
        .select()
        .single();

      if (itemError) {
        console.error('Error creating plaid_item:', itemError);
        throw itemError;
      }

      if (!itemData?.id) {
        console.error('No item data returned after creation');
        throw new Error('Failed to get plaid_item id after creation');
      }

      // Then, create or update the accounts
      if (data.accounts && data.accounts.length > 0) {
        const now = new Date().toISOString();
        const accountsToUpsert = data.accounts.map(account => ({
          id: account.id,
          user_id: user.id,
          plaid_item_id: itemData.id,
          name: account.name,
          type: account.type,
          subtype: account.subtype || null,
          mask: account.mask || null,
          // Convert to numeric type and handle null/undefined
          balance_available: account.balance_available != null 
            ? Number(account.balance_available) 
            : null,
          balance_current: Number(account.balance_current || 0), // Required field, default to 0
          created_at: now,
          last_updated: now
        }));

        console.log(`Upserting ${accountsToUpsert.length} accounts...`);
        
        const { error: accountsError } = await supabase
          .from('plaid_accounts')
          .upsert(accountsToUpsert, {
            onConflict: 'id'
          });

        if (accountsError) {
          console.error('Error saving accounts to Supabase:', accountsError);
          throw accountsError;
        }
      }
      
      console.log('Successfully saved all data to Supabase');
      await loadInstitutions();
    } catch (error) {
      console.error('Error exchanging public token:', error);
      throw error;
    }
  }, [user, loadInstitutions]);

  return {
    linkToken,
    generateLinkToken,
    institutions,
    loadInstitutions,
    exchangePublicToken
  };
}; 