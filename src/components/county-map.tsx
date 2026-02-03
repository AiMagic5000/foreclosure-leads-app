"use client"

import React, { useState, useEffect, useMemo } from 'react';
import {
  ComposableMap,
  Geographies,
  Geography,
  ZoomableGroup,
} from 'react-simple-maps';
import { Search, RotateCcw, Download, X, MapPin, Phone, Mail, Globe } from 'lucide-react';
import { findCountyContact, type CountyContact } from '@/data/county-directory';

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
}

// US counties TopoJSON URL
const GEO_URL = 'https://cdn.jsdelivr.net/npm/us-atlas@3/counties-10m.json';

export function CountyMap({ isDark = false, onCountyClick }: CountyMapProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCounty, setSelectedCounty] = useState<CountyData | null>(null);
  const [leadData, setLeadData] = useState<Record<string, number>>({});
  const [position, setPosition] = useState({ coordinates: [-96, 38] as [number, number], zoom: 1 });
  const [hoveredCounty, setHoveredCounty] = useState<string | null>(null);
  const [totalLeads, setTotalLeads] = useState(0);

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

  // Get color for county based on state type and lead count
  const getCountyColor = (geo: { id: string }, isHovered: boolean = false) => {
    const fips = geo.id;
    const stateFips = fips?.toString().slice(0, 2);
    const stateCode = STATE_FIPS_TO_CODE[stateFips];
    const leads = leadData[fips] || 0;

    const isJudicial = JUDICIAL_STATES.has(stateCode);

    if (isHovered) {
      return isJudicial ? theme.judicialHover : theme.nonJudicialHover;
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
      <div className="relative" style={{ height: '400px' }}>
        <ComposableMap
          projection="geoAlbersUsa"
          projectionConfig={{ scale: 1000 }}
          style={{ width: '100%', height: '100%', backgroundColor: theme.bgSecondary }}
        >
          <ZoomableGroup
            zoom={position.zoom}
            center={position.coordinates}
            onMoveEnd={({ coordinates, zoom }) => setPosition({ coordinates: coordinates as [number, number], zoom })}
          >
            <Geographies geography={GEO_URL}>
              {({ geographies }) =>
                geographies.map((geo) => {
                  const fips = geo.id;
                  const isHovered = hoveredCounty === fips;
                  const isSelected = selectedCounty?.fips === fips;

                  return (
                    <Geography
                      key={geo.rsmKey}
                      geography={geo}
                      onMouseEnter={() => setHoveredCounty(fips)}
                      onMouseLeave={() => setHoveredCounty(null)}
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
          </ZoomableGroup>
        </ComposableMap>

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
      </div>

      {/* County Popup */}
      {selectedCounty && (() => {
        const contact = findCountyContact(selectedCounty.state, selectedCounty.name);
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

            {/* County Directory Contact Info */}
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
          </div>
        );
      })()}
    </div>
  );
}
