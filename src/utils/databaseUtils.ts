import { supabase } from "@/integrations/supabase/client";

// Utility function to check and setup user profile
export async function ensureUserProfile(userId: string, userType: 'customer' | 'salon_owner' = 'customer') {
  try {
    // First, try to get existing profile
    const { data: existingProfile, error: fetchError } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error('Error fetching profile:', fetchError);
      return null;
    }

    // If profile doesn't exist, create it
    if (!existingProfile) {
      const { data: newProfile, error: insertError } = await supabase
        .from('profiles')
        .insert({
          user_id: userId,
          user_type: userType,
          full_name: 'User',
        })
        .select()
        .single();

      if (insertError) {
        console.error('Error creating profile:', insertError);
        return null;
      }

      return newProfile;
    }

    return existingProfile;
  } catch (error) {
    console.error('Error in ensureUserProfile:', error);
    return null;
  }
}

// Function to update user to salon owner
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

    const { data, error } = await supabase
      .from('profiles')
      .update(updateData)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      console.error('Error updating to salon owner:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error in makeSalonOwner:', error);
    return null;
  }
}