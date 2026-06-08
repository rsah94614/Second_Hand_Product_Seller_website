const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');

const serviceModulePath = require.resolve('../src/services/PDFExportService');

const buildMetrics = () => ({
  totalRevenue: 1234567.89,
  totalOrders: 2456,
  averageOrderValue: 503.12,
  activeSellers: 312,
  successfulPayments: 2211,
  failedPayments: 45,
  conversionRate: 18.4,
  refundAmount: 12003.55,
  pendingSettlements: 87,
  netProfit: 334455.66,
  monthlyGrowth: { value: 12.8, change: 4.2, label: 'Monthly Growth' },
  repeatCustomers: 620,
  avgItemsPerOrder: 3.7,
  cancelledOrders: 17,
  completedOrders: 2394,
  activeCampuses: 9,
  newUsers: 1440,
  grossMerchandiseValue: 1567890.5,
});

const freshService = (reportsDir) => {
  delete require.cache[serviceModulePath];
  process.env.REPORTS_DIR = reportsDir;
  return require('../src/services/PDFExportService');
};

async function runPDFExportServiceTests() {
  const tempReportsDir = fs.mkdtempSync(path.join(os.tmpdir(), 'campusmitra-pdf-'));
  const previousReportsDir = process.env.REPORTS_DIR;

  try {
    const service = freshService(tempReportsDir);
    const dateRange = {
      startDate: new Date('2026-05-01T00:00:00Z'),
      endDate: new Date('2026-05-21T00:00:00Z'),
    };

    const pdfBuffer = await service.createPDFDocument(
      'Sales Dashboard Report',
      dateRange,
      buildMetrics(),
      []
    );

    assert.ok(pdfBuffer.length >= 50 * 1024, 'Expected PDF buffer to be at least 50KB');
    assert.ok(pdfBuffer.length <= 10 * 1024 * 1024, 'Expected PDF buffer to be under 10MB');
    
    // Verify it is a valid PDF file (starts with %PDF-)
    assert.ok(pdfBuffer.slice(0, 5).toString() === '%PDF-', 'Expected buffer to be a valid PDF format');

    const result = await service.generatePDF({ metrics: buildMetrics(), charts: [] }, 'dashboard', dateRange);

    assert.ok(fs.existsSync(result.filePath), 'Expected generated PDF file to exist');
    assert.ok(result.fileSize >= 50 * 1024, 'Expected persisted PDF size to meet minimum threshold');
    assert.ok(result.fileSize <= 10 * 1024 * 1024, 'Expected persisted PDF size to stay within limit');
  } finally {
    if (previousReportsDir === undefined) {
      delete process.env.REPORTS_DIR;
    } else {
      process.env.REPORTS_DIR = previousReportsDir;
    }
    delete require.cache[serviceModulePath];
    fs.rmSync(tempReportsDir, { recursive: true, force: true });
  }
}

module.exports = { runPDFExportServiceTests };

if (require.main === module) {
  runPDFExportServiceTests()
    .then(() => {
      console.log('PASS PDFExportService');
    })
    .catch((error) => {
      console.error('FAIL PDFExportService');
      console.error(error);
      process.exitCode = 1;
    });
}
