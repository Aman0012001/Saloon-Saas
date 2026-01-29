import { supabase } from "@/integrations/supabase/client";

/**
 * Debug utility to check database state and help troubleshoot issues
 */
export const debugDatabase = async () => {
  console.log("🔍 Debugging Database State...");
  
  try {
    // Check salons
    const { data: salons, error: salonsError } = await supabase
      .from("salons")
      .select("id, name, is_active")
      .limit(5);
    
    console.log("📍 Salons:", salons?.length || 0, "found");
    if (salonsError) console.error("Salons error:", salonsError);
    else console.log("Sample salons:", salons);
    
    // Check services
    const { data: services, error: servicesError } = await supabase
      .from("services")
      .select("id, name, salon_id, is_active")
      .limit(5);
    
    console.log("🛠️ Services:", services?.length || 0, "found");
    if (servicesError) console.error("Services error:", servicesError);
    else console.log("Sample services:", services);
    
    // Check if services have salon_id
    const servicesWithoutSalon = services?.filter(s => !s.salon_id) || [];
    console.log("⚠️ Services without salon_id:", servicesWithoutSalon.length);
    
    // Check user roles
    const { data: userRoles, error: rolesError } = await supabase
      .from("user_roles")
      .select("user_id, salon_id, role")
      .limit(5);
    
    console.log("👥 User Roles:", userRoles?.length || 0, "found");
    if (rolesError) console.error("User roles error:", rolesError);
    else console.log("Sample roles:", userRoles);
    
    // Check current user
    const { data: { user } } = await supabase.auth.getUser();
    console.log("👤 Current User:", user?.id || "Not logged in");
    
    // Check bookings
    const { data: bookings, error: bookingsError } = await supabase
      .from("bookings")
      .select("id, salon_id, user_id, status")
      .limit(5);
    
    console.log("📅 Bookings:", bookings?.length || 0, "found");
    if (bookingsError) console.error("Bookings error:", bookingsError);
    else console.log("Sample bookings:", bookings);
    
    return {
      salons: salons || [],
      services: services || [],
      userRoles: userRoles || [],
      bookings: bookings || [],
      currentUser: user,
      issues: {
        noSalons: !salons || salons.length === 0,
        noServices: !services || services.length === 0,
        servicesWithoutSalon: servicesWithoutSalon.length > 0,
        noUserRoles: !userRoles || userRoles.length === 0,
      }
    };
    
  } catch (error) {
    console.error("Debug failed:", error);
    return null;
  }
};

/**
 * Create sample data if missing
 */
export const createSampleData = async () => {
  console.log("🏗️ Creating sample data...");
  
  try {
    // Create sample salons
    const { data: existingSalons } = await supabase
      .from("salons")
      .select("id")
      .limit(1);
    
    if (!existingSalons || existingSalons.length === 0) {
      console.log("Creating sample salons...");
      
      const { data: newSalons, error: salonError } = await supabase
        .from("salons")
        .insert([
          {
            name: "Glamour Saloon",
            slug: "glamour-saloon",
            description: "Premium beauty salon with expert stylists",
            address: "123 Fashion Street, Bandra West",
            city: "Mumbai",
            state: "Maharashtra",
            pincode: "400050",
            phone: "+91 98765 43210",
            email: "info@glamoursaloon.com",
            is_active: true
          },
          {
            name: "Elite Beauty Lounge",
            slug: "elite-beauty-lounge", 
            description: "Luxury salon offering complete beauty services",
            address: "456 Park Avenue, Connaught Place",
            city: "New Delhi",
            state: "Delhi",
            pincode: "110001",
            phone: "+91 98765 43211",
            email: "contact@elitebeauty.com",
            is_active: true
          }
        ])
        .select();
      
      if (salonError) {
        console.error("Error creating salons:", salonError);
        return false;
      }
      
      console.log("✅ Created salons:", newSalons?.length);
      
      // Create services for each salon
      if (newSalons && newSalons.length > 0) {
        const services = [];
        
        for (const salon of newSalons) {
          services.push(
            {
              salon_id: salon.id,
              name: "Haircut & Styling",
              description: "Professional haircut with expert styling",
              price: 299,
              duration_minutes: 30,
              category: "Hair",
              is_active: true
            },
            {
              salon_id: salon.id,
              name: "Hair Coloring",
              description: "Full hair color treatment",
              price: 999,
              duration_minutes: 90,
              category: "Hair",
              is_active: true
            },
            {
              salon_id: salon.id,
              name: "Facial Treatment",
              description: "Deep cleansing facial",
              price: 599,
              duration_minutes: 45,
              category: "Skin",
              is_active: true
            },
            {
              salon_id: salon.id,
              name: "Manicure",
              description: "Complete nail care for hands",
              price: 349,
              duration_minutes: 30,
              category: "Nails",
              is_active: true
            }
          );
        }
        
        const { data: newServices, error: serviceError } = await supabase
          .from("services")
          .insert(services)
          .select();
        
        if (serviceError) {
          console.error("Error creating services:", serviceError);
        } else {
          console.log("✅ Created services:", newServices?.length);
        }
      }
    }
    
    return true;
  } catch (error) {
    console.error("Error creating sample data:", error);
    return false;
  }
};

/**
 * Fix existing services to have salon_id
 */
export const fixServicesWithoutSalon = async (targetSalonId?: string) => {
  console.log("🔧 Fixing services without salon_id...");
  
  try {
    // Get services without salon_id
    const { data: orphanServices } = await supabase
      .from("services")
      .select("*")
      .is("salon_id", null);
    
    if (!orphanServices || orphanServices.length === 0) {
      console.log("✅ No orphan services found");
      return true;
    }
    
    console.log("Found", orphanServices.length, "services without salon_id");
    
    // Get salon to associate with (prefer targetSalonId if provided)
    let salonId = targetSalonId;
    
    if (!salonId) {
      const { data: salons } = await supabase
        .from("salons")
        .select("id")
        .limit(1);
      
      if (!salons || salons.length === 0) {
        console.log("❌ No salons found to associate services with");
        return false;
      }
      
      salonId = salons[0].id;
    }
    
    console.log("🏢 Associating services with salon:", salonId);
    
    // If targetSalonId is provided, create copies of services for this salon
    if (targetSalonId) {
      // Create service copies for the target salon
      const serviceCopies = orphanServices.map(service => ({
        salon_id: targetSalonId,
        name: service.name,
        description: service.description,
        price: service.price,
        duration_minutes: service.duration_minutes,
        category: service.category,
        image_url: service.image_url,
        is_active: service.is_active,
      }));
      
      const { error: insertError } = await supabase
        .from("services")
        .insert(serviceCopies);
      
      if (insertError) {
        console.error("Error creating service copies:", insertError);
        return false;
      }
      
      console.log("✅ Created service copies for salon");
    } else {
      // Update orphan services with salon_id
      const { error } = await supabase
        .from("services")
        .update({ salon_id: salonId })
        .is("salon_id", null);
      
      if (error) {
        console.error("Error fixing services:", error);
        return false;
      }
      
      console.log("✅ Fixed orphan services");
    }
    
    return true;
    
  } catch (error) {
    console.error("Error fixing services:", error);
    return false;
  }
};

/**
 * Ensure services exist for a specific salon
 */
export const ensureServicesForSalon = async (salonId: string) => {
  console.log("🔧 Ensuring services exist for salon:", salonId);
  
  try {
    // Check if salon has services
    const { data: existingServices } = await supabase
      .from("services")
      .select("id")
      .eq("salon_id", salonId)
      .eq("is_active", true);
    
    if (existingServices && existingServices.length > 0) {
      console.log("✅ Salon already has services:", existingServices.length);
      return true;
    }
    
    console.log("🏗️ Creating services for salon...");
    
    // Create basic services for this salon
    const basicServices = [
      {
        salon_id: salonId,
        name: "Haircut & Styling",
        description: "Professional haircut with expert styling",
        price: 299,
        duration_minutes: 30,
        category: "Hair",
        is_active: true,
      },
      {
        salon_id: salonId,
        name: "Hair Coloring",
        description: "Full hair color treatment with premium products",
        price: 999,
        duration_minutes: 90,
        category: "Hair",
        is_active: true,
      },
      {
        salon_id: salonId,
        name: "Facial Treatment",
        description: "Deep cleansing facial for glowing skin",
        price: 599,
        duration_minutes: 45,
        category: "Skin",
        is_active: true,
      },
      {
        salon_id: salonId,
        name: "Manicure",
        description: "Complete nail care for hands with polish",
        price: 349,
        duration_minutes: 30,
        category: "Nails",
        is_active: true,
      },
      {
        salon_id: salonId,
        name: "Pedicure",
        description: "Complete nail care for feet with polish",
        price: 449,
        duration_minutes: 45,
        category: "Nails",
        is_active: true,
      },
    ];
    
    const { data: newServices, error } = await supabase
      .from("services")
      .insert(basicServices)
      .select();
    
    if (error) {
      console.error("Error creating services:", error);
      return false;
    }
    
    console.log("✅ Created services for salon:", newServices?.length);
    return true;
    
  } catch (error) {
    console.error("Error ensuring services:", error);
    return false;
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