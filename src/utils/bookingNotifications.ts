import { supabase } from "@/integrations/supabase/client";

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
 * Send notification to salon owner when a new booking is created
 * This function handles multiple notification channels
 */
export const notifySalonOwner = async (data: BookingNotificationData) => {
  try {
    // 1. Create in-app notification record
    await createInAppNotification(data);
    
    // 2. Send email notification (if enabled)
    await sendEmailNotification(data);
    
    // 3. Send SMS notification (if enabled) 
    await sendSMSNotification(data);
    
    // 4. Send push notification (if enabled)
    await sendPushNotification(data);
    
    console.log(`Notifications sent for booking ${data.bookingId}`);
  } catch (error) {
    console.error("Error sending booking notifications:", error);
    // Don't throw error to avoid blocking booking creation
  }
};

/**
 * Create in-app notification that salon owner can see in dashboard
 */
const createInAppNotification = async (data: BookingNotificationData) => {
  try {
    // Get salon owner user IDs
    const { data: salonOwners, error } = await supabase
      .from("user_roles")
      .select("user_id")
      .eq("salon_id", data.salonId)
      .in("role", ["owner", "manager"]);

    if (error) throw error;

    // For now, just log the notification since notifications table may not exist
    console.log("In-app notification would be created for:", {
      recipients: salonOwners?.map(o => o.user_id),
      message: `${data.customerName} booked ${data.serviceName} for ${data.bookingDate} at ${data.bookingTime}`,
      salonId: data.salonId,
      bookingId: data.bookingId,
    });

    // TODO: Implement when notifications table is created
    /*
    const notifications = salonOwners?.map(owner => ({
      user_id: owner.user_id,
      salon_id: data.salonId,
      booking_id: data.bookingId,
      type: "new_booking",
      title: "New Booking Received",
      message: `${data.customerName} booked ${data.serviceName} for ${data.bookingDate} at ${data.bookingTime}`,
      is_read: false,
      created_at: new Date().toISOString(),
    }));

    if (notifications && notifications.length > 0) {
      await supabase.from("notifications").insert(notifications);
    }
    */
  } catch (error) {
    console.error("Error creating in-app notification:", error);
  }
};

/**
 * Send email notification to salon owner
 */
const sendEmailNotification = async (data: BookingNotificationData) => {
  try {
    // Get salon notification settings and owner email
    const { data: salon, error } = await supabase
      .from("salons")
      .select(`
        email,
        notification_settings,
        user_roles!inner(
          user_id,
          role,
          profiles!inner(
            user_id,
            full_name
          )
        )
      `)
      .eq("id", data.salonId)
      .eq("user_roles.role", "owner")
      .single();

    if (error || !salon) return;

    const notificationSettings = salon.notification_settings as any;
    
    // Check if email notifications are enabled
    if (!notificationSettings?.email_enabled) return;

    // In a real implementation, you would:
    // 1. Use a service like SendGrid, AWS SES, or Resend
    // 2. Send a professional email template
    // 3. Include booking details and action buttons
    
    console.log("Email notification would be sent to:", salon.email);
    console.log("Booking details:", data);
    
    // Example implementation with a hypothetical email service:
    /*
    await emailService.send({
      to: salon.email,
      subject: `New Booking - ${data.serviceName}`,
      template: 'new-booking',
      data: {
        salonName: data.salonName,
        customerName: data.customerName,
        serviceName: data.serviceName,
        bookingDate: data.bookingDate,
        bookingTime: data.bookingTime,
        customerPhone: data.customerPhone,
        dashboardUrl: `${process.env.VITE_APP_URL}/dashboard/appointments`
      }
    });
    */
  } catch (error) {
    console.error("Error sending email notification:", error);
  }
};

/**
 * Send SMS notification to salon owner
 */
const sendSMSNotification = async (data: BookingNotificationData) => {
  try {
    // Get salon phone and notification settings
    const { data: salon, error } = await supabase
      .from("salons")
      .select("phone, notification_settings")
      .eq("id", data.salonId)
      .single();

    if (error || !salon?.phone) return;

    const notificationSettings = salon.notification_settings as any;
    
    // Check if SMS notifications are enabled
    if (!notificationSettings?.sms_enabled) return;

    // In a real implementation, you would:
    // 1. Use a service like Twilio, AWS SNS, or similar
    // 2. Send a concise SMS with key booking details
    
    const message = `New booking at ${data.salonName}: ${data.customerName} - ${data.serviceName} on ${data.bookingDate} at ${data.bookingTime}. View: [dashboard-link]`;
    
    console.log("SMS notification would be sent to:", salon.phone);
    console.log("Message:", message);
    
    // Example implementation with Twilio:
    /*
    await twilioClient.messages.create({
      body: message,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: salon.phone
    });
    */
  } catch (error) {
    console.error("Error sending SMS notification:", error);
  }
};

/**
 * Send push notification to salon owner's devices
 */
const sendPushNotification = async (data: BookingNotificationData) => {
  try {
    // For now, just log since push tokens table may not exist
    console.log("Push notification would be sent for booking:", data.bookingId);
    
    // TODO: Implement when user_push_tokens table is created
    /*
    const { data: tokens, error } = await supabase
      .from("user_push_tokens")
      .select("token")
      .eq("salon_id", data.salonId)
      .eq("is_active", true);

    if (error || !tokens?.length) return;

    const notification = {
      title: "New Booking Received",
      body: `${data.customerName} booked ${data.serviceName}`,
      data: {
        type: "new_booking",
        bookingId: data.bookingId,
        salonId: data.salonId,
      }
    };
    
    console.log("Push notifications would be sent to:", tokens.length, "devices");
    */
  } catch (error) {
    console.error("Error sending push notification:", error);
  }
};

/**
 * Get unread notifications for a salon owner
 */
export const getSalonNotifications = async (salonId: string) => {
  try {
    // TODO: Implement when notifications table is created
    console.log("Would fetch notifications for salon:", salonId);
    return [];
    
    /*
    const { data, error } = await supabase
      .from("notifications")
      .select(`
        *,
        bookings (
          booking_date,
          booking_time,
          services (name),
          profiles (full_name)
        )
      `)
      .eq("salon_id", salonId)
      .eq("is_read", false)
      .order("created_at", { ascending: false })
      .limit(10);

    if (error) throw error;
    return data || [];
    */
  } catch (error) {
    console.error("Error fetching notifications:", error);
    return [];
  }
};

/**
 * Mark notification as read
 */
export const markNotificationAsRead = async (notificationId: string) => {
  try {
    // TODO: Implement when notifications table is created
    console.log("Would mark notification as read:", notificationId);
    
    /*
    const { error } = await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("id", notificationId);

    if (error) throw error;
    */
  } catch (error) {
    console.error("Error marking notification as read:", error);
  }
};

/**
 * Get booking statistics for salon dashboard
 */
export const getSalonBookingStats = async (salonId: string) => {
  try {
    // For now, calculate stats manually since view may not exist
    const { data: bookings, error } = await supabase
      .from("bookings")
      .select(`
        id,
        status,
        booking_date,
        services (price)
      `)
      .eq("salon_id", salonId);

    if (error) throw error;

    const stats = {
      salon_id: salonId,
      total_bookings: bookings?.length || 0,
      pending_bookings: bookings?.filter(b => b.status === 'pending').length || 0,
      confirmed_bookings: bookings?.filter(b => b.status === 'confirmed').length || 0,
      completed_bookings: bookings?.filter(b => b.status === 'completed').length || 0,
      cancelled_bookings: bookings?.filter(b => b.status === 'cancelled').length || 0,
      today_bookings: bookings?.filter(b => b.booking_date === new Date().toISOString().split('T')[0]).length || 0,
      total_revenue: bookings?.filter(b => b.status === 'completed').reduce((sum, b) => sum + (b.services?.price || 0), 0) || 0,
    };

    return stats;
  } catch (error) {
    console.error("Error fetching booking stats:", error);
    return null;
  }
};