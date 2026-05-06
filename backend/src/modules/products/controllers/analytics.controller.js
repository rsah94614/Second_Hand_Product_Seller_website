const Product = require('../../../../models/Product');
const ProductAnalytics = require('../../../../models/ProductAnalytics');

const getProductAnalytics = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).select('seller title views viewedBy');
    if (!product) return res.status(404).json({ message: 'Product not found' });
    if (product.seller.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    let analytics = await ProductAnalytics.findOne({ product: req.params.id });
    if (!analytics) {
      return res.json({
        product: req.params.id,
        totalViews: product.views || 0,
        uniqueViews: product.viewedBy?.length || 0,
        totalInquiries: 0,
        totalOrders: 0,
        wishlistSaves: 0,
        conversionRate: 0,
        dailyStats: [],
      });
    }

    const conversionRate =
      analytics.totalViews > 0
        ? ((analytics.totalOrders / analytics.totalViews) * 100).toFixed(1)
        : 0;

    return res.json({
      ...analytics.toObject(),
      conversionRate: parseFloat(conversionRate),
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const getSellerAnalyticsSummary = async (req, res) => {
  try {
    const analytics = await ProductAnalytics.find({ seller: req.user._id })
      .populate('product', 'title images isActive isSold')
      .lean();

    const summary = {
      totalViews: 0,
      totalInquiries: 0,
      totalOrders: 0,
      totalWishlistSaves: 0,
      topProducts: [],
    };

    analytics.forEach((a) => {
      summary.totalViews += a.totalViews;
      summary.totalInquiries += a.totalInquiries;
      summary.totalOrders += a.totalOrders;
      summary.totalWishlistSaves += a.wishlistSaves;
    });

    summary.topProducts = analytics
      .sort((a, b) => b.totalViews - a.totalViews)
      .slice(0, 5)
      .map((a) => ({
        product: a.product,
        views: a.totalViews,
        inquiries: a.totalInquiries,
        orders: a.totalOrders,
        conversionRate:
          a.totalViews > 0
            ? parseFloat(((a.totalOrders / a.totalViews) * 100).toFixed(1))
            : 0,
      }));

    return res.json(summary);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getProductAnalytics,
  getSellerAnalyticsSummary,
};
