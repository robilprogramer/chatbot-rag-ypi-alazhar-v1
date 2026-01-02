// lib/store.ts
import { create } from 'zustand';
import { Document, ParsedContent, KnowledgeEntry, Statistics } from './api';

interface AppState {
  // Documents
  documents: Document[];
  selectedDocument: Document | null;
  setDocuments: (docs: Document[]) => void;
  setSelectedDocument: (doc: Document | null) => void;
  
  // Staging
  stagedContents: ParsedContent[];
  selectedContent: ParsedContent | null;
  setStagedContents: (contents: ParsedContent[]) => void;
  setSelectedContent: (content: ParsedContent | null) => void;
  updateStagedContent: (id: string, updates: Partial<ParsedContent>) => void;
  
  // Knowledge
  knowledgeEntries: KnowledgeEntry[];
  setKnowledgeEntries: (entries: KnowledgeEntry[]) => void;
  
  // Statistics
  statistics: Statistics | null;
  setStatistics: (stats: Statistics) => void;
  
  // UI State
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  
  // Current Step in Pipeline
  currentStep: 'upload' | 'staging' | 'process' | 'complete';
  setCurrentStep: (step: 'upload' | 'staging' | 'process' | 'complete') => void;
}

export const useStore = create<AppState>((set) => ({
  // Documents
  documents: [],
  selectedDocument: null,
  setDocuments: (docs) => set({ documents: docs }),
  setSelectedDocument: (doc) => set({ selectedDocument: doc }),
  
  // Staging
  stagedContents: [],
  selectedContent: null,
  setStagedContents: (contents) => set({ stagedContents: contents }),
  setSelectedContent: (content) => set({ selectedContent: content }),
  updateStagedContent: (id, updates) => set((state) => ({
    stagedContents: state.stagedContents.map((c) =>
      c.id === id ? { ...c, ...updates } : c
    ),
    selectedContent: state.selectedContent?.id === id
      ? { ...state.selectedContent, ...updates }
      : state.selectedContent,
  })),
  
  // Knowledge
  knowledgeEntries: [],
  setKnowledgeEntries: (entries) => set({ knowledgeEntries: entries }),
  
  // Statistics
  statistics: null,
  setStatistics: (stats) => set({ statistics: stats }),
  
  // UI State
  isLoading: false,
  setIsLoading: (loading) => set({ isLoading: loading }),
  
  // Current Step
  currentStep: 'upload',
  setCurrentStep: (step) => set({ currentStep: step }),
}));
