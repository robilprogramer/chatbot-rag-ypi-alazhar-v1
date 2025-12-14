import { VectorStoreDocument } from "@/types/vectorstore";
import { FileText, ChevronDown, ChevronRight } from "lucide-react";
import { useState } from "react";

interface VectorStoreTableProps {
  documents: VectorStoreDocument[];
}

export default function VectorStoreTable({
  documents,
}: VectorStoreTableProps) {
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());

  const toggleRow = (index: number) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedRows(newExpanded);
  };

  if (documents.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <FileText className="h-12 w-12 text-gray-300 mx-auto mb-3" />
        <p>Tidak ada dokumen di vector store</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="bg-gray-50 border-b">
          <tr>
            <th className="text-left py-3 px-4 text-sm font-medium text-gray-600 w-12">
              #
            </th>
            <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">
              Source
            </th>
            <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">
              Cabang
            </th>
            <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">
              Jenjang
            </th>
            <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">
              Kategori
            </th>
            <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">
              Tahun
            </th>
            <th className="text-center py-3 px-4 text-sm font-medium text-gray-600">
              Chunk
            </th>
            <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">
              Content Preview
            </th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {documents.map((doc, index) => {
            const isExpanded = expandedRows.has(index);
            return (
              <tr key={index} className="hover:bg-gray-50">
                <td className="py-3 px-4 text-sm text-gray-600">
                  {index + 1}
                </td>
                <td className="py-3 px-4 text-sm text-gray-800">
                  <div className="font-medium">{doc.metadata.source}</div>
                  <div className="text-xs text-gray-500">
                    ID: {doc.metadata.chunk_id}
                  </div>
                </td>
                <td className="py-3 px-4 text-sm text-gray-600 capitalize">
                  {doc.metadata.cabang}
                </td>
                <td className="py-3 px-4 text-sm text-gray-600">
                  <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-xs">
                    {doc.metadata.jenjang}
                  </span>
                </td>
                <td className="py-3 px-4 text-sm text-gray-600 capitalize">
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                    {doc.metadata.kategori}
                  </span>
                </td>
                <td className="py-3 px-4 text-sm text-gray-600">
                  {doc.metadata.tahun}
                </td>
                <td className="py-3 px-4 text-center text-sm text-gray-600">
                  <span className="text-xs text-gray-500">
                    {doc.metadata.chunk_index + 1} / {doc.metadata.total_chunks}
                  </span>
                </td>
                <td className="py-3 px-4">
                  <div className="flex items-start gap-2">
                    <button
                      onClick={() => toggleRow(index)}
                      className="text-gray-400 hover:text-gray-600 mt-1"
                    >
                      {isExpanded ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                    </button>
                    <div className="flex-1">
                      <p className="text-sm text-gray-700 line-clamp-2">
                        {doc.content}
                      </p>
                      {isExpanded && (
                        <div className="mt-2 p-3 bg-gray-50 rounded text-sm text-gray-700 whitespace-pre-wrap">
                          {doc.content}
                        </div>
                      )}
                    </div>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}