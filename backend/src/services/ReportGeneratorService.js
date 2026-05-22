const Order = require('../../models/Order');
const User = require('../../models/User');
const Product = require('../../models/Product');
const logger = require('./logger.service');

/**
 * ReportGeneratorService
 * Generates comprehensive sales and revenue reports with metrics aggregation
 */
class ReportGeneratorService {
  /**
   * Get payment metrics including success/failure rates and failure breakdown
   * 
   * @param {Object} dateRange - Date range for filtering
   * @param {Date} dateRange.startDate - Start date (inclusive)
   * @param {Date} dateRange.endDate - End date (inclusive)
   * @returns {Promise<Object>} Payment metrics object
   * 
   * @example
   * const metrics = await reportGenerator.getPaymentMetrics({
   *   startDate: new Date('2024-01-01'),
   *   endDate: new Date('2024-01-31')
   * });
   * // Returns:
   * // {
   * //   totalAttempts: 150,
   * //   successfulPayments: 145,
   * //   failedPayments: 5,
   * //   successRate: 96.67,
   * //   failureRate: 3.33,
   * //   failureBreakdown: {
   * //     cancelled: { count: 2, percentage: 40 },
   * //     no_show: { count: 2, percentage: 40 },
   * //     pending: { count: 1, percentage: 20 },
   * //     other: { count: 0, percentage: 0 }
   * //   }
   * // }
   */
  async getPaymentMetrics(dateRange) {
    try {
      const { startDate, endDate } = dateRange;

      // Validate date range
      if (!startDate || !endDate) {
        throw new Error('Date range with startDate and endDate is required');
      }

      if (startDate > endDate) {
        throw new Error('startDate must be before endDate');
      }

      // Build date filter
      const dateFilter = {
        createdAt: {
          $gte: new Date(startDate),
          $lte: new Date(endDate),
        },
      };

      // Use aggregation pipeline for efficient calculation
      const paymentMetrics = await Order.aggregate([
        {
          $match: dateFilter,
        },
        {
          $facet: {
            // Count all orders (total payment attempts)
            totalStats: [
              {
                $group: {
                  _id: null,
                  totalAttempts: { $sum: 1 },
                  successfulPayments: {
                    $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] },
                  },
                },
              },
            ],
            // Break down failures by status
            failureBreakdown: [
              {
                $match: {
                  status: { $ne: 'completed' },
                },
              },
              {
                $group: {
                  _id: '$status',
                  count: { $sum: 1 },
                },
              },
              {
                $sort: { count: -1 },
              },
            ],
          },
        },
      ]);

      // Extract results from facet
      const totalStats = paymentMetrics[0].totalStats[0] || {
        totalAttempts: 0,
        successfulPayments: 0,
      };
      const failureBreakdownRaw = paymentMetrics[0].failureBreakdown || [];

      const totalAttempts = totalStats.totalAttempts;
      const successfulPayments = totalStats.successfulPayments;
      const failedPayments = totalAttempts - successfulPayments;

      // Calculate rates
      const successRate =
        totalAttempts > 0
          ? parseFloat(((successfulPayments / totalAttempts) * 100).toFixed(2))
          : 0;
      const failureRate =
        totalAttempts > 0
          ? parseFloat(((failedPayments / totalAttempts) * 100).toFixed(2))
          : 0;

      // Build failure breakdown with categorization
      const failureBreakdown = {
        cancelled: { count: 0, percentage: 0 },
        no_show: { count: 0, percentage: 0 },
        pending: { count: 0, percentage: 0 },
        other: { count: 0, percentage: 0 },
      };

      // Map statuses to categories
      const statusToCategoryMap = {
        cancelled: 'cancelled',
        no_show: 'no_show',
        requested: 'pending',
        accepted: 'pending',
        meetup_scheduled: 'pending',
        delivered: 'pending',
      };

      // Aggregate failures by category
      failureBreakdownRaw.forEach((failure) => {
        const category = statusToCategoryMap[failure._id] || 'other';
        failureBreakdown[category].count += failure.count;
      });

      // Calculate percentages for each category
      if (failedPayments > 0) {
        Object.keys(failureBreakdown).forEach((category) => {
          failureBreakdown[category].percentage = parseFloat(
            ((failureBreakdown[category].count / failedPayments) * 100).toFixed(2)
          );
        });
      }

      const result = {
        totalAttempts,
        successfulPayments,
        failedPayments,
        successRate,
        failureRate,
        failureBreakdown,
      };

      logger.info('Payment metrics calculated', {
        dateRange,
        metrics: result,
      });

      return result;
    } catch (error) {
      logger.error('Error calculating payment metrics', {
        error: error.message,
        dateRange,
      });
      throw error;
    }
  }

  /**
   * Get dashboard metrics (placeholder for future implementation)
   * @param {Object} dateRange - Date range for filtering
   * @returns {Promise<Object>} Dashboard metrics
   */
  async getDashboardMetrics(dateRange) {
    try {
      const { startDate, endDate } = dateRange || {};

      if (!startDate || !endDate) {
        throw new Error('Date range with startDate and endDate is required');
      }

      if (new Date(startDate) > new Date(endDate)) {
        throw new Error('startDate must be before endDate');
      }

      const current = await this.getSalesMetrics(dateRange);
      const currentStart = new Date(startDate);
      const currentEnd = new Date(endDate);
      const rangeDurationMs = Math.max(currentEnd.getTime() - currentStart.getTime(), 24 * 60 * 60 * 1000);
      const previousEnd = new Date(currentStart.getTime() - 1);
      const previousStart = new Date(previousEnd.getTime() - rangeDurationMs);

      const previous = await this.getSalesMetrics({
        startDate: previousStart,
        endDate: previousEnd,
      });

      const calculateChange = (currentValue, previousValue) => {
        if (!previousValue) {
          return currentValue ? 100 : 0;
        }
        return parseFloat((((currentValue - previousValue) / previousValue) * 100).toFixed(2));
      };

      const result = {
        totalRevenue: current.totalRevenue || 0,
        salesVolume: current.totalOrders || 0,
        avgOrderValue: current.avgOrderValue || 0,
        activeSellers: current.activeSellers || 0,
        revenueChange: calculateChange(current.totalRevenue || 0, previous.totalRevenue || 0),
        volumeChange: calculateChange(current.totalOrders || 0, previous.totalOrders || 0),
        aovChange: calculateChange(current.avgOrderValue || 0, previous.avgOrderValue || 0),
        sellersChange: calculateChange(current.activeSellers || 0, previous.activeSellers || 0),
      };

      logger.info('Dashboard metrics calculated', { dateRange, metrics: result });
      return result;
    } catch (error) {
      logger.error('Error calculating dashboard metrics', {
        error: error.message,
        dateRange,
      });
      throw error;
    }
  }

  /**
   * Get top products (placeholder for future implementation)
   * @param {Object} dateRange - Date range for filtering
   * @param {number} limit - Number of products to return
   * @param {string} sortBy - Sort field
   * @returns {Promise<Array>} Top products
   */
  async getTopProducts(dateRange, limit = 10, sortBy = 'quantity') {
    try {
      const { startDate, endDate } = dateRange || {};

      if (!startDate || !endDate) {
        throw new Error('Date range with startDate and endDate is required');
      }

      if (new Date(startDate) > new Date(endDate)) {
        throw new Error('startDate must be before endDate');
      }

      const dateFilter = {
        createdAt: {
          $gte: new Date(startDate),
          $lte: new Date(endDate),
        },
        status: 'completed',
      };

      const parsedLimit = Math.max(parseInt(limit, 10) || 10, 1);

      const products = await Order.aggregate([
        { $match: dateFilter },
        { $unwind: '$items' },
        {
          $group: {
            _id: '$items.product',
            title: { $first: '$items.title' },
            quantitySold: { $sum: '$items.quantity' },
            revenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } },
          },
        },
        {
          $lookup: {
            from: 'products',
            localField: '_id',
            foreignField: '_id',
            as: 'product',
          },
        },
        {
          $unwind: {
            path: '$product',
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $lookup: {
            from: 'users',
            localField: 'product.seller',
            foreignField: '_id',
            as: 'seller',
          },
        },
        {
          $unwind: {
            path: '$seller',
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $project: {
            _id: 1,
            title: { $ifNull: ['$product.title', '$title'] },
            category: { $ifNull: ['$product.category', 'Unknown'] },
            quantitySold: 1,
            revenue: { $round: ['$revenue', 2] },
            sellerName: { $ifNull: ['$seller.name', 'Unknown Seller'] },
            averageRating: { $ifNull: ['$product.averageRating', 0] },
          },
        },
      ]);

      const sortFieldMap = {
        quantity: 'quantitySold',
        revenue: 'revenue',
        rating: 'averageRating',
      };
      const normalizedSortBy = sortFieldMap[sortBy] || 'quantitySold';

      products.sort((a, b) => {
        if ((b[normalizedSortBy] || 0) !== (a[normalizedSortBy] || 0)) {
          return (b[normalizedSortBy] || 0) - (a[normalizedSortBy] || 0);
        }
        return (b.revenue || 0) - (a.revenue || 0);
      });

      const result = products.slice(0, parsedLimit);

      logger.info('Top products calculated', {
        dateRange,
        limit: parsedLimit,
        sortBy,
        count: result.length,
      });

      return result;
    } catch (error) {
      logger.error('Error calculating top products', {
        error: error.message,
        dateRange,
      });
      throw error;
    }
  }

  /**
   * Get category breakdown (placeholder for future implementation)
   * @param {Object} dateRange - Date range for filtering
   * @returns {Promise<Array>} Category breakdown
   */
  async getCategoryBreakdown(dateRange) {
    try {
      const { startDate, endDate } = dateRange || {};

      if (!startDate || !endDate) {
        throw new Error('Date range with startDate and endDate is required');
      }

      if (new Date(startDate) > new Date(endDate)) {
        throw new Error('startDate must be before endDate');
      }

      const dateFilter = {
        createdAt: {
          $gte: new Date(startDate),
          $lte: new Date(endDate),
        },
        status: 'completed',
      };

      const categories = await Order.aggregate([
        { $match: dateFilter },
        { $unwind: '$items' },
        {
          $lookup: {
            from: 'products',
            localField: 'items.product',
            foreignField: '_id',
            as: 'product',
          },
        },
        {
          $unwind: {
            path: '$product',
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $group: {
            _id: { $ifNull: ['$product.category', 'Unknown'] },
            revenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } },
            salesVolume: { $sum: '$items.quantity' },
            sellers: { $addToSet: '$seller' },
          },
        },
        {
          $project: {
            _id: 0,
            category: '$_id',
            revenue: { $round: ['$revenue', 2] },
            salesVolume: 1,
            avgOrderValue: {
              $cond: [
                { $gt: ['$salesVolume', 0] },
                { $round: [{ $divide: ['$revenue', '$salesVolume'] }, 2] },
                0,
              ],
            },
            activeSellers: {
              $size: {
                $filter: {
                  input: '$sellers',
                  as: 'sellerId',
                  cond: { $ne: ['$$sellerId', null] },
                },
              },
            },
          },
        },
        { $sort: { revenue: -1, salesVolume: -1, category: 1 } },
      ]);

      const totalRevenue = categories.reduce((sum, item) => sum + (item.revenue || 0), 0);
      const result = categories.map((item) => ({
        ...item,
        percentOfTotal: totalRevenue > 0
          ? parseFloat(((item.revenue / totalRevenue) * 100).toFixed(2))
          : 0,
      }));

      logger.info('Category breakdown calculated', {
        dateRange,
        count: result.length,
      });

      return result;
    } catch (error) {
      logger.error('Error calculating category breakdown', {
        error: error.message,
        dateRange,
      });
      throw error;
    }
  }

  /**
   * Get sales trends aggregated by time period (daily, weekly, or monthly)
   * 
   * @param {Object} dateRange - Date range for filtering
   * @param {Date} dateRange.startDate - Start date (inclusive)
   * @param {Date} dateRange.endDate - End date (inclusive)
   * @param {string} granularity - Granularity level: 'daily', 'weekly', or 'monthly'
   * @returns {Promise<Array>} Sales trends array
   * 
   * @example
   * // Daily trends
   * const dailyTrends = await reportGenerator.getSalesTrends(
   *   { startDate: new Date('2024-01-01'), endDate: new Date('2024-01-31') },
   *   'daily'
   * );
   * // Returns: [
   * //   { date: Date, revenue: 5000, salesVolume: 10, avgOrderValue: 500, transactions: 10 },
   * //   ...
   * // ]
   * 
   * // Weekly trends
   * const weeklyTrends = await reportGenerator.getSalesTrends(
   *   { startDate: new Date('2024-01-01'), endDate: new Date('2024-01-31') },
   *   'weekly'
   * );
   * // Returns: [
   * //   { weekStart: Date, revenue: 35000, salesVolume: 70, avgOrderValue: 500, weekOverWeekChange: 5.5 },
   * //   ...
   * // ]
   * 
   * // Monthly trends
   * const monthlyTrends = await reportGenerator.getSalesTrends(
   *   { startDate: new Date('2024-01-01'), endDate: new Date('2024-12-31') },
   *   'monthly'
   * );
   * // Returns: [
   * //   { month: '2024-01', revenue: 150000, salesVolume: 300, avgOrderValue: 500, monthOverMonthChange: 10 },
   * //   ...
   * // ]
   */
  async getSalesTrends(dateRange, granularity = 'daily') {
    try {
      const { startDate, endDate } = dateRange;

      // Validate date range
      if (!startDate || !endDate) {
        throw new Error('Date range with startDate and endDate is required');
      }

      if (startDate > endDate) {
        throw new Error('startDate must be before endDate');
      }

      // Validate granularity
      const validGranularities = ['daily', 'weekly', 'monthly'];
      if (!validGranularities.includes(granularity)) {
        throw new Error(`Granularity must be one of: ${validGranularities.join(', ')}`);
      }

      // Build date filter
      const dateFilter = {
        createdAt: {
          $gte: new Date(startDate),
          $lte: new Date(endDate),
        },
        status: 'completed', // Only include completed orders
      };

      let pipeline;

      if (granularity === 'daily') {
        pipeline = [
          { $match: dateFilter },
          {
            $group: {
              _id: {
                $dateToString: { format: '%Y-%m-%d', date: '$createdAt' },
              },
              revenue: { $sum: '$total' },
              salesVolume: { $sum: 1 },
              totalAmount: { $sum: '$total' },
              transactions: { $sum: 1 },
            },
          },
          {
            $sort: { _id: 1 },
          },
          {
            $project: {
              _id: 0,
              date: {
                $dateFromString: { dateString: '$_id' },
              },
              revenue: 1,
              salesVolume: 1,
              avgOrderValue: {
                $cond: [
                  { $gt: ['$transactions', 0] },
                  { $round: [{ $divide: ['$revenue', '$transactions'] }, 2] },
                  0,
                ],
              },
              transactions: 1,
            },
          },
        ];
      } else if (granularity === 'weekly') {
        pipeline = [
          { $match: dateFilter },
          {
            $group: {
              _id: {
                $dateToString: {
                  format: '%Y-%m-%d',
                  date: {
                    $dateSubtract: {
                      startDate: '$createdAt',
                      unit: 'day',
                      amount: {
                        $cond: [
                          { $eq: [{ $dayOfWeek: '$createdAt' }, 1] },
                          0,
                          { $subtract: [{ $dayOfWeek: '$createdAt' }, 1] },
                        ],
                      },
                    },
                  },
                },
              },
              revenue: { $sum: '$total' },
              salesVolume: { $sum: 1 },
              totalAmount: { $sum: '$total' },
              transactions: { $sum: 1 },
            },
          },
          {
            $sort: { _id: 1 },
          },
          {
            $project: {
              _id: 0,
              weekStart: {
                $dateFromString: { dateString: '$_id' },
              },
              revenue: 1,
              salesVolume: 1,
              avgOrderValue: {
                $cond: [
                  { $gt: ['$transactions', 0] },
                  { $round: [{ $divide: ['$revenue', '$transactions'] }, 2] },
                  0,
                ],
              },
              transactions: 1,
            },
          },
        ];

        // Add week-over-week change calculation
        const weeklyData = await Order.aggregate(pipeline);
        
        // Calculate week-over-week changes
        const result = weeklyData.map((week, index) => {
          let weekOverWeekChange = 0;
          if (index > 0) {
            const prevWeek = weeklyData[index - 1];
            if (prevWeek.revenue > 0) {
              weekOverWeekChange = parseFloat(
                (((week.revenue - prevWeek.revenue) / prevWeek.revenue) * 100).toFixed(2)
              );
            } else {
              weekOverWeekChange = week.revenue > 0 ? 100 : 0;
            }
          }
          return {
            ...week,
            weekOverWeekChange,
          };
        });

        logger.info('Weekly sales trends calculated', {
          dateRange,
          count: result.length,
        });

        return result;
      } else if (granularity === 'monthly') {
        pipeline = [
          { $match: dateFilter },
          {
            $group: {
              _id: {
                $dateToString: { format: '%Y-%m', date: '$createdAt' },
              },
              revenue: { $sum: '$total' },
              salesVolume: { $sum: 1 },
              totalAmount: { $sum: '$total' },
              transactions: { $sum: 1 },
            },
          },
          {
            $sort: { _id: 1 },
          },
          {
            $project: {
              _id: 0,
              month: '$_id',
              revenue: 1,
              salesVolume: 1,
              avgOrderValue: {
                $cond: [
                  { $gt: ['$transactions', 0] },
                  { $round: [{ $divide: ['$revenue', '$transactions'] }, 2] },
                  0,
                ],
              },
              transactions: 1,
            },
          },
        ];

        // Add month-over-month change calculation
        const monthlyData = await Order.aggregate(pipeline);
        
        // Calculate month-over-month changes
        const result = monthlyData.map((month, index) => {
          let monthOverMonthChange = 0;
          if (index > 0) {
            const prevMonth = monthlyData[index - 1];
            if (prevMonth.revenue > 0) {
              monthOverMonthChange = parseFloat(
                (((month.revenue - prevMonth.revenue) / prevMonth.revenue) * 100).toFixed(2)
              );
            } else {
              monthOverMonthChange = month.revenue > 0 ? 100 : 0;
            }
          }
          return {
            ...month,
            monthOverMonthChange,
          };
        });

        logger.info('Monthly sales trends calculated', {
          dateRange,
          count: result.length,
        });

        return result;
      }

      // Execute aggregation pipeline for daily trends
      const trends = await Order.aggregate(pipeline);

      logger.info('Daily sales trends calculated', {
        dateRange,
        granularity,
        count: trends.length,
      });

      return trends;
    } catch (error) {
      logger.error('Error calculating sales trends', {
        error: error.message,
        dateRange,
        granularity,
      });
      throw error;
    }
  }

  /**
   * Get seller rankings based on sales metrics within a date range
   * 
   * @param {Object} dateRange - Date range for filtering
   * @param {Date} dateRange.startDate - Start date (inclusive)
   * @param {Date} dateRange.endDate - End date (inclusive)
   * @param {string} sortBy - Metric to sort by: 'revenue', 'orders', 'rating', 'avgOrderValue'
   * @param {number} limit - Maximum number of sellers to return
   * @returns {Promise<Array<Object>>} List of seller rankings
   */
  async getSellerRankings(dateRange, sortBy = 'revenue', limit = 50) {
    try {
      const { startDate, endDate } = dateRange || {};

      // Validate date range
      if (!startDate || !endDate) {
        throw new Error('Date range with startDate and endDate is required');
      }

      if (startDate > endDate) {
        throw new Error('startDate must be before endDate');
      }

      const dateFilter = {
        createdAt: {
          $gte: new Date(startDate),
          $lte: new Date(endDate),
        },
        status: 'completed', // Only completed orders
      };

      // Aggregate completed orders by seller
      const sellerStats = await Order.aggregate([
        { $match: dateFilter },
        {
          $group: {
            _id: '$seller',
            totalRevenue: { $sum: '$total' },
            completedOrders: { $sum: 1 },
          },
        },
      ]);

      if (sellerStats.length === 0) {
        logger.info('No seller rankings found for the given date range', { dateRange });
        return [];
      }

      // Fetch user details for these sellers
      const sellerIds = sellerStats.map(stat => stat._id).filter(Boolean);
      const users = await User.find({ _id: { $in: sellerIds } }).lean();
      const userMap = {};
      users.forEach(user => {
        userMap[user._id.toString()] = user;
      });

      // Fetch product counts for these sellers
      const products = await Product.find({ seller: { $in: sellerIds } }).lean();
      const productMap = {};
      products.forEach(product => {
        if (product.seller) {
          const sellerStr = product.seller.toString();
          if (!productMap[sellerStr]) {
            productMap[sellerStr] = [];
          }
          productMap[sellerStr].push(product);
        }
      });

      // Map combined data
      const rankings = sellerStats.map(stat => {
        const sellerIdStr = stat._id ? stat._id.toString() : '';
        const user = userMap[sellerIdStr] || {};
        const sellerProducts = productMap[sellerIdStr] || [];

        const totalRevenue = stat.totalRevenue;
        const completedOrders = stat.completedOrders;
        const avgOrderValue = completedOrders > 0 ? totalRevenue / completedOrders : 0;

        const activeProductsCount = sellerProducts.filter(
          p => p.isActive !== false && p.isSold !== true
        ).length;

        return {
          sellerId: sellerIdStr,
          sellerName: user.name || 'Unknown Seller',
          totalRevenue,
          completedOrders,
          avgOrderValue,
          avgRating: user.averageRating !== undefined ? user.averageRating : 0,
          productsListed: sellerProducts.length,
          activeProducts: activeProductsCount,
          verificationStatus: user.sellerVerificationStatus || 'none',
        };
      });

      // Sort
      const sortFieldMap = {
        revenue: 'totalRevenue',
        orders: 'completedOrders',
        rating: 'avgRating',
        aov: 'avgOrderValue',
        avgOrderValue: 'avgOrderValue',
      };
      const sortField = sortFieldMap[sortBy] || 'totalRevenue';

      rankings.sort((a, b) => {
        if (b[sortField] !== a[sortField]) {
          return b[sortField] - a[sortField];
        }
        return a.sellerId.localeCompare(b.sellerId);
      });

      // Limit
      const result = rankings.slice(0, limit);

      logger.info('Seller rankings calculated', {
        dateRange,
        sortBy,
        limit,
        count: result.length,
      });

      return result;
    } catch (error) {
      logger.error('Error calculating seller rankings', {
        error: error.message,
        dateRange,
        sortBy,
        limit,
      });
      throw error;
    }
  }

  /**
   * Get transaction metrics including average, median, min, max, standard deviation, and distribution
   * 
   * @param {Object} dateRange - Date range for filtering
   * @param {Date} dateRange.startDate - Start date (inclusive)
   * @param {Date} dateRange.endDate - End date (inclusive)
   * @param {string} category - Category filter (optional)
   * @returns {Promise<Object>} Transaction metrics object
   * 
   * @example
   * const metrics = await reportGenerator.getTransactionMetrics({
   *   startDate: new Date('2024-01-01'),
   *   endDate: new Date('2024-01-31')
   * });
   * // Returns:
   * // {
   * //   avgOrderValue: 1500.50,
   * //   medianOrderValue: 1200,
   * //   minOrderValue: 100,
   * //   maxOrderValue: 5000,
   * //   stdDeviation: 850.25,
   * //   totalTransactions: 150,
   * //   totalRevenue: 225075,
   * //   distribution: {
   * //     '0-500': 20,
   * //     '501-1000': 35,
   * //     '1001-2500': 60,
   * //     '2501-5000': 30,
   * //     '5001-10000': 5,
   * //     '10001+': 0
   * //   }
   * // }
   */
  async getTransactionMetrics(dateRange, category = null) {
    try {
      const { startDate, endDate } = dateRange;

      // Validate date range
      if (!startDate || !endDate) {
        throw new Error('Date range with startDate and endDate is required');
      }

      if (startDate > endDate) {
        throw new Error('startDate must be before endDate');
      }

      // Build date filter
      const dateFilter = {
        createdAt: {
          $gte: new Date(startDate),
          $lte: new Date(endDate),
        },
        status: 'completed', // Only include completed orders
      };

      // If category filter is provided, we need to filter by product category
      let orders;
      if (category) {
        // Need to populate items.product to access category
        orders = await Order.find(dateFilter)
          .populate('items.product', 'category')
          .lean();

        // Filter orders that contain at least one product from the specified category
        orders = orders.filter(order => 
          order.items.some(item => 
            item.product && item.product.category === category
          )
        );
      } else {
        // No category filter, get all completed orders
        orders = await Order.find(dateFilter).lean();
      }

      // Extract order totals
      const orderTotals = orders.map(order => order.total);
      const totalTransactions = orderTotals.length;

      // Handle empty dataset
      if (totalTransactions === 0) {
        return {
          avgOrderValue: 0,
          medianOrderValue: 0,
          minOrderValue: 0,
          maxOrderValue: 0,
          stdDeviation: 0,
          totalTransactions: 0,
          totalRevenue: 0,
          distribution: {
            '0-500': 0,
            '501-1000': 0,
            '1001-2500': 0,
            '2501-5000': 0,
            '5001-10000': 0,
            '10001+': 0,
          },
        };
      }

      // Calculate total revenue
      const totalRevenue = orderTotals.reduce((sum, total) => sum + total, 0);

      // Calculate average order value
      const avgOrderValue = parseFloat((totalRevenue / totalTransactions).toFixed(2));

      // Calculate median order value
      const sortedTotals = [...orderTotals].sort((a, b) => a - b);
      let medianOrderValue;
      if (totalTransactions % 2 === 0) {
        // Even number of orders: average of two middle values
        const mid1 = sortedTotals[totalTransactions / 2 - 1];
        const mid2 = sortedTotals[totalTransactions / 2];
        medianOrderValue = parseFloat(((mid1 + mid2) / 2).toFixed(2));
      } else {
        // Odd number of orders: middle value
        medianOrderValue = sortedTotals[Math.floor(totalTransactions / 2)];
      }

      // Calculate min and max
      const minOrderValue = Math.min(...orderTotals);
      const maxOrderValue = Math.max(...orderTotals);

      // Calculate standard deviation
      const mean = totalRevenue / totalTransactions;
      const squaredDifferences = orderTotals.map(total => Math.pow(total - mean, 2));
      const variance = squaredDifferences.reduce((sum, diff) => sum + diff, 0) / totalTransactions;
      const stdDeviation = parseFloat(Math.sqrt(variance).toFixed(2));

      // Calculate distribution across price ranges
      const distribution = {
        '0-500': 0,
        '501-1000': 0,
        '1001-2500': 0,
        '2501-5000': 0,
        '5001-10000': 0,
        '10001+': 0,
      };

      orderTotals.forEach(total => {
        if (total <= 500) {
          distribution['0-500']++;
        } else if (total <= 1000) {
          distribution['501-1000']++;
        } else if (total <= 2500) {
          distribution['1001-2500']++;
        } else if (total <= 5000) {
          distribution['2501-5000']++;
        } else if (total <= 10000) {
          distribution['5001-10000']++;
        } else {
          distribution['10001+']++;
        }
      });

      const result = {
        avgOrderValue,
        medianOrderValue,
        minOrderValue,
        maxOrderValue,
        stdDeviation,
        totalTransactions,
        totalRevenue,
        distribution,
      };

      logger.info('Transaction metrics calculated', {
        dateRange,
        category,
        metrics: result,
      });

      return result;
    } catch (error) {
      logger.error('Error calculating transaction metrics', {
        error: error.message,
        dateRange,
        category,
      });
      throw error;
    }
  }

  /**
   * Compare metrics across two periods for period-over-period analysis
   * 
   * @param {Date} period1Start - Period 1 start date (inclusive)
   * @param {Date} period1End - Period 1 end date (inclusive)
   * @param {Date} period2Start - Period 2 start date (inclusive)
   * @param {Date} period2End - Period 2 end date (inclusive)
   * @returns {Promise<Object>} Comparison results with metrics and changes
   * 
   * @example
   * const comparison = await reportGenerator.comparePeriods(
   *   new Date('2024-01-01'), new Date('2024-01-31'),
   *   new Date('2024-02-01'), new Date('2024-02-29')
   * );
   * // Returns:
   * // {
   * //   metrics: {
   * //     revenue: { period1: 50000, period2: 55000 },
   * //     salesVolume: { period1: 100, period2: 110 },
   * //     avgOrderValue: { period1: 500, period2: 500 },
   * //     successRate: { period1: 95, period2: 96 },
   * //     activeSellers: { period1: 25, period2: 28 }
   * //   },
   * //   comparison: {
   * //     revenue: { absolute: 5000, percentage: 10 },
   * //     salesVolume: { absolute: 10, percentage: 10 },
   * //     avgOrderValue: { absolute: 0, percentage: 0 },
   * //     successRate: { absolute: 1, percentage: 1.05 },
   * //     activeSellers: { absolute: 3, percentage: 12 }
   * //   }
   * // }
   */
  async comparePeriods(period1Start, period1End, period2Start, period2End) {
    try {
      // Validate date parameters
      if (!period1Start || !period1End || !period2Start || !period2End) {
        throw new Error('All date parameters (period1Start, period1End, period2Start, period2End) are required');
      }

      // Convert to Date objects if needed
      const p1Start = new Date(period1Start);
      const p1End = new Date(period1End);
      const p2Start = new Date(period2Start);
      const p2End = new Date(period2End);

      // Validate date ranges
      if (p1Start > p1End) {
        throw new Error('period1Start must be before period1End');
      }
      if (p2Start > p2End) {
        throw new Error('period2Start must be before period2End');
      }

      // Calculate metrics for both periods using aggregation pipeline
      const comparisonData = await Order.aggregate([
        {
          $facet: {
            // Period 1 metrics
            period1: [
              {
                $match: {
                  createdAt: {
                    $gte: p1Start,
                    $lte: p1End,
                  },
                },
              },
              {
                $group: {
                  _id: null,
                  totalRevenue: {
                    $sum: { $cond: [{ $eq: ['$status', 'completed'] }, '$total', 0] },
                  },
                  completedOrders: {
                    $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] },
                  },
                  totalOrders: { $sum: 1 },
                  uniqueSellers: {
                    $addToSet: { $cond: [{ $eq: ['$status', 'completed'] }, '$seller', null] },
                  },
                },
              },
            ],
            // Period 2 metrics
            period2: [
              {
                $match: {
                  createdAt: {
                    $gte: p2Start,
                    $lte: p2End,
                  },
                },
              },
              {
                $group: {
                  _id: null,
                  totalRevenue: {
                    $sum: { $cond: [{ $eq: ['$status', 'completed'] }, '$total', 0] },
                  },
                  completedOrders: {
                    $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] },
                  },
                  totalOrders: { $sum: 1 },
                  uniqueSellers: {
                    $addToSet: { $cond: [{ $eq: ['$status', 'completed'] }, '$seller', null] },
                  },
                },
              },
            ],
          },
        },
      ]);

      // Extract period data
      const period1Data = comparisonData[0].period1[0] || {
        totalRevenue: 0,
        completedOrders: 0,
        totalOrders: 0,
        uniqueSellers: [],
      };

      const period2Data = comparisonData[0].period2[0] || {
        totalRevenue: 0,
        completedOrders: 0,
        totalOrders: 0,
        uniqueSellers: [],
      };

      // Calculate metrics for period 1
      const p1Revenue = period1Data.totalRevenue || 0;
      const p1SalesVolume = period1Data.completedOrders || 0;
      const p1AvgOrderValue = p1SalesVolume > 0 ? parseFloat((p1Revenue / p1SalesVolume).toFixed(2)) : 0;
      const p1SuccessRate = period1Data.totalOrders > 0
        ? parseFloat(((p1SalesVolume / period1Data.totalOrders) * 100).toFixed(2))
        : 0;
      const p1ActiveSellers = period1Data.uniqueSellers.filter(s => s !== null).length;

      // Calculate metrics for period 2
      const p2Revenue = period2Data.totalRevenue || 0;
      const p2SalesVolume = period2Data.completedOrders || 0;
      const p2AvgOrderValue = p2SalesVolume > 0 ? parseFloat((p2Revenue / p2SalesVolume).toFixed(2)) : 0;
      const p2SuccessRate = period2Data.totalOrders > 0
        ? parseFloat(((p2SalesVolume / period2Data.totalOrders) * 100).toFixed(2))
        : 0;
      const p2ActiveSellers = period2Data.uniqueSellers.filter(s => s !== null).length;

      // Calculate absolute and percentage changes
      const calculateChange = (period1Value, period2Value) => {
        const absolute = parseFloat((period2Value - period1Value).toFixed(2));
        // Avoid division by zero for percentage calculation
        const percentage = period1Value !== 0
          ? parseFloat(((absolute / period1Value) * 100).toFixed(2))
          : (period2Value !== 0 ? 100 : 0);
        return { absolute, percentage };
      };

      const result = {
        metrics: {
          revenue: {
            period1: p1Revenue,
            period2: p2Revenue,
          },
          salesVolume: {
            period1: p1SalesVolume,
            period2: p2SalesVolume,
          },
          avgOrderValue: {
            period1: p1AvgOrderValue,
            period2: p2AvgOrderValue,
          },
          successRate: {
            period1: p1SuccessRate,
            period2: p2SuccessRate,
          },
          activeSellers: {
            period1: p1ActiveSellers,
            period2: p2ActiveSellers,
          },
        },
        comparison: {
          revenue: calculateChange(p1Revenue, p2Revenue),
          salesVolume: calculateChange(p1SalesVolume, p2SalesVolume),
          avgOrderValue: calculateChange(p1AvgOrderValue, p2AvgOrderValue),
          successRate: calculateChange(p1SuccessRate, p2SuccessRate),
          activeSellers: calculateChange(p1ActiveSellers, p2ActiveSellers),
        },
      };

      logger.info('Period comparison calculated', {
        period1: { start: p1Start, end: p1End },
        period2: { start: p2Start, end: p2End },
        result,
      });

      return result;
    } catch (error) {
      logger.error('Error comparing periods', {
        error: error.message,
        period1: { start: period1Start, end: period1End },
        period2: { start: period2Start, end: period2End },
      });
      throw error;
    }
  }

  /**
   * Get sales metrics for a date range
   * @param {Object} dateRange - Date range for filtering
   * @returns {Promise<Object>} Sales metrics
   */
  async getSalesMetrics(dateRange) {
    try {
      const { startDate, endDate } = dateRange;

      if (!startDate || !endDate) {
        throw new Error('Date range with startDate and endDate is required');
      }

      const dateFilter = {
        createdAt: {
          $gte: new Date(startDate),
          $lte: new Date(endDate),
        },
      };

      const metrics = await Order.aggregate([
        { $match: dateFilter },
        {
          $group: {
            _id: null,
            totalRevenue: {
              $sum: { $cond: [{ $eq: ['$status', 'completed'] }, '$total', 0] },
            },
            totalOrders: {
              $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] },
            },
            totalAttempts: { $sum: 1 },
            activeSellersRaw: {
              $addToSet: { $cond: [{ $eq: ['$status', 'completed'] }, '$seller', null] },
            },
          },
        },
        {
          $project: {
            _id: 0,
            totalRevenue: 1,
            totalOrders: 1,
            totalAttempts: 1,
            avgOrderValue: {
              $cond: [
                { $gt: ['$totalOrders', 0] },
                { $round: [{ $divide: ['$totalRevenue', '$totalOrders'] }, 2] },
                0,
              ],
            },
            activeSellers: {
              $size: {
                $filter: {
                  input: '$activeSellersRaw',
                  as: 'sellerId',
                  cond: { $ne: ['$$sellerId', null] },
                },
              },
            },
            weekOverWeekChange: { $literal: 0 },
          },
        },
      ]);

      return metrics[0] || {
        totalRevenue: 0,
        totalOrders: 0,
        totalAttempts: 0,
        avgOrderValue: 0,
        activeSellers: 0,
        weekOverWeekChange: 0,
      };
    } catch (error) {
      logger.error('Error calculating sales metrics', {
        error: error.message,
        dateRange,
      });
      throw error;
    }
  }

  /**
   * Get top sellers for a date range
   * @param {Object} dateRange - Date range for filtering
   * @param {number} limit - Number of sellers to return
   * @returns {Promise<Array>} Top sellers
   */
  async getTopSellers(dateRange, limit = 5) {
    try {
      const { startDate, endDate } = dateRange;

      if (!startDate || !endDate) {
        throw new Error('Date range with startDate and endDate is required');
      }

      const dateFilter = {
        createdAt: {
          $gte: new Date(startDate),
          $lte: new Date(endDate),
        },
        status: 'completed',
      };

      const sellers = await Order.aggregate([
        { $match: dateFilter },
        {
          $group: {
            _id: '$seller',
            totalRevenue: { $sum: '$total' },
            completedOrders: { $sum: 1 },
            sellerName: { $first: '$sellerName' },
          },
        },
        { $sort: { totalRevenue: -1 } },
        { $limit: limit },
        {
          $project: {
            _id: 0,
            sellerId: '$_id',
            sellerName: 1,
            totalRevenue: 1,
            completedOrders: 1,
            revenue: '$totalRevenue',
            orders: '$completedOrders',
          },
        },
      ]);

      return sellers;
    } catch (error) {
      logger.error('Error calculating top sellers', {
        error: error.message,
        dateRange,
      });
      throw error;
    }
  }
}

// Export singleton instance
module.exports = new ReportGeneratorService();
