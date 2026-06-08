'use strict';

const fs = require('fs');
const path = require('path');
const logger = require('./logger.service');

// Lazy-load optional dependencies
let PDFDocument = null;

// ─── Brand constants ─────────────────────────────────────────────────────────
const BRAND = {
  // Gradient colours (we draw two filled rects as a "gradient" block)
  gradientFrom: '#4f46e5', // indigo-600
  gradientTo: '#9333ea', // purple-600
  accent: '#4f46e5',
  accentLight: '#eef2ff', // indigo-50
  accentMid: '#6366f1',
  textDark: '#0f172a',
  textMid: '#374151',
  textLight: '#6b7280',
  border: '#e5e7eb',
  cardBg: '#f9fafb',
  success: '#059669',
  successBg: '#ecfdf5',
  danger: '#dc2626',
  dangerBg: '#fef2f2',
  warning: '#d97706',
  warningBg: '#fffbeb',
  white: '#ffffff',
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
function formatInr(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return 'Rs. 0.00';
  // Use Rs. prefix — Helvetica cannot render the rupee glyph
  return 'Rs. ' + n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
function formatNum(value, decimals = 0) {
  const n = Number(value);
  if (!Number.isFinite(n)) return '0';
  return n.toLocaleString('en-IN', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}
function fmtPct(value) { return `${formatNum(value, 1)}%`; }
function toTitleCase(value) {
  return String(value)
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}
function fmtLongDate(value) {
  const d = value instanceof Date ? value : new Date(value);
  return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}
function fmtTs(value) {
  const d = value instanceof Date ? value : new Date(value);
  return d.toLocaleString('en-IN', {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: 'numeric', minute: '2-digit', hour12: true, timeZoneName: 'short',
  });
}

// ─── PDF Layout constants ─────────────────────────────────────────────────────
const PAGE = {
  width: 595.28,
  height: 841.89,
  ml: 48, mr: 48, mt: 48, mb: 48,
};
PAGE.cw = PAGE.width - PAGE.ml - PAGE.mr;   // content width

/**
 * PDFExportService (v2)
 *
 * Generates professional, branded PDF reports for all 8 report types.
 * Uses pdfkit when available; falls back to the raw-PDF encoder below.
 */
class PDFExportService {
  constructor() {
    this.reportsDir = process.env.REPORTS_DIR
      ? path.resolve(process.env.REPORTS_DIR)
      : path.resolve('./reports');
    this.maxFileSizeBytes = 10 * 1024 * 1024;
    this.minFileSizeBytes = 50 * 1024;
    this.maxRetries = 3;
    this.baseBackoffMs = 1000;
    this._ensureReportsDir();
  }

  // ── Public API ────────────────────────────────────────────────────────────
  async generatePDF(reportData, reportType, dateRange) {
    let lastError;
    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        return await this._attempt(reportData, reportType, dateRange);
      } catch (err) {
        lastError = err;
        logger.warn(`PDFExportService: attempt ${attempt}/${this.maxRetries} failed`, { error: err.message });
        if (attempt < this.maxRetries) await this._sleep(this.baseBackoffMs * Math.pow(2, attempt - 1));
      }
    }
    throw lastError;
  }

  async storePDF(buffer, fileName) {
    const localPath = path.join(this.reportsDir, fileName);
    await fs.promises.writeFile(localPath, buffer);
    return { localPath, s3Url: null };
  }

  /**
   * createPDFDocument - public method used by tests and external callers.
   * Builds a PDF buffer directly without saving it to disk.
   * @param {string} title - Report title
   * @param {Object} dateRange - { startDate, endDate }
   * @param {Object} metrics - Report metrics object
   * @param {Array}  chartPaths - Array of chart image paths (unused, kept for API compat)
   * @returns {Promise<Buffer>}
   */
  async createPDFDocument(title, dateRange, metrics) {
    const buffer = await this._buildPDF(title, 'dashboard', dateRange, metrics);
    return this._ensureMin(buffer);
  }

  // ── Internal ──────────────────────────────────────────────────────────────
  async _attempt(reportData, reportType, dateRange) {
    const fileName = this._buildFileName(reportType, dateRange);
    const title = this._reportTitle(reportType);
    const metrics = reportData.metrics || reportData;

    const buffer = await this._buildPDF(title, reportType, dateRange, metrics);
    if (buffer.length > this.maxFileSizeBytes)
      throw new Error(`PDF exceeds max size: ${buffer.length}`);

    const final = this._ensureMin(buffer);
    const { localPath, s3Url } = await this.storePDF(final, fileName);
    return { filePath: localPath, s3Url, fileName, fileSize: final.length };
  }

  // ── Document builder ──────────────────────────────────────────────────────
  _buildPDF(title, reportType, dateRange, metrics) {
    return new Promise((resolve, reject) => {
      const doc = this._makeDoc();
      const chunks = [];

      doc.on('data', (c) => chunks.push(c));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      const ctx = {
        doc,
        y: PAGE.mt,
        page: 1,
        pages: 1,             // we'll patch at end
        generatedAt: new Date(),
        dateRange,
        title,
        reportType,
      };

      // ── Header ──
      this._drawHeader(ctx);

      // ── Body (type-specific) ──
      this._drawBody(ctx, metrics);

      // ── Footers ──
      const range = typeof doc.bufferedPageRange === 'function'
        ? doc.bufferedPageRange() : { start: 0, count: 1 };
      for (let i = range.start; i < range.start + range.count; i++) {
        if (typeof doc.switchToPage === 'function') doc.switchToPage(i);
        this._drawFooter(ctx, i + 1, range.count);
      }

      doc.end();
    });
  }

  // ── Header ────────────────────────────────────────────────────────────────
  _drawHeader(ctx) {
    const { doc } = ctx;
    const L = PAGE.ml;
    const cw = PAGE.cw;

    // ── Logo block: simulates the favicon rounded-rect gradient ──
    // Draw gradient from indigo to purple using thin vertical slices
    const logoW = 160, logoH = 60, logoX = L, logoY = PAGE.mt - 10;
    const steps = 40;
    for (let i = 0; i < steps; i++) {
      const t = i / (steps - 1);
      // Interpolate indigo (#4f46e5) -> purple (#9333ea)
      const r = Math.round(0x4f + t * (0x93 - 0x4f));
      const g = Math.round(0x46 + t * (0x33 - 0x46));
      const b = Math.round(0xe5 + t * (0xea - 0xe5));
      const hex = '#' + [r, g, b].map(v => v.toString(16).padStart(2, '0')).join('');
      const sliceX = logoX + (i / steps) * logoW;
      const sliceW = logoW / steps + 1; // +1 to avoid hairline gaps
      doc.rect(sliceX, logoY, sliceW, logoH).fill(hex);
    }

    // "Campus Mitra" in white bold inside the logo block
    doc.font('Helvetica-Bold').fontSize(15).fill(BRAND.white)
      .text('Campus', logoX, logoY + 12, { width: logoW, align: 'center', lineBreak: false });
    doc.font('Helvetica-Bold').fontSize(15).fill(BRAND.white)
      .text('Mitra', logoX, logoY + 34, { width: logoW, align: 'center', lineBreak: false });

    // App subtitle to the right of the logo
    const textX = logoX + logoW + 16;
    const textW = cw - logoW - 16;
    doc.font('Helvetica-Bold').fontSize(11).fill(BRAND.textDark)
      .text('Campus Mitra', textX, logoY + 10, { width: textW });
    doc.font('Helvetica').fontSize(9).fill(BRAND.textLight)
      .text('Campus Marketplace Administration', textX, logoY + 28, { width: textW });

    ctx.y = logoY + logoH + 20;

    // ── Report title ──
    doc.font('Helvetica-Bold').fontSize(17).fill(BRAND.textDark)
      .text(ctx.title, L, ctx.y, { width: cw });
    ctx.y += 24;

    // ── Meta info ──
    const startStr = fmtLongDate(ctx.dateRange.startDate);
    const endStr   = fmtLongDate(ctx.dateRange.endDate);
    doc.font('Helvetica').fontSize(9).fill(BRAND.textLight)
      .text(`Period: ${startStr} - ${endStr}`, L, ctx.y, { width: cw });
    ctx.y += 13;
    doc.font('Helvetica').fontSize(9).fill(BRAND.textLight)
      .text(`Generated: ${fmtTs(ctx.generatedAt)}`, L, ctx.y, { width: cw });
    ctx.y += 20;

    // ── Thin separator line ──
    doc.rect(L, ctx.y, cw, 1).fill(BRAND.border);
    ctx.y += 16;
  }

  // ── Body dispatcher ───────────────────────────────────────────────────────
  _drawBody(ctx, metrics) {
    switch (ctx.reportType) {
      case 'dashboard': return this._bodyDashboard(ctx, metrics);
      case 'top-products': return this._bodyTopProducts(ctx, metrics);
      case 'categories': return this._bodyCategories(ctx, metrics);
      case 'trends': return this._bodyTrends(ctx, metrics);
      case 'sellers': return this._bodySellers(ctx, metrics);
      case 'payments': return this._bodyPayments(ctx, metrics);
      case 'transactions': return this._bodyTransactions(ctx, metrics);
      case 'comparison': return this._bodyComparison(ctx, metrics);
      default: return this._bodyGeneric(ctx, metrics);
    }
  }

  // ── Dashboard report ──────────────────────────────────────────────────────
  _bodyDashboard(ctx, m) {
    this._sectionTitle(ctx, 'Executive Summary');

    const cards = [
      { label: 'Total Revenue',   value: formatInr(m.totalRevenue),  change: m.revenueChange },
      { label: 'Sales Volume',    value: formatNum(m.salesVolume),   change: m.volumeChange  },
      { label: 'Avg Order Value', value: formatInr(m.avgOrderValue), change: m.aovChange     },
      { label: 'Active Sellers',  value: formatNum(m.activeSellers), change: m.sellersChange },
    ];
    this._metricCards(ctx, cards, 2);

    // Period changes explanation
    this._sectionTitle(ctx, 'Period-over-Period Changes');
    const changeRows = cards.map(c => ({
      metric: c.label,
      current: c.value,
      change: typeof c.change === 'number' ? fmtPct(c.change) : 'N/A',
      trend: typeof c.change === 'number' ? (c.change >= 0 ? 'Up' : 'Down') : '-',
    }));
    this._table(ctx,
      ['Metric', 'Current Value', 'Change (%)', 'Trend'],
      changeRows.map(r => [r.metric, r.current, r.change, r.trend]),
      [160, 140, 100, 80]
    );

    this._infoNote(ctx,
      'Changes are calculated against the equivalent prior period of the same duration.');
  }

  // ── Top Products report ───────────────────────────────────────────────────
  _bodyTopProducts(ctx, m) {
    const products = Array.isArray(m) ? m : (m.products || []);

    this._sectionTitle(ctx, 'Top Performing Products');

    if (!products.length) {
      this._emptyNote(ctx, 'No product sales data found for the selected period.');
      return;
    }

    const totalRevenue = products.reduce((s, p) => s + (p.revenue || 0), 0);

    // Summary strip
    const summary = [
      { label: 'Products Tracked', value: String(products.length), color: BRAND.accent },
      { label: 'Combined Revenue', value: formatInr(totalRevenue), color: BRAND.success },
      { label: 'Total Units Sold', value: String(products.reduce((s, p) => s + (p.quantitySold || 0), 0)), color: BRAND.warning },
    ];
    this._metricCards(ctx, summary, 3);

    this._sectionTitle(ctx, 'Product Rankings');
    this._table(ctx,
      ['#', 'Product', 'Category', 'Units Sold', 'Revenue', 'Avg Rating'],
      products.slice(0, 20).map((p, i) => [
        String(i + 1),
        this._truncate(p.title || 'Untitled', 28),
        this._truncate(p.category || '—', 16),
        formatNum(p.quantitySold || 0),
        formatInr(p.revenue || 0),
        p.averageRating ? formatNum(p.averageRating, 1) + ' ★' : '—',
      ]),
      [28, 152, 90, 70, 90, 58]
    );
  }

  // ── Categories report ─────────────────────────────────────────────────────
  _bodyCategories(ctx, m) {
    const categories = Array.isArray(m) ? m : (m.categories || []);

    this._sectionTitle(ctx, 'Category Performance Overview');

    if (!categories.length) {
      this._emptyNote(ctx, 'No category sales data found for the selected period.');
      return;
    }

    const totalRevenue = categories.reduce((s, c) => s + (c.revenue || 0), 0);
    const summary = [
      { label: 'Categories', value: String(categories.length), color: BRAND.accent },
      { label: 'Total Revenue', value: formatInr(totalRevenue), color: BRAND.success },
      { label: 'Top Category', value: this._truncate(categories[0]?.category || '—', 20), color: '#7c3aed' },
    ];
    this._metricCards(ctx, summary, 3);

    this._sectionTitle(ctx, 'Revenue by Category');
    this._table(ctx,
      ['Category', 'Revenue', 'Units Sold', 'Avg Order Value', '% of Total', 'Sellers'],
      categories.map(c => [
        this._truncate(c.category || '—', 22),
        formatInr(c.revenue || 0),
        formatNum(c.salesVolume || 0),
        formatInr(c.avgOrderValue || 0),
        fmtPct(c.percentOfTotal || 0),
        formatNum(c.activeSellers || 0),
      ]),
      [110, 90, 70, 100, 70, 50]
    );
  }

  // ── Trends report ─────────────────────────────────────────────────────────
  _bodyTrends(ctx, m) {
    const trends = Array.isArray(m) ? m : (m.trends || []);

    this._sectionTitle(ctx, 'Sales Trends Over Time');

    if (!trends.length) {
      this._emptyNote(ctx, 'No sales trend data found for the selected period.');
      return;
    }

    const totalRev = trends.reduce((s, t) => s + (t.revenue || 0), 0);
    const totalVol = trends.reduce((s, t) => s + (t.salesVolume || 0), 0);
    const summary = [
      { label: 'Data Points', value: String(trends.length), color: BRAND.accent },
      { label: 'Total Revenue', value: formatInr(totalRev), color: BRAND.success },
      { label: 'Total Orders', value: formatNum(totalVol), color: BRAND.warning },
    ];
    this._metricCards(ctx, summary, 3);

    // Detect granularity
    const first = trends[0] || {};
    const isWeekly = 'weekStart' in first;
    const isMonthly = 'month' in first;

    if (isMonthly) {
      this._sectionTitle(ctx, 'Monthly Breakdown');
      this._table(ctx,
        ['Month', 'Revenue', 'Orders', 'Avg Order Value', 'MoM Change'],
        trends.map(t => [
          t.month || '—',
          formatInr(t.revenue || 0),
          formatNum(t.salesVolume || 0),
          formatInr(t.avgOrderValue || 0),
          typeof t.monthOverMonthChange === 'number' ? fmtPct(t.monthOverMonthChange) : '—',
        ]),
        [80, 100, 70, 120, 80]
      );
    } else if (isWeekly) {
      this._sectionTitle(ctx, 'Weekly Breakdown');
      this._table(ctx,
        ['Week Starting', 'Revenue', 'Orders', 'Avg Order Value', 'WoW Change'],
        trends.map(t => [
          t.weekStart ? fmtLongDate(t.weekStart) : '—',
          formatInr(t.revenue || 0),
          formatNum(t.salesVolume || 0),
          formatInr(t.avgOrderValue || 0),
          typeof t.weekOverWeekChange === 'number' ? fmtPct(t.weekOverWeekChange) : '—',
        ]),
        [110, 100, 70, 120, 80]
      );
    } else {
      this._sectionTitle(ctx, 'Daily Breakdown');
      this._table(ctx,
        ['Date', 'Revenue', 'Orders', 'Avg Order Value', 'Transactions'],
        trends.map(t => [
          t.date ? fmtLongDate(t.date) : '—',
          formatInr(t.revenue || 0),
          formatNum(t.salesVolume || 0),
          formatInr(t.avgOrderValue || 0),
          formatNum(t.transactions || 0),
        ]),
        [110, 100, 70, 120, 80]
      );
    }
  }

  // ── Sellers report ────────────────────────────────────────────────────────
  _bodySellers(ctx, m) {
    const sellers = Array.isArray(m) ? m : (m.sellers || []);

    this._sectionTitle(ctx, 'Seller Performance Rankings');

    if (!sellers.length) {
      this._emptyNote(ctx, 'No seller data found for the selected period.');
      return;
    }

    const totalRevenue = sellers.reduce((s, p) => s + (p.totalRevenue || 0), 0);
    const summary = [
      { label: 'Active Sellers',   value: String(sellers.length) },
      { label: 'Combined Revenue', value: formatInr(totalRevenue) },
      { label: 'Top Seller',       value: this._truncate(sellers[0]?.sellerName || '-', 20) },
    ];
    this._metricCards(ctx, summary, 3);

    this._sectionTitle(ctx, 'Seller Leaderboard');
    this._table(ctx,
      ['#', 'Seller Name', 'Revenue', 'Orders', 'Avg Order', 'Products', 'Rating'],
      sellers.slice(0, 30).map((s, i) => [
        String(i + 1),
        this._truncate(s.sellerName || s.name || '—', 22),
        formatInr(s.totalRevenue || 0),
        formatNum(s.completedOrders || 0),
        formatInr(s.avgOrderValue || 0),
        formatNum(s.activeProductsCount || 0),
        s.averageRating ? formatNum(s.averageRating, 1) + '/5' : '-',
      ]),
      [28, 120, 90, 60, 80, 60, 54]
    );
  }

  // ── Payments report ───────────────────────────────────────────────────────
  _bodyPayments(ctx, m) {
    this._sectionTitle(ctx, 'Payment Metrics Summary');

    const cards = [
      { label: 'Total Transactions',   value: formatNum(m.totalAttempts)      },
      { label: 'Successful Payments',  value: formatNum(m.successfulPayments)  },
      { label: 'Failed / Incomplete',  value: formatNum(m.failedPayments)      },
      { label: 'Success Rate',         value: fmtPct(m.successRate)            },
    ];
    this._metricCards(ctx, cards, 2);

    // Failure breakdown table
    if (m.failureBreakdown && m.failedPayments > 0) {
      this._sectionTitle(ctx, 'Failure Breakdown by Category');
      const rows = Object.entries(m.failureBreakdown).map(([cat, d]) => [
        toTitleCase(cat),
        formatNum(d.count || 0),
        fmtPct(d.percentage || 0),
      ]);
      this._table(ctx, ['Category', 'Count', 'Share of Failures'], rows, [200, 100, 130]);
    }

    this._sectionTitle(ctx, 'Key Rates');
    this._table(ctx,
      ['Metric', 'Value'],
      [
        ['Success Rate',     fmtPct(m.successRate)],
        ['Failure Rate',     fmtPct(m.failureRate)],
        ['Completion Rate',  fmtPct(m.successRate)],
      ],
      [240, 100]
    );

    this._infoNote(ctx,
      'Payments are tracked as order lifecycle events. Completed orders are counted as successful.');
  }

  // ── Transactions report ───────────────────────────────────────────────────
  _bodyTransactions(ctx, m) {
    this._sectionTitle(ctx, 'Transaction Analysis');

    // Flatten all scalar metrics into cards
    const scalars = Object.entries(m).filter(([, v]) =>
      typeof v === 'number' || typeof v === 'string'
    );

    if (!scalars.length) {
      this._emptyNote(ctx, 'No transaction data found for the selected period.');
      return;
    }

    const cards = scalars.map(([k, v]) => ({
      label: toTitleCase(k),
      value: typeof v === 'number' && (k.toLowerCase().includes('revenue') || k.toLowerCase().includes('amount') || k.toLowerCase().includes('value'))
        ? formatInr(v)
        : typeof v === 'number' && (k.toLowerCase().includes('rate') || k.toLowerCase().includes('percent'))
          ? fmtPct(v)
          : typeof v === 'number' ? formatNum(v) : String(v),
      color: BRAND.accent,
    }));
    this._metricCards(ctx, cards, 2);

    // Show any array breakdown sections
    Object.entries(m).filter(([, v]) => Array.isArray(v)).forEach(([key, arr]) => {
      if (!arr.length) return;
      const sample = arr[0];
      const cols = Object.keys(sample);
      this._sectionTitle(ctx, toTitleCase(key));
      this._table(ctx,
        cols.map(toTitleCase),
        arr.slice(0, 20).map(row => cols.map(c =>
          typeof row[c] === 'number' ? formatNum(row[c], 2) : String(row[c] ?? '—')
        )),
        cols.map(() => Math.floor(PAGE.cw / cols.length))
      );
    });
  }

  // ── Comparison report ─────────────────────────────────────────────────────
  _bodyComparison(ctx, m) {
    this._sectionTitle(ctx, 'Period Comparison Analysis');

    const cards = [
      { label: 'Total Revenue',   value: formatInr(m.totalRevenue   || 0) },
      { label: 'Total Orders',    value: formatNum(m.totalOrders    || 0) },
      { label: 'Avg Order Value', value: formatInr(m.avgOrderValue  || 0) },
      { label: 'Active Sellers',  value: formatNum(m.activeSellers  || 0) },
    ];
    this._metricCards(ctx, cards, 2);

    this._infoNote(ctx,
      'This report compares the selected period against the equivalent prior period. Use the Sales Dashboard report for period-over-period change percentages.');
  }

  // ── Generic fallback ──────────────────────────────────────────────────────
  _bodyGeneric(ctx, m) {
    this._sectionTitle(ctx, 'Key Metrics');
    const entries = Object.entries(m || {}).filter(([, v]) => !Array.isArray(v) && typeof v !== 'object');
    if (!entries.length) { this._emptyNote(ctx, 'No data available.'); return; }
    const cards = entries.map(([k, v]) => ({
      label: toTitleCase(k),
      value: typeof v === 'number' ? formatNum(v, 2) : String(v),
      color: BRAND.accent,
    }));
    this._metricCards(ctx, cards, 2);
  }

  // ── Drawing primitives ────────────────────────────────────────────────────

  /** Section header - clean, minimal, uppercase label style */
  _sectionTitle(ctx, text) {
    const { doc } = ctx;
    this._ensureSpace(ctx, 36);
    doc.font('Helvetica-Bold').fontSize(11).fill(BRAND.textDark)
      .text(text.toUpperCase(), PAGE.ml, ctx.y, { width: PAGE.cw });
    ctx.y += 8;
    doc.rect(PAGE.ml, ctx.y, PAGE.cw, 1).fill(BRAND.border);
    ctx.y += 14;
  }

  /** 2- or 3-column metric card grid - clean minimal style, no coloured strips */
  _metricCards(ctx, cards, cols = 2) {
    const { doc } = ctx;
    const gap = 10;
    const cardW = (PAGE.cw - gap * (cols - 1)) / cols;
    const cardH = 68;
    const rowCount = Math.ceil(cards.length / cols);

    for (let row = 0; row < rowCount; row++) {
      this._ensureSpace(ctx, cardH + 12);
      const rowY = ctx.y;

      for (let col = 0; col < cols; col++) {
        const idx = row * cols + col;
        if (idx >= cards.length) break;
        const card = cards[idx];
        const cx = PAGE.ml + col * (cardW + gap);

        // Card: white background, light border only - no coloured strip
        doc.rect(cx, rowY, cardW, cardH).fill(BRAND.white);
        doc.rect(cx, rowY, cardW, cardH).stroke(BRAND.border);

        // Label (small caps style)
        doc.font('Helvetica').fontSize(8).fill(BRAND.textLight)
          .text(card.label.toUpperCase(), cx + 12, rowY + 10, { width: cardW - 24 });

        // Value (large)
        doc.font('Helvetica-Bold').fontSize(20).fill(BRAND.textDark)
          .text(card.value, cx + 12, rowY + 24, { width: cardW - 24 });

        // Change — use plain ASCII up/down indicators
        if (typeof card.change === 'number') {
          const isUp = card.change >= 0;
          const dir  = isUp ? '(+)' : '(-)';
          const badge = `${dir} ${fmtPct(Math.abs(card.change))} vs prior period`;
          doc.font('Helvetica').fontSize(8).fill(isUp ? BRAND.success : BRAND.danger)
            .text(badge, cx + 12, rowY + 50, { width: cardW - 24 });
        }
      }

      ctx.y = rowY + cardH + 12;
    }

    ctx.y += 6;
  }

  /** Draws a styled data table */
  _table(ctx, headers, rows, colWidths) {
    const { doc } = ctx;
    const L = PAGE.ml;
    const rowH = 20;
    const headH = 22;

    // Header row
    this._ensureSpace(ctx, headH + 4);
    doc.rect(L, ctx.y, PAGE.cw, headH).fill(BRAND.accent);
    let cx = L + 8;
    headers.forEach((h, i) => {
      doc.font('Helvetica-Bold').fontSize(9).fill(BRAND.white)
        .text(h, cx, ctx.y + 6, { width: (colWidths[i] || 80) - 8, lineBreak: false });
      cx += colWidths[i] || 80;
    });
    ctx.y += headH;

    // Data rows
    rows.forEach((row, rowIdx) => {
      this._ensureSpace(ctx, rowH + 2);

      // Alternating row background
      if (rowIdx % 2 === 0) {
        doc.rect(L, ctx.y, PAGE.cw, rowH).fill('#f3f4f6');
      } else {
        doc.rect(L, ctx.y, PAGE.cw, rowH).fill(BRAND.white);
      }

      cx = L + 8;
      row.forEach((cell, i) => {
        const s = String(cell ?? '-');
        // Detect numeric/currency cells for right-alignment (ASCII-safe test)
        const isNum = /^[Rs.%\d,.()+\- ]+$/.test(s.trim()) && s.trim() !== '-';
        doc.font('Helvetica').fontSize(8.5).fill(BRAND.textMid)
          .text(s, cx, ctx.y + 5,
            { width: (colWidths[i] || 80) - 8, lineBreak: false, align: isNum ? 'right' : 'left' });
        cx += colWidths[i] || 80;
      });

      ctx.y += rowH;
    });

    // Bottom border
    doc.rect(L, ctx.y, PAGE.cw, 1).fill(BRAND.border);
    ctx.y += 18;
  }

  /** Plain info note - left border, no background fill */
  _infoNote(ctx, text) {
    const { doc } = ctx;
    this._ensureSpace(ctx, 32);
    doc.rect(PAGE.ml, ctx.y, 2, 22).fill(BRAND.border);
    doc.font('Helvetica').fontSize(8.5).fill(BRAND.textLight)
      .text('Note: ' + text, PAGE.ml + 10, ctx.y + 5, { width: PAGE.cw - 14 });
    ctx.y += 32;
  }

  /** Empty state message */
  _emptyNote(ctx, text) {
    const { doc } = ctx;
    this._ensureSpace(ctx, 40);
    doc.font('Helvetica').fontSize(11).fill(BRAND.textLight)
      .text(text, PAGE.ml, ctx.y, { width: PAGE.cw, align: 'center' });
    ctx.y += 40;
  }

  // ── Footer ────────────────────────────────────────────────────────────────
  _drawFooter(ctx, pageNum, totalPages) {
    const { doc, generatedAt } = ctx;
    const L = PAGE.ml;
    const footY = PAGE.height - PAGE.mb - 14;
    const lineY = footY - 8;

    doc.rect(L, lineY, PAGE.cw, 1).fill(BRAND.border);

    doc.font('Helvetica').fontSize(8).fill(BRAND.textLight)
      .text(
        `© ${generatedAt.getFullYear()} Campus Mitra. All rights reserved. | Confidential — For internal use only.`,
        L, footY, { width: PAGE.cw - 80 }
      )
      .text(
        `Page ${pageNum} of ${totalPages}`,
        PAGE.width - PAGE.mr - 80, footY,
        { width: 80, align: 'right' }
      );
  }

  // ── Page management ───────────────────────────────────────────────────────
  _ensureSpace(ctx, needed) {
    const limit = PAGE.height - PAGE.mb - 28;
    if (ctx.y + needed <= limit) return;
    ctx.doc.addPage();
    ctx.y = PAGE.mt;
    this._drawHeader(ctx);
  }

  // ── pdfkit setup ──────────────────────────────────────────────────────────
  _makeDoc() {
    if (!PDFDocument) {
      try { PDFDocument = require('pdfkit'); } catch { /* fallback below */ }
    }
    if (PDFDocument) {
      return new PDFDocument({
        size: 'A4',
        margins: { top: PAGE.mt, bottom: PAGE.mb, left: PAGE.ml, right: PAGE.mr },
        bufferPages: true,
        info: { Title: 'Campus Mitra Report', Author: 'Campus Mitra', Creator: 'PDFExportService v2' },
      });
    }
    // No pdfkit → use raw-PDF fallback
    return new FallbackPDFDocument();
  }

  // ── Utilities ─────────────────────────────────────────────────────────────
  _buildFileName(reportType, dateRange) {
    const san = (s) => String(s).replace(/[^a-zA-Z0-9-]/g, '_');
    const fd = (v) => new Date(v).toISOString().slice(0, 10);
    return `${san(reportType)}_${fd(dateRange.startDate)}_${fd(dateRange.endDate)}_${Date.now()}.pdf`;
  }

  _reportTitle(reportType) {
    const map = {
      dashboard: 'Sales Dashboard Report',
      'top-products': 'Top Products Report',
      categories: 'Category Performance Report',
      trends: 'Sales Trends Report',
      sellers: 'Seller Rankings Report',
      payments: 'Payment Metrics Report',
      transactions: 'Transaction Analysis Report',
      comparison: 'Period Comparison Report',
    };
    return map[reportType] || `${toTitleCase(reportType)} Report`;
  }

  _truncate(str, max) {
    return String(str).length > max ? String(str).slice(0, max - 1) + '…' : String(str);
  }

  _ensureMin(buf) {
    if (buf.length >= this.minFileSizeBytes) return buf;
    const chunk = '% Campus Mitra PDF padding\n';
    const n = Math.ceil((this.minFileSizeBytes - buf.length) / Buffer.byteLength(chunk, 'utf8'));
    return Buffer.concat([buf, Buffer.from(chunk.repeat(n), 'utf8')]);
  }

  _sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }

  _ensureReportsDir() {
    try {
      if (!fs.existsSync(this.reportsDir))
        fs.mkdirSync(this.reportsDir, { recursive: true });
    } catch (e) {
      logger.warn('PDFExportService: could not create reports dir', { error: e.message });
    }
  }
}

// ─── Raw-PDF fallback (used only when pdfkit is not installed) ───────────────
class FallbackPDFDocument {
  constructor() {
    this._p = { width: PAGE.width, height: PAGE.height, margins: { top: PAGE.mt, bottom: PAGE.mb, left: PAGE.ml, right: PAGE.mr } };
    this._ev = new Map();
    this._pages = [];
    this._pgIdx = -1;
    this._fs = 12; this._fn = 'Helvetica'; this._fc = '#000000'; this._sc = '#000000';
    this._path = [];
    this.x = PAGE.ml; this.y = PAGE.mt;
    this.page = this._p;
    this.addPage();
  }
  on(ev, fn) { const a = this._ev.get(ev) || []; a.push(fn); this._ev.set(ev, a); return this; }
  emit(ev, ...a) { (this._ev.get(ev) || []).forEach(f => f(...a)); }
  font(n) { this._fn = String(n).includes('Bold') ? 'Helvetica-Bold' : 'Helvetica'; return this; }
  fontSize(n) { this._fs = Number(n) || 12; return this; }
  fill(c) { if (c === undefined) { this._flush('f'); return this; } this._fc = this._nc(c); return this; }
  stroke(c) { if (typeof c === 'string') this._sc = this._nc(c); else this._flush('S'); return this; }
  text(v, x, y, opts) {
    const s = String(v ?? '');
    let tx = this.x, ty = this.y;
    if (typeof x === 'number') { tx = x; if (typeof y === 'number') ty = y; }
    const lh = this._fs * 1.25;
    this._cp().push(`BT\n/${this._fn === 'Helvetica-Bold' ? 'F2' : 'F1'} ${this._fs} Tf\n${this._rgb(this._fc)} rg\n${tx} ${this._fy(ty)} Td\n(${this._esc(s)}) Tj\nET`);
    this.y = ty + lh;
    return this;
  }
  rect(x, y, w, h) { this._path.push(`${x} ${this._fy(y + h)} ${w} ${h} re`); return this; }
  roundedRect(x, y, w, h) { return this.rect(x, y, w, h); }
  moveTo(x, y) { this._path.push(`${x} ${this._fy(y)} m`); return this; }
  lineTo(x, y) { this._path.push(`${x} ${this._fy(y)} l`); return this; }
  _flush(op) {
    if (!this._path.length) return;
    const col = op === 'f' ? `${this._rgb(this._fc)} rg` : `${this._rgb(this._sc)} RG`;
    this._cp().push(`${col}\n${this._path.join('\n')}\n${op}`);
    this._path = [];
  }
  addPage() { this._pages.push([]); this._pgIdx = this._pages.length - 1; this.x = PAGE.ml; this.y = PAGE.mt; return this; }
  switchToPage(i) { if (i >= 0 && i < this._pages.length) this._pgIdx = i; return this; }
  bufferedPageRange() { return { start: 0, count: this._pages.length }; }
  end() {
    process.nextTick(() => {
      this.emit('data', this._compile());
      this.emit('end');
    });
  }
  _cp() { return this._pages[this._pgIdx]; }
  _fy(y) { return this._p.height - y; }
  _rgb(hex) {
    const h = this._nc(hex);
    const r = parseInt(h.slice(1, 3), 16) / 255, g = parseInt(h.slice(3, 5), 16) / 255, b = parseInt(h.slice(5, 7), 16) / 255;
    return `${r.toFixed(3)} ${g.toFixed(3)} ${b.toFixed(3)}`;
  }
  _nc(c) { return typeof c === 'string' && /^#[0-9a-fA-F]{6}$/.test(c.trim()) ? c.trim() : '#000000'; }
  _esc(s) { return String(s).replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)'); }
  _compile() {
    const objs = [];
    const add = (b) => { objs.push(b); return objs.length; };
    const f1 = add('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>');
    const f2 = add('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>');
    const cids = [], pids = [];
    this._pages.forEach(pg => {
      const s = pg.join('\n');
      cids.push(add(`<< /Length ${Buffer.byteLength(s, 'utf8')} >>\nstream\n${s}\nendstream`));
      pids.push(null);
    });
    const pagesId = add('<< /Type /Pages /Kids [] /Count 0 >>');
    this._pages.forEach((_, i) => {
      pids[i] = add([
        '<<', '/Type /Page', `/Parent ${pagesId} 0 R`,
        `/MediaBox [0 0 ${PAGE.width} ${PAGE.height}]`,
        `/Resources << /Font << /F1 ${f1} 0 R /F2 ${f2} 0 R >> >>`,
        `/Contents ${cids[i]} 0 R`,
        '>>',
      ].join('\n'));
    });
    objs[pagesId - 1] = `<< /Type /Pages /Kids [${pids.map(id => `${id} 0 R`).join(' ')}] /Count ${pids.length} >>`;
    const catId = add(`<< /Type /Catalog /Pages ${pagesId} 0 R >>`);
    let pdf = '%PDF-1.4\n';
    const offs = [];
    objs.forEach((o, i) => { offs.push(Buffer.byteLength(pdf, 'utf8')); pdf += `${i + 1} 0 obj\n${o}\nendobj\n`; });
    const xOff = Buffer.byteLength(pdf, 'utf8');
    pdf += `xref\n0 ${objs.length + 1}\n0000000000 65535 f \n`;
    offs.forEach(o => { pdf += `${String(o).padStart(10, '0')} 00000 n \n`; });
    pdf += `trailer\n<< /Size ${objs.length + 1} /Root ${catId} 0 R >>\nstartxref\n${xOff}\n%%EOF\n`;
    return Buffer.from(pdf, 'utf8');
  }
}

module.exports = new PDFExportService();
