/**
 * CivicLens Mock Data
 * Separate data structures for Incidents and Citizen Reports
 */

export const incidents = [
  {
    id: 'CIV-8402',
    incidentNumber: '01',
    category: 'Road Safety',
    categoryTheme: 'roads',
    title: 'Dangerous pothole near school crossing',
    location: 'MG Road, Bengaluru',
    priority: 'Critical',
    priorityLevel: 'critical',
    status: 'Open',
    statusLevel: 'open',
    assignedTo: 'Road Safety Response Unit 4',
    isUrgent: true,
    zone: 'Ward 112 (East Zone), Bengaluru Urban',
    intakeWindow: 'First logged at 07:15 AM · Last report 08:42 AM',
    clusterPattern: 'Corridor adjacent to primary school crossing',
    evidenceRiskTag: 'High Pedestrian Risk',
  },
  {
    id: 'CIV-8397',
    incidentNumber: '02',
    category: 'Waste Management',
    categoryTheme: 'waste',
    title: 'Garbage accumulation near residential blocks',
    location: 'Indiranagar, Bengaluru',
    priority: 'High',
    priorityLevel: 'high',
    status: 'Under Review',
    statusLevel: 'review',
    assignedTo: 'Sanitation Wing B',
    isUrgent: false,
    zone: 'Ward 84 (East Zone), Bengaluru Urban',
    intakeWindow: 'First logged at 09:20 AM · Last report 11:05 AM',
    clusterPattern: 'Side-street residential intersection',
    evidenceRiskTag: 'Sanitation & Health Risk',
  },
  {
    id: 'CIV-8391',
    incidentNumber: '03',
    category: 'Street Lighting',
    categoryTheme: 'lighting',
    title: 'Streetlights not functioning after sunset',
    location: 'Jayanagar, Bengaluru',
    priority: 'Medium',
    priorityLevel: 'medium',
    status: 'Open',
    statusLevel: 'open',
    assignedTo: null, // Unassigned incident
    isUrgent: false,
    zone: 'Ward 153 (South Zone), Bengaluru Urban',
    intakeWindow: 'First logged at 06:45 PM · Last report 08:10 PM',
    clusterPattern: 'Residential street grid (5 poles affected)',
    evidenceRiskTag: 'Low-Light Pedestrian Hazard',
  },
  {
    id: 'CIV-8384',
    incidentNumber: '04',
    category: 'Water Supply',
    categoryTheme: 'water',
    title: 'Water main leakage flooding pedestrian walkway',
    location: 'Koramangala, Bengaluru',
    priority: 'Critical',
    priorityLevel: 'critical',
    status: 'Open',
    statusLevel: 'open',
    assignedTo: null, // Unassigned incident
    isUrgent: true,
    zone: 'Ward 151 (South Zone), Bengaluru Urban',
    intakeWindow: 'First logged at 06:10 AM · Last report 07:50 AM',
    clusterPattern: 'Commercial arterial corridor and sidewalk',
    evidenceRiskTag: 'Infrastructure Erosion Hazard',
  },
  {
    id: 'CIV-8378',
    incidentNumber: '05',
    category: 'Road Safety',
    categoryTheme: 'roads',
    title: 'Damaged storm drain grate creating hazard',
    location: 'Whitefield, Bengaluru',
    priority: 'High',
    priorityLevel: 'high',
    status: 'Resolved', // Resolved incident
    statusLevel: 'resolved',
    assignedTo: 'Stormwater Ops Team',
    isUrgent: false,
    zone: 'Ward 85 (Mahadevapura Zone), Bengaluru Urban',
    intakeWindow: 'First logged yesterday · Resolved today 10:30 AM',
    clusterPattern: 'Intersection stormwater runoff channel',
    evidenceRiskTag: 'Resolved Community Issue',
  },
  {
    id: 'CIV-8362',
    incidentNumber: '06',
    category: 'Road Safety',
    categoryTheme: 'roads',
    title: 'Fallen tree branch blocking transit lane',
    location: 'Malleshwaram, Bengaluru',
    priority: 'Medium',
    priorityLevel: 'medium',
    status: 'Resolved', // Resolved incident
    statusLevel: 'resolved',
    assignedTo: 'Urban Forestry Team',
    isUrgent: false,
    zone: 'Ward 45 (West Zone), Bengaluru Urban',
    intakeWindow: 'First logged yesterday · Cleared today 09:15 AM',
    clusterPattern: 'Bus rapid transit feeder corridor',
    evidenceRiskTag: 'Resolved Community Issue',
  },
];

export const reports = [
  {
    id: 'REP-101',
    incidentId: 'CIV-8402',
    text: 'Vehicles are swerving into the opposite lane to avoid the pothole near the school gate.',
    timestamp: '07:15 AM',
    channel: 'Citizen Mobile App',
    verified: true,
    isPriorityEvidence: true,
  },
  {
    id: 'REP-102',
    incidentId: 'CIV-8402',
    text: 'School bus had to brake abruptly this morning to avoid wheel damage near the crossing.',
    timestamp: '08:42 AM',
    channel: 'Citizen Mobile App',
    verified: true,
    isPriorityEvidence: false,
  },
  {
    id: 'REP-103',
    incidentId: 'CIV-8397',
    text: 'Waste has been overflowing across the sidewalk for three days, attracting stray animals.',
    timestamp: '09:20 AM',
    channel: 'Web Portal',
    verified: true,
    isPriorityEvidence: true,
  },
  {
    id: 'REP-104',
    incidentId: 'CIV-8397',
    text: 'Foul smell reaching residential apartments; garbage bin is completely toppled.',
    timestamp: '11:05 AM',
    channel: 'Citizen Mobile App',
    verified: true,
    isPriorityEvidence: false,
  },
  {
    id: 'REP-105',
    incidentId: 'CIV-8391',
    text: 'Entire street stretch pitch dark after 7 PM, creating safety hazards for pedestrians.',
    timestamp: '06:45 PM',
    channel: 'Helpline Call',
    verified: true,
    isPriorityEvidence: true,
  },
  {
    id: 'REP-106',
    incidentId: 'CIV-8384',
    text: 'High-pressure pipeline leak is eroding the footpath and entering adjacent basements.',
    timestamp: '06:10 AM',
    channel: 'Citizen Mobile App',
    verified: true,
    isPriorityEvidence: true,
  },
  {
    id: 'REP-107',
    incidentId: 'CIV-8384',
    text: 'Water flooding 100 meters of pedestrian walkway forcing people to walk into traffic.',
    timestamp: '07:50 AM',
    channel: 'Web Portal',
    verified: true,
    isPriorityEvidence: false,
  },
  {
    id: 'REP-108',
    incidentId: 'CIV-8378',
    text: 'Drain grate has collapsed under vehicle weight, leaving a sharp 2-foot open cavity.',
    timestamp: 'Yesterday 04:30 PM',
    channel: 'Citizen Mobile App',
    verified: true,
    isPriorityEvidence: true,
  },
  {
    id: 'REP-109',
    incidentId: 'CIV-8378',
    text: 'Cyclist front wheel got caught in the damaged drain grate yesterday evening.',
    timestamp: 'Yesterday 06:15 PM',
    channel: 'Citizen Mobile App',
    verified: true,
    isPriorityEvidence: false,
  },
  {
    id: 'REP-110',
    incidentId: 'CIV-8362',
    text: 'Heavy branch snapped and obstruction blocking city bus transit lane completely.',
    timestamp: 'Yesterday 08:00 PM',
    channel: 'Municipal Radio',
    verified: true,
    isPriorityEvidence: true,
  },
];

/**
 * Helper to get all reports linked to an incident
 */
export function getLinkedReports(incidentId) {
  return reports.filter((r) => r.incidentId === incidentId);
}

/**
 * Helper to get the primary priority evidence report text for an incident
 */
export function getPriorityEvidence(incidentId) {
  const linked = getLinkedReports(incidentId);
  const priorityReport = linked.find((r) => r.isPriorityEvidence) || linked[0];
  return priorityReport ? priorityReport.text : '';
}

/**
 * Dynamically calculated summary counts derived directly from data structures
 */
export function calculateSummaryCounts() {
  return {
    totalReports: reports.length,
    openIncidents: incidents.filter((i) => i.status === 'Open').length,
    urgentReview: incidents.filter((i) => i.priority === 'Critical' || i.isUrgent).length,
    unassignedIncidents: incidents.filter((i) => !i.assignedTo || i.status === 'Unassigned').length,
  };
}

