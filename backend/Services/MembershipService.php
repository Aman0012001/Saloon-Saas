<?php
require_once __DIR__ . '/NotificationService.php';
require_once __DIR__ . '/InvoiceService.php';

class MembershipService
{
    private $db;
    private $notifService;
    private $invoiceService;

    public function __construct($db)
    {
        $this->db = $db;
        $this->notifService = new NotificationService($db);
        $this->invoiceService = new InvoiceService($db, $this->notifService);
    }

    public function getActivePlan($salonId)
    {
        $stmt = $this->db->prepare("
            SELECT ss.*, sp.name as plan_name, sp.max_staff, sp.max_services, sp.features
            FROM salon_subscriptions ss
            JOIN subscription_plans sp ON ss.plan_id = sp.id
            WHERE ss.salon_id = ? AND ss.status = 'active'
            AND (ss.subscription_end_date IS NULL OR ss.subscription_end_date > NOW())
        ");
        $stmt->execute([$salonId]);
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    public function canAddStaff($salonId)
    {
        $plan = $this->getActivePlan($salonId);
        if (!$plan)
            return false;

        $stmt = $this->db->prepare("SELECT COUNT(*) FROM staff_profiles WHERE salon_id = ?");
        $stmt->execute([$salonId]);
        $count = $stmt->fetchColumn();

        if ($count >= $plan['max_staff']) {
            $this->notifyUpgrade($salonId, 'staff members');
            return false;
        }
        return true;
    }

    public function canAddService($salonId)
    {
        $plan = $this->getActivePlan($salonId);
        if (!$plan)
            return false;

        $stmt = $this->db->prepare("SELECT COUNT(*) FROM services WHERE salon_id = ?");
        $stmt->execute([$salonId]);
        $count = $stmt->fetchColumn();

        if ($count >= $plan['max_services']) {
            $this->notifyUpgrade($salonId, 'services');
            return false;
        }
        return true;
    }

    private function notifyUpgrade($salonId, $feature)
    {
        $ownerId = $this->invoiceService->getSalonOwnerId($salonId);

        if ($ownerId) {
            $this->notifService->notifyUser(
                $ownerId,
                "Upgrade Required",
                "You have reached your limit for $feature. Please upgrade your plan to add more.",
                'warning',
                '/dashboard/billing'
            );
        }

        // Notify Super Admin
        $stmt = $this->db->prepare("
            SELECT ur.user_id 
            FROM user_roles ur 
            JOIN profiles p ON ur.user_id = p.user_id 
            WHERE p.user_type = 'superadmin' 
            LIMIT 1
        ");
        $stmt->execute();
        $superAdminId = $stmt->fetchColumn();

        if ($superAdminId) {
            $stmt = $this->db->prepare("SELECT name FROM salons WHERE id = ?");
            $stmt->execute([$salonId]);
            $salonName = $stmt->fetchColumn();

            $this->notifService->notifyUser(
                $superAdminId,
                "Upgrade Recommended",
                "Salon '$salonName' has reached their limit for $feature.",
                'info',
                '/admin/members'
            );
        }
    }
}
