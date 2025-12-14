import { ChunkResponse } from "@/types/chunk";
import { FileText, Edit2, Trash2 } from "lucide-react";

interface ChunkListProps {
  chunks: ChunkResponse[];
  loading: boolean;
  onEdit: (chunkId: number, chunk: ChunkResponse) => void;
  onDelete: (chunkId: number) => void;
}

export default function ChunkList({
  chunks,
  loading,
  onEdit,
  onDelete,
}: ChunkListProps) {
  if (loading) {
    return null;
  }

  if (chunks.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <FileText className="h-12 w-12 text-gray-300 mx-auto mb-3" />
        <p>Tidak ada chunks</p>
        <p className="text-sm mt-2">Process dokumen untuk membuat chunks</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="bg-gray-50 border-b">
          <tr>
            <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">
              #
            </th>
            <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">
              Content
            </th>
            <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">
              Filename
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
            <th className="text-right py-3 px-4 text-sm font-medium text-gray-600">
              Aksi
            </th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {chunks.map((chunk, index) => (
            <tr key={index} className="hover:bg-gray-50">
              <td className="py-3 px-4 text-sm text-gray-600">
                {index + 1}
              </td>
              <td className="py-3 px-4">
                <div className="max-w-md">
                  <p className="text-sm text-gray-800 line-clamp-2">
                    {chunk.content}
                  </p>
                  {chunk.content.length > 100 && (
                    <details className="mt-1">
                      <summary className="text-xs text-blue-600 cursor-pointer hover:text-blue-700">
                        Lihat selengkapnya
                      </summary>
                      <p className="text-sm text-gray-700 mt-2 whitespace-pre-wrap">
                        {chunk.content}
                      </p>
                    </details>
                  )}
                </div>
              </td>
              <td className="py-3 px-4 text-sm text-gray-600">
                {chunk.metadata?.filename || "-"}
              </td>
              <td className="py-3 px-4 text-sm text-gray-600 capitalize">
                {chunk.metadata?.cabang || "-"}
              </td>
              <td className="py-3 px-4 text-sm text-gray-600">
                {chunk.metadata?.jenjang || "-"}
              </td>
              <td className="py-3 px-4 text-sm text-gray-600 capitalize">
                {chunk.metadata?.kategori || "-"}
              </td>
              <td className="py-3 px-4 text-right">
                <div className="flex items-center justify-end gap-2">
                  <button
                    onClick={() => onEdit(chunk.id, chunk)}
                    className="text-blue-600 hover:text-blue-700 p-1"
                    title="Edit chunk"
                  >
                    <Edit2 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => onDelete(chunk.id)}
                    className="text-red-600 hover:text-red-700 p-1"
                    title="Delete chunk"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                  {chunk.metadata && Object.keys(chunk.metadata).length > 0 && (
                    <details className="relative group">
                      <summary className="text-gray-600 hover:text-gray-700 cursor-pointer p-1 list-none">
                        <span className="text-xs">JSON</span>
                      </summary>
                      <div className="absolute right-0 mt-2 w-80 bg-white border border-gray-200 rounded-lg shadow-lg z-10 p-3">
                        <pre className="text-xs overflow-auto max-h-64">
                          {JSON.stringify(chunk.metadata, null, 2)}
                        </pre>
                      </div>
                    </details>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}