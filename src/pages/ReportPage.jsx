import { useState, useRef } from 'react';
import { useApp } from '../context/appContextUtils';
import { navigate } from '../router/routerUtils';

const CATEGORIES = ['Waterlogging', 'Roads', 'Waste', 'Streetlights', 'Drainage'];
const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5 MB
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

function FieldError({ message }) {
  if (!message) return null;
  return (
    <span className="cl-field-error" role="alert" aria-live="polite">
      {message}
    </span>
  );
}

export default function ReportPage() {
  const { submitReport, apiConnected } = useApp();
  const fileInputRef = useRef(null);

  const [form, setForm] = useState({
    category: '',
    description: '',
    location: '',
  });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [imageError, setImageError] = useState('');
  const [errors, setErrors] = useState({});
  const [submittedRefId, setSubmittedRefId] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  function validate() {
    const e = {};
    if (!form.category) e.category = 'Please select a category.';
    if (!form.description.trim()) e.description = 'Description is required.';
    else if (form.description.trim().length < 10) e.description = 'Please provide at least 10 characters.';
    if (!form.location.trim()) e.location = 'Location is required.';
    return e;
  }

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    // Clear field error on change
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
  }

  function handleImageChange(e) {
    const file = e.target.files[0];
    setImageError('');
    setImageFile(null);
    setImagePreview(null);

    if (!file) return;

    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      setImageError('Only JPEG, PNG, WebP, or GIF images are accepted.');
      e.target.value = '';
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      setImageError('Image must be smaller than 5 MB.');
      e.target.value = '';
      return;
    }

    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  }

  function handleRemoveImage() {
    setImageFile(null);
    setImagePreview(null);
    setImageError('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      // Focus first errored field
      const firstKey = Object.keys(errs)[0];
      document.getElementById(`field-${firstKey}`)?.focus();
      return;
    }

    setIsSubmitting(true);
    setSubmitError('');
    try {
      const refId = await submitReport({
        category: form.category,
        description: form.description.trim(),
        location: form.location.trim(),
        imageFile,
      });
      setSubmittedRefId(refId);
    } catch (err) {
      setSubmitError(err.message || 'Failed to submit report. Please check your connection.');
    } finally {
      setIsSubmitting(false);
    }
  }

  // ── Success state ──────────────────────────────────────────────────────────
  if (submittedRefId) {
    return (
      <main className="cl-main-workspace" id="main-content">
        <div className="cl-workspace-container">
          <div className="cl-report-success">
            <div className="cl-success-icon" aria-hidden="true">✓</div>
            <h1 className="cl-success-heading">Report Submitted</h1>
            <p className="cl-success-subtext">
              Your complaint has been logged and recorded in the database. Use the reference ID below to track its status.
            </p>

            <div className="cl-success-refid-box" aria-label={`Your reference ID is ${submittedRefId}`}>
              <span className="cl-success-refid-label">Reference ID</span>
              <span className="cl-success-refid">{submittedRefId}</span>
            </div>

            <p className="cl-success-disclaimer">
              Status notice: Citizen-reported; not independently verified. Stored in Supabase PostgreSQL database.
            </p>

            <div className="cl-success-actions">
              <button
                type="button"
                className="cl-btn cl-btn--primary"
                onClick={() => navigate(`/track/${submittedRefId}`)}
              >
                Track this Report
              </button>
              <button
                type="button"
                className="cl-btn cl-btn--secondary"
                onClick={() => {
                  setForm({ category: '', description: '', location: '' });
                  setImageFile(null);
                  setImagePreview(null);
                  setErrors({});
                  setSubmittedRefId(null);
                }}
              >
                Submit Another Report
              </button>
              <button
                type="button"
                className="cl-btn cl-btn--ghost"
                onClick={() => navigate('/dashboard')}
              >
                Back to Dashboard
              </button>
            </div>
          </div>
        </div>
      </main>
    );
  }

  // ── Form state ─────────────────────────────────────────────────────────────
  return (
    <main className="cl-main-workspace" id="main-content">
      <div className="cl-workspace-container">
        <header className="cl-page-header">
          <div className="cl-header-text-group">
            <h1 className="cl-page-title">Submit a Complaint</h1>
            <p className="cl-page-subtitle">Report a civic issue in your area.</p>
          </div>
          <div className="cl-header-meta">
            <div className="cl-demo-badge" role="status" aria-label="System status">
              <span className="cl-demo-beacon" aria-hidden="true">
                <span className="cl-demo-beacon-ring" />
                <span className="cl-demo-beacon-dot" />
              </span>
              <span className="cl-demo-badge-text">
                {apiConnected ? 'DATABASE CONNECTED' : 'LOCAL SESSION'}
              </span>
            </div>
          </div>
        </header>

        <div className="cl-form-notice" role="note">
          <strong>Notice:</strong> Citizen-reported; not independently verified.
          {apiConnected
            ? ' Reports are persisted to the database and tracked via unique reference ID.'
            : ' Reports are stored in the active session and will sync when backend is available.'}
        </div>

        {submitError && (
          <div className="cl-field-error" style={{ marginBottom: '1rem', padding: '0.75rem', backgroundColor: 'rgba(239, 68, 68, 0.1)', borderRadius: '4px' }} role="alert">
            {submitError}
          </div>
        )}

        <form
          className="cl-report-form"
          onSubmit={handleSubmit}
          noValidate
          aria-label="Civic complaint form"
        >
          {/* Category */}
          <div className="cl-form-group">
            <label className="cl-form-label" htmlFor="field-category">
              Category <span className="cl-required" aria-hidden="true">*</span>
            </label>
            <select
              id="field-category"
              name="category"
              className={`cl-form-select ${errors.category ? 'cl-input--error' : ''}`}
              value={form.category}
              onChange={handleChange}
              aria-required="true"
              aria-describedby={errors.category ? 'err-category' : undefined}
            >
              <option value="">Select a category…</option>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            <FieldError message={errors.category} id="err-category" />
          </div>

          {/* Description */}
          <div className="cl-form-group">
            <label className="cl-form-label" htmlFor="field-description">
              Description <span className="cl-required" aria-hidden="true">*</span>
            </label>
            <textarea
              id="field-description"
              name="description"
              className={`cl-form-textarea ${errors.description ? 'cl-input--error' : ''}`}
              value={form.description}
              onChange={handleChange}
              rows={5}
              placeholder="Describe the issue in detail…"
              aria-required="true"
              aria-describedby={errors.description ? 'err-description' : undefined}
              maxLength={1000}
            />
            <div className="cl-form-char-count">
              {form.description.length}/1000
            </div>
            <FieldError message={errors.description} id="err-description" />
          </div>

          {/* Location */}
          <div className="cl-form-group">
            <label className="cl-form-label" htmlFor="field-location">
              Location <span className="cl-required" aria-hidden="true">*</span>
            </label>
            <input
              id="field-location"
              name="location"
              type="text"
              className={`cl-form-input ${errors.location ? 'cl-input--error' : ''}`}
              value={form.location}
              onChange={handleChange}
              placeholder="Street name, landmark, or neighbourhood…"
              aria-required="true"
              aria-describedby={errors.location ? 'err-location' : undefined}
              maxLength={200}
            />
            <FieldError message={errors.location} id="err-location" />
          </div>

          {/* Image (optional) */}
          <div className="cl-form-group">
            <label className="cl-form-label" htmlFor="field-image">
              Photo <span className="cl-optional">(optional)</span>
            </label>
            <input
              id="field-image"
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              className="cl-form-file"
              onChange={handleImageChange}
              aria-describedby={imageError ? 'err-image' : 'image-hint'}
            />
            <span id="image-hint" className="cl-form-hint">
              JPEG, PNG, WebP or GIF · max 5 MB · preview is local only, not uploaded
            </span>
            {imageError && (
              <span className="cl-field-error" role="alert" id="err-image">
                {imageError}
              </span>
            )}
            {imagePreview && (
              <div className="cl-image-preview-wrap">
                <img
                  src={imagePreview}
                  alt="Selected photo preview"
                  className="cl-image-preview"
                />
                <button
                  type="button"
                  className="cl-image-remove-btn"
                  onClick={handleRemoveImage}
                  aria-label="Remove selected photo"
                >
                  Remove
                </button>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="cl-form-actions">
            <button
              type="submit"
              className="cl-btn cl-btn--primary"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Submitting to Database…' : 'Submit Report'}
            </button>
            <button
              type="button"
              className="cl-btn cl-btn--ghost"
              onClick={() => navigate('/dashboard')}
              disabled={isSubmitting}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
