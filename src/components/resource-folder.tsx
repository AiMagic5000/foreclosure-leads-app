"use client"

import { Download, Printer, X } from "lucide-react"

interface ResourceFolderProps {
  displayName: string
  fileUrl: string
  onDownload: () => void
  onPrint: () => void
  onDelete?: () => void
}

export function ResourceFolder({
  displayName,
  fileUrl,
  onDownload,
  onPrint,
  onDelete,
}: ResourceFolderProps) {
  return (
    <div className="group relative flex flex-col items-center gap-2">
      {/* Admin delete button */}
      {onDelete && (
        <button
          type="button"
          onClick={onDelete}
          className="absolute -top-1 -right-1 z-10 h-6 w-6 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
          title="Delete resource"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}

      {/* Animated folder */}
      <div className="folder-wrapper cursor-pointer" onClick={onDownload}>
        <div className="folder">
          <div className="folder-back" />
          <div className="folder-paper">
            <div className="folder-paper-line" />
            <div className="folder-paper-line" />
            <div className="folder-paper-line" />
          </div>
          <div className="folder-front" />
          <div className="folder-tab" />
        </div>
      </div>

      {/* File name */}
      <p className="text-xs text-center font-medium text-muted-foreground line-clamp-2 max-w-[120px] leading-tight">
        {displayName}
      </p>

      {/* Action buttons */}
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={onDownload}
          className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-indigo-600 text-white text-[10px] font-medium hover:bg-indigo-700 transition-colors"
        >
          <Download className="h-3 w-3" />
          Download
        </button>
        <button
          type="button"
          onClick={onPrint}
          className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-slate-600 text-white text-[10px] font-medium hover:bg-slate-700 transition-colors"
        >
          <Printer className="h-3 w-3" />
          Print
        </button>
      </div>

      {/* Folder CSS */}
      <style jsx>{`
        .folder-wrapper {
          width: 80px;
          height: 70px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .folder {
          position: relative;
          width: 70px;
          height: 55px;
          transition: transform 0.3s ease;
        }
        .folder-wrapper:hover .folder {
          transform: translateY(-4px);
        }
        .folder-back {
          position: absolute;
          bottom: 0;
          left: 0;
          width: 100%;
          height: 45px;
          background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%);
          border-radius: 0 6px 6px 6px;
          z-index: 1;
        }
        .folder-tab {
          position: absolute;
          top: 0;
          left: 0;
          width: 35px;
          height: 14px;
          background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%);
          border-radius: 6px 6px 0 0;
          z-index: 0;
        }
        .folder-paper {
          position: absolute;
          bottom: 6px;
          left: 8px;
          width: calc(100% - 16px);
          height: 34px;
          background: #f8fafc;
          border-radius: 3px;
          z-index: 2;
          padding: 6px;
          display: flex;
          flex-direction: column;
          gap: 4px;
          transition: transform 0.3s ease;
        }
        .folder-wrapper:hover .folder-paper {
          transform: translateY(-6px);
        }
        .folder-paper-line {
          height: 2px;
          background: #e2e8f0;
          border-radius: 1px;
        }
        .folder-paper-line:nth-child(2) {
          width: 80%;
        }
        .folder-paper-line:nth-child(3) {
          width: 60%;
        }
        .folder-front {
          position: absolute;
          bottom: 0;
          left: 0;
          width: 100%;
          height: 40px;
          background: linear-gradient(135deg, #818cf8 0%, #6366f1 100%);
          border-radius: 0 6px 6px 6px;
          z-index: 3;
          transition: transform 0.3s ease;
        }
        .folder-wrapper:hover .folder-front {
          transform: translateY(2px) rotateX(-8deg);
          transform-origin: bottom center;
        }
      `}</style>
    </div>
  )
}
