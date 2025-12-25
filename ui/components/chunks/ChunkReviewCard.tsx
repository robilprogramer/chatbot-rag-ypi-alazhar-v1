"use client";

import { useState } from "react";
import { ChunkResponse, ChunkUpdateItem } from "@/types/chunk";
import { Edit2, Save, X, AlertCircle } from "lucide-react";

interface ChunkReviewCardProps {
  chunk: ChunkResponse;
  index: number;
  onUpdate: (id: number, updates: Partial<ChunkUpdateItem>) => void;
  hasChanges: boolean;
}

export default function ChunkReviewCard({
  chunk,
  index,
  onUpdate,
  hasChanges,
}: ChunkReviewCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(chunk.content);
  const [editedMetadata, setEditedMetadata] = useState(
    JSON.stringify(chunk.metadata, null, 2)
  );
  const [metadataError, setMetadataError] = useState("");

  const handleSave = () => {
    try {
      const parsedMetadata = JSON.parse(editedMetadata);
      onUpdate(chunk.id, {
        content: editedContent,
        metadata: parsedMetadata,
      });
      setIsEditing(false);
      setMetadataError("");
    } catch (error) {
      setMetadataError("Invalid JSON format");
    }
  };

  const handleCancel = () => {
    setEditedContent(chunk.content);
    setEditedMetadata(JSON.stringify(chunk.metadata, null, 2));
    setMetadataError("");
    setIsEditing(false);
  };

  return (
    <div
      className={`border rounded-lg p-4 transition-all ${
        hasChanges
          ? "border-blue-500 bg-blue-50"
          : "border-gray-200 bg-white"
      }`}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-gray-500 bg-gray-100 px-2 py-1 rounded">
            Chunk #{index + 1}
          </span>
          <span className="text-xs text-gray-400">ID: {chunk.id}</span>
          {hasChanges && (
            <span className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded flex items-center gap-1">
              <AlertCircle className="h-3 w-3" />
              Modified
            </span>
          )}
        </div>
        <div className="flex gap-2">
          {isEditing ? (
            <>
              <button
                onClick={handleSave}
                className="text-green-600 hover:text-green-700 p-1"
                title="Save changes"
              >
                <Save className="h-4 w-4" />
              </button>
              <button
                onClick={handleCancel}
                className="text-red-600 hover:text-red-700 p-1"
                title="Cancel"
              >
                <X className="h-4 w-4" />
              </button>
            </>
          ) : (
            <button
              onClick={() => setIsEditing(true)}
              className="text-blue-600 hover:text-blue-700 p-1"
              title="Edit chunk"
            >
              <Edit2 className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      <div className="space-y-3">
        {/* Content */}
        <div>
          <label className="text-xs font-semibold text-gray-600 mb-1 block">
            Content
          </label>
          {isEditing ? (
            <textarea
              value={editedContent}
              onChange={(e) => setEditedContent(e.target.value)}
              className="w-full p-2 border rounded text-sm font-mono min-h-[120px] focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Chunk content..."
            />
          ) : (
            <p className="text-sm text-gray-700 whitespace-pre-wrap bg-gray-50 p-3 rounded">
              {chunk.content}
            </p>
          )}
        </div>

        {/* Metadata */}
        <div>
          <label className="text-xs font-semibold text-gray-600 mb-1 block">
            Metadata
          </label>
          {isEditing ? (
            <div>
              <textarea
                value={editedMetadata}
                onChange={(e) => {
                  setEditedMetadata(e.target.value);
                  setMetadataError("");
                }}
                className={`w-full p-2 border rounded text-xs font-mono min-h-[100px] focus:ring-2 ${
                  metadataError
                    ? "border-red-500 focus:ring-red-500"
                    : "focus:ring-blue-500 focus:border-blue-500"
                }`}
                placeholder='{"key": "value"}'
              />
              {metadataError && (
                <p className="text-xs text-red-600 mt-1">{metadataError}</p>
              )}
            </div>
          ) : (
            <pre className="text-xs text-gray-600 bg-gray-50 p-3 rounded overflow-x-auto">
              {JSON.stringify(chunk.metadata, null, 2)}
            </pre>
          )}
        </div>
      </div>
    </div>
  );
}