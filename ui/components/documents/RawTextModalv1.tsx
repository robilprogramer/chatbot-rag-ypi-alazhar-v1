// // src/components/documents/RawTextModal.tsx

// "use client";

// import { useState, useEffect } from "react";
// import { Document } from "@/types/document";
// import { documentService } from "@/services/documentService";
// import { X, Copy, Download, Loader2, CheckCircle } from "lucide-react";
// import toast from "react-hot-toast";

// interface RawTextModalProps {
//   document: Document;
//   onClose: () => void;
// }

// export default function RawTextModal({
//   document,
//   onClose,
// }: RawTextModalProps) {
//   const [rawText, setRawText] = useState<string>("");
//   const [loading, setLoading] = useState(true);
//   const [copied, setCopied] = useState(false);

//   useEffect(() => {
//     fetchRawText();
//   }, [document.id]);

//   const fetchRawText = async () => {
//     try {
//       setLoading(true);
//       const response = await documentService.getRawText(document.id);
//       setRawText(response.raw_text);
//     } catch (err) {
//       toast.error("Gagal memuat raw text");
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleCopy = async () => {
//     try {
//       await navigator.clipboard.writeText(rawText);
//       setCopied(true);
//       toast.success("Text berhasil dicopy!");
//       setTimeout(() => setCopied(false), 2000);
//     } catch (err) {
//       toast.error("Gagal copy text");
//     }
//   };

//   const handleDownload = () => {
//     const blob = new Blob([rawText], { type: "text/plain" });
//     const url = URL.createObjectURL(blob);
//     const a = document.createElement("a");
//     a.href = url;
//     a.download = `${document.original_filename.replace(".pdf", "")}_raw_text.txt`;
//     document.body.appendChild(a);
//     a.click();
//     document.body.removeChild(a);
//     URL.revokeObjectURL(url);
//     toast.success("File berhasil didownload!");
//   };

//   return (
//     <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
//       <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] flex flex-col">
//         <div className="border-b border-gray-200 p-6 flex items-center justify-between">
//           <div>
//             <h2 className="text-xl font-bold text-gray-800">Raw Text</h2>
//             <p className="text-sm text-gray-500 mt-1">
//               {document.original_filename}
//             </p>
//           </div>
//           <div className="flex items-center gap-2">
//             <button
//               onClick={handleCopy}
//               disabled={loading}
//               className="btn-secondary flex items-center gap-2"
//             >
//               {copied ? (
//                 <>
//                   <CheckCircle className="h-4 w-4" />
//                   Copied!
//                 </>
//               ) : (
//                 <>
//                   <Copy className="h-4 w-4" />
//                   Copy
//                 </>
//               )}
//             </button>
//             <button
//               onClick={handleDownload}
//               disabled={loading}
//               className="btn-secondary flex items-center gap-2"
//             >
//               <Download className="h-4 w-4" />
//               Download
//             </button>
//             <button
//               onClick={onClose}
//               className="text-gray-400 hover:text-gray-600 transition-colors"
//             >
//               <X className="h-6 w-6" />
//             </button>
//           </div>
//         </div>

//         <div className="flex-1 overflow-y-auto p-6">
//           {loading ? (
//             <div className="flex items-center justify-center h-full">
//               <Loader2 className="h-8 w-8 text-gray-400 animate-spin" />
//             </div>
//           ) : (
//             <div className="bg-gray-50 rounded-lg p-6">
//               <pre className="text-sm text-gray-700 whitespace-pre-wrap font-mono leading-relaxed">
//                 {rawText}
//               </pre>
//             </div>
//           )}
//         </div>

//         {!loading && (
//           <div className="border-t border-gray-200 p-4 bg-gray-50">
//             <p className="text-sm text-gray-500 text-center">
//               {rawText.length.toLocaleString()} karakter • {document.total_pages} halaman
//             </p>
//           </div>
//         )}
//       </div>
//     </div>
//   );
// }