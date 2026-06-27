"use client";

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { PDFDocument } from 'pdf-lib';
import {
  Upload, Type, Image, PenTool, Download, FilePlus, X,
  ChevronLeft, ShieldCheck, RotateCcw, Loader2, AlertCircle,
  CheckCircle2, Minus, Plus, ArrowUpDown, Trash2
} from 'lucide-react';
import axios from 'axios';

const API = 'http://127.0.0.1:5000';

interface PdfAction {
  type: 'watermark' | 'rotate' | 'delete-page' | 'reorder' | 'compress';
  text?: string;
  angle?: number;
  pages?: number[];
  order?: number[];
  opacity?: number;
  color?: string;
}

interface PdfEditorState {
  file: File | null;
  pdfUrl: string | null;
  fileName: string;
  isProcessing: boolean;
  status: string;
  statusType: 'info' | 'success' | 'error' | 'processing';
  activeTool: string | null;
  actions: PdfAction[];
  watermarkText: string;
  watermarkOpacity: number;
  watermarkColor: string;
  watermarkSize: number;
  selectedPages: number[];
  totalPages: number;
  pageRotations: Record<number, number>;
  downloadUrl: string | null;
  downloadName: string | null;
  previewKey: number;
}

export default function PdfEditorComponent() {
  const [state, setState] = useState<PdfEditorState>({
    file: null,
    pdfUrl: null,
    fileName: '',
    isProcessing: false,
    status: '',
    statusType: 'info',
    activeTool: null,
    actions: [],
    watermarkText: 'CONFIDENTIAL',
    watermarkOpacity: 0.3,
    watermarkColor: '#ef4444',
    watermarkSize: 40,
    selectedPages: [],
    totalPages: 1,
    pageRotations: {},
    downloadUrl: null,
    downloadName: null,
    previewKey: 0,
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  const updateState = useCallback((partial: Partial<PdfEditorState>) => {
    setState(prev => ({ ...prev, ...partial }));
  }, []);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const url = URL.createObjectURL(file);
      updateState({
        file,
        pdfUrl: url,
        fileName: file.name,
        actions: [],
        downloadUrl: null,
        downloadName: null,
        previewKey: Date.now(),
        status: '',
        activeTool: null,
      });
    }
  };

  const handleUpload = () => {
    fileInputRef.current?.click();
  };

  // Load PDF page count when file changes
  useEffect(() => {
    if (!state.file) return;
    const loadPdfInfo = async () => {
      try {
        const arrayBuffer = await state.file!.arrayBuffer();
        const pdfDoc = await PDFDocument.load(arrayBuffer);
        updateState({ totalPages: pdfDoc.getPageCount() });
      } catch (err) {
        console.error('Failed to load PDF info:', err);
      }
    };
    loadPdfInfo();
  }, [state.file]);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.type === 'application/pdf') {
      const url = URL.createObjectURL(file);
      updateState({
        file,
        pdfUrl: url,
        fileName: file.name,
        actions: [],
        downloadUrl: null,
        downloadName: null,
        previewKey: Date.now(),
        status: '',
        activeTool: null,
      });
    } else {
      updateState({ status: 'Please upload a PDF file.', statusType: 'error' });
    }
  };

  const handleDragOver = (e: React.DragEvent) => e.preventDefault();

  const addWatermark = () => {
    const action: PdfAction = {
      type: 'watermark',
      text: state.watermarkText || 'WATERMARK',
      opacity: state.watermarkOpacity,
      color: state.watermarkColor,
      angle: 45,
    };
    updateState({
      actions: [...state.actions, action],
      status: 'Watermark added to action queue',
      statusType: 'success',
    });
  };

  const addPageRotation = (pageNum: number) => {
    const currentRotation = state.pageRotations[pageNum] || 0;
    const newRotation = (currentRotation + 90) % 360;
    const newRotations = { ...state.pageRotations, [pageNum]: newRotation };
    updateState({
      pageRotations: newRotations,
      actions: state.actions.filter(a => !(a.type === 'rotate' && a.pages?.[0] === pageNum)).concat({
        type: 'rotate',
        pages: [pageNum],
        angle: newRotation,
      }),
      status: `Page ${pageNum} rotated ${newRotation} degrees`,
      statusType: 'success',
    });
  };

  const togglePageSelection = (pageNum: number) => {
    const selected = state.selectedPages.includes(pageNum)
      ? state.selectedPages.filter(p => p !== pageNum)
      : [...state.selectedPages, pageNum];
    updateState({ selectedPages: selected });
  };

  const deleteSelectedPages = () => {
    if (state.selectedPages.length === 0) {
      updateState({ status: 'Select pages to delete first', statusType: 'error' });
      return;
    }
    const action: PdfAction = {
      type: 'delete-page',
      pages: [...state.selectedPages],
    };
    updateState({
      actions: [...state.actions, action],
      selectedPages: [],
      status: `Pages ${state.selectedPages.join(', ')} marked for deletion`,
      statusType: 'success',
    });
  };

  const clearActions = () => {
    updateState({
      actions: [],
      pageRotations: {},
      selectedPages: [],
      status: 'All actions cleared',
      statusType: 'info',
    });
  };

  const removeAction = (index: number) => {
    const newActions = [...state.actions];
    newActions.splice(index, 1);
    updateState({
      actions: newActions,
      status: 'Action removed',
      statusType: 'info',
    });
  };

  const applyChanges = async () => {
    if (!state.file) return;
    if (state.actions.length === 0) {
      updateState({ status: 'No actions to apply. Add a tool first.', statusType: 'error' });
      return;
    }

    updateState({ isProcessing: true, status: 'Uploading PDF to editor...', statusType: 'processing' });

    try {
      const formData = new FormData();
      formData.append('file', state.file);
      formData.append('actions', JSON.stringify(state.actions));

      const response = await axios.post(`${API}/api/convert/edit-pdf`, formData, {
        responseType: 'blob',
      });

      const blob = new Blob([response.data], { type: 'application/pdf' });
      const downloadUrl = URL.createObjectURL(blob);
      const downloadName = `edited_${state.fileName}`;

      updateState({
        isProcessing: false,
        downloadUrl,
        downloadName,
        status: 'PDF edited successfully!',
        statusType: 'success',
      });
    } catch (err) {
      const msg = axios.isAxiosError(err)
        ? String((err.response?.data as { message?: string })?.message ?? '')
        : 'Failed to edit PDF';
      updateState({
        isProcessing: false,
        status: msg || 'Failed to edit PDF.',
        statusType: 'error',
      });
    }
  };

  const handleDownload = () => {
    if (state.downloadUrl && state.downloadName) {
      const a = document.createElement('a');
      a.href = state.downloadUrl;
      a.download = state.downloadName;
      a.click();
    }
  };

  const tools = [
    { id: 'watermark', icon: Type, label: 'Watermark', desc: 'Add text watermark' },
    { id: 'rotate', icon: RotateCcw, label: 'Rotate', desc: 'Rotate pages' },
    { id: 'delete', icon: Trash2, label: 'Delete Pages', desc: 'Remove pages' },
    { id: 'compress', icon: ShieldCheck, label: 'Compress', desc: 'Reduce file size' },
  ];

  return (
    <div className="pdf-editor-root">
      <input
        type="file"
        accept=".pdf"
        ref={fileInputRef}
        style={{ display: 'none' }}
        onChange={handleFileUpload}
      />

      {/* Header */}
      <div className="pdf-editor-header">
        <div className="pdf-editor-header-left">
          <h2 className="pdf-editor-title">PDF Editor</h2>
          <span className="pdf-editor-subtitle">Edit PDFs online with ease</span>
        </div>
        <div className="pdf-editor-header-actions">
          {state.actions.length > 0 && (
            <button className="pdf-editor-btn-clear" onClick={clearActions} title="Clear all actions">
              <X size={16} /> Clear
            </button>
          )}
          {state.file && (
            <button
              className="pdf-editor-btn-apply"
              onClick={applyChanges}
              disabled={state.isProcessing || state.actions.length === 0}
            >
              {state.isProcessing ? <Loader2 size={16} className="animate-spin" /> : <PenTool size={16} />}
              {state.isProcessing ? 'Processing...' : 'Apply Changes'}
            </button>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="pdf-editor-body">
        {!state.file ? (
          <div
            className="pdf-editor-upload-zone"
            onClick={handleUpload}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
          >
            <div className="pdf-editor-upload-icon">
              <FilePlus size={56} />
            </div>
            <h3 className="pdf-editor-upload-title">Upload a PDF to edit</h3>
            <p className="pdf-editor-upload-desc">Drag & drop your PDF here, or click to browse</p>
            <button className="pdf-editor-upload-btn">
              <Upload size={18} /> Select PDF
            </button>
            <p className="pdf-editor-upload-hint">Max file size: 50 MB</p>
          </div>
        ) : (
          <div className="pdf-editor-workspace">
            {/* Sidebar - Tools */}
            <div className="pdf-editor-sidebar">
              <div className="pdf-editor-tools">
                {tools.map(tool => {
                  const Icon = tool.icon;
                  const isActive = state.activeTool === tool.id;
                  return (
                    <button
                      key={tool.id}
                      className={`pdf-editor-tool ${isActive ? 'active' : ''}`}
                      onClick={() => updateState({ activeTool: isActive ? null : tool.id })}
                    >
                      <Icon size={20} />
                      <span className="pdf-editor-tool-label">{tool.label}</span>
                      <span className="pdf-editor-tool-desc">{tool.desc}</span>
                    </button>
                  );
                })}
              </div>

              {/* Tool Panel */}
              {state.activeTool && (
                <div className="pdf-editor-tool-panel">
                  {state.activeTool === 'watermark' && (
                    <div className="pdf-editor-panel-section">
                      <h4>Text Watermark</h4>
                      <div className="pdf-editor-form-group">
                        <label>Text</label>
                        <input
                          type="text"
                          value={state.watermarkText}
                          onChange={e => updateState({ watermarkText: e.target.value })}
                          className="pdf-editor-input"
                          placeholder="Enter watermark text"
                        />
                      </div>
                      <div className="pdf-editor-form-group">
                        <label>Opacity: {Math.round(state.watermarkOpacity * 100)}%</label>
                        <input
                          type="range"
                          min={0.05}
                          max={0.8}
                          step={0.05}
                          value={state.watermarkOpacity}
                          onChange={e => updateState({ watermarkOpacity: Number(e.target.value) })}
                          className="pdf-editor-slider"
                        />
                      </div>
                      <div className="pdf-editor-form-group">
                        <label>Size: {state.watermarkSize}px</label>
                        <input
                          type="range"
                          min={20}
                          max={80}
                          step={5}
                          value={state.watermarkSize}
                          onChange={e => updateState({ watermarkSize: Number(e.target.value) })}
                          className="pdf-editor-slider"
                        />
                      </div>
                      <div className="pdf-editor-form-group">
                        <label>Color</label>
                        <div className="pdf-editor-color-picker">
                          {['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#a855f7', '#6b7280', '#000000'].map(c => (
                            <button
                              key={c}
                              className={`pdf-editor-color ${state.watermarkColor === c ? 'selected' : ''}`}
                              style={{ backgroundColor: c }}
                              onClick={() => updateState({ watermarkColor: c })}
                            />
                          ))}
                        </div>
                      </div>
                      <button className="pdf-editor-btn-confirm" onClick={addWatermark}>
                        <Plus size={16} /> Add Watermark
                      </button>
                    </div>
                  )}

                  {state.activeTool === 'rotate' && (
                    <div className="pdf-editor-panel-section">
                      <h4>Rotate Pages</h4>
                      <p className="pdf-editor-panel-hint">Click on a page in the preview to rotate it 90 degrees clockwise.</p>
                      <div className="pdf-editor-page-grid">
                        {Array.from({ length: state.totalPages }, (_, i) => i + 1).map(pageNum => (
                          <div
                            key={pageNum}
                            className="pdf-editor-page-thumb"
                            onClick={() => addPageRotation(pageNum)}
                          >
                            <div className="pdf-editor-page-number">Page {pageNum}</div>
                            <div className="pdf-editor-page-rotate">
                              <RotateCcw size={16} /> {state.pageRotations[pageNum] || 0}°
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {state.activeTool === 'delete' && (
                    <div className="pdf-editor-panel-section">
                      <h4>Delete Pages</h4>
                      <p className="pdf-editor-panel-hint">Select pages to delete, then confirm.</p>
                      <div className="pdf-editor-page-grid">
                        {Array.from({ length: state.totalPages }, (_, i) => i + 1).map(pageNum => (
                          <div
                            key={pageNum}
                            className={`pdf-editor-page-thumb ${state.selectedPages.includes(pageNum) ? 'selected' : ''}`}
                            onClick={() => togglePageSelection(pageNum)}
                          >
                            <div className="pdf-editor-page-number">Page {pageNum}</div>
                            {state.selectedPages.includes(pageNum) && (
                              <div className="pdf-editor-page-check">
                                <CheckCircle2 size={16} />
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                      {state.selectedPages.length > 0 && (
                        <button className="pdf-editor-btn-confirm" onClick={deleteSelectedPages}>
                          <Trash2 size={16} /> Delete {state.selectedPages.length} Pages
                        </button>
                      )}
                    </div>
                  )}

                  {state.activeTool === 'compress' && (
                    <div className="pdf-editor-panel-section">
                      <h4>Compress PDF</h4>
                      <p className="pdf-editor-panel-hint">Reduce the file size by optimizing the PDF.</p>
                      <button
                        className="pdf-editor-btn-confirm"
                        onClick={() => {
                          updateState({
                            actions: [...state.actions, { type: 'compress' }],
                            status: 'Compress action added',
                            statusType: 'success',
                          });
                        }}
                      >
                        <ShieldCheck size={16} /> Add Compress Action
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Action Queue */}
              {state.actions.length > 0 && (
                <div className="pdf-editor-action-queue">
                  <h4>Action Queue ({state.actions.length})</h4>
                  {state.actions.map((action, index) => (
                    <div key={index} className="pdf-editor-action-item">
                      <div className="pdf-editor-action-info">
                        <span className="pdf-editor-action-type">{action.type}</span>
                        {action.text && <span className="pdf-editor-action-detail">{action.text}</span>}
                        {action.pages && <span className="pdf-editor-action-detail">Pages: {action.pages.join(', ')}</span>}
                        {action.angle !== undefined && action.type === 'rotate' && (
                          <span className="pdf-editor-action-detail">{action.angle} degrees</span>
                        )}
                      </div>
                      <button className="pdf-editor-action-remove" onClick={() => removeAction(index)}>
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Download */}
              {state.downloadUrl && (
                <div className="pdf-editor-download-section">
                  <button className="pdf-editor-btn-download" onClick={handleDownload}>
                    <Download size={18} /> Download Edited PDF
                  </button>
                  <p className="pdf-editor-download-name">{state.downloadName}</p>
                </div>
              )}
            </div>

            {/* Preview Area */}
            <div className="pdf-editor-preview">
              <div className="pdf-editor-preview-header">
                <div className="pdf-editor-preview-info">
                  <FilePlus size={16} />
                  <span className="pdf-editor-preview-name">{state.fileName}</span>
                  <span className="pdf-editor-preview-meta">{state.actions.length} actions queued</span>
                </div>
                <button className="pdf-editor-preview-close" onClick={() => {
                  updateState({
                    file: null,
                    pdfUrl: null,
                    fileName: '',
                    actions: [],
                    downloadUrl: null,
                    downloadName: null,
                    activeTool: null,
                    status: '',
                  });
                }}>
                  <X size={16} /> Close
                </button>
              </div>
              <div className="pdf-editor-preview-frame">
                <iframe
                  key={state.previewKey}
                  src={`${state.pdfUrl}#toolbar=1&navpanes=1`}
                  className="pdf-editor-iframe"
                  title="PDF Preview"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Status Bar */}
      {state.status && (
        <div className={`pdf-editor-status pdf-editor-status-${state.statusType}`}>
          {state.statusType === 'processing' && <Loader2 size={16} className="animate-spin" />}
          {state.statusType === 'success' && <CheckCircle2 size={16} />}
          {state.statusType === 'error' && <AlertCircle size={16} />}
          <span>{state.status}</span>
        </div>
      )}
    </div>
  );
}
