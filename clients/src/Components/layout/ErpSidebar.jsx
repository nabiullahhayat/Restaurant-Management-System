import React, { useState } from "react";
import {
  FiGrid,
  FiShoppingBag,
  FiClock,
  FiCoffee,
  FiUsers,
  FiCalendar,
  FiDollarSign,
  FiTrendingDown,
  FiBook,
  FiSettings,
  FiUser,
  FiShield,
  FiMenu,
  FiChevronDown,
  FiChevronRight,
  FiLogOut,
  FiLayers,
} from "react-icons/fi";
import { useTranslation } from "../../../node_modules/react-i18next";
import Logo from "../../images/logo.jpg";
import LanguageSwitcher from "../UI/LanguageSwitcher";

const MENU_STRUCTURE = [
  {
    group: "Main",
    groupKey: "Main",
    items: [
      { key: "Overview", label: "Dashboard", icon: FiGrid, permissions: ["overview_access", "admin_access"] },
    ],
  },
  {
    group: "POS",
    groupKey: "POS",
    items: [
      { key: "OrderHistory", label: "Order History", icon: FiClock, permissions: ["order_history_access", "admin_access"] },
    ],
  },
  {
    group: "Restaurant",
    groupKey: "Restaurant",
    items: [
      { key: "Foods", label: "Foods", icon: FiCoffee, permissions: ["food_access", "admin_access"] },
      { key: "Tables", label: "Tables", icon: FiLayers, permissions: ["table_access", "admin_access"] },
      { key: "Menus", label: "Menu Categories", icon: FiShoppingBag, permissions: ["panel_access", "admin_access"], adminTab: "Menus" },
    ],
  },
  {
    group: "Human Resources",
    groupKey: "HumanResources",
    items: [
      { key: "Staff", label: "Staff", icon: FiUsers, permissions: ["panel_access", "admin_access"], adminTab: "Staff" },
      { key: "Attendance", label: "Attendance", icon: FiCalendar, permissions: ["panel_access", "admin_access", "salary_access"] },
      { key: "Salary", label: "Salary", icon: FiDollarSign, permissions: ["salary_access", "admin_access"] },
    ],
  },
  {
    group: "Finance",
    groupKey: "Finance",
    items: [
      { key: "Expenses", label: "Expenses", icon: FiTrendingDown, permissions: ["expense_access", "admin_access"] },
      { key: "Dakhal", label: "Dakhal", icon: FiBook, permissions: ["expense_access", "admin_access"] },
    ],
  },
  {
    group: "Users & Access",
    groupKey: "UsersAndAccess",
    items: [
      { key: "Garsons", label: "System Users", icon: FiUser, permissions: ["panel_access", "admin_access"], adminTab: "Garsons" },
      { key: "Role", label: "Roles & Permissions", icon: FiShield, permissions: ["panel_access", "admin_access"], adminTab: "Role" },
    ],
  },
];

function ErpSidebar({ activeMenu, onMenuClick, onLogout, userPermissions = [], isMobile, sidebarOpen, onToggle }) {
  const { t, i18n } = useTranslation("common");
  const isRTL = i18n.language === "ps";
  const [collapsedGroups, setCollapsedGroups] = useState({});

  const hasPermission = (permissions) =>
    permissions.some((p) => userPermissions.includes(p));

  const toggleGroup = (group) => {
    setCollapsedGroups((prev) => ({ ...prev, [group]: !prev[group] }));
  };

  const handleItemClick = (item) => {
    onMenuClick(item.key, item.adminTab || null, item.externalPath || null);
    if (isMobile) onToggle(false);
  };

  const sidebarClass = `
    erp-sidebar fixed top-0 ${isRTL ? "right-0 border-r-0 border-l" : "left-0"} h-full z-40
    transition-transform duration-200
    ${sidebarOpen ? "translate-x-0" : isRTL ? "translate-x-full" : "-translate-x-full"}
    md:translate-x-0
  `;

  return (
    <>
      {isMobile && sidebarOpen && (
        <div className="fixed inset-0 bg-black/30 z-30 md:hidden" onClick={() => onToggle(false)} />
      )}

      <aside className={sidebarClass}>
        <div className="erp-sidebar-logo flex flex-col items-center justify-center text-center gap-2">
          <img src={Logo} alt="Logo" className="w-16 h-16 rounded-full object-cover" />
          <div className="erp-sidebar-logo-text">{t("AdminDashboard", { defaultValue: "Restaurant ERP" })}</div>
        </div>

        <nav className="erp-sidebar-nav">
          {MENU_STRUCTURE.map((section) => {
            const visibleItems = section.items.filter((item) => hasPermission(item.permissions));
            if (visibleItems.length === 0) return null;

            const isCollapsed = collapsedGroups[section.group];

            return (
              <div key={section.group}>
                <button
                  type="button"
                  className="w-full flex items-center justify-between erp-nav-group-label cursor-pointer hover:text-slate-400"
                  onClick={() => toggleGroup(section.group)}
                >
                  <span>{t(section.groupKey, { defaultValue: section.group })}</span>
                  {isCollapsed ? <FiChevronRight size={12} /> : <FiChevronDown size={12} />}
                </button>

                {!isCollapsed && (
                  <div className="erp-nav-sub">
                    {visibleItems.map((item) => {
                      const Icon = item.icon;
                      const isActive = activeMenu === item.key;
                      return (
                        <div
                          key={item.key}
                          className={`erp-nav-item ${isActive ? "active" : ""}`}
                          onClick={() => handleItemClick(item)}
                          role="button"
                          tabIndex={0}
                          onKeyDown={(e) => e.key === "Enter" && handleItemClick(item)}
                        >
                          <Icon />
                          <span>{t(item.label.replace(/\s/g, ""), { defaultValue: item.label })}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        <div className="erp-sidebar-footer">
          <LanguageSwitcher variant="sidebar" />
          <div className="erp-nav-item" onClick={onLogout} role="button" tabIndex={0}>
            <FiLogOut />
            <span>{t("Logout", { defaultValue: "Logout" })}</span>
          </div>
        </div>
      </aside>
    </>
  );
}

export function ErpTopbar({ title, subtitle, isMobile, onMenuToggle }) {
  return (
    <header className="erp-topbar">
      <div className="flex items-center gap-3">
        {isMobile && (
          <button type="button" className="btn-secondary p-2 md:hidden" onClick={onMenuToggle}>
            <FiMenu size={18} />
          </button>
        )}
        <div>
          <h1 className="erp-page-title">{title}</h1>
          {subtitle && <p className="erp-page-subtitle">{subtitle}</p>}
        </div>
      </div>
    </header>
  );
}

export default ErpSidebar;
