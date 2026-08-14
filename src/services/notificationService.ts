import * as restaurantService from './restaurantService';
import * as barService from './bar.service';
import * as hotelService from './hotel.service';
import { stockService } from './stock.service';

export interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  message: string;
  timestamp: string;
  source?: string;
  actionUrl?: string;
}

const LOW_STOCK_THRESHOLD = 10;
const CRITICAL_STOCK_THRESHOLD = 3;

/**
 * Generate notifications based on restaurant stock levels
 */
const checkRestaurantStock = async (): Promise<Notification[]> => {
  const notifications: Notification[] = [];
  
  try {
    const locationsRes = await stockService.getLocations();
    const locations = Array.isArray(locationsRes) ? locationsRes : (locationsRes as any)?.data || [];
    if (!locations.length) return notifications;
    
    const restaurantLocation = locations.find((loc: any) => 
      loc.nom.toLowerCase().includes('restaurant')
    ) || locations[0];
    
    const stocksRes = await stockService.getByLocation(restaurantLocation.id);
    const stocks = Array.isArray(stocksRes) ? stocksRes : (stocksRes as any)?.data || [];
    if (!stocks.length) return notifications;
    
    // Check for critical and low stock items
    stocks.forEach((stock: any) => {
      if (stock.quantite <= CRITICAL_STOCK_THRESHOLD) {
        notifications.push({
          id: `stock-critical-${stock.product_id}-${Date.now()}`,
          type: 'error',
          message: `Stock critique: ${stock.product?.nom || stock.product_nom} (${stock.quantite} ${stock.product?.unite || ''})`,
          timestamp: new Date().toISOString(),
          source: 'Restaurant',
          actionUrl: '/restaurant?tab=stock'
        });
      } else if (stock.quantite <= LOW_STOCK_THRESHOLD) {
        notifications.push({
          id: `stock-low-${stock.product_id}-${Date.now()}`,
          type: 'warning',
          message: `Stock faible: ${stock.product?.nom || stock.product_nom} (${stock.quantite} ${stock.product?.unite || ''})`,
          timestamp: new Date().toISOString(),
          source: 'Restaurant',
          actionUrl: '/restaurant?tab=stock'
        });
      }
    });
  } catch (error) {
    console.error('Error checking restaurant stock:', error);
  }
  
  return notifications;
};

/**
 * Generate notifications based on bar stock levels
 */
const checkBarStock = async (): Promise<Notification[]> => {
  const notifications: Notification[] = [];
  
  try {
    const locationsRes = await stockService.getLocations();
    const locations = Array.isArray(locationsRes) ? locationsRes : (locationsRes as any)?.data || [];
    if (!locations.length) return notifications;
    
    const barLocation = locations.find((loc: any) => 
      loc.nom.toLowerCase().includes('bar')
    ) || locations.find((loc: any) => 
      loc.id !== 5 // Filter out hotel location
    );
    
    if (!barLocation) return notifications;
    
    const stocksRes = await stockService.getByLocation(barLocation.id);
    const stocks = Array.isArray(stocksRes) ? stocksRes : (stocksRes as any)?.data || [];
    if (!stocks.length) return notifications;
    
    stocks.forEach((stock: any) => {
      if (stock.quantite <= CRITICAL_STOCK_THRESHOLD) {
        notifications.push({
          id: `bar-stock-critical-${stock.product_id}-${Date.now()}`,
          type: 'error',
          message: `Stock critique (Bar): ${stock.product?.nom || stock.product_nom} (${stock.quantite} ${stock.product?.unite || ''})`,
          timestamp: new Date().toISOString(),
          source: 'Bar',
          actionUrl: '/bar?tab=stock'
        });
      } else if (stock.quantite <= LOW_STOCK_THRESHOLD) {
        notifications.push({
          id: `bar-stock-low-${stock.product_id}-${Date.now()}`,
          type: 'warning',
          message: `Stock faible (Bar): ${stock.product?.nom || stock.product_nom} (${stock.quantite} ${stock.product?.unite || ''})`,
          timestamp: new Date().toISOString(),
          source: 'Bar',
          actionUrl: '/bar?tab=stock'
        });
      }
    });
  } catch (error) {
    console.error('Error checking bar stock:', error);
  }
  
  return notifications;
};

/**
 * Generate notifications based on hotel room status
 */
const checkHotelStatus = async (): Promise<Notification[]> => {
  const notifications: Notification[] = [];
  
  try {
    const roomsRes = await hotelService.hotelService.getChambres();
    const rooms = Array.isArray(roomsRes) ? roomsRes : (roomsRes as any)?.data || [];
    if (!rooms.length) return notifications;
    
    const occupiedRooms = rooms.filter((r: any) => r.status === 'occupee').length;
    const totalRooms = rooms.length;
    const occupancyRate = totalRooms > 0 ? (occupiedRooms / totalRooms) * 100 : 0;
    
    // High occupancy notification
    if (occupancyRate >= 90) {
      notifications.push({
        id: `hotel-occupancy-${Date.now()}`,
        type: 'info',
        message: `Taux d'occupation élevé: ${occupancyRate.toFixed(0)}% (${occupiedRooms}/${totalRooms} chambres)`,
        timestamp: new Date().toISOString(),
        source: 'Hôtel',
        actionUrl: '/hotel'
      });
    }
    
    // Check for rooms needing maintenance
    const maintenanceRooms = rooms.filter((r: any) => r.status === 'maintenance');
    if (maintenanceRooms.length > 0) {
      notifications.push({
        id: `hotel-maintenance-${Date.now()}`,
        type: 'warning',
        message: `${maintenanceRooms.length} chambre(s) en maintenance`,
        timestamp: new Date().toISOString(),
        source: 'Hôtel',
        actionUrl: '/hotel'
      });
    }
  } catch (error) {
    console.error('Error checking hotel status:', error);
  }
  
  return notifications;
};

/**
 * Main function to generate all notifications
 */
export const generateNotifications = async (): Promise<Notification[]> => {
  const allNotifications: Notification[] = [];
  
  // Run all checks in parallel
  const [restaurantNotifs, barNotifs, hotelNotifs] = await Promise.all([
    checkRestaurantStock(),
    checkBarStock(),
    checkHotelStatus()
  ]);
  
  allNotifications.push(...restaurantNotifs, ...barNotifs, ...hotelNotifs);
  
  // Sort by timestamp (newest first) and limit to 10
  return allNotifications
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 10);
};

/**
 * Add a custom notification (for user actions, system events, etc.)
 */
export const addCustomNotification = (
  type: 'info' | 'success' | 'warning' | 'error',
  message: string,
  source?: string,
  actionUrl?: string
): Notification => {
  return {
    id: `custom-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    type,
    message,
    timestamp: new Date().toISOString(),
    source: source || 'Système',
    actionUrl
  };
};