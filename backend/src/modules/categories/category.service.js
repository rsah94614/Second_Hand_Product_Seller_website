const { slugify } = require('../../../utils/categoryDefaults');

const sanitizeCategoryPayload = (payload = {}) => {
  const name = payload.name?.trim();
  const description = payload.description?.trim() || '';
  const sortOrder = Number.isFinite(Number(payload.sortOrder)) ? Number(payload.sortOrder) : 0;

  if (!name || name.length < 2 || name.length > 50) {
    return { error: 'Category name must be between 2 and 50 characters' };
  }

  if (description.length > 200) {
    return { error: 'Description cannot exceed 200 characters' };
  }

  return {
    data: {
      name,
      slug: slugify(name),
      description,
      isActive: payload.isActive !== undefined ? Boolean(payload.isActive) : true,
      sortOrder,
      icon: typeof payload.icon === 'string' ? payload.icon : '',
      image: typeof payload.image === 'string' ? payload.image : '',
    },
  };
};

module.exports = {
  sanitizeCategoryPayload,
};
