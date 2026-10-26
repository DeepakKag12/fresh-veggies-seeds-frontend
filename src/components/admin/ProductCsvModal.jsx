import React, { useState, useRef } from 'react';
import {
  Upload,
  Download,
  X,
  FileSpreadsheet,
  AlertTriangle,
  CheckCircle2,
  FileText,
  RefreshCw,
  Info
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../utils/api';

const SAMPLE_CSV_TEMPLATE = `Name,Category,Price,OriginalPrice,Stock,Weight,Season,Description,Images,Packages,Status
"Organic Hybrid Tomato Seeds","Seeds",120,150,100,"50g","All Season","High-yield disease resistant hybrid tomato seeds","https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=500","50 Seeds:120:50|100 Seeds:220:50","Active"
"Bio-Enriched Vermicompost","Fertilizers",250,300,45,"1kg","All Season","100% natural organic compost enriched with beneficial soil microbes","https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?w=500","","Active"
"Italian Sweet Basil Seeds","Seeds",99,130,60,"20g","Summer","Aromatic culinary herb perfect for home garden pots","https://images.unsplash.com/photo-1618375569909-3c8616cf7733?w=500","100 Seeds:99:60","Active"`;

export const ProductCsvModal = ({ isOpen, onClose, onImportSuccess }) => {
  const [activeTab, setActiveTab] = useState('import'); // 'import' | 'export'
  const [file, setFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [validationErrors, setValidationErrors] = useState([]);
  const [summary, setSummary] = useState(null);
  const fileInputRef = useRef(null);

  if (!isOpen) return null;

  const handleFileDrop = (e) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile.name.endsWith('.csv') || droppedFile.type === 'text/csv') {
        setFile(droppedFile);
        setValidationErrors([]);
        setSummary(null);
      } else {
        toast.error('Please upload a valid .csv file');
      }
    }
  };

  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      if (selected.name.endsWith('.csv') || selected.type === 'text/csv') {
        setFile(selected);
        setValidationErrors([]);
        setSummary(null);
      } else {
        toast.error('Please upload a valid .csv file');
      }
    }
  };

  const handleDownloadSample = () => {
    const blob = new Blob([SAMPLE_CSV_TEMPLATE], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'fresh_veggies_catalog_template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success('Sample CSV template downloaded!');
  };

  const handleImport = async () => {
    if (!file) {
      toast.error('Please select a CSV file to import');
      return;
    }

    setIsUploading(true);
    setValidationErrors([]);
    setSummary(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await api.post('/products/import-csv', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (response.data.success) {
        toast.success(response.data.message || 'Products imported successfully!');
        setSummary({
          type: 'success',
          text: response.data.message,
          count: response.data.importedCount,
        });
        setFile(null);
        if (onImportSuccess) onImportSuccess();
      }
    } catch (err) {
      const errData = err.response?.data;
      if (errData?.errors && Array.isArray(errData.errors)) {
        setValidationErrors(errData.errors);
        setSummary({
          type: 'error',
          text: errData.message || 'CSV validation failed. No products were imported.',
          totalRows: errData.totalRows,
          failedCount: errData.failedRowCount || errData.errors.length,
        });
        toast.error(`Validation failed with ${errData.errors.length} error(s)`);
      } else {
        toast.error(errData?.message || 'Failed to import CSV');
      }
    } finally {
      setIsUploading(false);
    }
  };

  const handleBackendExport = async () => {
    setIsExporting(true);
    try {
      const response = await api.get('/products/export-csv', { responseType: 'blob' });
      const blob = new Blob([response.data], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `fresh_veggies_full_catalog_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success('Full catalog exported to CSV successfully!');
    } catch (err) {
      toast.error('Failed to export catalog to CSV');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white dark:bg-gray-800 rounded-3xl max-w-2xl w-full border border-gray-200 dark:border-gray-700 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-5 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900 dark:text-white">
                Bulk CSV Catalog Operations
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Shopify-grade bulk import & export with atomic validation safeguards
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Toggle */}
        <div className="flex border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50 px-5 pt-2">
          <button
            type="button"
            onClick={() => setActiveTab('import')}
            className={`flex items-center gap-2 pb-3 px-3 text-xs font-bold border-b-2 transition-colors ${
              activeTab === 'import'
                ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
                : 'border-transparent text-gray-500 hover:text-gray-900 dark:text-gray-400'
            }`}
          >
            <Upload className="w-4 h-4" />
            <span>Import Products</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('export')}
            className={`flex items-center gap-2 pb-3 px-3 text-xs font-bold border-b-2 transition-colors ${
              activeTab === 'export'
                ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
                : 'border-transparent text-gray-500 hover:text-gray-900 dark:text-gray-400'
            }`}
          >
            <Download className="w-4 h-4" />
            <span>Export Catalog</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-5 flex-1 text-xs">
          {activeTab === 'import' ? (
            <>
              {/* Instructions & Template Link */}
              <div className="bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <p className="font-bold text-emerald-900 dark:text-emerald-300 flex items-center gap-1.5">
                    <Info className="w-4 h-4" />
                    CSV Format Instructions
                  </p>
                  <p className="text-emerald-700 dark:text-emerald-400 text-[11px] leading-relaxed">
                    Required columns: <strong>Name, Category, Price, Stock</strong>. Categories must match existing store categories.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleDownloadSample}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-xs transition-colors shrink-0"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Sample Template</span>
                </button>
              </div>

              {/* Drag & Drop Upload Box */}
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleFileDrop}
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-gray-300 dark:border-gray-600 hover:border-emerald-500 dark:hover:border-emerald-400 rounded-2xl p-6 text-center cursor-pointer transition-colors bg-gray-50/40 dark:bg-gray-800/40"
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileSelect}
                  accept=".csv,text/csv"
                  className="hidden"
                />
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center mb-2">
                  <Upload className="w-6 h-6" />
                </div>
                <p className="font-bold text-gray-800 dark:text-gray-200">
                  {file ? file.name : 'Click or drag & drop CSV file here'}
                </p>
                <p className="text-[11px] text-gray-400 mt-0.5">
                  {file ? `${(file.size / 1024).toFixed(1)} KB` : 'Supports standard UTF-8 encoded .csv files up to 10MB'}
                </p>
              </div>

              {/* Import Feedback / Summary Banner */}
              {summary && (
                <div
                  className={`p-4 rounded-2xl border ${
                    summary.type === 'success'
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'
                      : 'bg-rose-50 text-rose-800 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800'
                  }`}
                >
                  <div className="flex items-start gap-2.5">
                    {summary.type === 'success' ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                    ) : (
                      <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                    )}
                    <div>
                      <p className="font-bold">{summary.text}</p>
                      {summary.type === 'error' && (
                        <p className="text-[11px] mt-1 text-rose-700 dark:text-rose-400">
                          <strong>Catalog Protected:</strong> Database was NOT modified. Please fix the {validationErrors.length} row error(s) below and re-upload.
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Validation Errors Detailed Table */}
              {validationErrors.length > 0 && (
                <div className="space-y-2 border border-rose-200 dark:border-rose-900/50 rounded-2xl p-4 bg-rose-50/20 dark:bg-rose-950/10">
                  <h4 className="font-bold text-rose-700 dark:text-rose-400 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" />
                    Row-Level Validation Error Report ({validationErrors.length})
                  </h4>
                  <div className="max-h-56 overflow-y-auto rounded-xl border border-rose-100 dark:border-rose-900/40 bg-white dark:bg-gray-800">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead className="bg-rose-50/60 dark:bg-rose-950/30 text-rose-800 dark:text-rose-300 border-b border-rose-100 dark:border-rose-900/40 font-bold">
                        <tr>
                          <th className="py-2 px-3">Row #</th>
                          <th className="py-2 px-3">Field</th>
                          <th className="py-2 px-3">Issue Reason</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                        {validationErrors.map((err, i) => (
                          <tr key={i} className="hover:bg-rose-50/30 dark:hover:bg-rose-950/20">
                            <td className="py-2 px-3 font-mono font-bold text-rose-600 dark:text-rose-400">
                              Row {err.row}
                            </td>
                            <td className="py-2 px-3 font-semibold uppercase text-[10px] text-gray-500">
                              {err.field}
                            </td>
                            <td className="py-2 px-3 text-gray-700 dark:text-gray-300">
                              {err.message}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          ) : (
            /* Export Catalog Tab */
            <div className="space-y-4">
              <div className="bg-gray-50 dark:bg-gray-700/30 rounded-2xl p-4 border border-gray-200 dark:border-gray-700 space-y-2">
                <h4 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <FileText className="w-4 h-4 text-emerald-600" />
                  Complete Product Catalog Export
                </h4>
                <p className="text-gray-500 dark:text-gray-400 text-xs">
                  Generate an official RFC 4180 CSV export of all active products, categories, SKU pricing, package variants, and current warehouse stock levels directly from the backend.
                </p>
              </div>

              <button
                type="button"
                onClick={handleBackendExport}
                disabled={isExporting}
                className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-xs transition-colors disabled:opacity-50"
              >
                {isExporting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Generating Catalog CSV...</span>
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    <span>Download Full Catalog (.csv)</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        {activeTab === 'import' && (
          <div className="p-4 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-bold hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-xs"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleImport}
              disabled={!file || isUploading}
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-xs transition-colors flex items-center gap-2 disabled:opacity-40 text-xs"
            >
              {isUploading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Validating & Importing...</span>
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  <span>Validate & Import Products</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductCsvModal;
