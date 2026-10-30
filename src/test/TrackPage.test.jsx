import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import TrackPage from '../pages/TrackPage';
import { AppContext } from '../context/appContextUtils';

function renderTrackPage(props, contextOverrides = {}) {
  const defaultContext = {
    getSubmission: vi.fn(),
    fetchSubmission: vi.fn(),
    triggerAnalysis: vi.fn(),
    incidents: [],
    ...contextOverrides,
  };

  return render(
    <AppContext.Provider value={defaultContext}>
      <TrackPage {...props} />
    </AppContext.Provider>
  );
}

describe('Citizen Track Page Component', () => {
  it('displays not found state when reference ID does not exist', async () => {
    renderTrackPage(
      { reportId: 'SUB-UNKNOWN' },
      {
        getSubmission: () => null,
        fetchSubmission: () => Promise.resolve(null),
      }
    );

    expect(await screen.findByText(/Report Not Found/i)).toBeDefined();
    expect(screen.getByText(/SUB-UNKNOWN/i)).toBeDefined();
    expect(screen.getByRole('button', { name: /Submit a New Report/i })).toBeDefined();
  });

  it('renders unlinked report with intake queue status', () => {
    const mockReport = {
      refId: 'SUB-INTAKE1',
      category: 'Waste',
      location: 'Indiranagar 100ft Road',
      description: 'Overflowing commercial bins on the sidewalk.',
      status: 'Submitted',
      statusLevel: 'submitted',
      incidentId: null,
      submittedAt: 'Today at 10:00 AM',
    };

    renderTrackPage(
      { reportId: 'SUB-INTAKE1' },
      {
        getSubmission: (id) => (id === 'SUB-INTAKE1' ? mockReport : null),
      }
    );

    expect(screen.getByText('SUB-INTAKE1')).toBeDefined();
    expect(screen.getByText(/Pending Incident Linkage/i)).toBeDefined();
    expect(screen.getByText(/safely recorded in the intake queue/i)).toBeDefined();
    expect(screen.getByText(/Citizen-reported; not independently verified/i)).toBeDefined();
  });

  it('renders linked incident details and assigned unit when report is linked', () => {
    const mockReport = {
      refId: 'SUB-LINKED1',
      category: 'Roads',
      location: 'MG Road',
      description: 'Dangerous pothole cluster near crossing.',
      status: 'Under Review',
      statusLevel: 'review',
      incidentId: 'CIV-8402',
      submittedAt: 'Today at 09:30 AM',
    };

    const mockIncidents = [
      {
        id: 'CIV-8402',
        title: 'Severe Pothole Cluster & Road Cave-In',
        status: 'In Progress',
        statusLevel: 'progress',
        assignedTo: 'Road Safety Response Unit 4',
        updates: [
          {
            timestamp: '2024-05-18T10:30:00Z',
            note: 'Asphalt patching crew actively working on-site.',
          },
        ],
      },
    ];

    renderTrackPage(
      { reportId: 'SUB-LINKED1' },
      {
        getSubmission: (id) => (id === 'SUB-LINKED1' ? mockReport : null),
        incidents: mockIncidents,
      }
    );

    expect(screen.getByText('SUB-LINKED1')).toBeDefined();
    expect(screen.getByText('CIV-8402')).toBeDefined();
    expect(screen.getByText(/Linked to Operational Incident Cluster/i)).toBeDefined();
    expect(screen.getByText(/Road Safety Response Unit 4/i)).toBeDefined();
    expect(screen.getByText(/Asphalt patching crew actively working on-site/i)).toBeDefined();
  });
});
