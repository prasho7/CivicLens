import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ReportPage from '../pages/ReportPage';
import { AppContext } from '../context/appContextUtils';

function renderWithContext(ui, customContext = {}) {
  const defaultContext = {
    submitReport: vi.fn(),
    apiConnected: true,
    ...customContext,
  };
  return {
    ...render(
      <AppContext.Provider value={defaultContext}>
        {ui}
      </AppContext.Provider>
    ),
    context: defaultContext,
  };
}

describe('Citizen Report Form Component', () => {
  it('displays validation errors when submitting an empty form', async () => {
    const submitMock = vi.fn();
    renderWithContext(<ReportPage />, { submitReport: submitMock });

    const submitBtn = screen.getByRole('button', { name: /Submit Report/i });
    fireEvent.click(submitBtn);

    expect(await screen.findByText(/Please select a category/i)).toBeDefined();
    expect(screen.getByText(/Description is required/i)).toBeDefined();
    expect(screen.getByText(/Location is required/i)).toBeDefined();
    expect(submitMock).not.toHaveBeenCalled();
  });

  it('validates description minimum character length', async () => {
    const submitMock = vi.fn();
    renderWithContext(<ReportPage />, { submitReport: submitMock });

    const categorySelect = screen.getByLabelText(/Category/i);
    const descInput = screen.getByLabelText(/Description/i);
    const locInput = screen.getByLabelText(/Location/i);

    fireEvent.change(categorySelect, { target: { value: 'Roads' } });
    fireEvent.change(descInput, { target: { value: 'Short' } }); // < 10 chars
    fireEvent.change(locInput, { target: { value: 'MG Road' } });

    const submitBtn = screen.getByRole('button', { name: /Submit Report/i });
    fireEvent.click(submitBtn);

    expect(await screen.findByText(/Please provide at least 10 characters/i)).toBeDefined();
    expect(submitMock).not.toHaveBeenCalled();
  });

  it('submits successfully and displays the confirmation screen with reference ID', async () => {
    const submitMock = vi.fn().mockResolvedValue('SUB-TEST99');
    renderWithContext(<ReportPage />, { submitReport: submitMock });

    const categorySelect = screen.getByLabelText(/Category/i);
    const descInput = screen.getByLabelText(/Description/i);
    const locInput = screen.getByLabelText(/Location/i);

    fireEvent.change(categorySelect, { target: { value: 'Roads' } });
    fireEvent.change(descInput, {
      target: { value: 'Large hazardous pothole cluster damaging vehicles near school gate.' },
    });
    fireEvent.change(locInput, { target: { value: 'MG Road near St. Josephs' } });

    const submitBtn = screen.getByRole('button', { name: /Submit Report/i });
    fireEvent.click(submitBtn);

    expect(await screen.findByText(/Report Submitted/i)).toBeDefined();
    expect(screen.getByText('SUB-TEST99')).toBeDefined();
    expect(screen.getByText(/Citizen-reported; not independently verified/i)).toBeDefined();
  });

  it('displays error banner when submission service fails', async () => {
    const submitMock = vi.fn().mockRejectedValue(new Error('Database network timeout. Please retry.'));
    renderWithContext(<ReportPage />, { submitReport: submitMock });

    const categorySelect = screen.getByLabelText(/Category/i);
    const descInput = screen.getByLabelText(/Description/i);
    const locInput = screen.getByLabelText(/Location/i);

    fireEvent.change(categorySelect, { target: { value: 'Waterlogging' } });
    fireEvent.change(descInput, {
      target: { value: 'Severe storm drain waterlogging completely flooding the street.' },
    });
    fireEvent.change(locInput, { target: { value: 'Indiranagar 100ft Road' } });

    const submitBtn = screen.getByRole('button', { name: /Submit Report/i });
    fireEvent.click(submitBtn);

    expect(await screen.findByText(/Database network timeout/i)).toBeDefined();
  });
});
