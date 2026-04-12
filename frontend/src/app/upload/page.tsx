'use client';

import { useState, useRef } from 'react';
import { uploadCandidatesExcel, addJobsBulk } from '@/lib/api';
import { UploadResponse } from '@/types';
import { Upload, FileSpreadsheet, Plus, Trash2, CheckCircle, AlertCircle } from 'lucide-react';
import clsx from 'clsx';

interface JobFormData {
  id: string;
  title: string;
  company: string;
  location: string;
  required_skills: string;
  core_requirements: string;
  overview: string;
}

export default function UploadPage() {
  const [candidateFile, setCandidateFile] = useState<File | null>(null);
  const [candidateStatus, setCandidateStatus] = useState<{
    type: 'success' | 'error' | null;
    message: string;
  }>({ type: null, message: '' });
  const [candidateLoading, setCandidateLoading] = useState(false);

  const [jobForms, setJobForms] = useState<JobFormData[]>([
    {
      id: '1',
      title: '',
      company: '',
      location: '',
      required_skills: '',
      core_requirements: '',
      overview: '',
    },
  ]);

  const [jobLoading, setJobLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragZoneRef = useRef<HTMLDivElement>(null);

  // Candidate upload handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (dragZoneRef.current) {
      dragZoneRef.current.classList.add('border-amber-400/40', 'bg-amber-400/5');
    }
  };

  const handleDragLeave = () => {
    if (dragZoneRef.current) {
      dragZoneRef.current.classList.remove('border-amber-400/40', 'bg-amber-400/5');
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (dragZoneRef.current) {
      dragZoneRef.current.classList.remove('border-amber-400/40', 'bg-amber-400/5');
    }
    const file = e.dataTransfer.files[0];
    if (file && (file.name.endsWith('.xlsx') || file.name.endsWith('.xlsm'))) {
      setCandidateFile(file);
      setCandidateStatus({ type: null, message: '' });
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.currentTarget.files?.[0];
    if (file) {
      setCandidateFile(file);
      setCandidateStatus({ type: null, message: '' });
    }
  };

  const handleUploadCandidates = async () => {
    if (!candidateFile) return;

    setCandidateLoading(true);
    try {
      const result = await uploadCandidatesExcel(candidateFile);
      setCandidateStatus({
        type: 'success',
        message: result.message,
      });
      setCandidateFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (error) {
      setCandidateStatus({
        type: 'error',
        message: error instanceof Error ? error.message : 'Upload failed',
      });
    } finally {
      setCandidateLoading(false);
    }
  };

  // Job form handlers
  const updateJobForm = (id: string, field: keyof JobFormData, value: string) => {
    setJobForms(
      jobForms.map((form) =>
        form.id === id ? { ...form, [field]: value } : form
      )
    );
  };

  const addJobForm = () => {
    setJobForms([
      ...jobForms,
      {
        id: String(Date.now()),
        title: '',
        company: '',
        location: '',
        required_skills: '',
        core_requirements: '',
        overview: '',
      },
    ]);
  };

  const removeJobForm = (id: string) => {
    if (jobForms.length > 1) {
      setJobForms(jobForms.filter((form) => form.id !== id));
    }
  };

  const handleSaveJobs = async () => {
    const validForms = jobForms.filter((f) => f.title.trim());
    if (validForms.length === 0) {
      alert('Please fill in at least one job title');
      return;
    }

    setJobLoading(true);
    try {
      const result = await addJobsBulk({
        job_descriptions: validForms.map((form) => ({
          title: form.title || undefined,
          company: form.company || undefined,
          location: form.location || undefined,
          required_skills: form.required_skills || undefined,
          core_requirements: form.core_requirements || undefined,
          overview: form.overview || undefined,
          employment_type: undefined,
          preferred_quals: undefined,
          responsibilities: undefined,
        })),
      });
      alert(result.message);
      setJobForms([
        {
          id: '1',
          title: '',
          company: '',
          location: '',
          required_skills: '',
          core_requirements: '',
          overview: '',
        },
      ]);
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to save jobs');
    } finally {
      setJobLoading(false);
    }
  };

  return (
    <main className="pt-20 pb-24">
      <div className="max-w-7xl mx-auto px-6">
        <div className="mb-12">
          <h1 className="font-display text-5xl text-[var(--snow)] tracking-wide mb-3">
            DATA INGEST
          </h1>
          <p className="font-mono text-[10px] text-amber-400 tracking-widest">
            STEP 1 OF 2
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Column A - Candidate Upload */}
          <div>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-7 h-7 rounded-full border border-amber-400 flex items-center justify-center font-display text-amber-400">
                A
              </div>
              <h2 className="font-display text-2xl text-[var(--snow)]">
                CANDIDATE PROFILES
              </h2>
            </div>

            {/* Drag zone */}
            <div
              ref={dragZoneRef}
              onClick={() => fileInputRef.current?.click()}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={clsx(
                'border-2 border-dashed rounded cursor-pointer min-h-[180px]',
                'flex flex-col items-center justify-center transition-all',
                candidateFile
                  ? 'border-teal-400/40 bg-teal-400/5'
                  : 'border-[var(--wire)] hover:border-amber-400/40 hover:bg-amber-400/5'
              )}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xlsm"
                onChange={handleFileSelect}
                className="hidden"
              />

              {candidateFile ? (
                <div className="text-center">
                  <FileSpreadsheet
                    size={32}
                    className="text-teal-400 mx-auto mb-2"
                  />
                  <p className="text-sm text-[var(--light)] font-mono">
                    {candidateFile.name}
                  </p>
                  <p className="text-xs text-[var(--dim)] font-mono">
                    {(candidateFile.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              ) : (
                <div className="text-center">
                  <Upload
                    size={32}
                    className="text-[var(--wire)] mx-auto mb-2 group-hover:text-amber-400"
                  />
                  <p className="text-sm text-[var(--light)]">
                    Drag Excel file here or click
                  </p>
                  <p className="text-xs text-[var(--muted)]">
                    .xlsx or .xlsm only
                  </p>
                </div>
              )}
            </div>

            {/* Status banner */}
            {candidateStatus.type && (
              <div
                className={clsx(
                  'mt-4 p-3 rounded border flex items-start gap-2',
                  candidateStatus.type === 'success'
                    ? 'bg-teal-400/10 border-teal-400/25'
                    : 'bg-rose-400/10 border-rose-400/25'
                )}
              >
                {candidateStatus.type === 'success' ? (
                  <CheckCircle size={18} className="text-teal-400 flex-shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle size={18} className="text-rose-400 flex-shrink-0 mt-0.5" />
                )}
                <p
                  className={clsx(
                    'text-sm',
                    candidateStatus.type === 'success'
                      ? 'text-teal-400'
                      : 'text-rose-400'
                  )}
                >
                  {candidateStatus.message}
                </p>
              </div>
            )}

            {/* Upload button */}
            <button
              onClick={handleUploadCandidates}
              disabled={!candidateFile || candidateLoading}
              className={clsx(
                'w-full mt-4 px-4 py-3 rounded font-mono text-sm tracking-widest transition-colors',
                candidateFile && !candidateLoading
                  ? 'bg-amber-400 text-[var(--ink)] hover:bg-amber-300'
                  : 'bg-[var(--wire)] text-[var(--muted)] cursor-not-allowed'
              )}
            >
              {candidateLoading ? 'UPLOADING...' : 'UPLOAD CANDIDATES'}
            </button>
          </div>

          {/* Column B - Job Forms */}
          <div>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-7 h-7 rounded-full border border-amber-400 flex items-center justify-center font-display text-amber-400">
                B
              </div>
              <h2 className="font-display text-2xl text-[var(--snow)]">
                JOB DESCRIPTIONS
              </h2>
            </div>

            <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
              {jobForms.map((form, index) => (
                <div
                  key={form.id}
                  className="border border-[var(--edge)] rounded p-4 bg-[var(--panel)]"
                >
                  <div className="flex items-center justify-between mb-4">
                    <span className="font-mono text-[10px] text-[var(--dim)] tracking-widest">
                      JOB {index + 1}
                    </span>
                    {jobForms.length > 1 && (
                      <button
                        onClick={() => removeJobForm(form.id)}
                        className="p-1 hover:bg-rose-400/10 rounded transition-colors"
                      >
                        <Trash2 size={16} className="text-rose-400" />
                      </button>
                    )}
                  </div>

                  <div className="space-y-3">
                    {/* Title */}
                    <div>
                      <label className="font-mono text-[10px] text-[var(--dim)] tracking-wider mb-1 block">
                        JOB TITLE *
                      </label>
                      <input
                        type="text"
                        value={form.title}
                        onChange={(e) => updateJobForm(form.id, 'title', e.target.value)}
                        className="w-full bg-[#0a0a0a] border border-[var(--wire)] rounded px-3 py-2 text-[var(--light)] placeholder-[var(--muted)] focus:border-amber-400/50 outline-none text-sm"
                        placeholder="Software Engineer, Data Scientist, etc."
                      />
                    </div>

                    {/* Company & Location */}
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="font-mono text-[10px] text-[var(--dim)] tracking-wider mb-1 block">
                          COMPANY
                        </label>
                        <input
                          type="text"
                          value={form.company}
                          onChange={(e) => updateJobForm(form.id, 'company', e.target.value)}
                          className="w-full bg-[#0a0a0a] border border-[var(--wire)] rounded px-3 py-2 text-[var(--light)] placeholder-[var(--muted)] focus:border-amber-400/50 outline-none text-sm"
                          placeholder="Company name"
                        />
                      </div>
                      <div>
                        <label className="font-mono text-[10px] text-[var(--dim)] tracking-wider mb-1 block">
                          LOCATION
                        </label>
                        <input
                          type="text"
                          value={form.location}
                          onChange={(e) => updateJobForm(form.id, 'location', e.target.value)}
                          className="w-full bg-[#0a0a0a] border border-[var(--wire)] rounded px-3 py-2 text-[var(--light)] placeholder-[var(--muted)] focus:border-amber-400/50 outline-none text-sm"
                          placeholder="San Francisco, CA"
                        />
                      </div>
                    </div>

                    {/* Skills */}
                    <div>
                      <label className="font-mono text-[10px] text-[var(--dim)] tracking-wider mb-1 block">
                        REQUIRED SKILLS
                      </label>
                      <textarea
                        value={form.required_skills}
                        onChange={(e) => updateJobForm(form.id, 'required_skills', e.target.value)}
                        className="w-full bg-[#0a0a0a] border border-[var(--wire)] rounded px-3 py-2 text-[var(--light)] placeholder-[var(--muted)] focus:border-amber-400/50 outline-none text-sm resize-none h-16"
                        placeholder="Python, FastAPI, Docker, etc. (comma-separated)"
                      />
                    </div>

                    {/* Core requirements */}
                    <div>
                      <label className="font-mono text-[10px] text-[var(--dim)] tracking-wider mb-1 block">
                        CORE REQUIREMENTS
                      </label>
                      <textarea
                        value={form.core_requirements}
                        onChange={(e) => updateJobForm(form.id, 'core_requirements', e.target.value)}
                        className="w-full bg-[#0a0a0a] border border-[var(--wire)] rounded px-3 py-2 text-[var(--light)] placeholder-[var(--muted)] focus:border-amber-400/50 outline-none text-sm resize-none h-16"
                        placeholder="Minimum 2 years of experience..."
                      />
                    </div>

                    {/* Overview */}
                    <div>
                      <label className="font-mono text-[10px] text-[var(--dim)] tracking-wider mb-1 block">
                        OVERVIEW
                      </label>
                      <textarea
                        value={form.overview}
                        onChange={(e) => updateJobForm(form.id, 'overview', e.target.value)}
                        className="w-full bg-[#0a0a0a] border border-[var(--wire)] rounded px-3 py-2 text-[var(--light)] placeholder-[var(--muted)] focus:border-amber-400/50 outline-none text-sm resize-none h-16"
                        placeholder="Job description details..."
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Add another button */}
            <button
              onClick={addJobForm}
              className="w-full mt-4 px-4 py-3 border-2 border-dashed border-[var(--edge)] rounded font-mono text-sm tracking-widest text-[var(--dim)] hover:border-amber-400/40 hover:text-amber-400 hover:bg-amber-400/5 transition-all flex items-center justify-center gap-2"
            >
              <Plus size={16} />
              ADD ANOTHER JD
            </button>

            {/* Save button */}
            <button
              onClick={handleSaveJobs}
              disabled={jobLoading}
              className={clsx(
                'w-full mt-3 px-4 py-3 rounded border font-mono text-sm tracking-widest transition-colors',
                jobLoading
                  ? 'border-[var(--wire)] text-[var(--muted)] cursor-not-allowed'
                  : 'border-amber-400/40 text-amber-400 hover:bg-amber-400/10'
              )}
            >
              {jobLoading ? 'SAVING...' : 'SAVE JOB DESCRIPTIONS'}
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
