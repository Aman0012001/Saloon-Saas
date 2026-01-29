import api from "@/services/api";

// Utility function to check and setup user profile using local API
export async function ensureUserProfile(userId: string, userType: 'customer' | 'salon_owner' = 'customer') {
  try {
    // First, try to get existing profile via local API
    const existingProfile = await api.profiles.getById(userId);

    // If profile doesn't exist (handled by API service returning null or throwing), create it
    if (!existingProfile) {
      // Create new profile locally
      const newProfile = await api.profiles.create({
        user_id: userId,
        user_type: userType,
        full_name: 'Local User',
      });

      return newProfile;
    }

    return existingProfile;
  } catch (error) {
    console.error('Error in local ensureUserProfile:', error);
    return null;
  }
}

// Function to update user to salon owner via local API
export async function makeSalonOwner(userId: string, businessData?: {
  businessName?: string;
  city?: string;
  experience?: string;
}) {
  try {
    const updateData: any = {
      user_type: 'salon_owner',
    };

    if (businessData) {
      if (businessData.businessName) updateData.business_name = businessData.businessName;
      if (businessData.city) updateData.city = businessData.city;
      if (businessData.experience) updateData.experience = businessData.experience;
    }

    // Update locally via API
    const data = await api.profiles.update(userId, updateData);

    return data;
  } catch (error) {
    console.error('Error in local makeSalonOwner:', error);
    return null;
  }
}