"use client"

import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  ComposableMap,
  Geographies,
  Geography,
  Marker,
  ZoomableGroup,
} from 'react-simple-maps';
import { Search, RotateCcw, Download, X, MapPin, Phone, Mail, Globe, Users, FileText, Printer, Lock, ShieldAlert } from 'lucide-react';
import { findCountyContact, type CountyContact } from '@/data/county-directory';
import { findCountyCourtInfo, type CountyCourtInfo } from '@/data/county-court-directory';

// Judicial foreclosure states (require court process) - BLUE
const JUDICIAL_STATES = new Set([
  'CT', 'DE', 'FL', 'HI', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA',
  'ME', 'MD', 'MA', 'NE', 'NJ', 'NM', 'NY', 'ND', 'OH', 'OK',
  'PA', 'SC', 'SD', 'VT', 'WI'
]);

// Non-judicial foreclosure states (no court required) - ORANGE/AMBER
const NON_JUDICIAL_STATES = new Set([
  'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'GA', 'ID', 'MI', 'MN',
  'MS', 'MO', 'MT', 'NV', 'NH', 'NC', 'OR', 'RI', 'TN', 'TX',
  'UT', 'VA', 'WA', 'WV', 'WY'
]);

// States with $2,500 asset recovery agent fee cap - RED X warning
const FEE_CAP_2500_STATES = new Set(['AZ', 'NV']);

const STATE_FIPS_TO_CODE: Record<string, string> = {
  '01': 'AL', '02': 'AK', '04': 'AZ', '05': 'AR', '06': 'CA',
  '08': 'CO', '09': 'CT', '10': 'DE', '11': 'DC', '12': 'FL',
  '13': 'GA', '15': 'HI', '16': 'ID', '17': 'IL', '18': 'IN',
  '19': 'IA', '20': 'KS', '21': 'KY', '22': 'LA', '23': 'ME',
  '24': 'MD', '25': 'MA', '26': 'MI', '27': 'MN', '28': 'MS',
  '29': 'MO', '30': 'MT', '31': 'NE', '32': 'NV', '33': 'NH',
  '34': 'NJ', '35': 'NM', '36': 'NY', '37': 'NC', '38': 'ND',
  '39': 'OH', '40': 'OK', '41': 'OR', '42': 'PA', '44': 'RI',
  '45': 'SC', '46': 'SD', '47': 'TN', '48': 'TX', '49': 'UT',
  '50': 'VT', '51': 'VA', '53': 'WA', '54': 'WV', '55': 'WI',
  '56': 'WY'
};

const STATE_NAMES: Record<string, string> = {
  'AL': 'Alabama', 'AK': 'Alaska', 'AZ': 'Arizona', 'AR': 'Arkansas',
  'CA': 'California', 'CO': 'Colorado', 'CT': 'Connecticut', 'DE': 'Delaware',
  'DC': 'District of Columbia', 'FL': 'Florida', 'GA': 'Georgia', 'HI': 'Hawaii',
  'ID': 'Idaho', 'IL': 'Illinois', 'IN': 'Indiana', 'IA': 'Iowa',
  'KS': 'Kansas', 'KY': 'Kentucky', 'LA': 'Louisiana', 'ME': 'Maine',
  'MD': 'Maryland', 'MA': 'Massachusetts', 'MI': 'Michigan', 'MN': 'Minnesota',
  'MS': 'Mississippi', 'MO': 'Missouri', 'MT': 'Montana', 'NE': 'Nebraska',
  'NV': 'Nevada', 'NH': 'New Hampshire', 'NJ': 'New Jersey', 'NM': 'New Mexico',
  'NY': 'New York', 'NC': 'North Carolina', 'ND': 'North Dakota', 'OH': 'Ohio',
  'OK': 'Oklahoma', 'OR': 'Oregon', 'PA': 'Pennsylvania', 'RI': 'Rhode Island',
  'SC': 'South Carolina', 'SD': 'South Dakota', 'TN': 'Tennessee', 'TX': 'Texas',
  'UT': 'Utah', 'VT': 'Vermont', 'VA': 'Virginia', 'WA': 'Washington',
  'WV': 'West Virginia', 'WI': 'Wisconsin', 'WY': 'Wyoming'
};

interface CountyData {
  fips: string;
  name: string;
  state: string;
  leadCount: number;
  population?: number;
}

interface CountyMapProps {
  isDark?: boolean;
  onCountyClick?: (county: CountyData) => void;
  onDownloadLeads?: (stateAbbr: string) => void;
  onAddToDashboard?: (stateAbbr: string) => void;
  isPinVerified?: boolean;
  onPinRequired?: () => void;
  isOwnerOperator?: boolean;
}

// US counties TopoJSON URL
const GEO_URL = 'https://cdn.jsdelivr.net/npm/us-atlas@3/counties-10m.json';

// US states TopoJSON URL (for state border overlay)
const STATES_GEO_URL = 'https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json';

// Approximate geographic centroids for state abbreviation labels
const STATE_CENTROIDS: Record<string, [number, number]> = {
  'AL': [-86.9, 32.8], 'AK': [-153.5, 64.2], 'AZ': [-111.7, 34.2],
  'AR': [-92.4, 34.8], 'CA': [-119.7, 37.2], 'CO': [-105.5, 39.0],
  'CT': [-72.7, 41.6], 'DE': [-75.5, 39.0], 'FL': [-81.7, 28.6],
  'GA': [-83.5, 32.7], 'HI': [-155.5, 20.0], 'ID': [-114.7, 44.4],
  'IL': [-89.4, 40.0], 'IN': [-86.3, 39.8], 'IA': [-93.5, 42.0],
  'KS': [-98.3, 38.5], 'KY': [-85.3, 37.8], 'LA': [-91.9, 31.0],
  'ME': [-69.2, 45.4], 'MD': [-76.6, 39.0], 'MA': [-71.8, 42.2],
  'MI': [-84.5, 44.3], 'MN': [-94.3, 46.3], 'MS': [-89.7, 32.7],
  'MO': [-92.5, 38.4], 'MT': [-109.6, 47.0], 'NE': [-99.8, 41.5],
  'NV': [-116.6, 39.4], 'NH': [-71.6, 43.7], 'NJ': [-74.7, 40.1],
  'NM': [-106.0, 34.4], 'NY': [-75.5, 42.9], 'NC': [-79.4, 35.5],
  'ND': [-100.5, 47.5], 'OH': [-82.8, 40.3], 'OK': [-97.5, 35.5],
  'OR': [-120.5, 44.0], 'PA': [-77.6, 40.9], 'RI': [-71.5, 41.7],
  'SC': [-80.9, 33.9], 'SD': [-100.2, 44.4], 'TN': [-86.3, 35.8],
  'TX': [-99.3, 31.5], 'UT': [-111.7, 39.3], 'VT': [-72.6, 44.1],
  'VA': [-79.4, 37.5], 'WA': [-120.7, 47.4], 'WV': [-80.6, 38.6],
  'WI': [-89.8, 44.6], 'WY': [-107.5, 43.0], 'DC': [-77.0, 38.9],
};

export function CountyMap({
  isDark = false,
  onCountyClick,
  onDownloadLeads,
  onAddToDashboard,
  isPinVerified = false,
  onPinRequired,
  isOwnerOperator = false
}: CountyMapProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCounty, setSelectedCounty] = useState<CountyData | null>(null);
  const [leadData, setLeadData] = useState<Record<string, number>>({});
  const [position, setPosition] = useState({ coordinates: [-96, 38] as [number, number], zoom: 1 });
  const [hoveredCounty, setHoveredCounty] = useState<string | null>(null);
  const [hoveredCountyName, setHoveredCountyName] = useState<string | null>(null);
  const [hoveredCountyPos, setHoveredCountyPos] = useState<{ x: number; y: number } | null>(null);
  const [totalLeads, setTotalLeads] = useState(0);
  const mapContainerRef = useRef<HTMLDivElement>(null);

  // Fetch lead data from API (with mock fallback)
  useEffect(() => {
    const fetchLeadData = async () => {
      try {
        const response = await fetch('/api/leads/by-county');
        if (response.ok) {
          const data = await response.json();
          setLeadData(data.leadsByCounty || {});
          setTotalLeads(data.totalLeads || 0);
        }
      } catch {
        // Use mock data for demo
        const mockData: Record<string, number> = {
          '06037': 1247, // Los Angeles, CA
          '48201': 892,  // Harris (Houston), TX
          '04013': 743,  // Maricopa (Phoenix), AZ
          '12086': 621,  // Miami-Dade, FL
          '17031': 534,  // Cook (Chicago), IL
          '06073': 478,  // San Diego, CA
          '48113': 412,  // Dallas, TX
          '53033': 389,  // King (Seattle), WA
          '06059': 356,  // Orange, CA
          '12011': 298,  // Broward, FL
          '13121': 287,  // Fulton (Atlanta), GA
          '32003': 245,  // Clark (Las Vegas), NV
          '36047': 234,  // Kings (Brooklyn), NY
          '48029': 221,  // Bexar (San Antonio), TX
          '06065': 198,  // Riverside, CA
        };
        setLeadData(mockData);
        setTotalLeads(Object.values(mockData).reduce((a, b) => a + b, 0));
      }
    };
    fetchLeadData();
  }, []);

  // Theme colors - Bold Red, White, Blue (American flag colors)
  const theme = useMemo(() => ({
    // Background
    bg: isDark ? '#0f172a' : '#ffffff',
    bgSecondary: isDark ? '#1e293b' : '#f1f5f9',
    bgHover: isDark ? '#334155' : '#e2e8f0',

    // Text
    text: isDark ? '#f8fafc' : '#1e293b',
    textSecondary: isDark ? '#94a3b8' : '#64748b',

    // Borders
    border: isDark ? '#334155' : '#e2e8f0',
    borderHover: isDark ? '#ffffff' : '#1e3a8a',

    // Judicial states (BOLD BLUE)
    judicialBase: isDark ? '#1e40af' : '#1e40af',
    judicialHover: '#ffffff',
    judicialIntense: '#1e3a8a',

    // Non-judicial states (BOLD RED)
    nonJudicialBase: isDark ? '#b91c1c' : '#dc2626',
    nonJudicialHover: '#ffffff',
    nonJudicialIntense: '#991b1b',

    // County borders
    countyStroke: isDark ? '#0f172a' : '#1e293b',
    stateStroke: isDark ? '#475569' : '#334155',

    // Selected
    selectedStroke: '#fbbf24',

    // Accent
    accent: '#2563eb',
    accentLight: isDark ? '#1e3a5f' : '#dbeafe',
  }), [isDark]);

  // Get color for county based on state type, fee cap, and lead count
  const getCountyColor = (geo: { id: string }, isHovered: boolean = false) => {
    const fips = geo.id;
    const stateFips = fips?.toString().slice(0, 2);
    const stateCode = STATE_FIPS_TO_CODE[stateFips];
    const leads = leadData[fips] || 0;

    const isJudicial = JUDICIAL_STATES.has(stateCode);
    const isFeeCapped = FEE_CAP_2500_STATES.has(stateCode);

    if (isHovered) {
      return isJudicial ? theme.judicialHover : theme.nonJudicialHover;
    }

    // Fee-capped states get a distinct amber/dark-orange color
    if (isFeeCapped) {
      return isDark ? '#78350f' : '#92400e';
    }

    if (leads > 0) {
      return isJudicial ? theme.judicialIntense : theme.nonJudicialIntense;
    }

    return isJudicial ? theme.judicialBase : theme.nonJudicialBase;
  };

  const handleCountyClick = (geo: { id: string; properties?: { name?: string } }) => {
    const fips = geo.id;
    const stateFips = fips?.toString().slice(0, 2);
    const stateCode = STATE_FIPS_TO_CODE[stateFips];
    const countyName = geo.properties?.name || `County ${fips}`;

    const countyData: CountyData = {
      fips,
      name: countyName,
      state: stateCode,
      leadCount: leadData[fips] || 0,
    };

    setSelectedCounty(countyData);
    onCountyClick?.(countyData);
  };

  const handleZoomIn = () => {
    if (position.zoom >= 8) return;
    setPosition(pos => ({ ...pos, zoom: pos.zoom * 1.5 }));
  };

  const handleZoomOut = () => {
    if (position.zoom <= 1) return;
    setPosition(pos => ({ ...pos, zoom: pos.zoom / 1.5 }));
  };

  const handleReset = () => {
    setPosition({ coordinates: [-96, 38], zoom: 1 });
    setSearchQuery('');
    setSelectedCounty(null);
  };

  const handleExport = () => {
    const data = {
      exportDate: new Date().toISOString(),
      totalLeads,
      leadsByCounty: leadData,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `county-leads-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{ backgroundColor: theme.bg, border: `1px solid ${theme.border}` }}
    >
      {/* Header */}
      <div
        className="p-4 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-3"
        style={{ borderColor: theme.border }}
      >
        <div>
          <h3 className="font-semibold text-sm sm:text-base" style={{ color: theme.text }}>
            Interactive US County Map
          </h3>
          <p className="text-xs" style={{ color: theme.textSecondary }}>
            {totalLeads.toLocaleString()} total leads across 3,143 counties
          </p>
        </div>

        {/* Search */}
        <div className="flex items-center gap-2">
          <div
            className="flex items-center px-3 py-1.5 rounded-lg"
            style={{ backgroundColor: theme.bgSecondary, border: `1px solid ${theme.border}` }}
          >
            <Search size={14} style={{ color: theme.textSecondary }} />
            <input
              type="text"
              placeholder="Search county..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="ml-2 bg-transparent outline-none text-sm w-32 sm:w-40"
              style={{ color: theme.text }}
            />
          </div>
          <button
            onClick={handleReset}
            className="p-1.5 rounded-lg transition-colors"
            style={{ backgroundColor: theme.bgSecondary }}
            title="Reset View"
          >
            <RotateCcw size={16} style={{ color: theme.textSecondary }} />
          </button>
          <button
            onClick={handleExport}
            className="p-1.5 rounded-lg transition-colors"
            style={{ backgroundColor: theme.bgSecondary }}
            title="Export Data"
          >
            <Download size={16} style={{ color: theme.textSecondary }} />
          </button>
        </div>
      </div>

      {/* Map */}
      <div
        ref={mapContainerRef}
        className="relative"
        style={{ height: '400px' }}
        onMouseMove={(e) => {
          if (mapContainerRef.current) {
            const rect = mapContainerRef.current.getBoundingClientRect();
            setHoveredCountyPos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
          }
        }}
      >
        <ComposableMap
          projection="geoAlbersUsa"
          projectionConfig={{ scale: 1000 }}
          style={{ width: '100%', height: '100%', backgroundColor: theme.bgSecondary }}
        >
          <ZoomableGroup
            zoom={position.zoom}
            center={position.coordinates}
            onMoveEnd={({ coordinates, zoom }: { coordinates: [number, number]; zoom: number }) => setPosition({ coordinates, zoom })}
          >
            {/* Layer 1: County fills */}
            <Geographies geography={GEO_URL}>
              {({ geographies }: { geographies: Array<{ id: string; rsmKey: string; properties: Record<string, string> }> }) =>
                geographies.map((geo) => {
                  const fips = geo.id;
                  const isHovered = hoveredCounty === fips;
                  const isSelected = selectedCounty?.fips === fips;

                  return (
                    <Geography
                      key={geo.rsmKey}
                      geography={geo}
                      onMouseEnter={() => {
                        setHoveredCounty(fips);
                        setHoveredCountyName(geo.properties?.name || null);
                      }}
                      onMouseLeave={() => {
                        setHoveredCounty(null);
                        setHoveredCountyName(null);
                        setHoveredCountyPos(null);
                      }}
                      onClick={() => handleCountyClick(geo)}
                      style={{
                        default: {
                          fill: getCountyColor(geo),
                          stroke: isSelected ? theme.selectedStroke : theme.countyStroke,
                          strokeWidth: isSelected ? 1.5 : 0.3,
                          outline: 'none',
                          cursor: 'pointer',
                        },
                        hover: {
                          fill: getCountyColor(geo, true),
                          stroke: theme.borderHover,
                          strokeWidth: 0.75,
                          outline: 'none',
                          cursor: 'pointer',
                        },
                        pressed: {
                          fill: getCountyColor(geo),
                          stroke: theme.selectedStroke,
                          strokeWidth: 1,
                          outline: 'none',
                        },
                      }}
                    />
                  );
                })
              }
            </Geographies>

            {/* Layer 2: State borders (white, on top of counties) */}
            <Geographies geography={STATES_GEO_URL}>
              {({ geographies }: { geographies: Array<{ id: string; rsmKey: string; properties: Record<string, string> }> }) =>
                geographies.map((geo) => (
                  <Geography
                    key={`state-border-${geo.rsmKey}`}
                    geography={geo}
                    style={{
                      default: {
                        fill: 'none',
                        stroke: '#ffffff',
                        strokeWidth: 3 / position.zoom,
                        outline: 'none',
                        pointerEvents: 'none',
                      },
                      hover: {
                        fill: 'none',
                        stroke: '#ffffff',
                        strokeWidth: 3 / position.zoom,
                        outline: 'none',
                        pointerEvents: 'none',
                      },
                      pressed: {
                        fill: 'none',
                        stroke: '#ffffff',
                        strokeWidth: 3 / position.zoom,
                        outline: 'none',
                        pointerEvents: 'none',
                      },
                    }}
                  />
                ))
              }
            </Geographies>

            {/* Layer 3: State abbreviation labels (fade as zoom increases) */}
            {Object.entries(STATE_CENTROIDS).map(([stateCode, coords]) => {
              const labelOpacity = Math.max(0.15, 1 - (position.zoom - 1) / 3);
              const fontSize = 10 / position.zoom;

              return (
                <Marker key={`label-${stateCode}`} coordinates={coords}>
                  <text
                    textAnchor="middle"
                    dominantBaseline="central"
                    style={{
                      fontSize,
                      fontWeight: 700,
                      fontFamily: 'system-ui, sans-serif',
                      fill: '#ffffff',
                      opacity: labelOpacity,
                      pointerEvents: 'none',
                      userSelect: 'none',
                      textShadow: '0 1px 3px rgba(0,0,0,0.8), 0 0 6px rgba(0,0,0,0.6)',
                      paintOrder: 'stroke',
                      stroke: 'rgba(0,0,0,0.5)',
                      strokeWidth: 2 / position.zoom,
                      strokeLinejoin: 'round' as const,
                    }}
                  >
                    {stateCode}
                  </text>
                </Marker>
              );
            })}
          </ZoomableGroup>
        </ComposableMap>

        {/* County info icon tooltip (visible at zoom > 2) */}
        {position.zoom > 2 && hoveredCounty && hoveredCountyName && hoveredCountyPos && (
          <div
            style={{
              position: 'absolute',
              left: hoveredCountyPos.x + 12,
              top: hoveredCountyPos.y - 32,
              pointerEvents: 'none',
              zIndex: 20,
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              backgroundColor: 'rgba(15, 23, 42, 0.92)',
              border: '1px solid rgba(255,255,255,0.2)',
              borderRadius: '6px',
              padding: '4px 8px',
              whiteSpace: 'nowrap',
            }}
          >
            <span style={{ fontSize: '13px', color: '#93c5fd', lineHeight: 1 }}>&#x2139;</span>
            <span style={{ fontSize: '11px', color: '#f1f5f9', fontWeight: 600, fontFamily: 'system-ui, sans-serif' }}>
              {hoveredCountyName} County
            </span>
          </div>
        )}

        {/* Zoom Controls */}
        <div
          className="absolute top-3 right-3 flex flex-col gap-1 rounded-lg overflow-hidden shadow-lg"
          style={{ backgroundColor: theme.bg, border: `1px solid ${theme.border}` }}
        >
          <button
            onClick={handleZoomIn}
            className="px-3 py-2 text-lg font-bold hover:bg-opacity-80 transition-colors"
            style={{ color: theme.text, backgroundColor: theme.bgSecondary }}
          >
            +
          </button>
          <button
            onClick={handleZoomOut}
            className="px-3 py-2 text-lg font-bold hover:bg-opacity-80 transition-colors border-t"
            style={{ color: theme.text, backgroundColor: theme.bgSecondary, borderColor: theme.border }}
          >
            -
          </button>
        </div>
      </div>

      {/* Legend */}
      <div
        className="p-3 border-t flex flex-wrap items-center justify-center gap-4 sm:gap-8 text-xs"
        style={{ borderColor: theme.border, backgroundColor: theme.bgSecondary }}
      >
        <div className="flex items-center gap-2">
          <div
            className="w-5 h-5 rounded"
            style={{ backgroundColor: '#1e40af', border: '2px solid #1e3a8a' }}
          />
          <span className="font-semibold" style={{ color: theme.text }}>Judicial States (Blue)</span>
        </div>
        <div className="flex items-center gap-2">
          <div
            className="w-5 h-5 rounded"
            style={{ backgroundColor: '#dc2626', border: '2px solid #991b1b' }}
          />
          <span className="font-semibold" style={{ color: theme.text }}>Non-Judicial States (Red)</span>
        </div>
        <div className="flex items-center gap-2">
          <div
            className="w-5 h-5 rounded"
            style={{ backgroundColor: '#ffffff', border: '2px solid #64748b' }}
          />
          <span className="font-semibold" style={{ color: theme.text }}>Hover / Selected (White)</span>
        </div>
        <div className="flex items-center gap-2">
          <div
            className="w-5 h-5 rounded flex items-center justify-center"
            style={{ backgroundColor: '#92400e', border: '2px solid #78350f' }}
          >
            <X size={12} style={{ color: '#ffffff' }} strokeWidth={3} />
          </div>
          <span className="font-semibold" style={{ color: theme.text }}>$2,500 Fee Cap (AZ, NV)</span>
        </div>
      </div>

      {/* County Popup */}
      {selectedCounty && (() => {
        const contact = findCountyContact(selectedCounty.state, selectedCounty.name);
        const courtInfo = findCountyCourtInfo(selectedCounty.state, selectedCounty.name);
        return (
          <div
            className="absolute bottom-20 left-1/2 transform -translate-x-1/2 rounded-xl p-4 shadow-xl max-w-sm w-full mx-4 z-10"
            style={{
              backgroundColor: theme.bg,
              border: `2px solid ${theme.accent}`,
            }}
          >
            <button
              onClick={() => setSelectedCounty(null)}
              className="absolute top-2 right-2 p-1 rounded hover:bg-opacity-80"
              style={{ color: theme.textSecondary }}
            >
              <X size={16} />
            </button>

            <div className="flex items-start gap-3">
              <div
                className="p-2 rounded-lg"
                style={{ backgroundColor: theme.accentLight }}
              >
                <MapPin size={20} style={{ color: theme.accent }} />
              </div>
              <div>
                <h4 className="font-semibold" style={{ color: theme.text }}>
                  {selectedCounty.name} County
                </h4>
                <p className="text-sm" style={{ color: theme.textSecondary }}>
                  {STATE_NAMES[selectedCounty.state]} ({selectedCounty.state})
                </p>
              </div>
            </div>

            <div className="mt-3 pt-3 border-t" style={{ borderColor: theme.border }}>
              <div className="flex justify-between items-center">
                <span className="text-sm" style={{ color: theme.textSecondary }}>Available Leads</span>
                <span
                  className="text-lg font-bold"
                  style={{ color: selectedCounty.leadCount > 0 ? '#22c55e' : theme.textSecondary }}
                >
                  {selectedCounty.leadCount.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between items-center mt-1">
                <span className="text-sm" style={{ color: theme.textSecondary }}>Foreclosure Type</span>
                <span
                  className="text-sm font-medium px-2 py-0.5 rounded"
                  style={{
                    backgroundColor: JUDICIAL_STATES.has(selectedCounty.state) ? theme.judicialBase : theme.nonJudicialBase,
                    color: '#ffffff'
                  }}
                >
                  {JUDICIAL_STATES.has(selectedCounty.state) ? 'Judicial' : 'Non-Judicial'}
                </span>
              </div>
            </div>

            {/* Fee Cap Warning */}
            {FEE_CAP_2500_STATES.has(selectedCounty.state) && (
              <div
                className="mt-3 pt-3 border-t flex items-center gap-2"
                style={{ borderColor: theme.border }}
              >
                <div
                  className="p-1 rounded flex items-center justify-center shrink-0"
                  style={{ backgroundColor: '#991b1b' }}
                >
                  <X size={14} style={{ color: '#ffffff' }} strokeWidth={3} />
                </div>
                <span className="text-xs font-semibold" style={{ color: '#dc2626' }}>
                  $2,500 asset recovery fee cap in {STATE_NAMES[selectedCounty.state]}
                </span>
              </div>
            )}

            {/* County Directory Contact Info + Court Filing */}
            {(contact || courtInfo) && !isOwnerOperator ? (
              <div className="mt-3 pt-3 border-t relative" style={{ borderColor: theme.border }}>
                {/* Blurred content */}
                <div style={{ filter: 'blur(5px)' }} className="pointer-events-none select-none space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: theme.textSecondary }}>
                    County Contact
                  </p>
                  <div className="flex items-center gap-2 text-sm" style={{ color: theme.accent }}>
                    <Phone size={14} />
                    (555) 000-0000
                  </div>
                  <div className="flex items-center gap-2 text-sm" style={{ color: theme.accent }}>
                    <Mail size={14} />
                    contact@county.gov
                  </div>
                  <div className="flex items-center gap-2 text-sm" style={{ color: theme.accent }}>
                    <Globe size={14} />
                    Visit Website
                  </div>
                  <p className="text-xs font-semibold uppercase tracking-wide pt-2" style={{ color: theme.textSecondary }}>
                    Court Filing
                  </p>
                  <div className="flex items-center gap-2 text-sm" style={{ color: '#10b981' }}>
                    <FileText size={14} />
                    E-Filing System
                  </div>
                  <div className="flex items-center gap-2 text-sm" style={{ color: theme.text }}>
                    <Printer size={14} />
                    Fax: (555) 000-0000
                  </div>
                </div>
                {/* Access gate overlay */}
                <div
                  className="absolute inset-0 flex items-center justify-center"
                  style={{ backgroundColor: isDark ? 'rgba(15,23,42,0.75)' : 'rgba(255,255,255,0.75)' }}
                >
                  <div
                    style={{
                      backgroundColor: isDark ? '#1c1917' : '#fffbeb',
                      border: `1px solid ${isDark ? '#78350f' : '#fbbf24'}`,
                      borderRadius: '12px',
                      padding: '16px',
                      maxWidth: '260px',
                      textAlign: 'center',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '40px',
                        height: '40px',
                        borderRadius: '50%',
                        backgroundColor: isDark ? '#78350f' : '#fef3c7',
                        margin: '0 auto 8px',
                      }}
                    >
                      <ShieldAlert size={20} style={{ color: isDark ? '#fbbf24' : '#b45309' }} />
                    </div>
                    <p style={{ fontSize: '13px', fontWeight: 700, color: isDark ? '#fbbf24' : '#92400e', margin: '0 0 4px' }}>
                      Owner Operator Access Only
                    </p>
                    <p style={{ fontSize: '11px', color: isDark ? '#a8a29e' : '#78716c', lineHeight: 1.4, margin: '0 0 10px' }}>
                      Full county contact data, court filing links, and e-filing access is exclusive to Senior Asset Recovery Agents with a $5,000 Owner Operator investment.
                    </p>
                    <a
                      href="https://www.usforeclosurerecovery.com/foreclosure-recovery-surplus-funds-business"
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        fontSize: '12px',
                        fontWeight: 600,
                        color: '#ffffff',
                        backgroundColor: isDark ? '#b45309' : '#d97706',
                        padding: '6px 14px',
                        borderRadius: '8px',
                        textDecoration: 'none',
                      }}
                    >
                      <Lock size={12} />
                      Become an Owner Operator
                    </a>
                  </div>
                </div>
              </div>
            ) : (
              <>
                {/* County Directory Contact Info (full access) */}
                {contact && (
                  <div className="mt-3 pt-3 border-t space-y-2" style={{ borderColor: theme.border }}>
                    <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: theme.textSecondary }}>
                      County Contact
                    </p>
                    {contact.phone && (
                      <a
                        href={`tel:${contact.phone.replace(/[^+\d]/g, '')}`}
                        className="flex items-center gap-2 text-sm hover:underline"
                        style={{ color: theme.accent }}
                      >
                        <Phone size={14} />
                        {contact.phone}
                      </a>
                    )}
                    {contact.email && (
                      <a
                        href={`mailto:${contact.email}`}
                        className="flex items-center gap-2 text-sm hover:underline truncate"
                        style={{ color: theme.accent }}
                      >
                        <Mail size={14} className="shrink-0" />
                        <span className="truncate">{contact.email}</span>
                      </a>
                    )}
                    {contact.website && (
                      <a
                        href={contact.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-sm hover:underline truncate"
                        style={{ color: theme.accent }}
                      >
                        <Globe size={14} className="shrink-0" />
                        <span className="truncate">Visit Website</span>
                      </a>
                    )}
                  </div>
                )}

                {!contact && (
                  <div className="mt-3 pt-3 border-t" style={{ borderColor: theme.border }}>
                    <p className="text-xs" style={{ color: theme.textSecondary }}>
                      No directory contact info available for this county.
                    </p>
                  </div>
                )}

                {/* Court Filing Info (full access) */}
                {courtInfo && (
                  <div className="mt-3 pt-3 border-t space-y-2" style={{ borderColor: theme.border }}>
                    <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: theme.textSecondary }}>
                      Court Filing
                    </p>
                    {(courtInfo.efilingUrl || courtInfo.statewideEfilingUrl) && (
                      <a
                        href={courtInfo.efilingUrl || courtInfo.statewideEfilingUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-sm hover:underline"
                        style={{ color: '#10b981' }}
                      >
                        <FileText size={14} />
                        <span className="truncate">
                          {courtInfo.efilingSystem || courtInfo.statewideEfilingSystem || 'E-File'}
                        </span>
                      </a>
                    )}
                    {courtInfo.fax && (
                      <div className="flex items-center gap-2 text-sm" style={{ color: theme.text }}>
                        <Printer size={14} style={{ color: theme.textSecondary }} />
                        <span>Fax: {courtInfo.fax}</span>
                      </div>
                    )}
                    {courtInfo.phone && (
                      <a
                        href={`tel:${courtInfo.phone.replace(/[^+\d]/g, '')}`}
                        className="flex items-center gap-2 text-sm hover:underline"
                        style={{ color: theme.accent }}
                      >
                        <Phone size={14} />
                        {courtInfo.phone}
                      </a>
                    )}
                    {courtInfo.clerkWebsite && (
                      <a
                        href={courtInfo.clerkWebsite}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-sm hover:underline truncate"
                        style={{ color: theme.accent }}
                      >
                        <Globe size={14} className="shrink-0" />
                        <span className="truncate">Clerk of Court</span>
                      </a>
                    )}
                  </div>
                )}
              </>
            )}

            {/* Action Buttons */}
            <div className="mt-3 pt-3 border-t flex gap-2" style={{ borderColor: theme.border }}>
              <button
                onClick={() => {
                  if (!isPinVerified) {
                    onPinRequired?.();
                    return;
                  }
                  onDownloadLeads?.(selectedCounty.state);
                }}
                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-white transition-colors"
                style={{ backgroundColor: '#10b981' }}
              >
                <Download size={14} />
                Download
              </button>
              <button
                onClick={() => {
                  if (!isPinVerified) {
                    onPinRequired?.();
                    return;
                  }
                  onAddToDashboard?.(selectedCounty.state);
                }}
                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-white transition-colors"
                style={{ backgroundColor: theme.accent }}
              >
                <Users size={14} />
                Add Leads
              </button>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
