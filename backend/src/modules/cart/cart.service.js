
const normalizeQuantity = (quantity = 1) => {
  const qty = Number(quantity);
  if (Number.isNaN(qty) || qty < 1) return 1;
  return Math.floor(qty);
};

const populateCart = async (cart) => {
  if (!cart) return null;
  return cart.populate('items.product');
};

const formatCartResponse = (cart) => {
  if (!cart) {
    return { items: [], summary: { itemCount: 0, totalAmount: 0 } };
  }

  const items = cart.items.map((item) => {
    const product =
      item.product && typeof item.product.toObject === 'function'
        ? item.product.toObject()
        : item.product;
    const price = product?.price || 0;

    return {
      _id: item._id,
      quantity: item.quantity,
      product,
      subtotal: price * item.quantity,
    };
  });

  const summary = items.reduce(
    (acc, item) => {
      acc.itemCount += item.quantity;
      acc.totalAmount += item.subtotal;
      return acc;
    },
    { itemCount: 0, totalAmount: 0 }
  );

  return { items, summary };
};

module.exports = { normalizeQuantity, populateCart, formatCartResponse };
