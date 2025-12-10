import React, { useState, useEffect, useRef } from 'react';
import { TargetScanResult, ScanProgressResponse } from '../types/availability';
import { getPublicTargetsSummary } from '../utils/api';
import { useSilentRefresh } from '../hooks/useSilentRefresh';
import { CheckCircleIcon, XCircleIcon, ClockIcon, GlobeAltIcon, LinkIcon, CloudIcon, ServerIcon, ShieldCheckIcon, ArrowDownTrayIcon } from '@heroicons/react/24/outline';

interface ScanResultsProps {
  scanData: ScanProgressResponse | null;
  isLoading?: boolean;
}

const ScanResults: React.FC<ScanResultsProps> = ({ scanData, isLoading = false }) => {
  const [targets, setTargets] = useState<any>(null);
  const [targetsLoading, setTargetsLoading] = useState(true);
  const timestampRef = useRef<HTMLDivElement>(null);

  // Fetch configured targets once
  useEffect(() => {
    const fetchTargets = async () => {
      try {
        const data = await getPublicTargetsSummary();
        setTargets(data);
      } catch (error) {
        console.error('Error fetching targets:', error);
      } finally {
        setTargetsLoading(false);
      }
    };

    fetchTargets();
  }, []);

  // Use silent refresh for timestamp only (no re-renders)
  useSilentRefresh(
    async () => {
      // Silent fetch that doesn't update state
      return await getPublicTargetsSummary();
    },
    {
      interval: 30000,
      enabled: !scanData || scanData.status === 'complete' || scanData.status === 'failed',
      onUpdate: () => {
        // Only update timestamp silently without re-render
        if (timestampRef.current) {
          timestampRef.current.textContent = new Date().toLocaleTimeString();
        }
      }
    }
  );

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
      case 'running':
        return <ClockIcon className="h-5 w-5 text-blue-500 animate-spin" />;
      case 'failed':
        return <XCircleIcon className="h-5 w-5 text-red-500" />;
      default:
        return <ClockIcon className="h-5 w-5 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-green-600 bg-green-100 dark:bg-green-900/20 dark:text-green-400';
      case 'running':
        return 'text-blue-600 bg-blue-100 dark:bg-blue-900/20 dark:text-blue-400';
      case 'failed':
        return 'text-red-600 bg-red-100 dark:bg-red-900/20 dark:text-red-400';
      default:
        return 'text-gray-600 bg-gray-100 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  const getAvailabilityBadge = (availability: boolean) => {
    if (availability) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400">
          <CheckCircleIcon className="h-3 w-3 mr-1" />
          Available
        </span>
      );
    } else {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400">
          <XCircleIcon className="h-3 w-3 mr-1" />
          Unavailable
        </span>
      );
    }
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getCountryFlag = (country: string | null) => {
    if (!country) return null;

    // Use emoji flags instead of unreliable image URLs
    const getCountryEmoji = (countryName: string): string => {
      const countryMap: { [key: string]: string } = {
        'United States': '🇺🇸',
        'Canada': '🇨🇦',
        'United Kingdom': '🇬🇧',
        'Germany': '🇩🇪',
        'France': '🇫🇷',
        'Italy': '🇮🇹',
        'Spain': '🇪🇸',
        'Netherlands': '🇳🇱',
        'Belgium': '🇧🇪',
        'Switzerland': '🇨🇭',
        'Austria': '🇦🇹',
        'Sweden': '🇸🇪',
        'Norway': '🇳🇴',
        'Denmark': '🇩🇰',
        'Finland': '🇫🇮',
        'Poland': '🇵🇱',
        'Czech Republic': '🇨🇿',
        'Hungary': '🇭🇺',
        'Romania': '🇷🇴',
        'Bulgaria': '🇧🇬',
        'Greece': '🇬🇷',
        'Turkey': '🇹🇷',
        'Russia': '🇷🇺',
        'Ukraine': '🇺🇦',
        'Belarus': '🇧🇾',
        'Estonia': '🇪🇪',
        'Latvia': '🇱🇻',
        'Lithuania': '🇱🇹',
        'Ireland': '🇮🇪',
        'Portugal': '🇵🇹',
        'Brazil': '🇧🇷',
        'Argentina': '🇦🇷',
        'Mexico': '🇲🇽',
        'Chile': '🇨🇱',
        'Peru': '🇵🇪',
        'Colombia': '🇨🇴',
        'Venezuela': '🇻🇪',
        'Australia': '🇦🇺',
        'New Zealand': '🇳🇿',
        'China': '🇨🇳',
        'Japan': '🇯🇵',
        'South Korea': '🇰🇷',
        'India': '🇮🇳',
        'Pakistan': '🇵🇰',
        'Bangladesh': '🇧🇩',
        'Indonesia': '🇮🇩',
        'Malaysia': '🇲🇾',
        'Singapore': '🇸🇬',
        'Thailand': '🇹🇭',
        'Vietnam': '🇻🇳',
        'Philippines': '🇵🇭',
        'South Africa': '🇿🇦',
        'Egypt': '🇪🇬',
        'Israel': '🇮🇱',
        'Saudi Arabia': '🇸🇦',
        'United Arab Emirates': '🇦🇪',
        'Qatar': '🇶🇦',
        'Kuwait': '🇰🇼',
        'Bahrain': '🇧🇭',
        'Oman': '🇴🇲',
        'Jordan': '🇯🇴',
        'Lebanon': '🇱🇧',
        'Iraq': '🇮🇶',
        'Iran': '🇮🇷',
        'Afghanistan': '🇦🇫',
        'Sri Lanka': '🇱🇰',
        'Myanmar': '🇲🇲',
        'Cambodia': '🇰🇭',
        'Laos': '🇱🇦',
        'Mongolia': '🇲🇳',
        'Kazakhstan': '🇰🇿',
        'Uzbekistan': '🇺🇿',
        'Kyrgyzstan': '🇰🇬',
        'Tajikistan': '🇹🇯',
        'Turkmenistan': '🇹🇲',
        'Georgia': '🇬🇪',
        'Armenia': '🇦🇲',
        'Azerbaijan': '🇦🇿',
        'Cyprus': '🇨🇾',
        'Malta': '🇲🇹',
        'Luxembourg': '🇱🇺',
        'Monaco': '🇲🇨',
        'Iceland': '🇮🇸',
        'Greenland': '🇬🇱',
        'Albania': '🇦🇱',
        'Macedonia': '🇲🇰',
        'Montenegro': '🇲🇪',
        'Serbia': '🇷🇸',
        'Bosnia': '🇧🇦',
        'Croatia': '🇭🇷',
        'Slovenia': '🇸🇮',
        'Slovakia': '🇸🇰',
        'Moldova': '🇲🇩',
        'Andorra': '🇦🇩',
        'San Marino': '🇸🇲',
        'Liechtenstein': '🇱🇮',
        'Vatican': '🇻🇦',
        'Gibraltar': '🇬🇮',
        'Guernsey': '🇬🇬',
        'Jersey': '🇯🇪',
        'Isle of Man': '🇮🇲',
        'Bermuda': '🇧🇲',
        'Cayman Islands': '🇰🇾',
        'Turks and Caicos': '🇹🇨',
        'British Virgin Islands': '🇻🇬',
        'Anguilla': '🇦🇮',
        'Montserrat': '🇲🇸',
        'Antigua and Barbuda': '🇦🇬',
        'Barbados': '🇧🇧',
        'Trinidad and Tobago': '🇹🇹',
        'Dominica': '🇩🇲',
        'St. Lucia': '🇱🇨',
        'St. Vincent': '🇻🇨',
        'Grenada': '🇬🇩',
        'Jamaica': '🇯🇲',
        'Bahamas': '🇧🇸',
        'Dominican Republic': '🇩🇴',
        'Haiti': '🇭🇹',
        'Puerto Rico': '🇵🇷',
        'Guatemala': '🇬🇹',
        'Belize': '🇧🇿',
        'Honduras': '🇭🇳',
        'El Salvador': '🇸🇻',
        'Nicaragua': '🇳🇮',
        'Costa Rica': '🇨🇷',
        'Panama': '🇵🇦',
        'Uruguay': '🇺🇾',
        'Paraguay': '🇵🇾',
        'Bolivia': '🇧🇴',
        'Ecuador': '🇪🇨',
        'Guyana': '🇬🇾',
        'Suriname': '🇸🇷',
        'French Guiana': '🇬🇫',
        'French Polynesia': '🇵🇫',
        'New Caledonia': '🇳🇨',
        'Wallis and Futuna': '🇼🇫',
        'Samoa': '🇼🇸',
        'Tonga': '🇹🇴',
        'Tuvalu': '🇹🇻',
        'Kiribati': '🇰🇮',
        'Marshall Islands': '🇲🇭',
        'Palau': '🇵🇼',
        'Federated States of Micronesia': '🇫🇲',
        'Nauru': '🇳🇷',
        'Papua New Guinea': '🇵🇬',
        'Solomon Islands': '🇸🇧',
        'Vanuatu': '🇻🇺',
        'Fiji': '🇫🇯',
        'Western Sahara': '🇪🇭',
        'Sahrawi Arab Democratic Republic': '🇸🇭',
        'Mayotte': '🇾🇹',
        'Reunion': '🇷🇪',
        'Saint Martin': '🇸🇽',
        'Saint Barthelemy': '🇧🇱',
        'Saint Pierre and Miquelon': '🇵🇲',
        'Saint Eustatius': '🇸🇽',
        'Ascension Island': '🇦🇸',
        'Tristan da Cunha': '🇹🇹',
        'Cook Islands': '🇰🇰',
        'Niue': '🇳🇺',
        'Tokelau': '🇹🇰',
        'Pitcairn Islands': '🇵🇳',
        'South Georgia and the South Sandwich Islands': '🇬🇸',
        'British Antarctic Territory': '🇬🇶',
        'British Indian Ocean Territory': '🇮🇴',
        'Virgin Islands': '🇻🇮',
        // Add more common countries as needed
      };

      // Try to find exact match first
      if (countryMap[countryName]) {
        return countryMap[countryName];
      }

      // Try to find by partial match (contains)
      for (const [name, flag] of Object.entries(countryMap)) {
        if (name.toLowerCase().includes(countryName.toLowerCase()) ||
            countryName.toLowerCase().includes(name.toLowerCase())) {
          return flag;
        }
      }

      // Return generic flag for unknown countries
      return '🏳️';
    };

    return (
      <span className="inline-block text-lg" title={country}>
        {getCountryEmoji(country)}
      </span>
    );
  };

  const getCloudProviderBadge = (metadata: any) => {
    if (!metadata) return null;

    if (metadata.aws) {
      return (
        <div className="flex items-center space-x-2 mt-2">
          <div className="flex items-center space-x-1 bg-orange-100 dark:bg-orange-900/30 px-2 py-1 rounded-md">
            <CloudIcon className="h-4 w-4 text-orange-600 dark:text-orange-400" />
            <span className="text-xs font-semibold text-orange-800 dark:text-orange-300">AWS</span>
          </div>
          <span className="text-xs text-gray-600 dark:text-gray-400 font-medium">
            {metadata.aws.service}
          </span>
          {metadata.aws.region && (
            <span className="text-xs text-gray-500 dark:text-gray-500">
              ({metadata.aws.region})
            </span>
          )}
        </div>
      );
    }

    if (metadata.gcp) {
      return (
        <div className="flex items-center space-x-2 mt-2">
          <div className="flex items-center space-x-1 bg-blue-100 dark:bg-blue-900/30 px-2 py-1 rounded-md">
            <ServerIcon className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            <span className="text-xs font-semibold text-blue-800 dark:text-blue-300">GCP</span>
          </div>
          <span className="text-xs text-gray-600 dark:text-gray-400 font-medium">
            {metadata.gcp.service}
          </span>
          {metadata.gcp.region && (
            <span className="text-xs text-gray-500 dark:text-gray-500">
              ({metadata.gcp.region})
            </span>
          )}
        </div>
      );
    }

    return null;
  };

  const getProviderIcon = (provider: string | null) => {
    if (!provider) return null;

    const lowerProvider = provider.toLowerCase();
    if (lowerProvider.includes('amazon') || lowerProvider.includes('aws')) {
      return <CloudIcon className="h-4 w-4 text-orange-500" />;
    }
    if (lowerProvider.includes('google') || lowerProvider.includes('gcp')) {
      return <ServerIcon className="h-4 w-4 text-blue-500" />;
    }
    if (lowerProvider.includes('microsoft') || lowerProvider.includes('azure')) {
      return <ShieldCheckIcon className="h-4 w-4 text-purple-500" />;
    }
    return <GlobeAltIcon className="h-4 w-4 text-gray-500" />;
  };

  const getFlagIconClass = (country: string | null): string => {
    if (!country) return '';

    // Map country names to flag-icons CSS classes
    const countryToFlag: { [key: string]: string } = {
      'United States': 'us',
      'USA': 'us',
      'US': 'us',
      'China': 'cn',
      'Russia': 'ru',
      'United Kingdom': 'gb',
      'UK': 'gb',
      'Great Britain': 'gb',
      'Germany': 'de',
      'France': 'fr',
      'Japan': 'jp',
      'India': 'in',
      'Canada': 'ca',
      'Australia': 'au',
      'Brazil': 'br',
      'South Korea': 'kr',
      'Italy': 'it',
      'Spain': 'es',
      'Mexico': 'mx',
      'Indonesia': 'id',
      'Netherlands': 'nl',
      'Saudi Arabia': 'sa',
      'Switzerland': 'ch',
      'Taiwan': 'tw',
      'Belgium': 'be',
      'Ireland': 'ie',
      'Israel': 'il',
      'Austria': 'at',
      'Norway': 'no',
      'United Arab Emirates': 'ae',
      'UAE': 'ae',
      'Nigeria': 'ng',
      'Egypt': 'eg',
      'South Africa': 'za',
      'Argentina': 'ar',
      'Thailand': 'th',
      'Poland': 'pl',
      'Malaysia': 'my',
      'Philippines': 'ph',
      'Ukraine': 'ua',
      'Bangladesh': 'bd',
      'Vietnam': 'vn',
      'Chile': 'cl',
      'Finland': 'fi',
      'Singapore': 'sg',
      'Denmark': 'dk',
      'Hong Kong': 'hk',
      'Sweden': 'se',
      'Czech Republic': 'cz',
      'Romania': 'ro',
      'Portugal': 'pt',
      'New Zealand': 'nz',
      'Luxembourg': 'lu',
      'Hungary': 'hu',
      'Belarus': 'by',
      'Bulgaria': 'bg',
      'Croatia': 'hr',
      'Slovakia': 'sk',
      'Slovenia': 'si',
      'Lithuania': 'lt',
      'Latvia': 'lv',
      'Estonia': 'ee',
      'Iceland': 'is',
      'Malta': 'mt',
      'Cyprus': 'cy',
      'Greece': 'gr',
      'Turkey': 'tr',
      'Pakistan': 'pk',
      'Morocco': 'ma',
      'Peru': 'pe',
      'Colombia': 'co',
      'Kazakhstan': 'kz',
      'Qatar': 'qa',
      'Kuwait': 'kw',
      'Costa Rica': 'cr',
      'Uruguay': 'uy',
      'Panama': 'pa',
      'Ecuador': 'ec',
      'Dominican Republic': 'do',
      'Guatemala': 'gt',
      'Cuba': 'cu',
      'Bolivia': 'bo',
      'Venezuela': 've',
      'Sri Lanka': 'lk',
      'Kenya': 'ke',
      'Ghana': 'gh',
      'Ethiopia': 'et',
      'Tanzania': 'tz',
      'Uganda': 'ug',
      'Tunisia': 'tn',
      'Serbia': 'rs',
      'Albania': 'al',
      'Macedonia': 'mk',
      'North Macedonia': 'mk',
      'Moldova': 'md',
      'Bosnia and Herzegovina': 'ba',
      'Montenegro': 'me',
      'Andorra': 'ad',
      'Monaco': 'mc',
      'San Marino': 'sm',
      'Liechtenstein': 'li',
      'Vatican City': 'va',
      'Holy See': 'va',
      'Gibraltar': 'gi',
      'Jordan': 'jo',
      'Lebanon': 'lb',
      'Syria': 'sy',
      'Iraq': 'iq',
      'Yemen': 'ye',
      'Bahrain': 'bh',
      'Oman': 'om',
      'Afghanistan': 'af',
      'Libya': 'ly',
      'Sudan': 'sd',
      'Algeria': 'dz',
      'Senegal': 'sn',
      'Ivory Coast': 'ci',
      'Côte d\'Ivoire': 'ci',
      'Burkina Faso': 'bf',
      'Mali': 'ml',
      'Niger': 'ne',
      'Chad': 'td',
      'Central African Republic': 'cf',
      'Cameroon': 'cm',
      'Congo': 'cg',
      'Democratic Republic of the Congo': 'cd',
      'DRC': 'cd',
      'Gabon': 'ga',
      'Equatorial Guinea': 'gq',
      'São Tomé and Príncipe': 'st',
      'Cape Verde': 'cv',
      'Guinea-Bissau': 'gw',
      'Guinea': 'gn',
      'Sierra Leone': 'sl',
      'Liberia': 'lr',
      'Togo': 'tg',
      'Benin': 'bj',
      'Burundi': 'bi',
      'Rwanda': 'rw',
      'South Sudan': 'ss',
      'Eritrea': 'er',
      'Djibouti': 'dj',
      'Somalia': 'so',
      'Comoros': 'km',
      'Mauritius': 'mu',
      'Seychelles': 'sc',
      'Madagascar': 'mg',
      'Zimbabwe': 'zw',
      'Botswana': 'bw',
      'Namibia': 'na',
      'Zambia': 'zm',
      'Malawi': 'mw',
      'Mozambique': 'mz',
      'Eswatini': 'sz',
      'Lesotho': 'ls',
      'Angola': 'ao',
      'Bahamas': 'bs',
      'Barbados': 'bb',
      'Trinidad and Tobago': 'tt',
      'Dominica': 'dm',
      'St. Lucia': 'lc',
      'St. Vincent and the Grenadines': 'vc',
      'Grenada': 'gd',
      'Antigua and Barbuda': 'ag',
      'St. Kitts and Nevis': 'kn',
      'Belize': 'bz',
      'Guyana': 'gy',
      'Suriname': 'sr',
      'Jamaica': 'jm',
      'Haiti': 'ht',
      'Puerto Rico': 'pr',
      'U.S. Virgin Islands': 'vi',
      'British Virgin Islands': 'vg',
      'Cayman Islands': 'ky',
      'Turks and Caicos Islands': 'tc',
      'Bermuda': 'bm',
      'Aruba': 'aw',
      'Curaçao': 'cw',
      'Sint Maarten': 'sx',
      'Fiji': 'fj',
      'Papua New Guinea': 'pg',
      'Solomon Islands': 'sb',
      'Vanuatu': 'vu',
      'Samoa': 'ws',
      'Tonga': 'to',
      'Kiribati': 'ki',
      'Marshall Islands': 'mh',
      'Palau': 'pw',
      'Nauru': 'nr',
      'Tuvalu': 'tv',
      'Micronesia': 'fm'
    };

    const flagClass = countryToFlag[country];
    return flagClass ? `fi fi-${flagClass}` : '';
  };

  // Download functions
  const downloadJSON = () => {
    if (!scanData || !scanData.results) return;

    const jsonData = {
      scan_info: {
        token: scanData.token,
        status: scanData.status,
        mode: scanData.mode,
        started_at: scanData.started_at,
        finished_at: scanData.finished_at,
        total_targets: scanData.total_targets,
        completed_targets: scanData.completed_targets
      },
      results: scanData.results.map(result => ({
        target: result.target,
        ip_address: result.ip_address,
        availability: result.availability,
        metadata: {
          location: result.metadata.location,
          country: result.metadata.country,
          provider: result.metadata.provider,
          service_category: result.metadata.service_category,
          aws: result.metadata.aws,
          gcp: result.metadata.gcp
        },
        publicly_exposed: result.publicly_exposed,
        open_ports: result.open_ports,
        accessibility_tests: result.accessibility_tests,
        testing_techniques: result.testing_techniques,
        risk_level: result.risk_level,
        risk_summary: result.risk_summary,
        recommendation: result.recommendation
      }))
    };

    const blob = new Blob([JSON.stringify(jsonData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `scan-results-${scanData.token}-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const downloadCSV = () => {
    if (!scanData || !scanData.results) return;

    const headers = [
      'Target', 'IP Address', 'Available', 'Location', 'Country', 'Provider',
      'Service Category', 'Service', 'Region', 'Publicly Exposed', 'Open Ports',
      'Testing Techniques', 'Risk Level', 'Risk Summary', 'Recommendation'
    ];

    const csvContent = [
      headers.join(','),
      ...scanData.results.map(result => {
        const service = result.metadata.aws?.service || result.metadata.gcp?.service || 'N/A';
        const region = result.metadata.aws?.region || result.metadata.gcp?.region || 'N/A';
        const testingTechniques = result.testing_techniques ? result.testing_techniques.join('; ') : 'N/A';
        const openPorts = result.open_ports.length > 0 ? result.open_ports.join('; ') : 'N/A';

        return [
          `"${result.target}"`,
          `"${result.ip_address}"`,
          result.availability ? 'Yes' : 'No',
          `"${result.metadata.location || 'N/A'}"`,
          `"${result.metadata.country || 'N/A'}"`,
          `"${result.metadata.provider || 'N/A'}"`,
          `"${result.metadata.service_category || 'N/A'}"`,
          `"${service}"`,
          `"${region}"`,
          result.publicly_exposed ? 'Yes' : 'No',
          `"${openPorts}"`,
          `"${testingTechniques}"`,
          `"${result.risk_level}"`,
          `"${result.risk_summary || 'N/A'}"`,
          `"${result.recommendation || 'N/A'}"`
        ].join(',');
      })
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `scan-results-${scanData.token}-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        <div className="flex justify-center items-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  if (!scanData) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          No scan data available
        </div>
      </div>
    );
  }

  const progressPercentage = scanData.total_targets > 0 
    ? (scanData.completed_targets / scanData.total_targets) * 100 
    : 0;

  return (
    <div className="space-y-6">
      {/* Scan Header */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            {getStatusIcon(scanData.status)}
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Scan Results
            </h3>
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(scanData.status)}`}>
              {scanData.status.charAt(0).toUpperCase() + scanData.status.slice(1)}
            </span>
            {scanData.status === 'running' && (
              <div className="flex items-center space-x-1 text-xs text-blue-600 dark:text-blue-400">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                <span>Live Update</span>
              </div>
            )}
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Mode: {scanData.mode === 'ai' ? 'AI Enhanced' : 'Standard'}
            </div>
            {scanData.status === 'complete' && scanData.results && scanData.results.length > 0 && (
              <div className="flex items-center space-x-2">
                <button
                  onClick={downloadJSON}
                  className="flex items-center space-x-1 px-3 py-1.5 text-xs font-medium company-blue bg-cyan-50 border border-cyan-200 rounded-md hover:bg-cyan-100 dark:bg-cyan-500/20 dark:text-cyan-400 dark:border-cyan-500/50 dark:hover:bg-cyan-500/30 transition-colors"
                  title="Download as JSON"
                >
                  <ArrowDownTrayIcon className="h-4 w-4" />
                  <span>JSON</span>
                </button>
                <button
                  onClick={downloadCSV}
                  className="flex items-center space-x-1 px-3 py-1.5 text-xs font-medium company-blue bg-cyan-50 border border-cyan-200 rounded-md hover:bg-cyan-100 dark:bg-cyan-500/20 dark:text-cyan-400 dark:border-cyan-500/50 dark:hover:bg-cyan-500/30 transition-colors"
                  title="Download as CSV"
                >
                  <ArrowDownTrayIcon className="h-4 w-4" />
                  <span>CSV</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-4">
          <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-1">
            <span>Progress</span>
            <span>{scanData.completed_targets} / {scanData.total_targets} targets</span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progressPercentage}%` }}
            ></div>
          </div>
        </div>

        {/* Timestamps */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div>
            <span className="text-gray-500 dark:text-gray-400">Started:</span>
            <div className="font-medium text-gray-900 dark:text-white">
              {formatDateTime(scanData.started_at)}
            </div>
          </div>
          {scanData.finished_at && (
            <div>
              <span className="text-gray-500 dark:text-gray-400">Finished:</span>
              <div className="font-medium text-gray-900 dark:text-white">
                {formatDateTime(scanData.finished_at)}
              </div>
            </div>
          )}
          <div>
            <span className="text-gray-500 dark:text-gray-400">Last Updated:</span>
            <div ref={timestampRef} className="font-medium text-gray-900 dark:text-white">
              {new Date().toLocaleTimeString()}
            </div>
          </div>
        </div>
      </div>

      {/* Cloud Provider Summary */}
      {scanData && scanData.results && scanData.results.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Infrastructure Overview
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {(() => {
              const awsCount = scanData.results.filter(r => r.metadata?.aws).length;
              const gcpCount = scanData.results.filter(r => r.metadata?.gcp).length;
              const otherCount = scanData.results.length - awsCount - gcpCount;

              return (
                <>
                  {awsCount > 0 && (
                    <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4">
                      <div className="flex items-center space-x-3">
                        <CloudIcon className="h-8 w-8 text-orange-600 dark:text-orange-400" />
                        <div>
                          <div className="text-lg font-semibold text-orange-900 dark:text-orange-100">
                            {awsCount}
                          </div>
                          <div className="text-sm text-orange-700 dark:text-orange-300">
                            AWS Services
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  {gcpCount > 0 && (
                    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                      <div className="flex items-center space-x-3">
                        <ServerIcon className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                        <div>
                          <div className="text-lg font-semibold text-blue-900 dark:text-blue-100">
                            {gcpCount}
                          </div>
                          <div className="text-sm text-blue-700 dark:text-blue-300">
                            GCP Services
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  {otherCount > 0 && (
                    <div className="bg-gray-50 dark:bg-gray-900/20 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                      <div className="flex items-center space-x-3">
                        <GlobeAltIcon className="h-8 w-8 text-gray-600 dark:text-gray-400" />
                        <div>
                          <div className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                            {otherCount}
                          </div>
                          <div className="text-sm text-gray-700 dark:text-gray-300">
                            Other Providers
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              );
            })()}
          </div>
        </div>
      )}

      {/* Show scan results if available */}
      {scanData && scanData.results && scanData.results.length > 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
              Target Results ({scanData.results.length})
            </h4>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Latest scan results - {scanData.completed_targets}/{scanData.total_targets} targets scanned
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Target
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Location
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Service Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Open Ports
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Risk Level
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Testing Techniques
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {scanData.results.map((result: any, index: number) => (
                  <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-start space-x-3">
                        <div className="flex-shrink-0 mt-0.5">
                          {getProviderIcon(result.metadata?.provider)}
                        </div>
                        <div className="flex-1">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {result.target}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {result.ip_address}
                          </div>
                          {getCloudProviderBadge(result.metadata)}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getAvailabilityBadge(result.availability)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        {getFlagIconClass(result.metadata?.country) && (
                          <span className={getFlagIconClass(result.metadata?.country)}></span>
                        )}
                        <div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {result.metadata?.country || 'Unknown'}
                          </div>
                          {result.metadata?.location && (
                            <div className="text-xs text-gray-400 dark:text-gray-500">
                              {result.metadata.location}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-white font-medium">
                        {result.metadata?.service_category || result.metadata?.provider || 'Unknown'}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {result.metadata?.provider && result.metadata?.service_category !== result.metadata?.provider
                          ? result.metadata.provider
                          : 'General Hosting'
                        }
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-wrap gap-1">
                        {result.open_ports.length > 0 ? (
                          result.open_ports.slice(0, 3).map((port: number) => (
                            <span key={port} className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400">
                              {port}
                            </span>
                          ))
                        ) : (
                          <span className="text-sm text-gray-500 dark:text-gray-400">None</span>
                        )}
                        {result.open_ports.length > 3 && (
                          <span className="text-sm text-gray-500 dark:text-gray-400">
                            +{result.open_ports.length - 3} more
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        result.risk_level === 'low' ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' :
                        result.risk_level === 'medium' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400' :
                        result.risk_level === 'high' ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400' :
                        'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
                      }`}>
                        {result.risk_level.charAt(0).toUpperCase() + result.risk_level.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-wrap gap-1 max-w-xs">
                        {result.testing_techniques && result.testing_techniques.length > 0 ? (
                          result.testing_techniques.slice(0, 3).map((technique: string, idx: number) => (
                            <span key={idx} className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400">
                              {technique}
                            </span>
                          ))
                        ) : (
                          <span className="text-sm text-gray-500 dark:text-gray-400">None</span>
                        )}
                        {result.testing_techniques && result.testing_techniques.length > 3 && (
                          <span className="text-sm text-gray-500 dark:text-gray-400">
                            +{result.testing_techniques.length - 3} more
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {scanData.results.some((r: any) => r.risk_summary) && (
            <div className="border-t border-gray-200 dark:border-gray-700 px-6 py-4">
              <h5 className="text-sm font-medium text-gray-900 dark:text-white mb-2">Security Summary</h5>
              <div className="space-y-2">
                {scanData.results.filter((r: any) => r.risk_summary).map((result: any, index: number) => (
                  <div key={index} className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div className="flex items-start space-x-2">
                      <div className={`w-2 h-2 rounded-full mt-1.5 ${
                        result.risk_level === 'high' ? 'bg-red-500' :
                        result.risk_level === 'medium' ? 'bg-yellow-500' :
                        'bg-green-500'
                      }`}></div>
                      <div className="flex-1">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {result.target}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-300">
                          {result.risk_summary}
                        </div>
                        {result.recommendation && (
                          <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                            <strong>Recommendation:</strong> {result.recommendation}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Show configured targets when no scan results */
        targets && targets.targets && targets.targets.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                Target Results ({targets.targets.length})
              </h4>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Configured monitoring targets - Ready to scan
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Target
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Description
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {targets.targets.map((target: any, index: number) => (
                    <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 mr-3">
                            {target.type === 'ip' ? (
                              <GlobeAltIcon className="h-5 w-5 text-blue-500" />
                            ) : (
                              <LinkIcon className="h-5 w-5 text-purple-500" />
                            )}
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              {target.value}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400 capitalize">
                              {target.type}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          target.type === 'ip'
                            ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400'
                            : 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400'
                        }`}>
                          {target.type === 'ip' ? 'IP Address' : 'Endpoint'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {target.description || 'No description'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400">
                          <ClockIcon className="h-3 w-3 mr-1" />
                          Pending Scan
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )
      )}

      {/* Show empty state if no targets */}
      {(!targets || !targets.targets || targets.targets.length === 0) && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
          <div className="text-center">
            <GlobeAltIcon className="h-12 w-12 text-gray-400 mx-auto mb-3" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No targets configured
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Add IP addresses or endpoints to start monitoring their availability.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ScanResults;