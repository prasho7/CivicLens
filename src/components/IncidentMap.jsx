import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

function getPriorityColor(priority, status) {
  if (status === 'Resolved') return '#64748b'; // slate
  switch (priority) {
    case 'Critical':
      return '#ef4444'; // red
    case 'High':
      return '#f97316'; // orange
    case 'Medium':
      return '#3b82f6'; // blue
    case 'Low':
    default:
      return '#10b981'; // green
  }
}

function createIncidentMarkerIcon(incident) {
  const color = getPriorityColor(incident.priority, incident.status);

  return L.divIcon({
    className: 'cl-leaflet-custom-marker',
    html: `
      <div style="
        background-color: ${color};
        color: white;
        width: 32px;
        height: 32px;
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 4px 10px rgba(0,0,0,0.3);
        border: 2px solid white;
      ">
        <span style="
          transform: rotate(45deg);
          font-size: 11px;
          font-weight: 800;
          font-family: monospace;
        ">${incident.incidentNumber || '•'}</span>
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32],
  });
}

function createReportMarkerIcon() {
  return L.divIcon({
    className: 'cl-leaflet-custom-marker',
    html: `
      <div style="
        background-color: #8b5cf6;
        color: white;
        width: 18px;
        height: 18px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 2px 6px rgba(0,0,0,0.25);
        border: 2px solid white;
      ">
        <span style="font-size: 9px; font-weight: 800;">●</span>
      </div>
    `,
    iconSize: [18, 18],
    iconAnchor: [9, 9],
    popupAnchor: [0, -10],
  });
}

export default function IncidentMap({
  incidents = [],
  reports = [],
  selectedIncidentId,
  onSelectIncident,
}) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersLayerRef = useRef(null);

  // Separate items with and without valid coordinates
  const mappedIncidents = incidents.filter(
    (i) => typeof i.latitude === 'number' && typeof i.longitude === 'number',
  );
  const unmappedIncidents = incidents.filter(
    (i) => typeof i.latitude !== 'number' || typeof i.longitude !== 'number',
  );
  const mappedReports = reports.filter(
    (r) => typeof r.latitude === 'number' && typeof r.longitude === 'number',
  );
  const unmappedReports = reports.filter(
    (r) => typeof r.latitude !== 'number' || typeof r.longitude !== 'number',
  );

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    // Center on Bengaluru Urban
    const map = L.map(mapContainerRef.current, {
      center: [12.9716, 77.5946],
      zoom: 12,
      scrollWheelZoom: true,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(map);

    const markersGroup = L.layerGroup().addTo(map);
    markersLayerRef.current = markersGroup;
    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update Markers
  useEffect(() => {
    const map = mapInstanceRef.current;
    const markersGroup = markersLayerRef.current;
    if (!map || !markersGroup) return;

    markersGroup.clearLayers();

    const bounds = [];

    // Add Incident Markers
    mappedIncidents.forEach((inc) => {
      const isSelected = inc.id === selectedIncidentId;
      const marker = L.marker([inc.latitude, inc.longitude], {
        icon: createIncidentMarkerIcon(inc),
        zIndexOffset: isSelected ? 1000 : 100,
      });

      const popupHtml = `
        <div style="font-family: sans-serif; min-width: 220px; line-height: 1.4;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
            <strong style="color: #1e293b; font-size: 13px;">${inc.id}</strong>
            <span style="
              font-size: 10px;
              font-weight: 700;
              padding: 2px 6px;
              border-radius: 4px;
              background-color: ${getPriorityColor(inc.priority, inc.status)}22;
              color: ${getPriorityColor(inc.priority, inc.status)};
            ">${inc.priority} · ${inc.status}</span>
          </div>
          <div style="font-weight: 600; font-size: 13px; color: #0f172a; margin-bottom: 4px;">
            ${inc.title}
          </div>
          <div style="font-size: 11px; color: #64748b; margin-bottom: 4px;">
            📍 ${inc.location}
          </div>
          <div style="font-size: 11px; color: #475569; margin-bottom: 8px;">
            <strong>Category:</strong> ${inc.category}
            ${inc.assignedTo ? `<br/><strong>Assigned:</strong> ${inc.assignedTo}` : ''}
          </div>
          <button
            id="focus-btn-${inc.id}"
            style="
              width: 100%;
              padding: 6px 10px;
              font-size: 11px;
              font-weight: 600;
              background: #2563eb;
              color: white;
              border: none;
              border-radius: 6px;
              cursor: pointer;
            "
          >
            Focus in Dashboard
          </button>
        </div>
      `;

      marker.bindPopup(popupHtml);
      marker.on('popupopen', () => {
        const btn = document.getElementById(`focus-btn-${inc.id}`);
        if (btn && onSelectIncident) {
          btn.onclick = () => {
            onSelectIncident(inc.id);
          };
        }
      });

      marker.addTo(markersGroup);
      bounds.push([inc.latitude, inc.longitude]);

      if (isSelected) {
        marker.openPopup();
      }
    });

    // Add Mapped Reports (if any)
    mappedReports.forEach((rep) => {
      const marker = L.marker([rep.latitude, rep.longitude], {
        icon: createReportMarkerIcon(),
        zIndexOffset: 50,
      });

      marker.bindPopup(`
        <div style="font-family: sans-serif; min-width: 180px; line-height: 1.4;">
          <div style="font-size: 11px; font-weight: 700; color: #8b5cf6;">CITIZEN REPORT · ${rep.ref_id || rep.id}</div>
          <div style="font-size: 12px; font-weight: 600; color: #1e293b; margin: 4px 0;">${rep.category}</div>
          <div style="font-size: 11px; color: #475569;">${rep.description?.slice(0, 80) || ''}…</div>
          <div style="font-size: 10px; color: #64748b; margin-top: 4px;">📍 ${rep.location}</div>
        </div>
      `);

      marker.addTo(markersGroup);
      bounds.push([rep.latitude, rep.longitude]);
    });

    // Fit map bounds if markers exist
    if (bounds.length > 0 && !selectedIncidentId) {
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 });
    }
  }, [mappedIncidents, mappedReports, selectedIncidentId, onSelectIncident]);

  return (
    <div className="cl-map-wrapper">
      <div className="cl-map-header">
        <div className="cl-map-title-row">
          <span className="cl-eyebrow">Geographic Incident Distribution</span>
          <div className="cl-map-legend">
            <span className="cl-legend-pill cl-legend--critical">● Critical</span>
            <span className="cl-legend-pill cl-legend--high">● High</span>
            <span className="cl-legend-pill cl-legend--medium">● Medium</span>
            <span className="cl-legend-pill cl-legend--resolved">● Resolved</span>
          </div>
        </div>
      </div>

      <div
        ref={mapContainerRef}
        className="cl-leaflet-map-canvas"
        style={{ height: '480px', width: '100%', borderRadius: '10px' }}
        aria-label="Interactive Municipal Incident Map"
      />

      <div className="cl-map-footer">
        <div className="cl-map-stats">
          <span>
            📍 <strong>{mappedIncidents.length}</strong> operational incidents plotted on OpenStreetMap
          </span>
          {unmappedReports.length > 0 && (
            <span className="cl-unmapped-note">
              ℹ <strong>{unmappedReports.length}</strong> citizen {unmappedReports.length === 1 ? 'report has' : 'reports have'} text location only (coordinates not inferred to prevent inaccurate mapping)
            </span>
          )}
          {unmappedIncidents.length > 0 && (
            <span className="cl-unmapped-note">
              · {unmappedIncidents.length} unmapped incidents
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
