/**
 * Reports Module
 * 
 * Handles all sales and revenue reporting functionality including:
 * - Report generation (dashboard, top products, categories, trends, sellers, payments, transactions)
 * - PDF export with chart rendering
 * - Email delivery and scheduling
 * - Audit logging
 * - Monitoring and alerting
 * 
 * Phases: 1-5 (Backend Infrastructure, Report Generation, Export/Delivery, API Endpoints, Monitoring)
 */

const reportsRouter = require('./reports.route');

module.exports = {
  router: reportsRouter,
};
