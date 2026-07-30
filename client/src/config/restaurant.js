import { restaurantData } from './restaurantData';

export const restaurantConfig = {
  ...restaurantData,
  // Additional backward compatibility fields
  requireCustomerPhone: true
};

export { restaurantData };
