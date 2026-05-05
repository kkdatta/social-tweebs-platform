import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  ArrowLeft, Download, RefreshCw, Share2, Users, Heart, MessageCircle,
  Eye, MapPin, BadgeCheck, TrendingUp, Globe, Calendar, ExternalLink,
  BarChart3, PieChart, Instagram, Youtube, Sparkles, Play, AlertCircle,
  Hash, ChevronDown, ChevronRight, UserPlus, FolderPlus, X, CloudRainWind,
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart as RePieChart, Pie, Cell, BarChart, Bar, LineChart, Line, Legend,
} from 'recharts';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import {
  ComposableMap, Geographies, Geography, Marker, ZoomableGroup,
} from 'react-simple-maps';
import { insightsApi, influencerGroupsApi, campaignsApi } from '../../services/api';

const COLORS = ['#6366f1', '#8b5cf6', '#a855f7', '#d946ef', '#ec4899', '#f97316', '#14b8a6'];
const PIE_COLORS = ['#22c55e', '#6366f1', '#f59e0b', '#ef4444'];

const GEO_URL = 'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json';

const COUNTRY_COORDS: Record<string, [number, number]> = {
  'India': [78.9, 20.6], 'United States': [-95.7, 37.1], 'United Kingdom': [-1.2, 52.2],
  'Canada': [-106.3, 56.1], 'Australia': [133.8, -25.3], 'Germany': [10.5, 51.2],
  'France': [2.2, 46.2], 'Brazil': [-51.9, -14.2], 'Japan': [138.3, 36.2],
  'Mexico': [-102.6, 23.6], 'Italy': [12.6, 41.9], 'Spain': [-3.7, 40.5],
  'Russia': [105.3, 61.5], 'China': [104.2, 35.9], 'South Korea': [128.0, 35.9],
  'Indonesia': [113.9, -0.8], 'Turkey': [35.2, 38.9], 'Saudi Arabia': [45.1, 23.9],
  'Nigeria': [8.7, 9.1], 'South Africa': [22.9, -30.6], 'Argentina': [-63.6, -38.4],
  'Colombia': [-74.3, 4.6], 'Egypt': [30.8, 26.8], 'Pakistan': [69.3, 30.4],
  'Bangladesh': [90.4, 23.7], 'Thailand': [101.0, 15.9], 'Vietnam': [108.3, 14.1],
  'Philippines': [122.0, 12.9], 'Malaysia': [101.7, 4.2], 'Netherlands': [5.3, 52.1],
  'Sweden': [18.6, 60.1], 'Poland': [19.1, 51.9], 'Belgium': [4.5, 50.5],
  'Switzerland': [8.2, 46.8], 'Portugal': [-8.2, 39.4], 'Greece': [21.8, 39.1],
  'Czech Republic': [15.5, 49.8], 'Romania': [24.97, 45.9], 'Ireland': [-8.2, 53.4],
  'Austria': [14.6, 47.5], 'Norway': [8.5, 60.5], 'Denmark': [9.5, 56.3],
  'Finland': [25.7, 61.9], 'Israel': [34.9, 31.0], 'Singapore': [103.8, 1.4],
  'New Zealand': [174.9, -40.9], 'Chile': [-71.5, -35.7], 'Peru': [-75.0, -9.2],
  'United Arab Emirates': [53.8, 23.4], 'Kenya': [37.9, -0.02], 'Ghana': [-1.02, 7.9],
  'Morocco': [-7.1, 31.8], 'Ukraine': [31.2, 48.4], 'Iran': [53.7, 32.4],
  'Iraq': [43.7, 33.2], 'Sri Lanka': [80.8, 7.9], 'Nepal': [84.1, 28.4],
  'Hungary': [19.5, 47.2], 'Taiwan': [121.0, 23.7], 'Qatar': [51.2, 25.4],
  'Kuwait': [47.5, 29.3], 'Oman': [55.9, 21.5], 'Jordan': [36.2, 30.6],
  'Lebanon': [35.9, 33.9], 'Ethiopia': [40.5, 9.1], 'Tanzania': [34.9, -6.4],
  'Myanmar': [96.0, 21.9], 'Cambodia': [105.0, 12.6],
};

const CITY_COORDS: Record<string, [number, number]> = {
  'Mumbai': [72.88, 19.08], 'Delhi': [77.21, 28.61], 'Bangalore': [77.59, 12.97],
  'Bengaluru': [77.59, 12.97], 'Hyderabad': [78.47, 17.39], 'Chennai': [80.27, 13.08],
  'Kolkata': [88.36, 22.57], 'Pune': [73.86, 18.52], 'Ahmedabad': [72.58, 23.02],
  'Jaipur': [75.79, 26.91], 'Lucknow': [80.95, 26.85], 'Surat': [72.83, 21.17],
  'New York': [-74.0, 40.71], 'Los Angeles': [-118.24, 34.05], 'Chicago': [-87.63, 41.88],
  'Houston': [-95.37, 29.76], 'Miami': [-80.19, 25.76], 'San Francisco': [-122.42, 37.77],
  'London': [-0.13, 51.51], 'Paris': [2.35, 48.86], 'Berlin': [13.41, 52.52],
  'Tokyo': [139.69, 35.69], 'Sydney': [151.21, -33.87], 'Toronto': [-79.38, 43.65],
  'Dubai': [55.27, 25.2], 'Singapore': [103.85, 1.29], 'São Paulo': [-46.63, -23.55],
  'Jakarta': [106.85, -6.21], 'Bangkok': [100.5, 13.76], 'Istanbul': [28.98, 41.01],
  'Moscow': [37.62, 55.76], 'Seoul': [126.98, 37.57], 'Lagos': [3.39, 6.52],
  'Cairo': [31.24, 30.04], 'Riyadh': [46.72, 24.69], 'Kuala Lumpur': [101.69, 3.14],
  'Manila': [120.98, 14.6], 'Karachi': [67.01, 24.86], 'Dhaka': [90.41, 23.81],
  'Lima': [-77.04, -12.05], 'Mexico City': [-99.13, 19.43], 'Bogota': [-74.07, 4.71],
  'Buenos Aires': [-58.38, -34.6], 'Nairobi': [36.82, -1.29], 'Cape Town': [18.42, -33.93],
  'Johannesburg': [28.05, -26.2], 'Amsterdam': [4.9, 52.37], 'Madrid': [-3.7, 40.42],
  'Rome': [12.5, 41.9], 'Barcelona': [2.17, 41.39], 'Milan': [9.19, 45.46],
  'Melbourne': [144.96, -37.81], 'Vancouver': [-123.12, 49.28], 'Montreal': [-73.57, 45.5],
};

const STATE_COORDS: Record<string, [number, number]> = {
  'Maharashtra': [75.71, 19.75], 'Karnataka': [75.71, 15.32], 'Tamil Nadu': [78.66, 11.13],
  'Uttar Pradesh': [80.95, 26.85], 'Gujarat': [71.19, 22.26], 'Rajasthan': [74.22, 27.02],
  'West Bengal': [87.85, 22.99], 'Madhya Pradesh': [78.66, 23.47], 'Kerala': [76.27, 10.85],
  'Telangana': [79.02, 18.11], 'Andhra Pradesh': [79.74, 15.91], 'Bihar': [85.31, 25.1],
  'Punjab': [75.34, 31.15], 'Haryana': [76.09, 29.06], 'Delhi': [77.1, 28.7],
  'California': [-119.42, 36.78], 'Texas': [-99.9, 31.97], 'New York': [-74.22, 43.3],
  'Florida': [-81.52, 27.66], 'Illinois': [-89.4, 40.63], 'Ohio': [-82.91, 40.42],
  'Pennsylvania': [-77.21, 41.2], 'Georgia': [-82.9, 32.17], 'England': [-1.17, 52.36],
  'Scotland': [-4.2, 56.49], 'Wales': [-3.78, 51.48], 'Ontario': [-85.32, 51.25],
  'Queensland': [144.38, -22.58], 'Victoria': [145.61, -37.47],
  'São Paulo': [-48.55, -22.19], 'Rio de Janeiro': [-43.17, -22.91],
};

const getLocationCoords = (name: string, type: 'country' | 'state' | 'city'): [number, number] | null => {
  if (type === 'country') return COUNTRY_COORDS[name] || null;
  if (type === 'city') return CITY_COORDS[name] || null;
  return STATE_COORDS[name] || null;
};

interface ViewMoreModalProps {
  title: string;
  columns: { key: string; label: string; render?: (row: any) => React.ReactNode }[];
  data: any[];
  onClose: () => void;
}

const ViewMoreModal: React.FC<ViewMoreModalProps> = ({ title, columns, data, onClose }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 print:hidden">
    <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl mx-4 max-h-[80vh] flex flex-col animate-fadeIn">
      <div className="flex items-center justify-between p-4 border-b">
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600 print:hidden"><X className="w-5 h-5" /></button>
      </div>
      <div className="overflow-auto flex-1 p-4">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>{columns.map(c => <th key={c.key} className="px-3 py-2 text-left font-semibold text-gray-600">{c.label}</th>)}</tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {data.map((row, i) => (
              <tr key={i} className="hover:bg-gray-50">
                {columns.map(c => (
                  <td key={c.key} className="px-3 py-2 text-gray-700">
                    {c.render ? c.render(row)
                      : c.key === 'url' || c.key === 'postUrl'
                      ? row[c.key] ? <a href={row[c.key]} target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:underline flex items-center gap-1">Open <ExternalLink className="w-3 h-3" /></a> : '-'
                      : typeof row[c.key] === 'number' ? row[c.key].toLocaleString() : row[c.key] || '-'}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  </div>
);

const formatNum = (num: number | undefined | null): string => {
  if (num === undefined || num === null) return '0';
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num.toLocaleString();
};

const formatDate = (value: string | undefined | null): string => {
  if (!value) return '';
  try {
    const d = new Date(value);
    if (isNaN(d.getTime())) return value;
    return d.toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' });
  } catch {
    return value;
  }
};

/** Modash items often use `weight` (0–1); mock/local data may use `percentage` (0–100). */
const itemWeightOrPct = (item: any): number | null => {
  if (!item || typeof item !== 'object') return null;
  if (typeof item.percentage === 'number' && Number.isFinite(item.percentage)) return item.percentage;
  if (typeof item.usagePercentage === 'number' && Number.isFinite(item.usagePercentage)) return item.usagePercentage;
  if (typeof item.weight === 'number' && Number.isFinite(item.weight)) return item.weight * 100;
  return null;
};

/** Percentage for display (includes %). */
const pctDisplay = (pct: number | null, digits = 1): string =>
  pct != null && Number.isFinite(pct) ? `${pct.toFixed(digits)}%` : '—';

const brandRowLabel = (b: any): string => b?.brand ?? b?.name ?? '—';
const interestRowLabel = (int: any): string => int?.category ?? int?.name ?? '—';

const locationRowLabel = (loc: any, tab: 'country' | 'state' | 'city'): string => {
  if (!loc || typeof loc !== 'object') return '—';
  if (tab === 'country') return loc.name ?? loc.country ?? loc.code ?? '—';
  if (tab === 'state') return loc.name ?? loc.state ?? loc.code ?? '—';
  return loc.name ?? loc.city ?? loc.code ?? '—';
};

const InsightsPage: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, updateUser } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [insights, setInsights] = useState<any>(null);
  const [error, setError] = useState('');
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [viewMoreData, setViewMoreData] = useState<ViewMoreModalProps | null>(null);

  const [locationTab, setLocationTab] = useState<'country' | 'state' | 'city'>('country');
  const [locationView, setLocationView] = useState<'list' | 'map'>('list');
  const [postCategory, setPostCategory] = useState<'popular' | 'sponsored' | 'recent'>('popular');
  const [reelCategory, setReelCategory] = useState<'popular' | 'recent'>('popular');
  const [isPdfExporting, setIsPdfExporting] = useState(false);
  const pdfContainerRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => { if (id) fetchInsight(); }, [id]);

  const fetchInsight = async () => {
    try {
      setIsLoading(true); setError('');
      const data = await insightsApi.getById(id!);
      setInsights(data);
    } catch (err: any) { setError(err.response?.data?.message || 'Failed to load insight');
    } finally { setIsLoading(false); }
  };

  const handleRefresh = async () => {
    if (!confirm('Refreshing this insight will cost 1 credit. Continue?')) return;
    try {
      setIsRefreshing(true);
      const result = await insightsApi.refresh(id!);
      setInsights(result.insight);
      if (user && result.remainingBalance !== undefined) updateUser({ ...user, credits: result.remainingBalance });
      if (result.creditsUsed > 0) alert(`Insight refreshed! ${result.creditsUsed} credit used. Remaining: ${result.remainingBalance}`);
    } catch (err: any) { alert(err.response?.data?.message || 'Failed to refresh insight');
    } finally { setIsRefreshing(false); }
  };

  const handleShare = async () => {
    const url = window.location.href;
    try { await navigator.clipboard.writeText(url); alert('Link copied to clipboard!'); } catch { alert('Copy this link: ' + url); }
  };

  const handleExportJSON = () => {
    if (!insights) return;
    const dataStr = JSON.stringify(insights, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url; link.download = `${insights.username}_insight_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link); link.click(); document.body.removeChild(link); URL.revokeObjectURL(url);
  };

  const handleExportPDF = async () => {
    if (!insights) return;
    try {
      setIsPdfExporting(true);
      await new Promise(r => setTimeout(r, 800));

      const container = pdfContainerRef.current;
      if (!container) { setIsPdfExporting(false); return; }

      const origWidth = container.style.width;
      container.style.width = '900px';
      container.querySelectorAll('.line-clamp-2, .line-clamp-3, .truncate').forEach(el => {
        (el as HTMLElement).style.setProperty('-webkit-line-clamp', 'unset', 'important');
        (el as HTMLElement).style.setProperty('overflow', 'visible', 'important');
        (el as HTMLElement).style.setProperty('text-overflow', 'unset', 'important');
        (el as HTMLElement).style.setProperty('white-space', 'normal', 'important');
      });
      await new Promise(r => setTimeout(r, 300));

      const sections = container.querySelectorAll<HTMLElement>('.pdf-section');
      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const W = doc.internal.pageSize.getWidth();
      const H = doc.internal.pageSize.getHeight();
      const M = 8;
      const usableW = W - M * 2;
      const usableH = H - M - 12;
      let y = M;
      let isFirstImage = true;

      for (const section of Array.from(sections)) {
        const canvas = await html2canvas(section, {
          scale: 2,
          useCORS: true,
          allowTaint: true,
          backgroundColor: '#ffffff',
          logging: false,
          windowWidth: 900,
        });

        const imgData = canvas.toDataURL('image/png');
        const imgWPx = canvas.width;
        const imgHPx = canvas.height;
        const ratio = usableW / imgWPx;
        const imgHMm = imgHPx * ratio;

        if (imgHMm > usableH) {
          let srcY = 0;
          const pageImgHPx = usableH / ratio;
          while (srcY < imgHPx) {
            const sliceH = Math.min(pageImgHPx, imgHPx - srcY);
            const sliceCanvas = document.createElement('canvas');
            sliceCanvas.width = imgWPx;
            sliceCanvas.height = sliceH;
            const ctx = sliceCanvas.getContext('2d')!;
            ctx.drawImage(canvas, 0, srcY, imgWPx, sliceH, 0, 0, imgWPx, sliceH);
            const sliceData = sliceCanvas.toDataURL('image/png');
            const sliceHMm = sliceH * ratio;

            if (!isFirstImage) doc.addPage();
            isFirstImage = false;
            y = M;
            doc.addImage(sliceData, 'PNG', M, y, usableW, sliceHMm);
            srcY += sliceH;
          }
          y = M;
        } else {
          if (y + imgHMm > usableH + M) {
            doc.addPage();
            y = M;
          }
          if (!isFirstImage && y === M) { /* already on fresh page */ }
          isFirstImage = false;
          doc.addImage(imgData, 'PNG', M, y, usableW, imgHMm);
          y += imgHMm + 2;
        }

        const links = section.querySelectorAll<HTMLAnchorElement>('a[href]');
        links.forEach(a => {
          const href = a.getAttribute('href');
          if (!href || href.startsWith('#') || href.startsWith('javascript')) return;
          const sectionRect = section.getBoundingClientRect();
          const linkRect = a.getBoundingClientRect();
          const relX = (linkRect.left - sectionRect.left) / sectionRect.width * usableW;
          const relY = (linkRect.top - sectionRect.top) / sectionRect.height * imgHMm;
          const relW = linkRect.width / sectionRect.width * usableW;
          const relH = linkRect.height / sectionRect.height * imgHMm;
          const linkPageY = y - imgHMm - 2 + relY;
          if (linkPageY >= 0 && linkPageY < H) {
            doc.link(M + relX, linkPageY, relW, relH, { url: href });
          }
        });
      }

      const total = doc.getNumberOfPages();
      for (let i = 1; i <= total; i++) {
        doc.setPage(i);
        doc.setFontSize(7); doc.setFont('helvetica', 'normal'); doc.setTextColor(180, 180, 180);
        doc.text(`@${insights.username} — Influencer Insights`, M, H - 4);
        doc.text(`Page ${i} / ${total}`, W - M, H - 4, { align: 'right' });
        doc.setDrawColor(229, 231, 235); doc.line(M, H - 7, W - M, H - 7);
      }

      doc.save(`${insights.username}_insight_${new Date().toISOString().split('T')[0]}.pdf`);

      container.style.width = origWidth;
      container.querySelectorAll('.line-clamp-2, .line-clamp-3, .truncate').forEach(el => {
        (el as HTMLElement).style.removeProperty('-webkit-line-clamp');
        (el as HTMLElement).style.removeProperty('overflow');
        (el as HTMLElement).style.removeProperty('text-overflow');
        (el as HTMLElement).style.removeProperty('white-space');
      });
      setIsPdfExporting(false);
    } catch (err) {
      console.error('PDF export error:', err);
      setIsPdfExporting(false);
      alert('PDF export failed: ' + (err instanceof Error ? err.message : String(err)));
    }
  };

  const handleExportExcel = () => {
    if (!insights) return;
    const st = insights.stats || {};
    const wb = XLSX.utils.book_new();
    const rows: (string | number)[][] = [
      ['Metric', 'Value'],
      ['Username', insights.username ?? ''],
      ['Full name', insights.fullName ?? ''],
      ['Platform', insights.platform ?? ''],
      ['Location', insights.locationCountry ?? ''],
      ['Followers', st.followerCount ?? ''],
      ['Following', st.followingCount ?? ''],
      ['Posts', st.postCount ?? ''],
      ['Avg likes', st.avgLikes ?? ''],
      ['Avg comments', st.avgComments ?? ''],
      ['Avg views', st.avgViews ?? ''],
      ['Engagement rate %', st.engagementRate != null ? Number(st.engagementRate) : ''],
      ['Avg reel views', st.avgReelViews ?? ''],
      ['Avg reel likes', st.avgReelLikes ?? ''],
      ['Avg reel comments', st.avgReelComments ?? ''],
      ['Brand post ER %', st.brandPostER != null ? Number(st.brandPostER) : ''],
      ['Posts with hidden likes %', st.postsWithHiddenLikesPct != null ? Number(st.postsWithHiddenLikesPct) : ''],
      ['Report refreshed', insights.lastRefreshedAt ? new Date(insights.lastRefreshedAt).toISOString() : ''],
    ];
    const ws = XLSX.utils.aoa_to_sheet(rows);
    XLSX.utils.book_append_sheet(wb, ws, 'Insight stats');
    const buf = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([buf], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${insights.username}_insight_${new Date().toISOString().split('T')[0]}.xlsx`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleAddToGroup = async () => {
    try {
      const result = await influencerGroupsApi.list({ limit: 50 });
      const groups = result.groups || [];
      if (groups.length === 0) { alert('No groups found. Create a group first.'); return; }
      const groupName = prompt('Enter group name to add to:\n' + groups.map((g: any) => g.name).join('\n'));
      const group = groups.find((g: any) => g.name === groupName);
      if (!group) return;
      await influencerGroupsApi.addInfluencer(group.id, {
        influencerName: insights.fullName || insights.username,
        influencerUsername: insights.username,
        platform: insights.platform,
        profilePictureUrl: insights.profilePictureUrl,
        followerCount: insights.stats?.followerCount,
        engagementRate: insights.stats?.engagementRate,
      });
      alert('Added to group successfully!');
    } catch (err: any) { alert(err.response?.data?.message || 'Failed to add to group'); }
    setShowAddMenu(false);
  };

  const handleAddToCampaign = async () => {
    try {
      const result = await campaignsApi.list({ tab: 'created_by_me', limit: 50 });
      const camps = result.campaigns || [];
      if (camps.length === 0) { alert('No campaigns found. Create a campaign first.'); return; }
      const name = prompt('Enter campaign name to add to:\n' + camps.map((c: any) => c.name).join('\n'));
      const camp = camps.find((c: any) => c.name === name);
      if (!camp) return;
      await campaignsApi.addInfluencer(camp.id, {
        influencerName: insights.fullName || insights.username,
        influencerUsername: insights.username,
        platform: insights.platform,
        profilePictureUrl: insights.profilePictureUrl,
        followerCount: insights.stats?.followerCount,
      });
      alert('Added to campaign successfully!');
    } catch (err: any) { alert(err.response?.data?.message || 'Failed to add to campaign'); }
    setShowAddMenu(false);
  };

  useEffect(() => {
    const handler = (e: MouseEvent) => { if (!(e.target as HTMLElement).closest('.relative')) { setShowExportMenu(false); setShowAddMenu(false); } };
    if (showExportMenu || showAddMenu) { document.addEventListener('click', handler); return () => document.removeEventListener('click', handler); }
  }, [showExportMenu, showAddMenu]);

  const getPlatformIcon = () => {
    switch (insights?.platform) {
      case 'INSTAGRAM': return <Instagram className="w-4 h-4" />;
      case 'YOUTUBE': return <Youtube className="w-4 h-4" />;
      default: return <Sparkles className="w-4 h-4" />;
    }
  };

  if (isLoading) return (
    <div className="flex items-center justify-center h-96"><div className="flex flex-col items-center gap-4">
      <div className="w-12 h-12 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin"></div>
      <p className="text-gray-500">Loading insights...</p></div></div>
  );
  if (error) return (
    <div className="flex items-center justify-center h-96"><div className="text-center">
      <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
      <h3 className="text-lg font-semibold text-gray-900">{error}</h3>
      <button type="button" onClick={() => navigate('/insights')} className="btn btn-primary mt-4 print:hidden">Back to Insights</button></div></div>
  );
  if (!insights) return (
    <div className="flex items-center justify-center h-96"><div className="text-center">
      <Sparkles className="w-16 h-16 text-gray-300 mx-auto mb-4" />
      <h3 className="text-lg font-semibold text-gray-900">Insight not found</h3>
      <button type="button" onClick={() => navigate('/insights')} className="btn btn-primary mt-4 print:hidden">Back to Insights</button></div></div>
  );

  const s = insights.stats || {};
  const aud = insights.audience || {};
  const eng = insights.engagement || {};
  const growth = insights.growth || {};
  const look = insights.lookalikes || {};
  const posts = insights.posts || {};
  const reels = insights.reels || {};
  const currentAud = aud;

  const tabs = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'engagement', label: 'Engagement', icon: Heart },
    { id: 'audience', label: 'Audience', icon: Users },
    { id: 'posts', label: 'Posts', icon: Instagram },
    { id: 'reels', label: 'Reels', icon: Play },
  ];

  return (
    <div ref={pdfContainerRef} className="space-y-4 sm:space-y-6 animate-fadeIn insights-print-root">
      <style>{`
        @media print {
          .flex.h-screen > div:first-child,
          .flex.h-screen header,
          .flex.h-screen > .flex-1 > .bg-amber-500 {
            display: none !important;
          }
          .flex.h-screen .flex-1 > main {
            padding: 12px !important;
            overflow: visible !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>
      {viewMoreData && <ViewMoreModal {...viewMoreData} onClose={() => setViewMoreData(null)} />}

      {isPdfExporting && (
        <div className="fixed inset-0 bg-black/40 z-[9999] flex items-center justify-center">
          <div className="bg-white rounded-xl p-6 shadow-2xl flex flex-col items-center gap-3">
            <div className="w-10 h-10 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm font-medium text-gray-700">Generating PDF...</p>
            <p className="text-xs text-gray-400">Capturing each section</p>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 no-print print:hidden">
        <button onClick={() => navigate('/insights')} className="flex items-center gap-2 text-gray-600 hover:text-gray-900 text-sm">
          <ArrowLeft className="w-4 h-4" /> Back to Insights
        </button>
        <div className="flex flex-wrap items-center gap-2">
          {insights.dataFreshnessStatus === 'STALE' && (
            <span className="text-xs text-amber-600 flex items-center gap-1"><AlertCircle className="w-4 h-4" /><span className="hidden sm:inline">Data may be outdated</span></span>
          )}
          <button onClick={handleShare} className="btn btn-secondary text-sm py-2"><Share2 className="w-4 h-4 sm:mr-2" /><span className="hidden sm:inline">Share</span></button>
          <div className="relative">
            <button onClick={() => setShowExportMenu(!showExportMenu)} className="btn btn-secondary text-sm py-2"><Download className="w-4 h-4 sm:mr-2" /><span className="hidden sm:inline">Export</span></button>
            {showExportMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border z-50">
                <button onClick={() => { handleExportJSON(); setShowExportMenu(false); }} className="w-full text-left px-4 py-2 hover:bg-gray-50 text-sm flex items-center gap-2"><Download className="w-4 h-4" />Export as JSON</button>
                <button onClick={() => { handleExportExcel(); setShowExportMenu(false); }} className="w-full text-left px-4 py-2 hover:bg-gray-50 text-sm flex items-center gap-2 border-t"><Download className="w-4 h-4" />Export Excel</button>
                <button onClick={() => { handleExportPDF(); setShowExportMenu(false); }} className="w-full text-left px-4 py-2 hover:bg-gray-50 text-sm flex items-center gap-2 border-t"><Download className="w-4 h-4" />Save as PDF</button>
              </div>
            )}
          </div>
          <div className="relative">
            <button onClick={() => setShowAddMenu(!showAddMenu)} className="btn btn-secondary text-sm py-2"><UserPlus className="w-4 h-4 sm:mr-2" /><span className="hidden sm:inline">Add to</span></button>
            {showAddMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border z-50">
                <button onClick={handleAddToGroup} className="w-full text-left px-4 py-2 hover:bg-gray-50 text-sm flex items-center gap-2"><FolderPlus className="w-4 h-4" />Add to Group</button>
                <button onClick={handleAddToCampaign} className="w-full text-left px-4 py-2 hover:bg-gray-50 text-sm flex items-center gap-2 border-t"><Users className="w-4 h-4" />Add to Campaign</button>
              </div>
            )}
          </div>
          <button onClick={handleRefresh} disabled={isRefreshing} className="btn btn-primary disabled:opacity-50 text-sm py-2">
            {isRefreshing ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div><span className="hidden sm:inline">Refreshing...</span></>
              : <><RefreshCw className="w-4 h-4 sm:mr-2" /><span className="hidden sm:inline">Refresh (1 Credit)</span></>}
          </button>
        </div>
      </div>

      {/* Profile Header */}
      <div className="pdf-section card p-4 sm:p-6" data-title="Profile">
        <div className="flex items-start gap-3 sm:gap-4">
          <div className="relative shrink-0">
            <img src={insights.profilePictureUrl || `https://ui-avatars.com/api/?name=${insights.username}&background=6366f1&color=fff`} alt={insights.username} className="w-16 h-16 sm:w-24 sm:h-24 rounded-full object-cover ring-2 sm:ring-4 ring-primary-100" crossOrigin="anonymous" />
            {insights.isVerified && <div className="absolute -bottom-0.5 -right-0.5 sm:-bottom-1 sm:-right-1 w-5 h-5 sm:w-8 sm:h-8 bg-blue-500 rounded-full flex items-center justify-center ring-2 ring-white"><BadgeCheck className="w-3 h-3 sm:w-5 sm:h-5 text-white" /></div>}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-lg sm:text-2xl font-bold text-gray-900 truncate">{insights.fullName || insights.username}</h1>
              <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${insights.platform === 'INSTAGRAM' ? 'bg-pink-100 text-pink-700' : insights.platform === 'YOUTUBE' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'}`}>
                {getPlatformIcon()}<span className="ml-1">{insights.platform}</span>
              </span>
            </div>
            <p className="text-sm text-gray-500">@{insights.username}</p>
            {insights.bio && <p className="text-xs sm:text-sm text-gray-600 mt-1 line-clamp-2">{insights.bio}</p>}
            <div className="flex flex-wrap items-center gap-2 sm:gap-4 mt-2 text-xs sm:text-sm text-gray-500">
              {insights.locationCountry && <span className="flex items-center gap-1"><MapPin className="w-3 h-3 sm:w-4 sm:h-4" />{insights.locationCountry}</span>}
              <span className="flex items-center gap-1"><Calendar className="w-3 h-3 sm:w-4 sm:h-4" />Report: {insights.lastRefreshedAt ? new Date(insights.lastRefreshedAt).toLocaleDateString() : '—'}</span>
              <span className="flex items-center gap-1"><Users className="w-3 h-3 sm:w-4 sm:h-4" />{formatNum(s.followerCount)} followers</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      {!isPdfExporting && (
        <div className="border-b border-gray-200 overflow-x-auto hide-scrollbar print:hidden">
          <nav className="flex min-w-max">
            {tabs.map(tab => (
              <button type="button" key={tab.id} onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 py-3 px-3 sm:px-4 border-b-2 font-medium text-xs sm:text-sm transition-colors whitespace-nowrap ${activeTab === tab.id ? 'border-primary-600 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
                <tab.icon className="w-4 h-4" /><span>{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>
      )}

      {/* ==================== OVERVIEW TAB ==================== */}
      {(isPdfExporting || activeTab === 'overview') && (
        <div className="space-y-6">
          {isPdfExporting && <h2 className="text-xl font-bold text-primary-600 border-b-2 border-primary-600 pb-2 pdf-section" data-title="Overview Header">Overview</h2>}
          {/* 11 Stat Cards */}
          <div className="pdf-section grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3" data-title="Stats Cards">
            {[
              { label: 'Followers', value: formatNum(s.followerCount), icon: Users, color: 'bg-blue-50 text-blue-600' },
              { label: 'Avg Likes', value: formatNum(s.avgLikes), icon: Heart, color: 'bg-pink-50 text-pink-600' },
              { label: 'Avg Comments', value: formatNum(s.avgComments), icon: MessageCircle, color: 'bg-indigo-50 text-indigo-600' },
              { label: 'Engagement Rate', value: s.engagementRate ? `${Number(s.engagementRate).toFixed(2)}%` : 'N/A', icon: TrendingUp, color: 'bg-green-50 text-green-600' },
              { label: 'Avg Reel Views', value: formatNum(s.avgReelViews), icon: Eye, color: 'bg-purple-50 text-purple-600' },
              { label: 'Avg Reel Likes', value: formatNum(s.avgReelLikes), icon: Heart, color: 'bg-rose-50 text-rose-600' },
              { label: 'Avg Reel Comments', value: formatNum(s.avgReelComments), icon: MessageCircle, color: 'bg-orange-50 text-orange-600' },
              { label: 'Brand Post ER', value: s.brandPostER ? `${Number(s.brandPostER).toFixed(2)}%` : 'N/A', icon: BarChart3, color: 'bg-amber-50 text-amber-600' },
              { label: 'Posts Count', value: formatNum(s.postCount), icon: Instagram, color: 'bg-cyan-50 text-cyan-600' },
              { label: 'Hidden Likes', value: s.postsWithHiddenLikesPct != null ? `${Number(s.postsWithHiddenLikesPct).toFixed(1)}%` : 'N/A', icon: Eye, color: 'bg-gray-50 text-gray-600' },
              { label: 'Location', value: insights.locationCountry || 'N/A', icon: MapPin, color: 'bg-teal-50 text-teal-600' },
            ].map((stat, i) => (
              <div key={i} className="card p-3 text-center">
                <div className={`w-8 h-8 rounded-lg mx-auto flex items-center justify-center mb-2 ${stat.color}`}><stat.icon className="w-4 h-4" /></div>
                <p className="text-lg font-bold text-gray-900">{stat.value}</p>
                <p className="text-xs text-gray-500">{stat.label}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Growth Chart */}
            <div className="pdf-section card p-6" data-title="Growth Chart">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Audience Growth (6 Months)</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={growth.last6Months || []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="month" stroke="#9ca3af" fontSize={12} />
                  <YAxis stroke="#9ca3af" fontSize={12} tickFormatter={v => formatNum(v)} />
                  <Tooltip formatter={(v: number) => formatNum(v)} />
                  <Legend />
                  <Line type="monotone" dataKey="followers" stroke="#6366f1" strokeWidth={2} name="Followers" dot={false} />
                  <Line type="monotone" dataKey="following" stroke="#8b5cf6" strokeWidth={2} name="Following" dot={false} />
                  <Line type="monotone" dataKey="likes" stroke="#ec4899" strokeWidth={2} name="Likes" dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Word Cloud */}
            <div className="pdf-section card p-6" data-title="Word Cloud">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Word Cloud</h3>
              {insights.wordCloud && Array.isArray(insights.wordCloud) && insights.wordCloud.length > 0 ? (
                <div className="flex flex-wrap gap-2 justify-center items-center min-h-[250px]">
                  {insights.wordCloud.map((word: any, i: number) => {
                    const wv = Number(word?.value);
                    const safe = Number.isFinite(wv) ? wv : 0;
                    return (
                      <span key={i} className="inline-block px-2 py-1 rounded-lg transition-transform hover:scale-110"
                        style={{ fontSize: `${Math.max(12, Math.min(36, safe / 3))}px`, color: COLORS[i % COLORS.length], fontWeight: safe > 60 ? 700 : 400, opacity: Math.min(0.95, 0.7 + safe / 300) }}>
                        {word?.text ?? '—'}
                      </span>
                    );
                  })}
                </div>
              ) : <p className="text-gray-500 text-center py-16">No word cloud data available</p>}
            </div>

            {/* Influencer Lookalikes */}
            <div className={`pdf-section card p-6 ${!(look.audience && look.audience.length > 0) ? 'lg:col-span-2' : ''}`} data-title="Influencer Lookalikes">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Influencer Lookalikes</h3>
              {look.influencer && look.influencer.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50"><tr>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500">Profile</th>
                      <th className="px-3 py-2 text-right text-xs font-semibold text-gray-500">Followers</th>
                      <th className="px-3 py-2 text-right text-xs font-semibold text-gray-500">Similarity</th>
                    </tr></thead>
                    <tbody className="divide-y divide-gray-100">
                      {look.influencer.map((l: any, i: number) => (
                        <tr key={i} className="hover:bg-gray-50">
                          <td className="px-3 py-2">
                            <a href={`https://instagram.com/${l.username}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 group">
                              <img src={l.profilePictureUrl || l.picture || `https://ui-avatars.com/api/?name=${l.username}&background=6366f1&color=fff&size=40`} alt={l.username} className="w-9 h-9 rounded-full object-cover ring-2 ring-gray-100 group-hover:ring-primary-200 transition-all shrink-0" crossOrigin="anonymous" />
                              <div className="min-w-0">
                                <p className="text-primary-600 font-medium group-hover:underline truncate">@{l.username}</p>
                                {l.fullName && <p className="text-xs text-gray-500 truncate">{l.fullName}</p>}
                              </div>
                              <ExternalLink className="w-3.5 h-3.5 text-gray-300 group-hover:text-primary-400 shrink-0 ml-auto" />
                            </a>
                          </td>
                          <td className="px-3 py-2 text-right text-gray-700">{formatNum(l.followers)}</td>
                          <td className="px-3 py-2 text-right"><span className="text-green-600 font-medium">{l.similarity != null && Number.isFinite(l.similarity) ? `${(l.similarity * 100).toFixed(0)}%` : '—'}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : <p className="text-gray-500 text-center py-8">No lookalike data available</p>}
            </div>

            {/* Audience Lookalikes — only shown if data exists */}
            {look.audience && look.audience.length > 0 && (
              <div className="pdf-section card p-6" data-title="Audience Lookalikes">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Audience Lookalikes</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50"><tr>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500">Profile</th>
                      <th className="px-3 py-2 text-right text-xs font-semibold text-gray-500">Followers</th>
                      <th className="px-3 py-2 text-right text-xs font-semibold text-gray-500">Overlap</th>
                    </tr></thead>
                    <tbody className="divide-y divide-gray-100">
                      {look.audience.map((l: any, i: number) => (
                        <tr key={i} className="hover:bg-gray-50">
                          <td className="px-3 py-2">
                            <a href={`https://instagram.com/${l.username}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 group">
                              <img src={l.profilePictureUrl || l.picture || `https://ui-avatars.com/api/?name=${l.username}&background=8b5cf6&color=fff&size=40`} alt={l.username} className="w-9 h-9 rounded-full object-cover ring-2 ring-gray-100 group-hover:ring-purple-200 transition-all shrink-0" crossOrigin="anonymous" />
                              <div className="min-w-0">
                                <p className="text-primary-600 font-medium group-hover:underline truncate">@{l.username}</p>
                                {l.fullName && <p className="text-xs text-gray-500 truncate">{l.fullName}</p>}
                              </div>
                              <ExternalLink className="w-3.5 h-3.5 text-gray-300 group-hover:text-primary-400 shrink-0 ml-auto" />
                            </a>
                          </td>
                          <td className="px-3 py-2 text-right text-gray-700">{formatNum(l.followers)}</td>
                          <td className="px-3 py-2 text-right"><span className="text-blue-600 font-medium">{l.overlap != null && Number.isFinite(l.overlap) ? `${(l.overlap * 100).toFixed(0)}%` : '—'}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Brand Affinity */}
            <div className="pdf-section card p-6" data-title="Influencer Brand Affinity">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Influencer Brand Affinity</h3>
              {insights.brandAffinity && insights.brandAffinity.length > 0 ? (
                <div className="space-y-3">
                  {insights.brandAffinity.slice(0, 5).map((b: any, i: number) => {
                    const p = itemWeightOrPct(b);
                    const barW = p != null ? Math.min(p * 4, 100) : 0;
                    return (
                      <div key={i} className="flex items-center gap-3">
                        <span className="text-sm text-gray-600 w-24 truncate">{brandRowLabel(b)}</span>
                        <div className="flex-1 bg-gray-200 rounded-full h-2"><div className="h-2 rounded-full" style={{ width: `${barW}%`, backgroundColor: COLORS[i % COLORS.length] }}></div></div>
                        <span className="text-sm font-medium w-14 text-right shrink-0">{pctDisplay(p)}</span>
                      </div>
                    );
                  })}
                </div>
              ) : <p className="text-gray-500 text-center py-8">No brand affinity data</p>}
            </div>

            {/* Influencer Interests */}
            <div className="pdf-section card p-6" data-title="Influencer Interests">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Influencer Interests</h3>
              {insights.interests && insights.interests.length > 0 ? (
                <div className="space-y-3">
                  {insights.interests.slice(0, 5).map((int: any, i: number) => {
                    const p = itemWeightOrPct(int);
                    const barW = p != null ? Math.min(p * 2, 100) : 0;
                    return (
                      <div key={i} className="flex items-center gap-3">
                        <span className="text-sm text-gray-600 w-28 truncate">{interestRowLabel(int)}</span>
                        <div className="flex-1 bg-gray-200 rounded-full h-2"><div className="h-2 rounded-full" style={{ width: `${barW}%`, backgroundColor: COLORS[i % COLORS.length] }}></div></div>
                        <span className="text-sm font-medium w-14 text-right shrink-0">{pctDisplay(p)}</span>
                      </div>
                    );
                  })}
                </div>
              ) : <p className="text-gray-500 text-center py-8">No interest data</p>}
            </div>
          </div>
        </div>
      )}

      {/* ==================== ENGAGEMENT TAB ==================== */}
      {(isPdfExporting || activeTab === 'engagement') && (
        <div className="space-y-6">
          {isPdfExporting && <h2 className="text-xl font-bold text-primary-600 border-b-2 border-primary-600 pb-2 pdf-section" data-title="Engagement Header">Engagement</h2>}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* ER Distribution Chart */}
            <div className="pdf-section card p-6" data-title="ER Distribution">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Engagement Rate Distribution</h3>
              <p className="text-sm text-gray-500 mb-4">Number of similar influencers by engagement rate range</p>
              {eng.rateDistribution && eng.rateDistribution.length > 0 ? (
                <>
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={eng.rateDistribution}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="range" stroke="#9ca3af" fontSize={11} />
                      <YAxis stroke="#9ca3af" fontSize={11} tickFormatter={v => formatNum(v)} />
                      <Tooltip formatter={(v: number) => v.toLocaleString()} />
                      <Bar dataKey="count" fill="#6366f1" radius={[4, 4, 0, 0]} name="Influencers" />
                    </BarChart>
                  </ResponsiveContainer>
                  <button onClick={() => setViewMoreData({ title: 'Engagement Rate Distribution', columns: [{ key: 'range', label: 'ER Range' }, { key: 'count', label: 'Similar Influencers' }], data: eng.rateDistribution, onClose: () => setViewMoreData(null) })}
                    className="text-primary-600 hover:text-primary-700 text-sm font-medium mt-3 flex items-center gap-1 print:hidden">
                    View More <ChevronRight className="w-4 h-4" />
                  </button>
                </>
              ) : <p className="text-gray-500 text-center py-16">No distribution data</p>}
            </div>

            {/* ER Rate Circle */}
            <div className="pdf-section card p-6 flex flex-col items-center justify-center" data-title="Your ER">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Engagement Rate</h3>
              <div className="w-40 h-40 relative mb-4">
                <svg className="w-40 h-40 transform -rotate-90">
                  <circle cx="80" cy="80" r="68" stroke="#e5e7eb" strokeWidth="14" fill="none" />
                  <circle cx="80" cy="80" r="68" stroke="#6366f1" strokeWidth="14" fill="none" strokeDasharray={`${Math.min((s.engagementRate || 0) * 42.7, 427)} 427`} strokeLinecap="round" />
                </svg>
                <span className="absolute inset-0 flex items-center justify-center text-3xl font-bold text-primary-600">
                  {s.engagementRate ? `${Number(s.engagementRate).toFixed(2)}%` : 'N/A'}
                </span>
              </div>
              <p className="text-gray-600 text-sm">
                {s.engagementRate > 3 ? 'Above average engagement' : s.engagementRate > 1 ? 'Average engagement' : 'Below average engagement'}
              </p>
            </div>
          </div>

          {/* Engagement Spread Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="pdf-section card p-6" data-title="Likes Spread">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Likes Spread (Last 150 Posts)</h3>
              {eng.likesSpread && eng.likesSpread.length > 0 ? (
                <>
                  <ResponsiveContainer width="100%" height={250}>
                    <LineChart data={eng.likesSpread.slice(-50)}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="date" stroke="#9ca3af" fontSize={10} tickFormatter={v => v.slice(5)} />
                      <YAxis stroke="#9ca3af" fontSize={11} tickFormatter={v => formatNum(v)} />
                      <Tooltip formatter={(v: number) => v.toLocaleString()} />
                      <Line type="monotone" dataKey="likes" stroke="#ec4899" strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                  <button onClick={() => setViewMoreData({ title: 'Likes History', columns: [{ key: 'date', label: 'Date' }, { key: 'likes', label: 'Likes' }, { key: 'postUrl', label: 'Post Link' }], data: eng.likesSpread, onClose: () => setViewMoreData(null) })}
                    className="text-primary-600 hover:text-primary-700 text-sm font-medium mt-3 flex items-center gap-1 print:hidden">View More <ChevronRight className="w-4 h-4" /></button>
                </>
              ) : <p className="text-gray-500 text-center py-16">No likes spread data</p>}
            </div>

            <div className="pdf-section card p-6" data-title="Comments Spread">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Comments Spread (Last 150 Posts)</h3>
              {eng.commentsSpread && eng.commentsSpread.length > 0 ? (
                <>
                  <ResponsiveContainer width="100%" height={250}>
                    <LineChart data={eng.commentsSpread.slice(-50)}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="date" stroke="#9ca3af" fontSize={10} tickFormatter={v => v.slice(5)} />
                      <YAxis stroke="#9ca3af" fontSize={11} tickFormatter={v => formatNum(v)} />
                      <Tooltip formatter={(v: number) => v.toLocaleString()} />
                      <Line type="monotone" dataKey="comments" stroke="#6366f1" strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                  <button onClick={() => setViewMoreData({ title: 'Comments History', columns: [{ key: 'date', label: 'Date' }, { key: 'comments', label: 'Comments' }, { key: 'postUrl', label: 'Post Link' }], data: eng.commentsSpread, onClose: () => setViewMoreData(null) })}
                    className="text-primary-600 hover:text-primary-700 text-sm font-medium mt-3 flex items-center gap-1 print:hidden">View More <ChevronRight className="w-4 h-4" /></button>
                </>
              ) : <p className="text-gray-500 text-center py-16">No comments spread data</p>}
            </div>
          </div>

          {/* Popular Hashtags */}
          <div className="pdf-section card p-6" data-title="Popular Hashtags">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Popular Hashtags</h3>
            {eng.topHashtags && eng.topHashtags.length > 0 ? (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                  {eng.topHashtags.slice(0, 5).map((h: any, i: number) => (
                    <div key={i} className="p-3 bg-gray-50 rounded-xl text-center">
                      <Hash className="w-5 h-5 text-primary-500 mx-auto mb-1" />
                      <p className="font-medium text-gray-900 text-sm truncate">{h.tag}</p>
                      <p className="text-xs text-gray-500 mt-1">{pctDisplay(itemWeightOrPct(h))} usage</p>
                    </div>
                  ))}
                </div>
                <button onClick={() => setViewMoreData({ title: 'All Hashtags', columns: [{ key: 'tag', label: 'Hashtag' }, { key: 'usagePercentage', label: 'Usage %' }], data: eng.topHashtags, onClose: () => setViewMoreData(null) })}
                  className="text-primary-600 hover:text-primary-700 text-sm font-medium mt-4 flex items-center gap-1 print:hidden">View All Hashtags <ChevronRight className="w-4 h-4" /></button>
              </>
            ) : <p className="text-gray-500 text-center py-8">No hashtag data</p>}
          </div>
        </div>
      )}

      {/* ==================== AUDIENCE TAB ==================== */}
      {(isPdfExporting || activeTab === 'audience') && (
        <div className="space-y-6">
          {isPdfExporting && <h2 className="text-xl font-bold text-primary-600 border-b-2 border-primary-600 pb-2 pdf-section" data-title="Audience Header">Audience</h2>}

          {/* Credibility & Notable Cards */}
          <div className="pdf-section grid grid-cols-1 sm:grid-cols-2 gap-4" data-title="Credibility & Notable">
            <div className="card p-6 text-center">
              <div className="w-24 h-24 mx-auto relative mb-3">
                <svg className="w-24 h-24 transform -rotate-90"><circle cx="48" cy="48" r="42" stroke="#e5e7eb" strokeWidth="10" fill="none" /><circle cx="48" cy="48" r="42" stroke="#22c55e" strokeWidth="10" fill="none" strokeDasharray={`${(currentAud.credibility || aud.credibility || 0) * 264} 264`} strokeLinecap="round" /></svg>
                <span className="absolute inset-0 flex items-center justify-center text-xl font-bold text-green-600">{currentAud.credibility ? `${(currentAud.credibility * 100).toFixed(0)}%` : aud.credibility ? `${(aud.credibility * 100).toFixed(0)}%` : 'N/A'}</span>
              </div>
              <p className="font-semibold text-gray-900">Followers Credibility</p>
              <p className="text-xs text-gray-500 mt-1">Based on avatar, bio, post count & follow ratio</p>
            </div>
            <div className="card p-6 text-center">
              <p className="text-5xl font-bold text-blue-600 mb-3">
                {aud.notableFollowersPct ? `${Number(aud.notableFollowersPct).toFixed(1)}%` : 'N/A'}
              </p>
              <p className="font-semibold text-gray-900">Notable Followers</p>
              <p className="text-xs text-gray-500 mt-1">Followers who are influencers</p>
            </div>
          </div>

          {/* Credibility Distribution */}
          {currentAud.credibilityDistribution && (
            <div className="pdf-section card p-6" data-title="Audience Credibility">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Audience Credibility</h3>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={currentAud.credibilityDistribution}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="range" stroke="#9ca3af" fontSize={11} />
                  <YAxis stroke="#9ca3af" fontSize={11} tickFormatter={v => formatNum(v)} />
                  <Tooltip formatter={(v: number) => v.toLocaleString()} />
                  <Bar dataKey="count" fill="#22c55e" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
              <button onClick={() => setViewMoreData({ title: 'Audience Credibility', columns: [{ key: 'range', label: 'Credibility %' }, { key: 'count', label: 'Influencer Accounts' }], data: currentAud.credibilityDistribution, onClose: () => setViewMoreData(null) })}
                className="text-primary-600 hover:text-primary-700 text-sm font-medium mt-3 flex items-center gap-1 print:hidden">View More <ChevronRight className="w-4 h-4" /></button>
            </div>
          )}

          {/* Audience Location — unified list + map */}
          <div className="pdf-section card p-6" data-title="Location">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Audience Location</h3>
              <div className="flex items-center gap-3">
                <div className="flex gap-1 bg-gray-100 p-0.5 rounded-lg w-fit print:hidden">
                  {(['country', 'state', 'city'] as const).map(t => (
                    <button type="button" key={t} onClick={() => setLocationTab(t)} className={`px-3 py-1.5 rounded-md text-xs font-medium capitalize transition-colors ${locationTab === t ? 'bg-white text-primary-600 shadow-sm' : 'text-gray-500'}`}>{t}</button>
                  ))}
                </div>
                <div className="flex gap-1 bg-gray-100 p-0.5 rounded-lg w-fit print:hidden">
                  {([['list', 'List'], ['map', 'Map']] as const).map(([key, label]) => (
                    <button type="button" key={key} onClick={() => setLocationView(key as any)} className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${locationView === key ? 'bg-white text-primary-600 shadow-sm' : 'text-gray-500'}`}>{label}</button>
                  ))}
                </div>
              </div>
            </div>
            {(() => {
              const locData = locationTab === 'country' ? currentAud.topCountries
                : locationTab === 'state' ? currentAud.topStates
                : currentAud.topCities;
              const nameKey = locationTab === 'country' ? 'country' : locationTab === 'state' ? 'state' : 'city';
              if (!locData || locData.length === 0) return <p className="text-gray-500 text-center py-8">No location data</p>;

              if (locationView === 'map') {
                return (
                  <>
                    <div className="rounded-xl overflow-hidden border border-gray-200 bg-[#f0f4f8]">
                      <ComposableMap
                        projectionConfig={{ rotate: [-10, 0, 0], scale: 147 }}
                        width={800} height={400}
                        style={{ width: '100%', height: 'auto' }}
                      >
                        <ZoomableGroup>
                          <Geographies geography={GEO_URL}>
                            {({ geographies }: any) =>
                              geographies.map((geo: any) => (
                                <Geography
                                  key={geo.rsmKey}
                                  geography={geo}
                                  fill="#d6dee8"
                                  stroke="#fff"
                                  strokeWidth={0.5}
                                  style={{
                                    default: { outline: 'none' },
                                    hover: { fill: '#c4ccd8', outline: 'none' },
                                    pressed: { outline: 'none' },
                                  }}
                                />
                              ))
                            }
                          </Geographies>
                          {locData.map((loc: any, i: number) => {
                            const name = loc[nameKey] || loc.name || '';
                            const coords = getLocationCoords(name, locationTab);
                            if (!coords) return null;
                            const pct = loc.percentage ?? (loc.weight != null ? loc.weight * 100 : 0);
                            const maxPct = Math.max(...locData.map((l: any) => l.percentage ?? (l.weight != null ? l.weight * 100 : 0)));
                            const intensity = maxPct > 0 ? pct / maxPct : 0;
                            const radius = Math.max(5, Math.min(22, pct / 2));
                            const opacity = 0.25 + intensity * 0.7;
                            return (
                              <Marker key={i} coordinates={coords}>
                                <circle r={radius} fill={`rgba(99, 102, 241, ${opacity})`} stroke="#4f46e5" strokeWidth={1} strokeOpacity={opacity} />
                              </Marker>
                            );
                          })}
                        </ZoomableGroup>
                      </ComposableMap>
                    </div>
                    <p className="text-xs text-gray-400 mt-2 text-center">Scroll to zoom · Drag to pan · Circle size represents audience share</p>
                  </>
                );
              }

              return (
                <>
                  <div className="space-y-2">
                    {locData.slice(0, 5).map((loc: any, i: number) => (
                      <div key={i} className="flex items-center gap-3">
                        <Globe className="w-4 h-4 text-gray-400 shrink-0" />
                        <span className="text-sm text-gray-700 flex-1 truncate">{locationRowLabel(loc, locationTab) || loc[nameKey]}</span>
                        <span className="text-sm font-medium w-14 text-right shrink-0">{pctDisplay(itemWeightOrPct(loc))}</span>
                      </div>
                    ))}
                  </div>
                  <button onClick={() => setViewMoreData({
                    title: `Audience by ${locationTab}`,
                    columns: [{ key: nameKey, label: locationTab.charAt(0).toUpperCase() + locationTab.slice(1) }, { key: 'percentage', label: 'Share %' }, { key: 'engagementPct', label: 'Engagement %' }],
                    data: locData.map((loc: any) => ({ ...loc, engagementPct: loc.engagements && loc.followers ? ((loc.engagements / loc.followers) * 100).toFixed(2) + '%' : loc.percentage ? loc.percentage.toFixed(1) + '%' : '-' })),
                    onClose: () => setViewMoreData(null)
                  })} className="text-primary-600 hover:text-primary-700 text-sm font-medium mt-3 flex items-center gap-1 print:hidden">View More <ChevronRight className="w-4 h-4" /></button>
                </>
              );
            })()}
          </div>

          {/* Audience Type Pie */}
          {currentAud.audienceTypes && (
            <div className="pdf-section card p-6" data-title="Audience Type">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Audience Type</h3>
              <ResponsiveContainer width="100%" height={250}>
                <RePieChart>
                  <Pie data={currentAud.audienceTypes} cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={3} dataKey="percentage" label={({ type, percentage }: any) => `${type}: ${percentage}%`}>
                    {currentAud.audienceTypes.map((_: any, i: number) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                </RePieChart>
              </ResponsiveContainer>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Gender Split */}
            {currentAud.genderSplit && (
              <div className="pdf-section card p-6" data-title="Gender Split">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Gender Split</h3>
                <ResponsiveContainer width="100%" height={200}>
                  <RePieChart>
                    <Pie data={[{ name: 'Female', value: currentAud.genderSplit.female }, { name: 'Male', value: currentAud.genderSplit.male }]} cx="50%" cy="50%" innerRadius={50} outerRadius={75} paddingAngle={4} dataKey="value" label={({ name, value }: any) => `${name}: ${value}%`}>
                      <Cell fill="#ec4899" /><Cell fill="#6366f1" />
                    </Pie>
                    <Tooltip />
                  </RePieChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Age & Gender */}
            {currentAud.ageGroups && (
              <div className="pdf-section card p-6" data-title="Age & Gender">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Age & Gender Split</h3>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={currentAud.ageGroups}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="range" stroke="#9ca3af" fontSize={11} />
                    <YAxis stroke="#9ca3af" fontSize={11} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="male" fill="#6366f1" stackId="a" name="Male" radius={[0, 0, 0, 0]} />
                    <Bar dataKey="female" fill="#ec4899" stackId="a" name="Female" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
                <button onClick={() => setViewMoreData({
                  title: 'Age & Gender Split',
                  columns: [{ key: 'range', label: 'Age Range' }, { key: 'percentage', label: 'Total %' }, { key: 'male', label: 'Male %' }, { key: 'female', label: 'Female %' }],
                  data: currentAud.ageGroups, onClose: () => setViewMoreData(null)
                })} className="text-primary-600 hover:text-primary-700 text-sm font-medium mt-3 flex items-center gap-1 print:hidden">View More <ChevronRight className="w-4 h-4" /></button>
              </div>
            )}
          </div>

          {/* Reachability */}
          {currentAud.reachability && (
            <div className="pdf-section card p-6" data-title="Audience Reachability">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Audience Reachability</h3>
              <p className="text-sm text-gray-500 mb-4">Followers grouped by number of influencers they follow</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: '< 500', value: currentAud.reachability.below500, color: 'bg-green-50 text-green-700', desc: 'Most likely to see posts' },
                  { label: '500-1000', value: currentAud.reachability['500to1000'], color: 'bg-blue-50 text-blue-700', desc: 'Moderate reach' },
                  { label: '1000-1500', value: currentAud.reachability['1000to1500'], color: 'bg-amber-50 text-amber-700', desc: 'Lower reach' },
                  { label: '> 1500', value: currentAud.reachability.above1500, color: 'bg-red-50 text-red-700', desc: 'Unlikely to see posts' },
                ].map((r, i) => (
                  <div key={i} className={`p-4 rounded-xl ${r.color} text-center`}>
                    <p className="text-2xl font-bold">{r.value}%</p>
                    <p className="font-medium text-sm mt-1">Following {r.label}</p>
                    <p className="text-xs opacity-70 mt-0.5">{r.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Notable Followers */}
          {(() => {
            const notable = currentAud.notableFollowers;
            if (!notable || notable.length === 0) return null;
            return (
              <div className="pdf-section card p-6" data-title="Notable Followers">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Notable Followers</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50"><tr>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500">Profile</th>
                      <th className="px-3 py-2 text-right text-xs font-semibold text-gray-500">Followers</th>
                      <th className="px-3 py-2 text-right text-xs font-semibold text-gray-500">Engagements</th>
                    </tr></thead>
                    <tbody className="divide-y divide-gray-100">
                      {notable.slice(0, 5).map((n: any, i: number) => (
                        <tr key={i} className="hover:bg-gray-50">
                          <td className="px-3 py-2">
                            <a href={`https://instagram.com/${n.username}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 group">
                              <img
                                src={n.profilePictureUrl || n.picture || `https://ui-avatars.com/api/?name=${n.username}&background=6366f1&color=fff&size=40`}
                                alt={n.username}
                                className="w-9 h-9 rounded-full object-cover ring-2 ring-gray-100 group-hover:ring-primary-200 transition-all shrink-0"
                                crossOrigin="anonymous"
                              />
                              <div className="min-w-0">
                                <p className="text-primary-600 font-medium group-hover:underline truncate">@{n.username}</p>
                                {n.fullName && <p className="text-xs text-gray-500 truncate">{n.fullName}</p>}
                              </div>
                              <ExternalLink className="w-3.5 h-3.5 text-gray-300 group-hover:text-primary-400 shrink-0 ml-auto" />
                            </a>
                          </td>
                          <td className="px-3 py-2 text-right">{formatNum(n.followers)}</td>
                          <td className="px-3 py-2 text-right">{formatNum(n.engagements)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <button onClick={() => setViewMoreData({
                  title: 'Notable Followers',
                  columns: [
                    { key: 'profile', label: 'Profile', render: (row: any) => (
                      <a href={`https://www.instagram.com/${row.username}/`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2.5 hover:opacity-80">
                        <img src={row.profilePictureUrl || `https://ui-avatars.com/api/?name=${row.username}&background=6366f1&color=fff&size=32`} alt="" className="w-8 h-8 rounded-full object-cover shrink-0" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">{row.fullName || row.username}</p>
                          <p className="text-xs text-primary-600">@{row.username}</p>
                        </div>
                      </a>
                    )},
                    { key: 'followers', label: 'Followers' },
                    { key: 'engagements', label: 'Engagements' },
                  ],
                  data: notable, onClose: () => setViewMoreData(null)
                })} className="text-primary-600 hover:text-primary-700 text-sm font-medium mt-3 flex items-center gap-1 print:hidden">View All <ChevronRight className="w-4 h-4" /></button>
              </div>
            );
          })()}

          {/* Audience Brand Affinity */}
          {currentAud.brandAffinity && currentAud.brandAffinity.length > 0 && (
            <div className="pdf-section card p-6" data-title="Audience Brand Affinity">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Audience Brand Affinity</h3>
              <div className="space-y-3">
                {currentAud.brandAffinity.slice(0, 5).map((b: any, i: number) => {
                  const p = itemWeightOrPct(b);
                  const barW = p != null ? Math.min(p * 4, 100) : 0;
                  return (
                    <div key={i} className="flex items-center gap-3">
                      <span className="text-sm text-gray-600 w-24 truncate">{brandRowLabel(b)}</span>
                      <div className="flex-1 bg-gray-200 rounded-full h-2"><div className="h-2 rounded-full" style={{ width: `${barW}%`, backgroundColor: COLORS[i % COLORS.length] }}></div></div>
                      <span className="text-sm font-medium w-14 text-right shrink-0">{pctDisplay(p)}</span>
                    </div>
                  );
                })}
              </div>
              <button onClick={() => setViewMoreData({
                title: 'Audience Brand Affinity',
                columns: [
                  { key: 'name', label: 'Brand', render: (row: any) => <span>{row.brand || row.name || '-'}</span> },
                  { key: 'affinity', label: 'Affinity %', render: (row: any) => {
                    const pct = row.percentage ?? (row.weight != null ? (row.weight * 100) : null);
                    return <span>{pct != null ? pct.toFixed(1) + '%' : '-'}</span>;
                  }},
                ],
                data: currentAud.brandAffinity, onClose: () => setViewMoreData(null)
              })} className="text-primary-600 hover:text-primary-700 text-sm font-medium mt-4 flex items-center gap-1 print:hidden">View All Brands <ChevronRight className="w-4 h-4" /></button>
            </div>
          )}

          {/* Audience Interests */}
          {currentAud.interests && currentAud.interests.length > 0 && (
            <div className="pdf-section card p-6" data-title="Audience Interests">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Audience Interests</h3>
              <div className="space-y-3">
                {currentAud.interests.slice(0, 5).map((int: any, i: number) => {
                  const p = itemWeightOrPct(int);
                  const barW = p != null ? Math.min(p * 2, 100) : 0;
                  return (
                    <div key={i} className="flex items-center gap-3">
                      <span className="text-sm text-gray-600 w-32 truncate">{interestRowLabel(int)}</span>
                      <div className="flex-1 bg-gray-200 rounded-full h-2"><div className="h-2 rounded-full" style={{ width: `${barW}%`, backgroundColor: COLORS[i % COLORS.length] }}></div></div>
                      <span className="text-sm font-medium w-14 text-right shrink-0">{pctDisplay(p)}</span>
                    </div>
                  );
                })}
              </div>
              <button onClick={() => setViewMoreData({
                title: 'Audience Interests',
                columns: [
                  { key: 'name', label: 'Interest Category', render: (row: any) => <span>{row.category || row.name || '-'}</span> },
                  { key: 'affinity', label: 'Affinity %', render: (row: any) => {
                    const pct = row.percentage ?? (row.weight != null ? (row.weight * 100) : null);
                    return <span>{pct != null ? pct.toFixed(1) + '%' : '-'}</span>;
                  }},
                ],
                data: currentAud.interests, onClose: () => setViewMoreData(null)
              })} className="text-primary-600 hover:text-primary-700 text-sm font-medium mt-4 flex items-center gap-1 print:hidden">View All Interests <ChevronRight className="w-4 h-4" /></button>
            </div>
          )}
        </div>
      )}

      {/* ==================== POSTS TAB ==================== */}
      {(isPdfExporting || activeTab === 'posts') && (
        <div className="space-y-6">
          {isPdfExporting && <h2 className="text-xl font-bold text-primary-600 border-b-2 border-primary-600 pb-2 pdf-section" data-title="Posts Header">Posts</h2>}
          {!isPdfExporting && (
            <div className="flex gap-2 bg-gray-100 p-1 rounded-lg w-fit print:hidden">
              {([['popular', 'Top Posts'], ['sponsored', 'Sponsored'], ['recent', 'Recent Posts']] as const).map(([key, label]) => (
                <button type="button" key={key} onClick={() => setPostCategory(key as any)} className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${postCategory === key ? 'bg-white text-primary-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}>{label}</button>
              ))}
            </div>
          )}
          {(isPdfExporting
            ? [['popular', 'Top Posts'], ['sponsored', 'Sponsored'], ['recent', 'Recent Posts']] as const
            : [[postCategory, postCategory === 'popular' ? 'Top Posts' : postCategory === 'sponsored' ? 'Sponsored' : 'Recent Posts']] as [string, string][]
          ).map(([catKey, catLabel]) => {
            const postList = posts[catKey] || [];
            if (postList.length === 0) return isPdfExporting ? null : (
              <div key={catKey} className="card p-12 text-center"><Instagram className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900">No {catKey} posts data</h3>
                <p className="text-gray-500 mt-2">Posts data will be available after refresh</p></div>
            );
            return (
              <div key={catKey} className="pdf-section" data-title={`Posts - ${catLabel}`}>
                {isPdfExporting && <h3 className="text-lg font-semibold text-gray-800 mb-3">{catLabel}</h3>}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {postList.map((post: any, i: number) => (
                    <a key={post.id || i} href={post.url || '#'} target="_blank" rel="noopener noreferrer" className="card overflow-hidden group cursor-pointer hover:shadow-md transition-shadow block">
                      <div className="relative aspect-square bg-gray-100">
                        {post.imageUrl || post.thumbnail ? (
                          <img src={post.imageUrl || post.thumbnail} alt="" className="w-full h-full object-cover" crossOrigin="anonymous" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center"><Instagram className="w-12 h-12 text-gray-300" /></div>
                        )}
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-6">
                          <div className="text-white text-center"><Heart className="w-6 h-6 mx-auto mb-1" /><p className="font-semibold">{formatNum(post.likes)}</p></div>
                          <div className="text-white text-center"><MessageCircle className="w-6 h-6 mx-auto mb-1" /><p className="font-semibold">{formatNum(post.comments)}</p></div>
                        </div>
                        {post.url && <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"><ExternalLink className="w-5 h-5 text-white" /></div>}
                      </div>
                      <div className="p-3">
                        <p className="text-sm text-gray-600 line-clamp-2">{post.caption || 'No caption'}</p>
                        <div className="flex items-center justify-between mt-2">
                          <p className="text-xs text-gray-400">{formatDate(post.postedAt)}</p>
                          <div className="flex items-center gap-3 text-xs text-gray-500">
                            <span className="flex items-center gap-1"><Heart className="w-3 h-3" />{formatNum(post.likes)}</span>
                            <span className="flex items-center gap-1"><MessageCircle className="w-3 h-3" />{formatNum(post.comments)}</span>
                          </div>
                        </div>
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ==================== REELS TAB ==================== */}
      {(isPdfExporting || activeTab === 'reels') && (
        <div className="space-y-6">
          {isPdfExporting && <h2 className="text-xl font-bold text-primary-600 border-b-2 border-primary-600 pb-2 pdf-section" data-title="Reels Header">Reels</h2>}
          {!isPdfExporting && (
            <div className="flex gap-2 bg-gray-100 p-1 rounded-lg w-fit print:hidden">
              {([['popular', 'Top Reels'], ['recent', 'Recent Reels']] as const).map(([key, label]) => (
                <button type="button" key={key} onClick={() => setReelCategory(key as any)} className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${reelCategory === key ? 'bg-white text-primary-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}>{label}</button>
              ))}
            </div>
          )}
          {(isPdfExporting
            ? [['popular', 'Top Reels'], ['recent', 'Recent Reels']] as const
            : [[reelCategory, reelCategory === 'popular' ? 'Top Reels' : 'Recent Reels']] as [string, string][]
          ).map(([catKey, catLabel]) => {
            const reelList = reels[catKey] || [];
            if (reelList.length === 0) return isPdfExporting ? null : (
              <div key={catKey} className="card p-12 text-center"><Play className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900">No {catKey} reels data</h3>
                <p className="text-gray-500 mt-2">Reels data will be available after refresh</p></div>
            );
            return (
              <div key={catKey} className="pdf-section" data-title={`Reels - ${catLabel}`}>
                {isPdfExporting && <h3 className="text-lg font-semibold text-gray-800 mb-3">{catLabel}</h3>}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {reelList.map((reel: any, i: number) => (
                    <a key={reel.id || i} href={reel.url || '#'} target="_blank" rel="noopener noreferrer" className="card overflow-hidden group cursor-pointer hover:shadow-md transition-shadow block">
                      <div className="relative aspect-[9/16] bg-gray-100">
                        {reel.thumbnail ? (
                          <img src={reel.thumbnail} alt="" className="w-full h-full object-cover" crossOrigin="anonymous" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center"><Play className="w-12 h-12 text-gray-300" /></div>
                        )}
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                          <div className="text-white text-center"><Eye className="w-5 h-5 mx-auto mb-1" /><p className="font-semibold text-sm">{formatNum(reel.views)}</p></div>
                          <div className="text-white text-center"><Heart className="w-5 h-5 mx-auto mb-1" /><p className="font-semibold text-sm">{formatNum(reel.likes)}</p></div>
                          <div className="text-white text-center"><MessageCircle className="w-5 h-5 mx-auto mb-1" /><p className="font-semibold text-sm">{formatNum(reel.comments)}</p></div>
                        </div>
                        <div className="absolute top-2 left-2 bg-black/60 px-2 py-1 rounded text-xs text-white flex items-center gap-1"><Play className="w-3 h-3" /> Reel</div>
                        {reel.url && <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"><ExternalLink className="w-5 h-5 text-white" /></div>}
                      </div>
                      <div className="p-3">
                        <p className="text-sm text-gray-600 line-clamp-2">{reel.caption || 'No caption'}</p>
                        <div className="flex items-center justify-between mt-2">
                          <p className="text-xs text-gray-400">{formatDate(reel.postedAt)}</p>
                          <div className="flex items-center gap-2 text-xs text-gray-500">
                            <span className="flex items-center gap-1"><Eye className="w-3 h-3" />{formatNum(reel.views)}</span>
                            <span className="flex items-center gap-1"><Heart className="w-3 h-3" />{formatNum(reel.likes)}</span>
                          </div>
                        </div>
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default InsightsPage;
