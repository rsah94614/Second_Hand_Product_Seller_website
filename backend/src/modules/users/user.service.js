const buildWishlistPayload = (user) => ({
  wishlist: (user.wishlist || []).map((item) => item.toString()),
  wishlistCount: user.wishlist?.length || 0,
});

module.exports = {
  buildWishlistPayload,
};
