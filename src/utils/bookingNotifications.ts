import api from "@/services/api";

interface BookingNotificationData {
  bookingId: string;
  salonId: string;
  salonName: string;
  customerName: string;
  serviceName: string;
  bookingDate: string;
  bookingTime: string;
  customerPhone?: string;
}

/**
 * Send notification to salon owner using local logic
 */
export const notifySalonOwner = async (data: BookingNotificationData) => {
  try {
    // 1. Log to local audit system
    console.log(`[LOCAL NOTIFY] New Booking ${data.bookingId} for ${data.salonName}`);

    // 2. In local mode, we simulate these for now
    console.log(`[ACTION] Email queueing for ${data.customerName} @ ${data.bookingTime}`);

    return true;
  } catch (error) {
    console.error("Local notification failure:", error);
    return false;
  }
};

/**
 * Get booking statistics from local API
 */
export const getSalonBookingStats = async (salonId: string) => {
  try {
    // Fetch directly from local bookings API
    const bookings = await api.bookings.getAll({ salon_id: salonId });

    if (!bookings) return null;

    const todayStr = new Date().toISOString().split('T')[0];

    const stats = {
      salon_id: salonId,
      total_bookings: bookings.length,
      pending_bookings: bookings.filter((b: any) => b.status === 'pending').length,
      confirmed_bookings: bookings.filter((b: any) => b.status === 'confirmed').length,
      completed_bookings: bookings.filter((b: any) => b.status === 'completed').length,
      cancelled_bookings: bookings.filter((b: any) => b.status === 'cancelled').length,
      today_bookings: bookings.filter((b: any) => b.booking_date === todayStr).length,
      total_revenue: bookings.filter((b: any) => b.status === 'completed' || b.status === 'confirmed').reduce((sum: number, b: any) => sum + Number(b.price || 0), 0),
    };

    return stats;
  } catch (error) {
    console.error("Local stats fetch failure:", error);
    return null;
  }
};

export const getSalonNotifications = async (salonId: string) => {
  // Mock local notifications
  return [];
};

export const markNotificationAsRead = async (notificationId: string) => {
  return true;
};