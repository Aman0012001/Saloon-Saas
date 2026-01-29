export const generateWhatsAppLink = (phone: string, message: string) => {
    // Clean phone number (remove +, spaces, etc)
    const cleanPhone = phone.replace(/\D/g, '');
    const encodedMsg = encodeURIComponent(message);
    return `https://wa.me/${cleanPhone}?text=${encodedMsg}`;
};

export const sendAppointmentConfirmation = (booking: any, salon: any) => {
    const message = `Hello ${booking.user_name || 'Customer'},\n\nThis is a confirmation for your appointment at ${salon.name}.\n\n📅 Date: ${booking.booking_date}\n⏰ Time: ${booking.booking_time}\n✂️ Service: ${booking.service_name}\n\nWe look forward to seeing you!`;

    const link = generateWhatsAppLink(booking.user_phone || '', message);
    window.open(link, '_blank');
};
