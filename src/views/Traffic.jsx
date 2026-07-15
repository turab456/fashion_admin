import React, { useState, useEffect } from "react";
import { api } from "../services/api";
import { Globe, MapPin, Smartphone, Laptop, Tablet, Eye, MousePointer2, Users, Percent, ArrowUpRight } from "lucide-react";
import PageHeader from "../components/ui/PageHeader";
import Card from "../components/ui/Card";
import { Table, TableHeader, TableHead, TableBody, TableRow, TableCell } from "../components/ui/Table";
import Badge from "../components/ui/Badge";
import { PieChart, Pie, Cell, Tooltip as RechartsTooltip, ResponsiveContainer } from "recharts";
import {
  ComposableMap,
  Geographies,
  Geography,
  ZoomableGroup
} from "react-simple-maps";
import { scaleLinear } from "d3-scale";

// The topojson URL for the world map
const geoUrl = "https://unpkg.com/world-atlas@2.0.2/countries-110m.json";

export default function Traffic() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [hoveredCountry, setHoveredCountry] = useState(null);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const res = await api.traffic.getStats();
      setStats(res.data);
    } catch (err) {
      console.error("Failed to load traffic stats", err);
    } finally {
      setLoading(false);
    }
  };

  // Convert map data to ISO Alpha-3 codes if possible, or match by name, but geoip usually gives ISO-2.
  const iso2to3 = {
    "IN": "IND",
    "US": "USA",
    "GB": "GBR",
    "AE": "ARE",
    "CA": "CAN",
    "AU": "AUS",
    "SG": "SGP",
    "DE": "DEU",
    "FR": "FRA",
    "IT": "ITA",
    "ES": "ESP",
    "CN": "CHN",
    "JP": "JPN"
  };

  const countryNames = {
    IN: "India",
    GB: "United Kingdom",
    US: "United States",
    CA: "Canada"
  };

  const deviceColors = {
    Desktop: "#2563eb", // Blue
    Mobile: "#10b981",  // Emerald
    Tablet: "#f59e0b"   // Amber
  };

  // Pre-calculate max hits for color scaling
  const maxHits = stats?.locations?.length > 0 
    ? Math.max(...stats.locations.map(l => l.count)) 
    : 1;

  const colorScale = scaleLinear()
    .domain([0, maxHits])
    .range(["#eff6ff", "#1d4ed8"]); // Light blue to dark blue

  const getCountryColor = (geo) => {
    if (!stats || !stats.locations) return "#F5F4F6";
    
    const iso3 = geo.properties.iso_a3 || geo.properties.adm0_a3;
    const match = stats.locations.find(l => {
      const lIso3 = iso2to3[l.country] || l.country;
      return lIso3 === iso3 || l.country === geo.properties.name;
    });

    return match ? colorScale(match.count) : "#F5F4F6";
  };

  const getCountryStats = (geo) => {
    if (!stats || !stats.locations) return null;
    const iso3 = geo.properties.iso_a3 || geo.properties.adm0_a3;
    const match = stats.locations.find(l => {
      const lIso3 = iso2to3[l.country] || l.country;
      return lIso3 === iso3 || l.country === geo.properties.name;
    });
    return match || null;
  };

  if (loading) {
    return (
      <div className="text-center py-20 text-xs uppercase tracking-widest text-text-muted">Loading traffic data...</div>
    );
  }

  const totalViews = stats?.totalViews || 0;
  const uniqueVisitors = stats?.uniqueVisitorsCount || 0;
  const paths = stats?.paths || [];
  const locations = stats?.locations || [];
  const devices = stats?.devices || [];

  const viewsPerSession = uniqueVisitors > 0 ? (totalViews / uniqueVisitors).toFixed(1) : "0.0";

  const deviceChartData = devices.map(d => ({
    name: d.device,
    value: d.count,
    color: deviceColors[d.device] || "#cbd5e1"
  }));

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      <PageHeader
        title="Traffic Analytics"
        subtitle="Global reach and visitor insights"
        icon={Globe}
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded bg-accent-light/10 text-accent flex items-center justify-center">
              <Eye className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-[10px] uppercase font-bold tracking-widest text-text-muted">Total Page Views</h4>
              <p className="text-2xl font-light text-text-primary">{totalViews}</p>
            </div>
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded bg-success-light/20 text-success flex items-center justify-center">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-[10px] uppercase font-bold tracking-widest text-text-muted">Unique Visitors</h4>
              <p className="text-2xl font-light text-text-primary">{uniqueVisitors}</p>
            </div>
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded bg-warning-light/20 text-warning flex items-center justify-center">
              <Percent className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-[10px] uppercase font-bold tracking-widest text-text-muted">Pages / Session</h4>
              <p className="text-2xl font-light text-text-primary">{viewsPerSession}</p>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Global Map */}
        <Card className="lg:col-span-2 p-0 overflow-hidden flex flex-col h-[500px]">
          <div className="p-6 border-b border-border-custom flex justify-between items-center bg-white z-10">
            <h3 className="text-xs uppercase tracking-widest font-semibold text-text-primary">Geographic Footprint</h3>
            {hoveredCountry && (
              <div className="flex items-center gap-2 text-xs font-semibold text-text-primary">
                <MapPin className="w-4 h-4 text-accent" />
                {hoveredCountry.name}: <span className="text-accent">{hoveredCountry.hits} views</span>
              </div>
            )}
          </div>
          <div className="flex-1 bg-[#f8fafc] relative">
            <ComposableMap 
              projection="geoMercator" 
              projectionConfig={{ scale: 130 }}
              style={{ width: "100%", height: "100%" }}
            >
              <ZoomableGroup center={[0, 20]} maxZoom={5}>
                <Geographies geography={geoUrl}>
                  {({ geographies }) =>
                    geographies.map((geo) => {
                      const geoStats = getCountryStats(geo);
                      return (
                        <Geography
                          key={geo.rsmKey}
                          geography={geo}
                          fill={getCountryColor(geo)}
                          stroke="#cbd5e1"
                          strokeWidth={0.5}
                          onMouseEnter={() => {
                            setHoveredCountry({
                              name: geo.properties.name,
                              hits: geoStats ? geoStats.count : 0
                            });
                          }}
                          onMouseLeave={() => {
                            setHoveredCountry(null);
                          }}
                          style={{
                            default: { outline: "none" },
                            hover: { fill: "#f59e0b", outline: "none", stroke: "#d97706", strokeWidth: 1 },
                            pressed: { outline: "none" },
                          }}
                        />
                      );
                    })
                  }
                </Geographies>
              </ZoomableGroup>
            </ComposableMap>
          </div>
        </Card>

        {/* Device Breakdown */}
        <Card className="p-0 overflow-hidden flex flex-col h-[500px]">
          <div className="p-6 border-b border-border-custom bg-white">
            <h3 className="text-xs uppercase tracking-widest font-semibold text-text-primary">Device Breakdown</h3>
            <p className="text-[11px] text-text-secondary mt-1">Distribution of devices hitting storefront</p>
          </div>
          
          <div className="flex-1 p-6 flex flex-col justify-between">
            <div style={{ height: "220px", display: "flex", alignItems: "center", justifyItems: "center" }}>
              {deviceChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={deviceChartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={65}
                      outerRadius={85}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {deviceChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <RechartsTooltip formatter={(value) => [`${value} Views`]} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="w-full text-center text-xs text-text-muted">No device data logged</div>
              )}
            </div>

            <div className="space-y-4">
              {deviceChartData.map((d, index) => {
                const Icon = d.name === "Desktop" ? Laptop : d.name === "Mobile" ? Smartphone : Tablet;
                const total = devices.reduce((sum, item) => sum + item.count, 0);
                const percent = total > 0 ? ((d.value / total) * 100).toFixed(1) : "0.0";
                return (
                  <div key={index} className="flex items-center justify-between py-2 border-t border-border-custom">
                    <div className="flex items-center gap-2 text-[13px]">
                      <Icon className="w-4 h-4" style={{ color: d.color }} />
                      <span className="font-medium text-text-primary">{d.name}</span>
                    </div>
                    <div className="flex items-center gap-3 text-[13px]">
                      <span className="text-text-secondary">{d.value} views</span>
                      <span className="font-semibold text-text-primary">{percent}%</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </Card>

      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Regions list */}
        <Card className="p-0 overflow-hidden h-[400px] flex flex-col">
          <div className="p-6 border-b border-border-custom bg-white">
            <h3 className="text-xs uppercase tracking-widest font-semibold text-text-primary">Traffic by Geography</h3>
          </div>
          <div className="flex-1 overflow-y-auto bg-white">
            <Table className="border-0 rounded-none">
              <TableHeader>
                <TableHead>Location</TableHead>
                <TableHead>Country</TableHead>
                <TableHead className="text-right">Hits Logged</TableHead>
              </TableHeader>
              <TableBody>
                {locations.length > 0 ? (
                  locations.map((loc, idx) => (
                    <TableRow key={idx}>
                      <TableCell className="font-medium text-text-primary text-[13px]">
                        {loc.city ? `${loc.city}, ` : ""}{loc.region ? `${loc.region}` : "Unknown"}
                      </TableCell>
                      <TableCell className="text-[13px] text-text-secondary">
                        {countryNames[loc.country] || loc.country || "Unknown"}
                      </TableCell>
                      <TableCell className="text-right font-semibold text-text-primary text-[13px]">
                        {loc.count}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center py-8 text-text-muted text-xs">No geographical traffic logged yet.</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </Card>

        {/* People's Choices / Paths */}
        <Card className="p-0 overflow-hidden h-[400px] flex flex-col">
          <div className="p-6 border-b border-border-custom bg-white">
            <h3 className="text-xs uppercase tracking-widest font-semibold text-text-primary flex items-center gap-2">
              <MousePointer2 className="w-4 h-4 text-accent" />
              People's Choices (Top Pages)
            </h3>
          </div>
          <div className="flex-1 overflow-y-auto bg-white">
            <Table className="border-0 rounded-none">
              <TableHeader>
                <TableHead>Page / Product Route</TableHead>
                <TableHead className="text-right">Total visits</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableHeader>
              <TableBody>
                {paths.length > 0 ? (
                  paths.map((p, idx) => {
                    const readableName = p.path === "/" ? "Homepage" : p.path.replace("/product/", "Product Detail: ").replace("/", " ");
                    return (
                      <TableRow key={idx}>
                        <TableCell className="font-medium text-text-primary text-[13px]" style={{ fontFamily: p.path !== "/" ? "monospace" : "inherit" }}>
                          {readableName}
                        </TableCell>
                        <TableCell className="text-right font-semibold text-accent text-[13px]">
                          {p.count}
                        </TableCell>
                        <TableCell className="text-right">
                          <a
                            href={`http://localhost:3000${p.path}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[11px] text-accent hover:text-accent-hover font-semibold transition-colors"
                          >
                            View <ArrowUpRight className="w-3 h-3" />
                          </a>
                        </TableCell>
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center py-8 text-text-muted text-xs">No page views logged yet.</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </Card>

      </div>
    </div>
  );
}
