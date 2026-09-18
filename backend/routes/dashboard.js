const express = require('express');
const db = require('../config/db');
const router = express.Router();

router.get('/stats', async (req, res) => {
  try {
    const [policies] = await db.execute('SELECT COUNT(*) AS totalPolicies FROM policies');
    const [premium] = await db.execute('SELECT COALESCE(SUM(premium_amount),0) AS totalPremium FROM policies');
    const [agents] = await db.execute('SELECT COUNT(*) AS activeAgents FROM agents WHERE status = "active"');
    const [renewals] = await db.execute('SELECT COUNT(*) AS pendingRenewals FROM policies WHERE status = "pending"');
    res.json({ totalPolicies: policies[0].totalPolicies, totalPremium: premium[0].totalPremium, activeAgents: agents[0].activeAgents, pendingRenewals: renewals[0].pendingRenewals });
  } catch (error) {
    res.status(500).json({ message: 'Stats failed' });
  }
});

router.get('/charts', async (req, res) => {
  try {
    const [monthlyPolicies] = await db.execute('SELECT MONTHNAME(created_at) AS month, COUNT(*) AS count FROM policies GROUP BY MONTH(created_at) ORDER BY MONTH(created_at)');
    const [policyType] = await db.execute('SELECT policy_type AS label, COUNT(*) AS value FROM policies GROUP BY policy_type');
    const [revenue] = await db.execute('SELECT MONTHNAME(created_at) AS month, SUM(premium_amount) AS value FROM policies GROUP BY MONTH(created_at) ORDER BY MONTH(created_at)');
    const [agentSales] = await db.execute('SELECT a.agent_name AS label, COUNT(ap.id) AS value FROM agents a LEFT JOIN agent_policies ap ON a.id = ap.agent_id GROUP BY a.id');
    res.json({
      monthlyPolicies: { labels: monthlyPolicies.map(item => item.month), values: monthlyPolicies.map(item => item.count) },
      policyType: { labels: policyType.map(item => item.label), values: policyType.map(item => item.value) },
      revenue: { labels: revenue.map(item => item.month), values: revenue.map(item => item.value) },
      agentSales: { labels: agentSales.map(item => item.label), values: agentSales.map(item => item.value) },
    });
  } catch (error) {
    res.status(500).json({ message: 'Charts failed' });
  }
});

module.exports = router;
