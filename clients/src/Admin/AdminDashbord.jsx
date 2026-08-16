import React, { useState, useEffect, useContext } from "react";
import { useTranslation } from "../../node_modules/react-i18next";
import { useNavigate } from "react-router-dom";
import Tables from "./Tables";
import OrderHistory from "./OrderHistory";
import FoodDataStorage from "./FoodDataStorage";
import DashboardAnalytics from "./DashboardAnalytics";
import AdminPanel from "./AdminPanel";
import Expenses from "./Expenses";
import Salary from "./Salary";
import Attendance from "./Attendance";
import Dakhal from "./Dakhal";
import ErpSidebar, { ErpTopbar } from "../Components/layout/ErpSidebar";
import { useApi } from "../context/ApiContext";
import { ItemsContext } from "../App";

const ADMIN_PANEL_TABS = ["Staff", "Garsons", "Role", "Menus"];

const PAGE_TITLES = {
  Overview: "Dashboard",
  OrderHistory: "Order History",
  Foods: "Foods",
  Tables: "Tables",
  Staff: "Staff Management",
  Garsons: "System Users",
  Role: "Roles & Permissions",
  Menus: "Menu Categories",
  Attendance: "Staff Attendance",
  Salary: "Salary Management",
  Expenses: "Expenses",
  Dakhal: "Dakhal",
};

function AdminDashboard() {
  const { get } = useApi();
  const { t, i18n } = useTranslation("common");
  const navigate = useNavigate();
  const isRTL = i18n.language === "ps";
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 767);
  const [activeMenu, setActiveMenu] = useState("Overview");
  const [adminTab, setAdminTab] = useState(null);
  const [dashboardData, setDashboardData] = useState(null);
  const [topFood, setTopFood] = useState(null);
  const [salesTrend, setSalesTrend] = useState(null);
  const { user, setIsAuth, setUser: setUserContext } = useContext(ItemsContext);

  useEffect(() => {
    const perms = user?.permissions || [];
    if (perms.includes("admin_access") || perms.includes("overview_access")) {
      setActiveMenu("Overview");
    } else if (perms.includes("table_access")) {
      setActiveMenu("Tables");
    } else if (perms.includes("order_history_access")) {
      setActiveMenu("OrderHistory");
    } else if (perms.includes("food_access")) {
      setActiveMenu("Foods");
    } else if (perms.includes("salary_access")) {
      setActiveMenu("Salary");
    } else if (perms.includes("panel_access")) {
      setActiveMenu("Staff");
      setAdminTab("Staff");
    }
  }, [user?.permissions]);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth <= 767;
      setIsMobile(mobile);
      setSidebarOpen(!mobile);
    };
    window.addEventListener("resize", handleResize);
    handleResize();
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (activeMenu !== "Overview") return;
    Promise.all([
      get("/api/v1/analytics/dashboard-summary"),
      get("/api/v1/analytics/top-selling").catch(() => null),
      get("/api/v1/analytics/sales-comparison?type=monthly").catch(() => null),
    ]).then(([summary, top, trend]) => {
      setDashboardData(summary.data.data);
      setTopFood(top?.data?.data || null);
      setSalesTrend(trend?.data?.data || null);
    }).catch((err) => console.error(err));
  }, [activeMenu]);

  const handleLogout = async () => {
    try {
      await get("/api/v1/user/logout");
    } catch (err) {
      console.error("Logout failed:", err);
    } finally {
      setIsAuth?.(false);
      setUserContext?.(null);
      navigate("/");
    }
  };

  const handleMenuClick = (menu, tab, externalPath) => {
    if (externalPath) {
      navigate(externalPath);
      return;
    }
    setActiveMenu(menu);
    setAdminTab(tab || (ADMIN_PANEL_TABS.includes(menu) ? menu : null));
  };

  const hasPermission = (perms) => perms.some((p) => user?.permissions?.includes(p));

  const formatWhole = (n) => Math.round(Number(n) || 0).toLocaleString();

  const renderContent = () => {
    if (activeMenu === "Overview" && hasPermission(["overview_access", "admin_access"])) {
      return (
        <div className="space-y-4">
          <div className="erp-stat-grid">
            {[
              { label: t("TodayRevenue"), value: `$${formatWhole(dashboardData?.todayRevenue)}` },
              { label: t("MonthRevenue"), value: `$${formatWhole(dashboardData?.monthRevenue)}` },
              { label: t("TodayExpenses"), value: `$${formatWhole(dashboardData?.todayExpenses)}`, color: "text-red-600" },
              { label: t("MonthExpenses"), value: `$${formatWhole(dashboardData?.monthExpenses)}`, color: "text-red-600" },
              { label: t("MonthProfit"), value: `$${formatWhole(dashboardData?.monthProfit)}`, color: "text-green-600" },
              { label: t("TodayOrders"), value: dashboardData?.todayOrders || 0 },
              { label: t("MonthOrders"), value: dashboardData?.monthOrders || 0 },
              { label: t("PaidSalaries"), value: `$${formatWhole(dashboardData?.paidSalaries)}` },
              { label: t("PendingSalaries"), value: `$${formatWhole(dashboardData?.pendingSalaries)}`, color: "text-amber-600" },
              { label: t("SalaryPaidCount"), value: dashboardData?.salaryPaidCount || 0 },
              { label: t("SalaryPendingCount"), value: dashboardData?.salaryPendingCount || 0 },
              { label: t("SalesTrend"), value: salesTrend ? `${Math.round(Number(salesTrend.percentageChange) || 0)}%` : "—", color: salesTrend?.trend === "increase" ? "text-green-600" : "text-red-600" },
            ].map((card) => (
              <div key={card.label} className="erp-stat-card">
                <div className="erp-stat-label">{card.label}</div>
                <div className={`erp-stat-value ${card.color || ""}`}>{card.value}</div>
              </div>
            ))}
          </div>

          <DashboardAnalytics dashboardData={dashboardData} topFood={topFood} />
        </div>
      );
    }

    if (activeMenu === "Tables" && hasPermission(["admin_access", "table_access"])) return <Tables />;
    if (activeMenu === "OrderHistory" && hasPermission(["admin_access", "order_history_access"])) return <OrderHistory />;
    if (activeMenu === "Foods" && hasPermission(["admin_access", "food_access"])) return <FoodDataStorage />;
    if (activeMenu === "Expenses" && hasPermission(["admin_access", "expense_access"])) return <Expenses />;
    if (activeMenu === "Dakhal" && hasPermission(["admin_access", "expense_access"])) return <Dakhal />;
    if (activeMenu === "Salary" && hasPermission(["admin_access", "salary_access"])) return <Salary />;
    if (activeMenu === "Attendance" && hasPermission(["admin_access", "panel_access", "salary_access"])) return <Attendance />;
    if (ADMIN_PANEL_TABS.includes(activeMenu) && hasPermission(["panel_access", "admin_access"])) {
      return <AdminPanel initialTab={adminTab || activeMenu} singleModule />;
    }

    return (
      <div className="erp-panel p-8 text-center text-slate-500">
        {t("NoAccess", { defaultValue: "You do not have access to this module." })}
      </div>
    );
  };

  const pageTitle = t(PAGE_TITLES[activeMenu]?.replace(/\s/g, "") || activeMenu, {
    defaultValue: PAGE_TITLES[activeMenu] || activeMenu,
  });

  return (
    <div className={`erp-layout ${isRTL ? "flex-row-reverse" : ""}`}>
      <ErpSidebar
        activeMenu={activeMenu}
        onMenuClick={handleMenuClick}
        onLogout={handleLogout}
        userPermissions={user?.permissions || []}
        isMobile={isMobile}
        sidebarOpen={sidebarOpen}
        onToggle={setSidebarOpen}
      />
      <div className={`erp-main ${isRTL ? "md:mr-[260px]" : "md:ml-[260px]"}`}>
        <ErpTopbar
          title={pageTitle}
          subtitle={t("RestaurantManagement", { defaultValue: "Hotel & Restaurant Management" })}
          isMobile={isMobile}
          onMenuToggle={() => setSidebarOpen(true)}
        />
        <div className="erp-content">{renderContent()}</div>
      </div>
    </div>
  );
}

export default AdminDashboard;
