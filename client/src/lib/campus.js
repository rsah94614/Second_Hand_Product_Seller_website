export const CAMPUS_NAME = 'Gauhati University';
export const CAMPUS_CITY = 'Guwahati';
export const CAMPUS_STATE = 'Assam';
export const CAMPUS_POSTAL_CODE = '781014';
export const CAMPUS_COUNTRY = 'India';
export const CAMPUS_LOCATION_LABEL = `${CAMPUS_NAME} Campus`;

export const CAMPUS_LOCATIONS = [
  'Main Gate',
  'Library',
  'Boys Hostel',
  'Girls Hostel',
  'Canteen',
  'Department Building',
  'Sports Complex',
  'Parking Area',
  'Student Union',
  'Admin Block',
  'Academic Building',
  'Lab Complex',
  'Auditorium',
  'Other',
];

export const getCampusPickupLabel = (location) => {
  const normalized = location?.trim();
  return normalized || CAMPUS_LOCATION_LABEL;
};

export const getCampusShippingDefaults = () => ({
  city: CAMPUS_CITY,
  state: CAMPUS_STATE,
  postalCode: CAMPUS_POSTAL_CODE,
  country: CAMPUS_COUNTRY,
});

export const formatCampusAddress = (shippingDetails = {}) => {
  const primaryLine = [
    shippingDetails.addressLine1,
    shippingDetails.addressLine2,
    shippingDetails.landmark,
  ]
    .filter(Boolean)
    .join(', ');

  const secondaryLine = [
    shippingDetails.city || CAMPUS_CITY,
    shippingDetails.state || CAMPUS_STATE,
    shippingDetails.postalCode || CAMPUS_POSTAL_CODE,
  ]
    .filter(Boolean)
    .join(', ');

  return {
    primaryLine: primaryLine || CAMPUS_LOCATION_LABEL,
    secondaryLine,
    country: shippingDetails.country || CAMPUS_COUNTRY,
  };
};
