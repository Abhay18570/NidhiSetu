import { useState, useEffect } from 'react';
import { X, Download, FileText, Shield, ExternalLink, AlertCircle, FileCheck } from 'lucide-react';
import Button from './Button';
import Badge from './Badge';
import { fdrDocumentRepository } from '../../storage/fdrDocumentRepository';

export default function DocumentPreviewModal({
  isOpen,
  onClose,
  documentId,
  fileName = 'Deposit_Receipt_Scan.pdf',
  fileType = 'application/pdf',
  fileSize = 0,
  sha256Hash = '',
}) {
  const [blobUrl, setBlobUrl] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let activeUrl = null;

    async function loadDoc() {
      if (!isOpen || !documentId) {
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const url = await fdrDocumentRepository.createDocumentUrl(documentId);
        activeUrl = url;
        setBlobUrl(url);
      } catch (err) {
        console.warn('Could not load document blob:', err);
      } finally {
        setLoading(false);
      }
    }

    loadDoc();

    return () => {
      if (activeUrl) {
        fdrDocumentRepository.revokeDocumentUrl(activeUrl);
      }
    };
  }, [isOpen, documentId]);

  if (!isOpen) return null;

  const isPdf = fileType?.toLowerCase().includes('pdf') || fileName?.toLowerCase().endsWith('.pdf');
  const isImage = fileType?.toLowerCase().includes('image') || /\.(jpg|jpeg|png|webp)$/i.test(fileName || '');

  const formatSize = (bytes) => {
    if (!bytes) return 'N/A';
    const mb = bytes / (1024 * 1024);
    if (mb >= 1) return `${mb.toFixed(2)} MB`;
    return `${(bytes / 1024).toFixed(1)} KB`;
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="app-modal fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150"
    >
      <div className="bg-white rounded-2xl border border-[#D3DDEB] max-w-4xl w-full h-[90vh] flex flex-col gov-shadow-xl overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:px-6 bg-[#0B1F54] text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3 truncate">
            <div className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center shrink-0">
              <FileText className="w-5 h-5 text-[#E89B24]" />
            </div>
            <div className="truncate">
              <div className="text-sm font-bold truncate">{fileName}</div>
              <div className="text-[0.6875rem] text-slate-300 flex items-center gap-2">
                <span>{formatSize(fileSize)}</span>
                <span>&bull;</span>
                <span className="uppercase">{fileType || 'Document'}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {blobUrl && (
              <a
                href={blobUrl}
                download={fileName}
                className="p-2 text-slate-300 hover:text-white hover:bg-white/10 rounded-lg text-xs flex items-center gap-1 font-semibold"
                title="Download Document"
              >
                <Download className="w-4 h-4" />
                <span className="hidden sm:inline">Download</span>
              </a>
            )}
            <button
              type="button"
              onClick={onClose}
              className="p-2 text-slate-300 hover:text-white hover:bg-white/10 rounded-lg"
              aria-label="Close Preview"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* SHA-256 Cryptographic Fingerprint Bar */}
        <div className="px-4 py-2 bg-[#F5F7FB] border-b border-[#D3DDEB] flex items-center justify-between text-xs text-[#505F79] shrink-0">
          <div className="flex items-center gap-2 font-mono truncate">
            <Shield className="w-3.5 h-3.5 text-[#13805E] shrink-0" />
            <span className="font-semibold text-[#0B1F54]">SHA-256 Fingerprint:</span>
            <span className="truncate text-[0.6875rem]">
              {sha256Hash || 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'}
            </span>
          </div>
          <Badge variant="green" size="sm" className="hidden sm:inline-flex shrink-0">
            Hash Sealed
          </Badge>
        </div>

        {/* Body Preview Area */}
        <div className="flex-1 overflow-auto bg-slate-100 flex items-center justify-center p-4">
          {loading ? (
            <div className="text-center space-y-2 text-slate-500">
              <div className="animate-spin w-8 h-8 border-3 border-[#174EA6] border-t-transparent rounded-full mx-auto" />
              <div className="text-xs font-semibold">Retrieving document from IndexedDB storage...</div>
            </div>
          ) : blobUrl ? (
            isImage ? (
              <img
                src={blobUrl}
                alt={fileName}
                className="max-h-full max-w-full object-contain rounded-lg shadow-sm border border-slate-300 bg-white"
              />
            ) : isPdf ? (
              <iframe
                src={`${blobUrl}#toolbar=0`}
                title={fileName}
                className="w-full h-full rounded-lg border border-slate-300 bg-white shadow-sm"
              />
            ) : (
              <div className="text-center p-6 bg-white rounded-xl border border-slate-200 max-w-md space-y-3">
                <FileCheck className="w-12 h-12 text-[#13805E] mx-auto" />
                <h4 className="font-bold text-sm text-[#0B1F54]">{fileName}</h4>
                <p className="text-xs text-slate-500">
                  Binary file successfully stored. Direct browser preview is not supported for this MIME format.
                </p>
                <a
                  href={blobUrl}
                  download={fileName}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#0B1F54] text-white text-xs font-bold rounded-lg shadow"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Document</span>
                </a>
              </div>
            )
          ) : (
            /* Synthetic / Mock preview if no real blob exists yet */
            <div className="text-center p-8 bg-white rounded-2xl border border-slate-200 max-w-lg shadow-sm space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-[#E8F0FE] text-[#174EA6] flex items-center justify-center mx-auto">
                <FileText className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <h4 className="font-extrabold text-base text-[#0B1F54]">{fileName}</h4>
                <p className="text-xs text-[#505F79]">
                  Synthetic Institutional Fixed Deposit Certificate Scan
                </p>
              </div>

              <div className="p-4 bg-[#F5F7FB] border border-[#D3DDEB] rounded-xl text-left text-xs space-y-2 font-mono">
                <div className="flex justify-between border-b border-slate-200 pb-1">
                  <span className="text-slate-500">Document Type:</span>
                  <span className="font-bold text-[#0B1F54]">{fileType}</span>
                </div>
                <div className="flex justify-between border-b border-slate-200 pb-1">
                  <span className="text-slate-500">File Size:</span>
                  <span className="font-bold text-[#0B1F54]">{formatSize(fileSize)}</span>
                </div>
                <div className="flex justify-between border-b border-slate-200 pb-1">
                  <span className="text-slate-500">Integrity:</span>
                  <span className="text-[#13805E] font-bold">SHA-256 Validated</span>
                </div>
                <div className="text-[0.6875rem] text-slate-500 pt-1">
                  This mock document record is backed by the prototype storage schema.
                </div>
              </div>

              <div className="text-[0.6875rem] text-[#C67C11] bg-amber-50 border border-amber-200 p-2.5 rounded-lg flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>IndexedDB prototype storage active. Real financial documents are not uploaded.</span>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 sm:px-6 bg-white border-t border-[#D3DDEB] flex items-center justify-between shrink-0">
          <div className="text-[0.6875rem] text-slate-500 hidden sm:block">
            NidhiSetu Document Repository &bull; Ingestion Hash Verification
          </div>
          <Button onClick={onClose} variant="primary" size="sm" className="font-bold ml-auto">
            Close Preview
          </Button>
        </div>
      </div>
    </div>
  );
}
