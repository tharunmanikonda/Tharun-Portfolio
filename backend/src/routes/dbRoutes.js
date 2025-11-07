const express = require('express');
const router = express.Router();

// Mock database with sample data
const createMockData = () => {
  const users = Array.from({ length: 100 }, (_, i) => ({
    id: i + 1,
    name: `User ${i + 1}`,
    email: `user${i + 1}@example.com`,
    createdAt: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000)
  }));

  const orders = Array.from({ length: 500 }, (_, i) => ({
    id: i + 1,
    userId: Math.floor(Math.random() * 100) + 1,
    product: `Product ${Math.floor(Math.random() * 50) + 1}`,
    amount: Math.floor(Math.random() * 1000) + 10,
    createdAt: new Date(Date.now() - Math.random() * 180 * 24 * 60 * 60 * 1000)
  }));

  return { users, orders };
};

const { users, orders } = createMockData();

// N+1 Query Problem Demo - Inefficient approach
router.get('/n-plus-one/inefficient', (req, res) => {
  const startTime = Date.now();
  const queryLogs = [];

  // First query: Get all users
  queryLogs.push({
    query: 'SELECT * FROM users LIMIT 10',
    executionTime: 15,
    timestamp: Date.now()
  });

  const selectedUsers = users.slice(0, 10);

  // N additional queries: Get orders for each user (N+1 problem!)
  const usersWithOrders = selectedUsers.map(user => {
    const userOrders = orders.filter(order => order.userId === user.id);
    queryLogs.push({
      query: `SELECT * FROM orders WHERE userId = ${user.id}`,
      executionTime: Math.floor(Math.random() * 20) + 10,
      timestamp: Date.now()
    });
    return { ...user, orders: userOrders };
  });

  const totalTime = Date.now() - startTime;

  res.json({
    approach: 'N+1 Queries (Inefficient)',
    data: usersWithOrders,
    performance: {
      totalQueries: queryLogs.length,
      totalExecutionTime: `${totalTime}ms`,
      averageQueryTime: `${(queryLogs.reduce((sum, log) => sum + log.executionTime, 0) / queryLogs.length).toFixed(2)}ms`,
      problem: 'Executed 1 query for users + N queries for orders = 11 total queries'
    },
    queryLogs
  });
});

// Optimized approach - Single JOIN query
router.get('/n-plus-one/optimized', (req, res) => {
  const startTime = Date.now();
  const queryLogs = [];

  // Single optimized query with aggregation
  queryLogs.push({
    query: `
      SELECT users.*,
             JSON_AGG(orders.*) as orders
      FROM users
      LEFT JOIN orders ON users.id = orders.userId
      WHERE users.id <= 10
      GROUP BY users.id
    `,
    executionTime: 25,
    timestamp: Date.now()
  });

  // Simulate the optimized result
  const selectedUsers = users.slice(0, 10);
  const usersWithOrders = selectedUsers.map(user => ({
    ...user,
    orders: orders.filter(order => order.userId === user.id)
  }));

  const totalTime = Date.now() - startTime;

  res.json({
    approach: 'Optimized JOIN Query',
    data: usersWithOrders,
    performance: {
      totalQueries: queryLogs.length,
      totalExecutionTime: `${totalTime}ms`,
      averageQueryTime: `${queryLogs[0].executionTime}ms`,
      improvement: '82% faster - Single query instead of 11 queries'
    },
    queryLogs
  });
});

// Index comparison demo
router.get('/index-comparison', (req, res) => {
  const searchEmail = req.query.email || 'user50@example.com';

  // Without index (full table scan)
  const withoutIndexTime = 145;
  const withoutIndexResult = {
    approach: 'Without Index (Full Table Scan)',
    query: `SELECT * FROM users WHERE email = '${searchEmail}'`,
    executionTime: `${withoutIndexTime}ms`,
    rowsScanned: users.length,
    method: 'FULL TABLE SCAN'
  };

  // With index (index seek)
  const withIndexTime = 8;
  const withIndexResult = {
    approach: 'With Index on email column',
    query: `SELECT * FROM users WHERE email = '${searchEmail}' /* INDEX: idx_users_email */`,
    executionTime: `${withIndexTime}ms`,
    rowsScanned: 1,
    method: 'INDEX SEEK'
  };

  res.json({
    searchedEmail: searchEmail,
    withoutIndex: withoutIndexResult,
    withIndex: withIndexResult,
    improvement: {
      percentFaster: `${(((withoutIndexTime - withIndexTime) / withoutIndexTime) * 100).toFixed(1)}%`,
      timeSaved: `${withoutIndexTime - withIndexTime}ms`,
      recommendation: 'CREATE INDEX idx_users_email ON users(email)'
    }
  });
});

// Aggregation pipeline demo
router.get('/aggregation', (req, res) => {
  const startTime = Date.now();

  // Simulate MongoDB aggregation pipeline
  const pipeline = [
    { $match: { amount: { $gte: 100 } } },
    { $group: {
      _id: '$userId',
      totalSpent: { $sum: '$amount' },
      orderCount: { $sum: 1 }
    }},
    { $sort: { totalSpent: -1 } },
    { $limit: 10 }
  ];

  // Execute aggregation
  const highValueOrders = orders.filter(order => order.amount >= 100);
  const aggregated = Object.values(
    highValueOrders.reduce((acc, order) => {
      if (!acc[order.userId]) {
        acc[order.userId] = {
          userId: order.userId,
          totalSpent: 0,
          orderCount: 0
        };
      }
      acc[order.userId].totalSpent += order.amount;
      acc[order.userId].orderCount += 1;
      return acc;
    }, {})
  )
  .sort((a, b) => b.totalSpent - a.totalSpent)
  .slice(0, 10);

  const executionTime = Date.now() - startTime;

  res.json({
    title: 'MongoDB Aggregation Pipeline',
    pipeline,
    results: aggregated,
    performance: {
      executionTime: `${executionTime}ms`,
      documentsProcessed: orders.length,
      resultsReturned: aggregated.length
    }
  });
});

module.exports = router;
