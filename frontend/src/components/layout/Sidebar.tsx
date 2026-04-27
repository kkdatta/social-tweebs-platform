import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  Search, 
  Users, 
  BarChart3, 
  Target, 
  Settings, 
  HelpCircle,
  CreditCard,
  UserCog,
  TrendingUp,
  FileText,
  Shield,
  Sparkles,
  MessageCircle,
  Calculator,
  Handshake,
  FileBarChart,
  Scale,
  DollarSign,
  UsersRound,
  AtSign,
  X,
  Swords,
  UserCheck
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

/** Matches backend `FeatureName` (e.g. INFLUENCER_DISCOVERY). */
type FeatureKey =
  | 'INFLUENCER_DISCOVERY'
  | 'INFLUENCER_INSIGHTS'
  | 'PAID_COLLABORATION'
  | 'AUDIENCE_OVERLAP'
  | 'INFLUENCER_TIE_BREAKER'
  | 'CUSTOM_ER_CALCULATOR'
  | 'SOCIAL_SENTIMENTS'
  | 'INFLUENCER_COLLAB_CHECK'
  | 'MENTION_TRACKING'
  | 'CAMPAIGN_TRACKING'
  | 'INFLUENCERS_GROUP'
  | 'COMPETITION_ANALYSIS';

interface NavItem {
  name: string;
  path: string;
  icon: React.ElementType;
  roles?: string[];
  /** If set, non–super-admins only see this when the feature is in `user.featureAccess`. */
  feature?: FeatureKey;
}

interface SidebarProps {
  onClose?: () => void;
}

const navItems: NavItem[] = [
  { name: 'Influencer Discovery', path: '/discovery', icon: Search, feature: 'INFLUENCER_DISCOVERY' },
  { name: 'Influencer Insights', path: '/insights', icon: Sparkles, feature: 'INFLUENCER_INSIGHTS' },
  { name: 'Campaign Tracking', path: '/campaigns', icon: Target, feature: 'CAMPAIGN_TRACKING' },
  { name: 'Audience Overlap', path: '/audience-overlap', icon: Users, feature: 'AUDIENCE_OVERLAP' },
  { name: 'Influencer Tie Breaker', path: '/tie-breaker', icon: Scale, feature: 'INFLUENCER_TIE_BREAKER' },
  { name: 'Custom ER Calculator', path: '/custom-er', icon: Calculator, feature: 'CUSTOM_ER_CALCULATOR' },
  { name: 'Social Sentiments', path: '/sentiments', icon: MessageCircle, feature: 'SOCIAL_SENTIMENTS' },
  { name: 'Collab Check', path: '/collab-check', icon: Handshake, feature: 'INFLUENCER_COLLAB_CHECK' },
  { name: 'Paid Collaboration', path: '/paid-collaboration', icon: DollarSign, feature: 'PAID_COLLABORATION' },
  { name: 'Mention Tracking', path: '/mention-tracking', icon: AtSign, feature: 'MENTION_TRACKING' },
  { name: 'Competition Analysis', path: '/competition-analysis', icon: Swords, feature: 'COMPETITION_ANALYSIS' },
  { name: 'Influencer Groups', path: '/influencer-groups', icon: UsersRound, feature: 'INFLUENCERS_GROUP' },
  { name: 'Generated Reports', path: '/generated-reports', icon: FileBarChart },
  { name: 'Analytics', path: '/analytics', icon: BarChart3 },
  { name: 'Signup Approvals', path: '/signup-approvals', icon: UserCheck, roles: ['SUPER_ADMIN'] },
  { name: 'Team Management', path: '/team', icon: UserCog, roles: ['SUPER_ADMIN', 'ADMIN'] },
  { name: 'Credits', path: '/credits', icon: CreditCard },
];

const bottomNavItems: NavItem[] = [
  { name: 'FAQ', path: '/faq', icon: HelpCircle },
  { name: 'Privacy Policy', path: '/privacy', icon: Shield },
  { name: 'Terms & Conditions', path: '/terms', icon: FileText },
  { name: 'Settings', path: '/settings', icon: Settings },
];

const Sidebar: React.FC<SidebarProps> = ({ onClose }) => {
  const { user } = useAuth();

  const filteredNavItems = navItems.filter((item) => {
    if (!user) return false;
    if (item.roles && !item.roles.includes(user.role)) return false;
    if (user.role === 'SUPER_ADMIN') return true;
    if (!item.feature) return true;
    if (user.featureAccess === undefined) return true;
    return user.featureAccess.includes(item.feature);
  });

  return (
    <aside className="w-64 bg-white border-r border-gray-200 h-full flex flex-col">
      {/* Logo */}
      <div className="h-16 flex items-center justify-between px-4 sm:px-6 border-b border-gray-200 shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-primary-700 rounded-lg flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-white" />
          </div>
          <span className="text-lg sm:text-xl font-bold bg-gradient-to-r from-primary-600 to-primary-800 bg-clip-text text-transparent">
            SocialTweebs
          </span>
        </div>
        {/* Close button - only on mobile */}
        {onClose && (
          <button
            onClick={onClose}
            className="lg:hidden p-2 -mr-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <div className="mb-4">
          <p className="px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
            Main Menu
          </p>
          {filteredNavItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-primary-50 text-primary-700 shadow-sm'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`
              }
            >
              <item.icon className="w-5 h-5 shrink-0" />
              <span className="truncate">{item.name}</span>
            </NavLink>
          ))}
        </div>
      </nav>

      {/* Bottom Navigation */}
      <div className="px-3 py-4 border-t border-gray-200 shrink-0">
        <p className="px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
          Support
        </p>
        {bottomNavItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-gray-100 text-gray-900'
                  : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'
              }`
            }
          >
            <item.icon className="w-4 h-4 shrink-0" />
            <span className="truncate">{item.name}</span>
          </NavLink>
        ))}
      </div>
    </aside>
  );
};

export default Sidebar;
