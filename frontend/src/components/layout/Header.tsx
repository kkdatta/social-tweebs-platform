import React, { useState, useRef, useEffect } from 'react';
import { 
  Bell, 
  HelpCircle, 
  ChevronDown, 
  User, 
  CreditCard, 
  Clock, 
  LogOut,
  Settings,
  Coins,
  Menu
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

interface HeaderProps {
  onMenuClick?: () => void;
}

const Header: React.FC<HeaderProps> = ({ onMenuClick }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="h-14 sm:h-16 bg-white border-b border-gray-200 flex items-center justify-between px-3 sm:px-6 shrink-0">
      {/* Left Section - Menu Button (mobile) + Page Title */}
      <div className="flex items-center gap-2 sm:gap-4">
        {/* Mobile menu button */}
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 -ml-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
          aria-label="Open menu"
        >
          <Menu className="w-5 h-5" />
        </button>
        <h1 className="text-base sm:text-lg font-semibold text-gray-900 truncate">Dashboard</h1>
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-2 sm:gap-4">
        {/* Credits Display - Compact on mobile */}
        <div className="flex items-center gap-1.5 sm:gap-2 bg-gradient-to-r from-amber-50 to-amber-100 px-2 sm:px-4 py-1.5 sm:py-2 rounded-lg border border-amber-200">
          <Coins className="w-4 sm:w-5 h-4 sm:h-5 text-amber-600" />
          <div className="hidden xs:block">
            <p className="text-[10px] sm:text-xs text-amber-600 font-medium leading-tight">Credits</p>
            <p className="text-xs sm:text-sm font-bold text-amber-700 leading-tight">
              {typeof user?.credits === 'number' ? user.credits.toFixed(2) : '0.00'}
            </p>
          </div>
          <span className="xs:hidden text-xs font-bold text-amber-700">
            {typeof user?.credits === 'number' ? user.credits.toFixed(0) : '0'}
          </span>
        </div>

        {/* Support Button - Hidden on small mobile */}
        <button className="hidden sm:flex p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
          <HelpCircle className="w-5 h-5" />
        </button>

        {/* Notifications */}
        <button className="p-1.5 sm:p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors relative">
          <Bell className="w-4 sm:w-5 h-4 sm:h-5" />
          <span className="absolute top-0.5 sm:top-1 right-0.5 sm:right-1 w-1.5 sm:w-2 h-1.5 sm:h-2 bg-red-500 rounded-full"></span>
        </button>

        {/* Profile Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setIsProfileOpen(!isProfileOpen)}
            className="flex items-center gap-1.5 sm:gap-3 px-1.5 sm:px-3 py-1.5 sm:py-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <div className="w-7 sm:w-8 h-7 sm:h-8 bg-gradient-to-br from-primary-500 to-primary-700 rounded-full flex items-center justify-center text-white text-xs sm:text-sm font-semibold shrink-0">
              {user?.name?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div className="text-left hidden md:block">
              <p className="text-sm font-medium text-gray-900 truncate max-w-[120px]">{user?.name || 'User'}</p>
              <p className="text-xs text-gray-500">{user?.role?.replace('_', ' ') || 'Member'}</p>
            </div>
            <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform hidden sm:block ${isProfileOpen ? 'rotate-180' : ''}`} />
          </button>

          {/* Dropdown Menu */}
          {isProfileOpen && (
            <div className="absolute right-0 mt-2 w-56 sm:w-64 bg-white rounded-xl shadow-lg border border-gray-200 py-2 z-50 animate-fadeIn">
              {/* User Info */}
              <div className="px-4 py-3 border-b border-gray-100">
                <p className="text-sm font-semibold text-gray-900 truncate">{user?.name}</p>
                <p className="text-xs text-gray-500 truncate">{user?.email}</p>
              </div>

              {/* Mobile-only Credits display */}
              <div className="px-4 py-2 border-b border-gray-100 sm:hidden">
                <div className="flex items-center gap-2">
                  <Coins className="w-4 h-4 text-amber-600" />
                  <span className="text-sm font-medium text-gray-700">
                    {typeof user?.credits === 'number' ? user.credits.toFixed(2) : '0.00'} Credits
                  </span>
                </div>
              </div>

              {/* Menu Items */}
              <div className="py-2">
                <button
                  onClick={() => { navigate('/profile'); setIsProfileOpen(false); }}
                  className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                >
                  <User className="w-4 h-4" />
                  Profile Info
                </button>
                <button
                  onClick={() => { navigate('/credits'); setIsProfileOpen(false); }}
                  className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                >
                  <CreditCard className="w-4 h-4" />
                  Credit Guide
                </button>
                <button
                  onClick={() => { navigate('/settings'); setIsProfileOpen(false); }}
                  className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                >
                  <Settings className="w-4 h-4" />
                  Settings
                </button>
                {/* Mobile-only Help link */}
                <button
                  onClick={() => { navigate('/faq'); setIsProfileOpen(false); }}
                  className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 sm:hidden"
                >
                  <HelpCircle className="w-4 h-4" />
                  Help & FAQ
                </button>
                <div className="px-4 py-2 border-t border-gray-100 mt-2">
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Clock className="w-3 h-3" />
                    Account expires in 30 days
                  </div>
                </div>
              </div>

              {/* Logout */}
              <div className="border-t border-gray-100 pt-2">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                >
                  <LogOut className="w-4 h-4" />
                  Logout
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
