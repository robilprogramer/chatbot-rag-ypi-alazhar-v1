"use client";

import { useState, useEffect } from "react";
import { Document } from "@/types/document";
import { documentService } from "@/services/documentService";
import {
    X,
    Copy,
    Download,
    Loader2,
    CheckCircle,
    Edit2,
    Save,
    RotateCcw,
    Maximize2,
    Minimize2,
    Bold,
    Italic,
    Underline as UnderlineIcon,
    List,
    ListOrdered,
    AlignLeft,
    AlignCenter,
    AlignRight,
    AlignJustify,
    Undo,
    Redo,
} from "lucide-react";
import toast from "react-hot-toast";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import Underline from "@tiptap/extension-underline";
import TextAlign from "@tiptap/extension-text-align";
import { TextStyle } from "@tiptap/extension-text-style";
import Color from "@tiptap/extension-color";

interface RichTextModalProps {
    document: Document;
    onClose: () => void;
    onUpdate?: () => void;
}

export default function RichTextModal({
    document,
    onClose,
    onUpdate,
}: RichTextModalProps) {
    const [rawText, setRawText] = useState<string>("");
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [copied, setCopied] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [hasChanges, setHasChanges] = useState(false);

    const editor = useEditor({
        immediatelyRender: false, // ✅ Tambahkan ini untuk fix SSR error
        extensions: [
            StarterKit.configure({
                heading: {
                    levels: [1, 2, 3],
                },
            }),
            Underline,
            TextAlign.configure({
                types: ["heading", "paragraph"],
            }),
            Placeholder.configure({
                placeholder: "Paste atau ketik text di sini...",
            }),
            TextStyle,
            Color,
        ],
        content: "",
        editable: false,
        onUpdate: ({ editor }) => {
            const currentText = editor.getText();
            setHasChanges(currentText !== rawText);
        },
    });

    useEffect(() => {
        fetchRawText();
    }, [document.id]);

    useEffect(() => {
        if (editor && rawText) {
            // Convert plain text to HTML paragraphs
            const htmlContent = rawText
                .split("\n")
                .map((line) => `<p>${line || "<br>"}</p>`)
                .join("");
            editor.commands.setContent(htmlContent);
            editor.setEditable(isEditing);
        }
    }, [editor, rawText, isEditing]);

    const fetchRawText = async () => {
        try {
            setLoading(true);
            const response = await documentService.getRawText(document.id);
            setRawText(response.raw_text);
        } catch (err) {
            toast.error("Gagal memuat raw text");
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!editor) return;

        const editedText = editor.getText();

        if (editedText.trim() === "") {
            toast.error("Raw text tidak boleh kosong");
            return;
        }

        if (editedText === rawText) {
            toast.error("Tidak ada perubahan untuk disimpan");
            return;
        }

        try {
            setSaving(true);
            await documentService.updateRawText(document.id, {
                raw_text: editedText,
            });

            setRawText(editedText);
            setIsEditing(false);
            setHasChanges(false);
            toast.success("Raw text berhasil diupdate!");

            if (onUpdate) {
                onUpdate();
            }
        } catch (err) {
            toast.error(
                err instanceof Error ? err.message : "Gagal update raw text"
            );
        } finally {
            setSaving(false);
        }
    };

    const handleCancel = () => {
        if (editor) {
            const htmlContent = rawText
                .split("\n")
                .map((line) => `<p>${line || "<br>"}</p>`)
                .join("");
            editor.commands.setContent(htmlContent);
        }
        setIsEditing(false);
        setHasChanges(false);
    };

    const handleReset = () => {
        if (confirm("Reset ke raw text original?")) {
            if (editor) {
                const htmlContent = rawText
                    .split("\n")
                    .map((line) => `<p>${line || "<br>"}</p>`)
                    .join("");
                editor.commands.setContent(htmlContent);
            }
            setHasChanges(false);
            toast.success("Raw text direset");
        }
    };

    const handleCopy = async () => {
        try {
            const textToCopy = editor ? editor.getText() : rawText;
            await navigator.clipboard.writeText(textToCopy);
            setCopied(true);
            toast.success("Text berhasil dicopy!");
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            toast.error("Gagal copy text");
        }
    };

    const handleDownload = () => {
        const textToDownload = editor ? editor.getText() : rawText;
        const blob = new Blob([textToDownload], { type: "text/plain" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${document.original_filename.replace(
            ".pdf",
            ""
        )}_raw_text.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        toast.success("File berhasil didownload!");
    };

    const MenuBar = () => {
        if (!editor || !isEditing) return null;

        return (
            <div className="border-b border-gray-200 bg-white sticky top-0 z-10">
                <div className="flex flex-wrap items-center gap-1 p-2">
                    {/* Undo/Redo */}
                    <div className="flex items-center gap-1 border-r border-gray-200 pr-2 mr-2">
                        <button
                            onClick={() => editor.chain().focus().undo().run()}
                            disabled={!editor.can().undo()}
                            className="p-2 rounded hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed"
                            title="Undo"
                        >
                            <Undo className="h-4 w-4" />
                        </button>
                        <button
                            onClick={() => editor.chain().focus().redo().run()}
                            disabled={!editor.can().redo()}
                            className="p-2 rounded hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed"
                            title="Redo"
                        >
                            <Redo className="h-4 w-4" />
                        </button>
                    </div>

                    {/* Text Formatting */}
                    <div className="flex items-center gap-1 border-r border-gray-200 pr-2 mr-2">
                        <button
                            onClick={() => editor.chain().focus().toggleBold().run()}
                            className={`p-2 rounded hover:bg-gray-100 ${editor.isActive("bold") ? "bg-gray-200" : ""
                                }`}
                            title="Bold"
                        >
                            <Bold className="h-4 w-4" />
                        </button>
                        <button
                            onClick={() => editor.chain().focus().toggleItalic().run()}
                            className={`p-2 rounded hover:bg-gray-100 ${editor.isActive("italic") ? "bg-gray-200" : ""
                                }`}
                            title="Italic"
                        >
                            <Italic className="h-4 w-4" />
                        </button>
                        <button
                            onClick={() => editor.chain().focus().toggleUnderline().run()}
                            className={`p-2 rounded hover:bg-gray-100 ${editor.isActive("underline") ? "bg-gray-200" : ""
                                }`}
                            title="Underline"
                        >
                            <UnderlineIcon className="h-4 w-4" />
                        </button>
                    </div>

                    {/* Headings */}
                    <div className="flex items-center gap-1 border-r border-gray-200 pr-2 mr-2">
                        <button
                            onClick={() =>
                                editor.chain().focus().toggleHeading({ level: 1 }).run()
                            }
                            className={`px-3 py-1 rounded text-sm font-medium hover:bg-gray-100 ${editor.isActive("heading", { level: 1 }) ? "bg-gray-200" : ""
                                }`}
                        >
                            H1
                        </button>
                        <button
                            onClick={() =>
                                editor.chain().focus().toggleHeading({ level: 2 }).run()
                            }
                            className={`px-3 py-1 rounded text-sm font-medium hover:bg-gray-100 ${editor.isActive("heading", { level: 2 }) ? "bg-gray-200" : ""
                                }`}
                        >
                            H2
                        </button>
                        <button
                            onClick={() =>
                                editor.chain().focus().toggleHeading({ level: 3 }).run()
                            }
                            className={`px-3 py-1 rounded text-sm font-medium hover:bg-gray-100 ${editor.isActive("heading", { level: 3 }) ? "bg-gray-200" : ""
                                }`}
                        >
                            H3
                        </button>
                    </div>

                    {/* Lists */}
                    <div className="flex items-center gap-1 border-r border-gray-200 pr-2 mr-2">
                        <button
                            onClick={() => editor.chain().focus().toggleBulletList().run()}
                            className={`p-2 rounded hover:bg-gray-100 ${editor.isActive("bulletList") ? "bg-gray-200" : ""
                                }`}
                            title="Bullet List"
                        >
                            <List className="h-4 w-4" />
                        </button>
                        <button
                            onClick={() => editor.chain().focus().toggleOrderedList().run()}
                            className={`p-2 rounded hover:bg-gray-100 ${editor.isActive("orderedList") ? "bg-gray-200" : ""
                                }`}
                            title="Numbered List"
                        >
                            <ListOrdered className="h-4 w-4" />
                        </button>
                    </div>

                    {/* Text Alignment */}
                    <div className="flex items-center gap-1">
                        <button
                            onClick={() => editor.chain().focus().setTextAlign("left").run()}
                            className={`p-2 rounded hover:bg-gray-100 ${editor.isActive({ textAlign: "left" }) ? "bg-gray-200" : ""
                                }`}
                            title="Align Left"
                        >
                            <AlignLeft className="h-4 w-4" />
                        </button>
                        <button
                            onClick={() =>
                                editor.chain().focus().setTextAlign("center").run()
                            }
                            className={`p-2 rounded hover:bg-gray-100 ${editor.isActive({ textAlign: "center" }) ? "bg-gray-200" : ""
                                }`}
                            title="Align Center"
                        >
                            <AlignCenter className="h-4 w-4" />
                        </button>
                        <button
                            onClick={() => editor.chain().focus().setTextAlign("right").run()}
                            className={`p-2 rounded hover:bg-gray-100 ${editor.isActive({ textAlign: "right" }) ? "bg-gray-200" : ""
                                }`}
                            title="Align Right"
                        >
                            <AlignRight className="h-4 w-4" />
                        </button>
                        <button
                            onClick={() =>
                                editor.chain().focus().setTextAlign("justify").run()
                            }
                            className={`p-2 rounded hover:bg-gray-100 ${editor.isActive({ textAlign: "justify" }) ? "bg-gray-200" : ""
                                }`}
                            title="Justify"
                        >
                            <AlignJustify className="h-4 w-4" />
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div
                className={`bg-white rounded-lg flex flex-col transition-all ${isFullscreen
                        ? "w-full h-full max-w-none"
                        : "max-w-6xl w-full max-h-[90vh]"
                    }`}
            >
                {/* Header */}
                <div className="border-b border-gray-200 p-6 flex items-center justify-between flex-shrink-0">
                    <div>
                        <h2 className="text-xl font-bold text-gray-800">
                            {isEditing ? "Edit Raw Text" : "Raw Text"}
                        </h2>
                        <p className="text-sm text-gray-500 mt-1">
                            {document.original_filename}
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        {isEditing && (
                            <button
                                onClick={() => setIsFullscreen(!isFullscreen)}
                                className="btn-secondary flex items-center gap-2"
                                title={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
                            >
                                {isFullscreen ? (
                                    <>
                                        <Minimize2 className="h-4 w-4" />
                                        Exit Fullscreen
                                    </>
                                ) : (
                                    <>
                                        <Maximize2 className="h-4 w-4" />
                                        Fullscreen
                                    </>
                                )}
                            </button>
                        )}
                        {isEditing ? (
                            <>
                                <button
                                    onClick={handleReset}
                                    disabled={saving}
                                    className="btn-secondary flex items-center gap-2"
                                    title="Reset to original"
                                >
                                    <RotateCcw className="h-4 w-4" />
                                    Reset
                                </button>
                                <button
                                    onClick={handleCancel}
                                    disabled={saving}
                                    className="btn-secondary flex items-center gap-2"
                                >
                                    <X className="h-4 w-4" />
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSave}
                                    disabled={saving || !hasChanges}
                                    className="btn-primary flex items-center gap-2 disabled:opacity-50"
                                >
                                    {saving ? (
                                        <>
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                            Saving...
                                        </>
                                    ) : (
                                        <>
                                            <Save className="h-4 w-4" />
                                            Save Changes
                                        </>
                                    )}
                                </button>
                            </>
                        ) : (
                            <>
                                <button
                                    onClick={handleCopy}
                                    disabled={loading}
                                    className="btn-secondary flex items-center gap-2"
                                >
                                    {copied ? (
                                        <>
                                            <CheckCircle className="h-4 w-4" />
                                            Copied!
                                        </>
                                    ) : (
                                        <>
                                            <Copy className="h-4 w-4" />
                                            Copy
                                        </>
                                    )}
                                </button>
                                <button
                                    onClick={handleDownload}
                                    disabled={loading}
                                    className="btn-secondary flex items-center gap-2"
                                >
                                    <Download className="h-4 w-4" />
                                    Download
                                </button>
                                <button
                                    onClick={() => setIsEditing(true)}
                                    disabled={loading}
                                    className="btn-primary flex items-center gap-2"
                                >
                                    <Edit2 className="h-4 w-4" />
                                    Edit
                                </button>
                            </>
                        )}
                        {!isEditing && (
                            <button
                                onClick={onClose}
                                className="text-gray-400 hover:text-gray-600 transition-colors ml-2"
                            >
                                <X className="h-6 w-6" />
                            </button>
                        )}
                    </div>
                </div>

                {/* Toolbar */}
                <MenuBar />

                {/* Content */}
                <div className="flex-1 overflow-y-auto">
                    {loading ? (
                        <div className="flex items-center justify-center h-full">
                            <Loader2 className="h-8 w-8 text-gray-400 animate-spin" />
                        </div>
                    ) : (
                        <div className="h-full p-6">
                            <EditorContent
                                editor={editor}
                                className={`prose max-w-none h-full ${isEditing
                                        ? "bg-white border border-gray-300 rounded-lg p-4 focus-within:ring-2 focus-within:ring-blue-500"
                                        : "bg-gray-50 rounded-lg p-6"
                                    }`}
                            />
                            {hasChanges && isEditing && (
                                <div className="mt-2 flex items-center gap-2 text-sm">
                                    <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
                                    <span className="text-yellow-700 font-medium">
                                        Unsaved changes
                                    </span>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer */}
                {!loading && editor && (
                    <div className="border-t border-gray-200 p-4 bg-gray-50 flex-shrink-0">
                        <div className="flex items-center justify-between">
                            <p className="text-sm text-gray-500">
                                {editor.getText().length.toLocaleString()} karakter •{" "}
                                {document.total_pages} halaman
                            </p>
                            {isEditing && hasChanges && (
                                <p className="text-sm text-yellow-600 font-medium">
                                    {Math.abs(editor.getText().length - rawText.length)} karakter{" "}
                                    {editor.getText().length > rawText.length
                                        ? "ditambahkan"
                                        : "dihapus"}
                                </p>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}