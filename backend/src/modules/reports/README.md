# Reports Module

Comprehensive sales and revenue reporting system for Campus Mitra administrators.

## Overview

The Reports module provides real-time business intelligence through:
- **Dashboard Metrics**: Revenue, sales volume, AOV, active sellers
- **Detailed Reports**: Top products, categories, trends, sellers, payments, transactions
- **Period Comparison**: Compare metrics across different time periods
- **PDF Export**: Generate downloadable PDF reports with charts
- **Email Delivery**: Automated weekly email summaries
- **Audit Logging**: Track all report access and exports
- **Monitoring & Alerting**: Monitor performance and detect anomalies

## Architecture

```
reports/
├── controllers/
│   └── reports.controller.js       # API endpoint handlers
├── services/
│   ├── ReportGeneratorService.js   # Core report generation logic
│   ├── CacheManager.js             # Redis caching layer
│   ├── PDFExportService.js         # PDF generation with Puppeteer
│   ├── EmailDeliveryService.js     # Email sending with retry logic
│   ├── EmailSchedulerService.js    # Weekly email scheduling
│   ├── AuditLogService.js          # Audit logging
│   ├── MonitoringService.js        # Performance monitoring
│   └── AlertingService.js          # Alert notifications
├── middleware/
│   └── (audit logging middleware)
├── models/
│   └── (EmailPreference, ReportAuditLog models)
├── utils/
│   └── (helper functions)
├── docs/
│   └── (API documentation)
├── reports.route.js                # Route definitions
├── index.js                        # Module entry point
└── README.md                       # This file
```

## API Endpoints

### Report Retrieval (Phase 4.1)

All endpoints require admin authentication and accept date range parameters.

```
GET /api/reports/dashboard              # Dashboard metrics
GET /api/reports/top-products           # Top products report
GET /api/reports/categories             # Category breakdown
GET /api/reports/trends                 # Sales trends
GET /api/reports/sellers                # Seller rankings
GET /api/reports/payments               # Payment metrics
GET /api/reports/transactions           # Transaction metrics
GET /api/reports/compare                # Period comparison
```

### Export & Preferences (Phase 4.2)

```
POST /api/reports/export-pdf            # Generate PDF report
GET /api/reports/email-preferences      # Get email preferences
PUT /api/reports/email-preferences      # Update email preferences
GET /api/reports/audit-log              # Get audit logs
```

### Monitoring & Alerting (Phase 5.2)

```
GET /api/reports/monitoring/metrics                    # Overall metrics
GET /api/reports/monitoring/report-generation          # Report generation metrics
GET /api/reports/monitoring/email-delivery             # Email delivery metrics
GET /api/reports/monitoring/cache                      # Cache statistics
GET /api/reports/monitoring/anomalies                  # Detected anomalies
GET /api/reports/monitoring/alerts                     # Alert statistics
PUT /api/reports/monitoring/alerts/channels            # Configure alert channels
POST /api/reports/monitoring/alerts/register-email     # Register admin email
DELETE /api/reports/monitoring/alerts/unregister-email # Unregister admin email
```

## Services

### ReportGeneratorService

Generates all report metrics using MongoDB aggregation pipelines.

**Methods:**
- `getDashboardMetrics(dateRange)` - Dashboard metrics (2s SLA)
- `getTopProducts(dateRange, limit, sortBy)` - Top products
- `getCategoryBreakdown(dateRange)` - Category breakdown
- `getSalesTrends(dateRange, granularity)` - Sales trends
- `getSellerRankings(dateRange, sortBy, limit)` - Seller rankings
- `getPaymentMetrics(dateRange)` - Payment metrics
- `getTransactionMetrics(dateRange, category)` - Transaction metrics
- `comparePeriods(p1Start, p1End, p2Start, p2End)` - Period comparison

### CacheManager

Redis-based caching with TTL and LRU eviction.

**Configuration:**
- TTL: 60 seconds
- Eviction: LRU (Least Recently Used)
- Invalidation: On order completion

**Methods:**
- `getOrCompute(key, computeFn, ttl)` - Get cached or compute
- `invalidateReportCache(orderId, reportTypes)` - Invalidate cache
- `warmCache(reportTypes, dateRanges)` - Pre-compute cache
- `getCacheStats()` - Cache statistics

### PDFExportService

PDF generation with chart rendering.

**Configuration:**
- Library: Puppeteer + PDFKit
- Resolution: 300 DPI
- Page Size: A4 with 1-inch margins
- Max File Size: 10 MB
- SLA: 5 seconds

**Methods:**
- `generatePDF(reportData, reportType, dateRange)` - Generate PDF
- `renderChart(chartConfig)` - Render chart as image
- `createPDFDocument(title, dateRange, metrics, charts)` - Create PDF

### EmailDeliveryService

Email sending with retry logic and queue management.

**Configuration:**
- Queue: Bull (Redis-backed)
- Retry: 3 attempts with exponential backoff (5 min, 30 min, 2 hours)
- Provider: SendGrid or AWS SES

**Methods:**
- `sendWeeklyEmail(adminEmail, reportData, options)` - Send email
- `scheduleWeeklyReport()` - Schedule weekly job
- `getEmailDeliveryStatus(jobId)` - Get delivery status

### EmailSchedulerService

Weekly email scheduling using cron.

**Configuration:**
- Schedule: Monday 9:00 AM IST
- Report Period: Last 7 days
- Timezone: Asia/Kolkata

**Methods:**
- `start()` - Start scheduler
- `stop()` - Stop scheduler
- `getStatus()` - Get scheduler status
- `triggerManually()` - Trigger job manually

### AuditLogService

Comprehensive audit logging for compliance.

**Methods:**
- `logReportAccess(params)` - Log report access
- `logPDFDownload(params)` - Log PDF download
- `logEmailDelivery(params)` - Log email delivery
- `logEmailFailure(params)` - Log email failure
- `getAuditLogs(params)` - Retrieve audit logs
- `getAuditStats(params)` - Get audit statistics

### MonitoringService

Performance monitoring and anomaly detection.

**Configuration:**
- SLA Threshold: 5 seconds
- Anomaly Threshold: 200% spike
- Metrics Retention: 24 hours

**Methods:**
- `trackReportGeneration(params)` - Track report generation
- `trackEmailDelivery(params)` - Track email delivery
- `trackCacheAccess(params)` - Track cache access
- `detectAnomalies(metricType, reportType)` - Detect anomalies
- `getReportGenerationMetrics(params)` - Get metrics
- `getEmailDeliveryMetrics(params)` - Get email metrics
- `getCacheStats()` - Get cache stats
- `exportMetrics()` - Export metrics

### AlertingService

Alert notifications for administrators.

**Configuration:**
- Channels: Email, In-App, Webhook
- Throttling: 5-minute window
- Severity: Info, Warning, Error, Critical

**Methods:**
- `sendAlert(alert)` - Send alert
- `registerAdminEmail(email)` - Register email
- `unregisterAdminEmail(email)` - Unregister email
- `setChannelEnabled(channel, enabled)` - Configure channel
- `getAlertStats()` - Get alert statistics

## Performance Characteristics

### SLA Compliance

- Dashboard reports: 2 seconds
- Detailed reports: 5 seconds
- PDF export: 5 seconds
- API response: 2 seconds (with cache)

### Caching

- Cache TTL: 60 seconds
- Cache hit rate target: 80%+
- LRU eviction policy

### Database Optimization

- Aggregation pipelines for server-side computation
- Compound indexes for efficient querying
- Lean queries for audit logs
- Pagination support for large result sets

## Configuration

### Environment Variables

```
# Email Configuration
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-password
EMAIL_FROM=noreply@campusmitra.in
FRONTEND_URL=https://campusmitra.in

# Redis Configuration
REDIS_URL=redis://localhost:6379

# Scheduler Configuration
SCHEDULER_ENABLED=true
SCHEDULER_TIMEZONE=Asia/Kolkata
REPORT_AGGREGATION_DAYS=7

# PDF Storage
REPORTS_DIR=./reports
AWS_S3_BUCKET=your-bucket
AWS_REGION=ap-south-1

# Monitoring
ALERT_WEBHOOK_URL=https://your-webhook-url
```

## Integration

### With Admin Module

The reports module is integrated with the admin module via:
- `/api/admin/reports/*` endpoints
- Admin authentication middleware
- Admin role enforcement

### With Other Services

- **Order Service**: Triggers cache invalidation on order completion
- **User Service**: Fetches seller information
- **Product Service**: Fetches product details
- **Logger Service**: Logs all operations

## Testing

### Unit Tests

- Report generation with sample data
- Cache operations
- PDF generation
- Email delivery
- Audit logging

### Integration Tests

- End-to-end report generation
- Email delivery with SMTP
- PDF export and storage
- Audit log retrieval

### Performance Tests

- SLA compliance verification
- Cache hit rate analysis
- Concurrent request handling

## Deployment

### Prerequisites

```bash
npm install puppeteer pdfkit bull aws-sdk nodemailer node-cron
```

### Initialization

```javascript
// In app.js or server.js
const emailSchedulerService = require('./src/modules/reports/services/EmailSchedulerService');

// Start scheduler on application startup
if (process.env.SCHEDULER_ENABLED !== 'false') {
  emailSchedulerService.start();
  console.log('Email scheduler started');
}

// Gracefully stop on shutdown
process.on('SIGTERM', () => {
  emailSchedulerService.stop();
  console.log('Email scheduler stopped');
});
```

### Monitoring

Monitor these logs:
- `Report generation tracked`
- `Email delivery tracked`
- `Alert triggered`
- `Anomaly detected`
- `SLA violation`

## Future Enhancements

1. **Persistent Metrics Storage**: Store metrics in MongoDB for long-term analysis
2. **Prometheus Integration**: Export metrics for Grafana dashboards
3. **DataDog Integration**: Send metrics to DataDog
4. **Custom Alert Rules**: Allow admins to define custom thresholds
5. **Alert History**: Store alert history for audit
6. **Performance Dashboards**: Real-time admin dashboard

## Documentation

- [API Reference](./docs/API_REFERENCE.md)
- [Implementation Guide](./docs/IMPLEMENTATION.md)
- [Monitoring Guide](./docs/MONITORING.md)

## Support

For issues or questions, refer to:
- Design Document: `.kiro/specs/sales-revenue-reports/design.md`
- Requirements: `.kiro/specs/sales-revenue-reports/requirements.md`
- Tasks: `.kiro/specs/sales-revenue-reports/tasks.md`
