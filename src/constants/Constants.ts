import poppinsRegular from '@assets/fonts/poppins/Poppins-Regular.ttf';

export const COLORS = {
  primary: "#281C59",
  secondary: "#4E8D9C",
  tertiary: "#85C79A",
  quaternary: "#EDF7BD",
  background: "#F5F5F5",
  Grey: '#999999',
  lightGrey: '#E5E5E5',
  text: "#212121",
  white: "#FFFFFF",
  black: "#1D1D1D",
  transparent: 'transparent',
  danger: "#E74C3C",
};

export const ADDRESS_FIELDS = [
  { key: 'street', label: 'Street', placeholder: 'Enter street address' },
  { key: 'town', label: 'Town', placeholder: 'Enter town' },
  { key: 'city', label: 'City', placeholder: 'Enter city' },
  { key: 'state', label: 'State', placeholder: 'Enter state' },
  { key: 'postal_code', label: 'Postal Code', placeholder: 'Enter postal code' },
  { key: 'country', label: 'Country', placeholder: 'Enter country' },
]

export const RADIUS = {
  small: 5,
  medium: 10,
  large: 15,
  extraLarge: 20,
};

export const FONT = {
  POPPIN_REGULAR: poppinsRegular
};

export const FONT_FAMILY = {
  poppinsRegular: 'Poppins-Regular',
};

export const FONT_SIZE = {
  extraSmall: 12,
  small: 14,
  medium: 16,
  large: 18,
  extraLarge: 32,
}

export const FONT_WIDTH = {
  extraSmall: 100,
  small: 200,
  medium: 300,
  large: 700,
  extraLarge: 800,
}

export const STATUS_OPTIONS = [
  'Inactive',
  'Active',
];

export const LOCATION_TYPES = [
  {
    "id": 1,
    "name": "Transport",
    "description": "Transportation facilities",
    "status": "inactive",
    "icon": "storefront-outline",

  },
  {
    "id": 2,
    "name": "Shop",
    "description": "Property rentals or sales",
    "status": "active",
    "icon": "storefront-outline"
  },
  {
    "id": 3,
    "name": "Property",
    "description": "Property rentals or sales",
    "status": "active",
    "icon": "home-outline"
  },
  // {
  //   "id": 4,
  //   "name": "Venues",
  //   "description": "Service facilities",
  //   "status": "active",
  //   "icon": "party-popper"
  // },
  {
    "id": 5,
    "name": "Service",
    "description": "Service facilities",
    "status": "active",
    "icon": "car-wash"
  },
  {
    "id": 6,
    "name": "Taxi Rank",
    "description": "Taxi rank or transport hub",
    "status": "active",
    "icon": "taxi"
  }
];

export const INTERNET_OPTIONS = [
  'No Internet provided',
  'Fiber',
  'Wifi',
  'Mobile Data',
  'Satellite'
];

export const PARKING_OPTIONS = [
  'No Parking provided',
  '1 Car',
  '2 Cars',
  '3 Cars',
  '4 Cars',
];

export const PETS_OPTIONS = [
  'No Pets allowed',
  'Pets allowed',
  'Pets allowed on approval',
];

export const BATHROOM_OPTIONS = [
  'No Bathroom provided',
  'Bathroom with Bathtub',
  'Bathroom with Shower',
  'Bathroom with Bathtub and Shower',
];

export const TOILET_OPTIONS = [
  'No Toilet provided',
  'Outside Toilet',
  'Seperate Inside Toilet',
  'Toilet inside bathroom',
];

export const FURNISHED_OPTIONS = [
  'No Furnished provided',
  'Inbuilt Wardrobe',
  'Fully Furnished',
  'Partly Furnished',
];
