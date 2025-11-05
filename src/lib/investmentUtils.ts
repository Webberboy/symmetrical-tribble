import { supabase } from '@/integrations/supabase/client';

// ============================================================================
// PORTFOLIO FUNCTIONS
// ============================================================================

/**
 * Get all portfolio holdings for a user
 */
export async function getPortfolio(userId: string) {
  try {
    const { data, error } = await supabase
      .from('portfolios')
      .select('*')
      .eq('user_id', userId)
      .order('total_value', { ascending: false });

    if (error) throw error;
    return { success: true, data };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Get a specific stock position
 */
export async function getStockPosition(userId: string, symbol: string) {
  try {
    const { data, error } = await supabase
      .from('portfolios')
      .select('*')
      .eq('user_id', userId)
      .eq('symbol', symbol)
      .single();

    if (error) throw error;
    return { success: true, data };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Update portfolio position with current market prices
 */
export async function updatePortfolioPrice(portfolioId: string, currentPrice: number) {
  try {
    const { data: portfolio, error: fetchError } = await supabase
      .from('portfolios')
      .select('*')
      .eq('id', portfolioId)
      .single();

    if (fetchError) throw fetchError;

    const shares = Number(portfolio.shares);
    const averageCost = Number(portfolio.average_cost);
    const totalValue = shares * currentPrice;
    const totalReturn = totalValue - Number(portfolio.total_cost_basis);
    const totalReturnPercent = (totalReturn / Number(portfolio.total_cost_basis)) * 100;
    const dayChange = (currentPrice - Number(portfolio.current_price)) * shares;
    const dayChangePercent = ((currentPrice - Number(portfolio.current_price)) / Number(portfolio.current_price)) * 100;

    const { data, error } = await supabase
      .from('portfolios')
      .update({
        current_price: currentPrice,
        total_value: totalValue,
        day_change: dayChange,
        day_change_percent: dayChangePercent,
        total_return: totalReturn,
        total_return_percent: totalReturnPercent,
        updated_at: new Date().toISOString()
      })
      .eq('id', portfolioId)
      .select()
      .single();

    if (error) throw error;
    return { success: true, data };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Calculate portfolio statistics
 */
export async function calculatePortfolioStatistics(userId: string) {
  try {
    const { data: portfolios, error } = await supabase
      .from('portfolios')
      .select('*')
      .eq('user_id', userId);

    if (error) throw error;

    const totalValue = portfolios.reduce((sum, p) => sum + Number(p.total_value), 0);
    const totalCostBasis = portfolios.reduce((sum, p) => sum + Number(p.total_cost_basis), 0);
    const totalDayChange = portfolios.reduce((sum, p) => sum + Number(p.day_change), 0);
    const totalReturn = portfolios.reduce((sum, p) => sum + Number(p.total_return), 0);
    
    const totalDayChangePercent = totalCostBasis > 0 ? (totalDayChange / (totalValue - totalDayChange)) * 100 : 0;
    const totalReturnPercent = totalCostBasis > 0 ? (totalReturn / totalCostBasis) * 100 : 0;

    // Calculate sector allocation
    const sectorAllocation: Record<string, number> = {};
    portfolios.forEach(p => {
      const sector = p.sector || 'Other';
      sectorAllocation[sector] = (sectorAllocation[sector] || 0) + Number(p.total_value);
    });

    return {
      success: true,
      data: {
        totalValue,
        totalCostBasis,
        totalDayChange,
        totalDayChangePercent,
        totalReturn,
        totalReturnPercent,
        numberOfHoldings: portfolios.length,
        sectorAllocation
      }
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// ============================================================================
// STOCK TRANSACTION FUNCTIONS
// ============================================================================

/**
 * Get all transactions for a user
 */
export async function getStockTransactions(userId: string, limit?: number) {
  try {
    let query = supabase
      .from('stock_transactions')
      .select('*')
      .eq('user_id', userId)
      .order('transaction_date', { ascending: false });

    if (limit) {
      query = query.limit(limit);
    }

    const { data, error } = await query;

    if (error) throw error;
    return { success: true, data };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Get transactions by type
 */
export async function getTransactionsByType(userId: string, transactionType: 'buy' | 'sell' | 'dividend') {
  try {
    const { data, error } = await supabase
      .from('stock_transactions')
      .select('*')
      .eq('user_id', userId)
      .eq('transaction_type', transactionType)
      .order('transaction_date', { ascending: false });

    if (error) throw error;
    return { success: true, data };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Get transactions for a specific stock
 */
export async function getStockTransactionHistory(userId: string, symbol: string) {
  try {
    const { data, error } = await supabase
      .from('stock_transactions')
      .select('*')
      .eq('user_id', userId)
      .eq('symbol', symbol)
      .order('transaction_date', { ascending: false });

    if (error) throw error;
    return { success: true, data };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Create a buy order
 */
export async function createBuyOrder(orderData: {
  userId: string;
  symbol: string;
  shares: number;
  pricePerShare: number;
  orderType: 'market' | 'limit';
  limitPrice?: number;
  fees?: number;
}) {
  try {
    const totalAmount = orderData.shares * orderData.pricePerShare;
    const fees = orderData.fees || 0;
    const netAmount = totalAmount + fees;

    const { data, error } = await supabase
      .from('stock_transactions')
      .insert({
        user_id: orderData.userId,
        transaction_type: 'buy',
        symbol: orderData.symbol,
        shares: orderData.shares,
        price_per_share: orderData.pricePerShare,
        total_amount: totalAmount,
        fees: fees,
        net_amount: netAmount,
        order_type: orderData.orderType,
        limit_price: orderData.limitPrice,
        status: 'completed', // In real app, would be 'pending' until order executes
        transaction_date: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;
    return { success: true, data };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Create a sell order
 */
export async function createSellOrder(orderData: {
  userId: string;
  symbol: string;
  shares: number;
  pricePerShare: number;
  orderType: 'market' | 'limit';
  limitPrice?: number;
  fees?: number;
}) {
  try {
    // Verify user has enough shares
    const { data: position } = await getStockPosition(orderData.userId, orderData.symbol);
    if (!position || Number(position.shares) < orderData.shares) {
      throw new Error('Insufficient shares to sell');
    }

    const totalAmount = orderData.shares * orderData.pricePerShare;
    const fees = orderData.fees || 0;
    const netAmount = totalAmount - fees;

    const { data, error } = await supabase
      .from('stock_transactions')
      .insert({
        user_id: orderData.userId,
        transaction_type: 'sell',
        symbol: orderData.symbol,
        shares: orderData.shares,
        price_per_share: orderData.pricePerShare,
        total_amount: totalAmount,
        fees: fees,
        net_amount: netAmount,
        order_type: orderData.orderType,
        limit_price: orderData.limitPrice,
        status: 'completed', // In real app, would be 'pending' until order executes
        transaction_date: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;
    return { success: true, data };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Record dividend payment
 */
export async function recordDividend(dividendData: {
  userId: string;
  symbol: string;
  shares: number;
  dividendPerShare: number;
}) {
  try {
    const totalAmount = dividendData.shares * dividendData.dividendPerShare;

    const { data, error } = await supabase
      .from('stock_transactions')
      .insert({
        user_id: dividendData.userId,
        transaction_type: 'dividend',
        symbol: dividendData.symbol,
        shares: dividendData.shares,
        price_per_share: dividendData.dividendPerShare,
        total_amount: totalAmount,
        fees: 0,
        net_amount: totalAmount,
        order_type: 'market',
        status: 'completed',
        transaction_date: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;
    return { success: true, data };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// ============================================================================
// STOCK MARKET DATA FUNCTIONS
// ============================================================================

/**
 * Get stock market data by symbol
 */
export async function getStockMarketData(symbol: string) {
  try {
    const { data, error } = await supabase
      .from('stock_market_data')
      .select('*')
      .eq('symbol', symbol)
      .single();

    if (error) throw error;
    return { success: true, data };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Search stocks by symbol or name
 */
export async function searchStocks(searchTerm: string) {
  try {
    const { data, error } = await supabase
      .from('stock_market_data')
      .select('*')
      .or(`symbol.ilike.%${searchTerm}%,name.ilike.%${searchTerm}%`)
      .order('symbol')
      .limit(20);

    if (error) throw error;
    return { success: true, data };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Get all available stocks
 */
export async function getAllStocks() {
  try {
    const { data, error } = await supabase
      .from('stock_market_data')
      .select('*')
      .order('symbol');

    if (error) throw error;
    return { success: true, data };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Get stocks by sector
 */
export async function getStocksBySector(sector: string) {
  try {
    const { data, error } = await supabase
      .from('stock_market_data')
      .select('*')
      .eq('sector', sector)
      .order('market_cap', { ascending: false });

    if (error) throw error;
    return { success: true, data };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Update stock price (admin function)
 */
export async function updateStockPrice(symbol: string, priceData: {
  currentPrice: number;
  previousClose: number;
  dayOpen: number;
  dayHigh: number;
  dayLow: number;
  volume: number;
}) {
  try {
    const dayChange = priceData.currentPrice - priceData.previousClose;
    const dayChangePercent = (dayChange / priceData.previousClose) * 100;

    const { data, error } = await supabase
      .from('stock_market_data')
      .update({
        current_price: priceData.currentPrice,
        previous_close: priceData.previousClose,
        day_open: priceData.dayOpen,
        day_high: priceData.dayHigh,
        day_low: priceData.dayLow,
        day_change: dayChange,
        day_change_percent: dayChangePercent,
        volume: priceData.volume,
        last_updated: new Date().toISOString()
      })
      .eq('symbol', symbol)
      .select()
      .single();

    if (error) throw error;
    return { success: true, data };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// ============================================================================
// MARKET INDICES FUNCTIONS
// ============================================================================

/**
 * Get all market indices
 */
export async function getMarketIndices() {
  try {
    const { data, error } = await supabase
      .from('market_indices')
      .select('*')
      .order('symbol');

    if (error) throw error;
    return { success: true, data };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Get specific market index
 */
export async function getMarketIndex(symbol: string) {
  try {
    const { data, error } = await supabase
      .from('market_indices')
      .select('*')
      .eq('symbol', symbol)
      .single();

    if (error) throw error;
    return { success: true, data };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// ============================================================================
// INVESTMENT GOALS FUNCTIONS
// ============================================================================

/**
 * Get all investment goals for a user
 */
export async function getInvestmentGoals(userId: string) {
  try {
    const { data, error } = await supabase
      .from('investment_goals')
      .select('*')
      .eq('user_id', userId)
      .order('target_date', { ascending: true });

    if (error) throw error;
    return { success: true, data };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Get goals by status
 */
export async function getGoalsByStatus(userId: string, status: 'on-track' | 'behind' | 'ahead' | 'completed') {
  try {
    const { data, error } = await supabase
      .from('investment_goals')
      .select('*')
      .eq('user_id', userId)
      .eq('status', status)
      .order('target_date', { ascending: true });

    if (error) throw error;
    return { success: true, data };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Get goals by category
 */
export async function getGoalsByCategory(userId: string, category: string) {
  try {
    const { data, error } = await supabase
      .from('investment_goals')
      .select('*')
      .eq('user_id', userId)
      .eq('category', category)
      .order('target_date', { ascending: true });

    if (error) throw error;
    return { success: true, data };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Create a new investment goal
 */
export async function createInvestmentGoal(goalData: {
  userId: string;
  name: string;
  description?: string;
  category: 'retirement' | 'house' | 'education' | 'vacation' | 'emergency' | 'other';
  priority: 'high' | 'medium' | 'low';
  targetAmount: number;
  currentAmount: number;
  targetDate: string;
  monthlyContribution: number;
}) {
  try {
    const { data, error } = await supabase
      .from('investment_goals')
      .insert({
        user_id: goalData.userId,
        name: goalData.name,
        description: goalData.description,
        category: goalData.category,
        priority: goalData.priority,
        target_amount: goalData.targetAmount,
        current_amount: goalData.currentAmount,
        target_date: goalData.targetDate,
        monthly_contribution: goalData.monthlyContribution
      })
      .select()
      .single();

    if (error) throw error;
    return { success: true, data };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Update an investment goal
 */
export async function updateInvestmentGoal(goalId: string, updates: {
  name?: string;
  description?: string;
  category?: string;
  priority?: string;
  targetAmount?: number;
  currentAmount?: number;
  targetDate?: string;
  monthlyContribution?: number;
}) {
  try {
    const updateData: any = {};
    if (updates.name !== undefined) updateData.name = updates.name;
    if (updates.description !== undefined) updateData.description = updates.description;
    if (updates.category !== undefined) updateData.category = updates.category;
    if (updates.priority !== undefined) updateData.priority = updates.priority;
    if (updates.targetAmount !== undefined) updateData.target_amount = updates.targetAmount;
    if (updates.currentAmount !== undefined) updateData.current_amount = updates.currentAmount;
    if (updates.targetDate !== undefined) updateData.target_date = updates.targetDate;
    if (updates.monthlyContribution !== undefined) updateData.monthly_contribution = updates.monthlyContribution;

    const { data, error } = await supabase
      .from('investment_goals')
      .update(updateData)
      .eq('id', goalId)
      .select()
      .single();

    if (error) throw error;
    return { success: true, data };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Delete an investment goal
 */
export async function deleteInvestmentGoal(goalId: string) {
  try {
    const { error } = await supabase
      .from('investment_goals')
      .delete()
      .eq('id', goalId);

    if (error) throw error;
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Get goal statistics
 */
export async function getGoalStatistics(userId: string) {
  try {
    const { data: goals, error } = await supabase
      .from('investment_goals')
      .select('*')
      .eq('user_id', userId);

    if (error) throw error;

    const totalTarget = goals.reduce((sum, g) => sum + Number(g.target_amount), 0);
    const totalCurrent = goals.reduce((sum, g) => sum + Number(g.current_amount), 0);
    const totalMonthly = goals.reduce((sum, g) => sum + Number(g.monthly_contribution), 0);
    const overallProgress = totalTarget > 0 ? (totalCurrent / totalTarget) * 100 : 0;

    const statusCounts = {
      'on-track': goals.filter(g => g.status === 'on-track').length,
      'behind': goals.filter(g => g.status === 'behind').length,
      'ahead': goals.filter(g => g.status === 'ahead').length,
      'completed': goals.filter(g => g.status === 'completed').length
    };

    return {
      success: true,
      data: {
        totalGoals: goals.length,
        totalTarget,
        totalCurrent,
        totalMonthly,
        overallProgress,
        statusCounts
      }
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// ============================================================================
// STOCK NEWS FUNCTIONS
// ============================================================================

/**
 * Get latest stock news
 */
export async function getStockNews(limit: number = 10, symbol?: string) {
  try {
    let query = supabase
      .from('stock_news')
      .select('*')
      .order('published_at', { ascending: false })
      .limit(limit);

    if (symbol) {
      query = query.or(`symbol.eq.${symbol},symbol.is.null`);
    }

    const { data, error } = await query;

    if (error) throw error;
    return { success: true, data };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Get news by sentiment
 */
export async function getNewsBySentiment(sentiment: 'positive' | 'negative' | 'neutral', limit: number = 10) {
  try {
    const { data, error } = await supabase
      .from('stock_news')
      .select('*')
      .eq('sentiment', sentiment)
      .order('published_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return { success: true, data };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Get news for specific stock
 */
export async function getStockSpecificNews(symbol: string, limit: number = 10) {
  try {
    const { data, error } = await supabase
      .from('stock_news')
      .select('*')
      .eq('symbol', symbol)
      .order('published_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return { success: true, data };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// ============================================================================
// STOCK ANALYSIS FUNCTIONS
// ============================================================================

/**
 * Get analyst ratings for a stock
 */
export async function getStockAnalysis(symbol: string) {
  try {
    const { data, error } = await supabase
      .from('stock_analysis')
      .select('*')
      .eq('symbol', symbol)
      .order('published_at', { ascending: false });

    if (error) throw error;
    return { success: true, data };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Get consensus rating for a stock
 */
export async function getConsensusRating(symbol: string) {
  try {
    const { data: ratings, error } = await supabase
      .from('stock_analysis')
      .select('*')
      .eq('symbol', symbol);

    if (error) throw error;

    if (!ratings || ratings.length === 0) {
      return { success: true, data: null };
    }

    // Count ratings
    const ratingCounts: Record<string, number> = {
      'strong-buy': 0,
      'buy': 0,
      'hold': 0,
      'sell': 0,
      'strong-sell': 0
    };

    ratings.forEach(r => {
      ratingCounts[r.rating] = (ratingCounts[r.rating] || 0) + 1;
    });

    // Calculate average price targets
    const priceTargets = {
      low: ratings.reduce((sum, r) => sum + (Number(r.price_target_low) || 0), 0) / ratings.length,
      average: ratings.reduce((sum, r) => sum + (Number(r.price_target_average) || 0), 0) / ratings.length,
      high: ratings.reduce((sum, r) => sum + (Number(r.price_target_high) || 0), 0) / ratings.length
    };

    // Determine consensus
    const totalRatings = ratings.length;
    const buyRatings = ratingCounts['strong-buy'] + ratingCounts['buy'];
    const sellRatings = ratingCounts['strong-sell'] + ratingCounts['sell'];
    
    let consensus = 'HOLD';
    if (buyRatings > totalRatings * 0.6) {
      consensus = 'BUY';
    } else if (buyRatings > totalRatings * 0.8) {
      consensus = 'STRONG BUY';
    } else if (sellRatings > totalRatings * 0.6) {
      consensus = 'SELL';
    }

    return {
      success: true,
      data: {
        consensus,
        ratingCounts,
        priceTargets,
        numberOfAnalysts: totalRatings
      }
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// ============================================================================
// WATCHLIST FUNCTIONS
// ============================================================================

/**
 * Get all watchlists for a user
 */
export async function getWatchlists(userId: string) {
  try {
    const { data, error } = await supabase
      .from('watchlists')
      .select(`
        *,
        watchlist_items (*)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return { success: true, data };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Get default watchlist
 */
export async function getDefaultWatchlist(userId: string) {
  try {
    const { data, error } = await supabase
      .from('watchlists')
      .select(`
        *,
        watchlist_items (*)
      `)
      .eq('user_id', userId)
      .eq('is_default', true)
      .single();

    if (error) throw error;
    return { success: true, data };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Create a new watchlist
 */
export async function createWatchlist(watchlistData: {
  userId: string;
  name: string;
  description?: string;
  isDefault?: boolean;
}) {
  try {
    const { data, error } = await supabase
      .from('watchlists')
      .insert({
        user_id: watchlistData.userId,
        name: watchlistData.name,
        description: watchlistData.description,
        is_default: watchlistData.isDefault || false
      })
      .select()
      .single();

    if (error) throw error;
    return { success: true, data };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Update watchlist
 */
export async function updateWatchlist(watchlistId: string, updates: {
  name?: string;
  description?: string;
  isDefault?: boolean;
}) {
  try {
    const updateData: any = {};
    if (updates.name !== undefined) updateData.name = updates.name;
    if (updates.description !== undefined) updateData.description = updates.description;
    if (updates.isDefault !== undefined) updateData.is_default = updates.isDefault;

    const { data, error } = await supabase
      .from('watchlists')
      .update(updateData)
      .eq('id', watchlistId)
      .select()
      .single();

    if (error) throw error;
    return { success: true, data };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Delete watchlist
 */
export async function deleteWatchlist(watchlistId: string) {
  try {
    const { error } = await supabase
      .from('watchlists')
      .delete()
      .eq('id', watchlistId);

    if (error) throw error;
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Add stock to watchlist
 */
export async function addToWatchlist(watchlistId: string, symbol: string, notes?: string) {
  try {
    const { data, error } = await supabase
      .from('watchlist_items')
      .insert({
        watchlist_id: watchlistId,
        symbol: symbol,
        notes: notes
      })
      .select()
      .single();

    if (error) throw error;
    return { success: true, data };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Remove stock from watchlist
 */
export async function removeFromWatchlist(watchlistId: string, symbol: string) {
  try {
    const { error } = await supabase
      .from('watchlist_items')
      .delete()
      .eq('watchlist_id', watchlistId)
      .eq('symbol', symbol);

    if (error) throw error;
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Update watchlist item notes
 */
export async function updateWatchlistItemNotes(watchlistId: string, symbol: string, notes: string) {
  try {
    const { data, error } = await supabase
      .from('watchlist_items')
      .update({ notes: notes })
      .eq('watchlist_id', watchlistId)
      .eq('symbol', symbol)
      .select()
      .single();

    if (error) throw error;
    return { success: true, data };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// ============================================================================
// PORTFOLIO HISTORY FUNCTIONS
// ============================================================================

/**
 * Get portfolio history for a user
 */
export async function getPortfolioHistory(userId: string, days: number = 30) {
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { data, error } = await supabase
      .from('portfolio_history')
      .select('*')
      .eq('user_id', userId)
      .gte('snapshot_date', startDate.toISOString().split('T')[0])
      .order('snapshot_date', { ascending: true });

    if (error) throw error;
    return { success: true, data };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Save portfolio snapshot
 */
export async function savePortfolioSnapshot(userId: string) {
  try {
    // Call the database function
    const { data, error } = await supabase.rpc('save_portfolio_snapshot', {
      p_user_id: userId,
      p_snapshot_date: new Date().toISOString().split('T')[0]
    });

    if (error) throw error;
    return { success: true, data };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Format currency
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
}

/**
 * Format percentage
 */
export function formatPercent(percent: number): string {
  return `${percent >= 0 ? '+' : ''}${percent.toFixed(2)}%`;
}

/**
 * Format large numbers (e.g., market cap)
 */
export function formatLargeNumber(num: number): string {
  if (num >= 1_000_000_000_000) {
    return `$${(num / 1_000_000_000_000).toFixed(2)}T`;
  } else if (num >= 1_000_000_000) {
    return `$${(num / 1_000_000_000).toFixed(2)}B`;
  } else if (num >= 1_000_000) {
    return `$${(num / 1_000_000).toFixed(2)}M`;
  } else if (num >= 1_000) {
    return `$${(num / 1_000).toFixed(2)}K`;
  }
  return `$${num.toFixed(2)}`;
}

/**
 * Calculate days until date
 */
export function daysUntil(targetDate: string): number {
  const target = new Date(targetDate);
  const today = new Date();
  const diffTime = target.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Calculate months until date
 */
export function monthsUntil(targetDate: string): number {
  const target = new Date(targetDate);
  const today = new Date();
  const diffTime = target.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24 * 30));
}
