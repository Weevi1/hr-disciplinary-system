// frontend/src/components/admin/DatabaseManagement.tsx
// 🔥 INTEGRATED FIREBASE DATABASE MANAGEMENT PANEL
// ✅ Collection browser, document editor, query builder, user management
// ✅ Professional interface matching SuperUser dashboard design

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  Database, 
  FolderOpen, 
  FileText, 
  Search, 
  Filter,
  Edit3, 
  Trash2, 
  Plus,
  Download,
  Upload,
  Users,
  Settings,
  Code2,
  Eye,
  EyeOff,
  Copy,
  Check,
  AlertTriangle,
  RefreshCw,
  Play,
  Save,
  X,
  ChevronRight,
  ChevronDown,
  MoreVertical,
  Zap,
  Activity,
  Clock,
  TrendingUp,
  UserPlus,
  UserX,
  Mail,
  Shield,
  Calendar,
  CheckCircle,
  XCircle,
  Archive,
  Package,
  FileDown,
  FileUp,
  Layers,
  Target
} from 'lucide-react';
import { 
  collection, 
  getDocs, 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  limit,
  startAfter,
  Query,
  DocumentData,
  QuerySnapshot
} from 'firebase/firestore';
import { 
  getAuth, 
  createUserWithEmailAndPassword, 
  sendPasswordResetEmail,
  updateProfile
} from 'firebase/auth';
import { db, auth } from '../../config/firebase';
import { DataService } from '../../services/DataService';
import Logger from '../../utils/logger';

interface CollectionInfo {
  id: string;
  name: string;
  documentCount: number;
  lastModified: Date | null;
  sampleFields: string[];
}

interface DocumentPreview {
  id: string;
  data: any;
  collection: string;
  lastModified: any;
}

interface QueryFilter {
  field: string;
  operator: string;
  value: any;
}

interface UserInfo {
  uid: string;
  email: string;
  displayName?: string;
  emailVerified: boolean;
  disabled: boolean;
  creationTime: string;
  lastSignInTime?: string;
  photoURL?: string;
  customClaims?: any;
}

interface BulkOperation {
  type: 'delete' | 'update' | 'export';
  selectedItems: string[];
  updateData?: any;
}

export const DatabaseManagement: React.FC = () => {
  // State management
  const [activeTab, setActiveTab] = useState<'collections' | 'documents' | 'query' | 'users' | 'analytics'>('collections');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Collections state
  const [collections, setCollections] = useState<CollectionInfo[]>([]);
  const [selectedCollection, setSelectedCollection] = useState<string | null>(null);
  
  // Documents state
  const [documents, setDocuments] = useState<DocumentPreview[]>([]);
  const [selectedDocument, setSelectedDocument] = useState<DocumentPreview | null>(null);
  const [documentContent, setDocumentContent] = useState<string>('');
  const [isEditing, setIsEditing] = useState(false);
  const [showRawJson, setShowRawJson] = useState(false);
  
  // Query builder state
  const [queryFilters, setQueryFilters] = useState<QueryFilter[]>([]);
  const [queryResults, setQueryResults] = useState<DocumentPreview[]>([]);
  const [queryLoading, setQueryLoading] = useState(false);
  
  // Search and pagination
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(25);
  
  // Copy success state
  const [copied, setCopied] = useState(false);
  
  // User management state
  const [users, setUsers] = useState<UserInfo[]>([]);
  const [selectedUser, setSelectedUser] = useState<UserInfo | null>(null);
  const [showCreateUser, setShowCreateUser] = useState(false);
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newUserDisplayName, setNewUserDisplayName] = useState('');
  
  // Bulk operations state
  const [selectedDocuments, setSelectedDocuments] = useState<string[]>([]);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bulkOperation, setBulkOperation] = useState<BulkOperation | null>(null);
  const [bulkUpdateData, setBulkUpdateData] = useState('');

  // Load collections on mount
  useEffect(() => {
    loadCollections();
  }, []);

  // Load documents when collection changes
  useEffect(() => {
    if (selectedCollection) {
      loadDocuments(selectedCollection);
    }
  }, [selectedCollection]);

  // Load users when users tab is selected
  useEffect(() => {
    if (activeTab === 'users') {
      loadUsers();
    }
  }, [activeTab]);

  const loadCollections = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Get all organization documents to discover collections
      const knownCollections = [
        'organizations', 
        'users', 
        'resellers',
        'warnings', 
        'employees', 
        'warningCategories',
        'absenceReports',
        'hrMeetings',
        'counsellings',
        'commissionReports',
        'auditLogs'
      ];

      const collectionInfos: CollectionInfo[] = [];

      for (const collectionName of knownCollections) {
        try {
          const collectionRef = collection(db, collectionName);
          const snapshot = await getDocs(query(collectionRef, limit(5)));
          
          if (!snapshot.empty) {
            const sampleDoc = snapshot.docs[0];
            const sampleFields = Object.keys(sampleDoc.data()).slice(0, 5);
            
            collectionInfos.push({
              id: collectionName,
              name: collectionName,
              documentCount: snapshot.size,
              lastModified: sampleDoc.data().updatedAt?.toDate() || sampleDoc.data().createdAt?.toDate() || null,
              sampleFields
            });
          } else {
            // Empty collection - still show it
            collectionInfos.push({
              id: collectionName,
              name: collectionName,
              documentCount: 0,
              lastModified: null,
              sampleFields: []
            });
          }
        } catch (err) {
          const errorMessage = err instanceof Error ? err.message : String(err);
          if (errorMessage.includes('Missing or insufficient permissions')) {
            // Collection exists but not accessible - show as restricted
            collectionInfos.push({
              id: collectionName,
              name: collectionName + ' (Empty/Restricted)',
              documentCount: 0,
              lastModified: null,
              sampleFields: ['Access Restricted - Empty Collection']
            });
          } else {
            Logger.warn(`Collection ${collectionName} not accessible:`, err);
          }
        }
      }

      setCollections(collectionInfos.sort((a, b) => b.documentCount - a.documentCount));
      Logger.success(`Loaded ${collectionInfos.length} collections`);
    } catch (err) {
      const errorMsg = `Failed to load collections: ${err instanceof Error ? err.message : 'Unknown error'}`;
      setError(errorMsg);
      Logger.error(errorMsg, err);
    } finally {
      setLoading(false);
    }
  };

  const loadDocuments = async (collectionName: string, pageSize: number = itemsPerPage) => {
    try {
      setLoading(true);
      setError(null);
      
      const collectionRef = collection(db, collectionName);
      const snapshot = await getDocs(query(collectionRef, limit(pageSize)));
      
      const docs: DocumentPreview[] = [];
      snapshot.forEach((doc) => {
        docs.push({
          id: doc.id,
          data: doc.data(),
          collection: collectionName,
          lastModified: doc.data().updatedAt || doc.data().createdAt || null
        });
      });
      
      setDocuments(docs);
      Logger.success(`Loaded ${docs.length} documents from ${collectionName}`);
    } catch (err) {
      const errorMsg = `Failed to load documents: ${err instanceof Error ? err.message : 'Unknown error'}`;
      setError(errorMsg);
      Logger.error(errorMsg, err);
    } finally {
      setLoading(false);
    }
  };

  const loadDocument = async (collectionName: string, documentId: string) => {
    try {
      setLoading(true);
      const docRef = doc(db, collectionName, documentId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const documentData = {
          id: docSnap.id,
          data: docSnap.data(),
          collection: collectionName,
          lastModified: docSnap.data().updatedAt || docSnap.data().createdAt || null
        };
        
        setSelectedDocument(documentData);
        setDocumentContent(JSON.stringify(docSnap.data(), null, 2));
        setIsEditing(false);
      } else {
        setError('Document not found');
      }
    } catch (err) {
      const errorMsg = `Failed to load document: ${err instanceof Error ? err.message : 'Unknown error'}`;
      setError(errorMsg);
      Logger.error(errorMsg, err);
    } finally {
      setLoading(false);
    }
  };

  const saveDocument = async () => {
    if (!selectedDocument) return;
    
    try {
      setLoading(true);
      const parsedData = JSON.parse(documentContent);
      
      // Add update timestamp
      parsedData.updatedAt = new Date();
      
      const docRef = doc(db, selectedDocument.collection, selectedDocument.id);
      await updateDoc(docRef, parsedData);
      
      // Reload the document
      await loadDocument(selectedDocument.collection, selectedDocument.id);
      setIsEditing(false);
      
      Logger.success('Document saved successfully');
    } catch (err) {
      const errorMsg = `Failed to save document: ${err instanceof Error ? err.message : 'Invalid JSON'}`;
      setError(errorMsg);
      Logger.error(errorMsg, err);
    } finally {
      setLoading(false);
    }
  };

  const deleteDocument = async (collectionName: string, documentId: string) => {
    if (!confirm(`Are you sure you want to delete document "${documentId}" from "${collectionName}"?`)) {
      return;
    }
    
    try {
      setLoading(true);
      const docRef = doc(db, collectionName, documentId);
      await deleteDoc(docRef);
      
      // Reload documents
      await loadDocuments(collectionName);
      setSelectedDocument(null);
      
      Logger.success('Document deleted successfully');
    } catch (err) {
      const errorMsg = `Failed to delete document: ${err instanceof Error ? err.message : 'Unknown error'}`;
      setError(errorMsg);
      Logger.error(errorMsg, err);
    } finally {
      setLoading(false);
    }
  };

  const runQuery = async () => {
    if (!selectedCollection || queryFilters.length === 0) return;
    
    try {
      setQueryLoading(true);
      setError(null);
      
      let queryRef = collection(db, selectedCollection) as Query<DocumentData>;
      
      queryFilters.forEach(filter => {
        if (filter.field && filter.operator && filter.value !== '') {
          const value = filter.value === 'true' ? true : filter.value === 'false' ? false : filter.value;
          queryRef = query(queryRef, where(filter.field, filter.operator as any, value));
        }
      });
      
      queryRef = query(queryRef, limit(50));
      
      const snapshot = await getDocs(queryRef);
      const results: DocumentPreview[] = [];
      
      snapshot.forEach((doc) => {
        results.push({
          id: doc.id,
          data: doc.data(),
          collection: selectedCollection,
          lastModified: doc.data().updatedAt || doc.data().createdAt || null
        });
      });
      
      setQueryResults(results);
      Logger.success(`Query returned ${results.length} results`);
    } catch (err) {
      const errorMsg = `Query failed: ${err instanceof Error ? err.message : 'Unknown error'}`;
      setError(errorMsg);
      Logger.error(errorMsg, err);
    } finally {
      setQueryLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const addQueryFilter = () => {
    setQueryFilters([...queryFilters, { field: '', operator: '==', value: '' }]);
  };

  const updateQueryFilter = (index: number, field: keyof QueryFilter, value: any) => {
    const newFilters = [...queryFilters];
    newFilters[index] = { ...newFilters[index], [field]: value };
    setQueryFilters(newFilters);
  };

  const removeQueryFilter = (index: number) => {
    setQueryFilters(queryFilters.filter((_, i) => i !== index));
  };

  // User Management Functions
  const loadUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Load users from the users collection in Firestore
      const usersCollectionRef = collection(db, 'users');
      const snapshot = await getDocs(usersCollectionRef);
      
      const userList: UserInfo[] = [];
      snapshot.forEach((doc) => {
        const userData = doc.data();
        userList.push({
          uid: doc.id,
          email: userData.email || 'No email',
          displayName: userData.displayName || userData.firstName + ' ' + userData.lastName || 'No name',
          emailVerified: userData.emailVerified || false,
          disabled: userData.disabled || false,
          creationTime: userData.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
          lastSignInTime: userData.lastSignIn?.toDate?.()?.toISOString(),
          photoURL: userData.photoURL,
          customClaims: userData.role || {}
        });
      });
      
      setUsers(userList);
      Logger.success(`Loaded ${userList.length} users`);
    } catch (err) {
      const errorMsg = `Failed to load users: ${err instanceof Error ? err.message : 'Unknown error'}`;
      setError(errorMsg);
      Logger.error(errorMsg, err);
    } finally {
      setLoading(false);
    }
  };

  const createUser = async () => {
    if (!newUserEmail || !newUserPassword) {
      setError('Email and password are required');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Create user in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, newUserEmail, newUserPassword);
      
      // Update profile if display name provided
      if (newUserDisplayName) {
        await updateProfile(userCredential.user, {
          displayName: newUserDisplayName
        });
      }

      // Create user document in Firestore
      const userDoc = {
        email: newUserEmail,
        displayName: newUserDisplayName,
        firstName: newUserDisplayName.split(' ')[0] || '',
        lastName: newUserDisplayName.split(' ').slice(1).join(' ') || '',
        role: { id: 'employee', name: 'Employee' },
        createdAt: new Date(),
        emailVerified: false,
        disabled: false
      };

      await setDoc(doc(db, 'users', userCredential.user.uid), userDoc);

      // Reset form
      setNewUserEmail('');
      setNewUserPassword('');
      setNewUserDisplayName('');
      setShowCreateUser(false);

      // Reload users
      await loadUsers();
      
      Logger.success('User created successfully');
    } catch (err) {
      const errorMsg = `Failed to create user: ${err instanceof Error ? err.message : 'Unknown error'}`;
      setError(errorMsg);
      Logger.error(errorMsg, err);
    } finally {
      setLoading(false);
    }
  };

  const resetUserPassword = async (email: string) => {
    try {
      setLoading(true);
      await sendPasswordResetEmail(auth, email);
      Logger.success(`Password reset email sent to ${email}`);
    } catch (err) {
      const errorMsg = `Failed to send password reset: ${err instanceof Error ? err.message : 'Unknown error'}`;
      setError(errorMsg);
      Logger.error(errorMsg, err);
    } finally {
      setLoading(false);
    }
  };

  const disableUser = async (uid: string) => {
    try {
      setLoading(true);
      const userRef = doc(db, 'users', uid);
      await updateDoc(userRef, { disabled: true });
      await loadUsers();
      Logger.success('User disabled successfully');
    } catch (err) {
      const errorMsg = `Failed to disable user: ${err instanceof Error ? err.message : 'Unknown error'}`;
      setError(errorMsg);
      Logger.error(errorMsg, err);
    } finally {
      setLoading(false);
    }
  };

  // Bulk Operations Functions
  const toggleDocumentSelection = (documentId: string) => {
    setSelectedDocuments(prev => 
      prev.includes(documentId)
        ? prev.filter(id => id !== documentId)
        : [...prev, documentId]
    );
  };

  const selectAllDocuments = () => {
    const allIds = filteredDocuments.map(doc => doc.id);
    setSelectedDocuments(allIds);
  };

  const clearSelection = () => {
    setSelectedDocuments([]);
  };

  const exportDocuments = async (format: 'json' | 'csv' = 'json') => {
    if (!selectedCollection || selectedDocuments.length === 0) return;

    try {
      setLoading(true);
      const docsToExport = documents.filter(doc => selectedDocuments.includes(doc.id));
      
      if (format === 'json') {
        const jsonData = JSON.stringify(docsToExport.map(doc => ({ id: doc.id, ...doc.data })), null, 2);
        const blob = new Blob([jsonData], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${selectedCollection}_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } else if (format === 'csv') {
        // Convert to CSV
        if (docsToExport.length > 0) {
          const headers = ['id', ...Object.keys(docsToExport[0].data)];
          const csvContent = [
            headers.join(','),
            ...docsToExport.map(doc => 
              headers.map(header => 
                header === 'id' ? doc.id : JSON.stringify(doc.data[header] || '')
              ).join(',')
            )
          ].join('\n');
          
          const blob = new Blob([csvContent], { type: 'text/csv' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `${selectedCollection}_${new Date().toISOString().split('T')[0]}.csv`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
        }
      }

      Logger.success(`Exported ${selectedDocuments.length} documents as ${format.toUpperCase()}`);
      clearSelection();
    } catch (err) {
      const errorMsg = `Export failed: ${err instanceof Error ? err.message : 'Unknown error'}`;
      setError(errorMsg);
      Logger.error(errorMsg, err);
    } finally {
      setLoading(false);
    }
  };

  const bulkUpdateDocuments = async () => {
    if (!selectedCollection || selectedDocuments.length === 0 || !bulkUpdateData.trim()) return;

    try {
      setLoading(true);
      const updateData = JSON.parse(bulkUpdateData);
      
      // Add timestamp
      updateData.updatedAt = new Date();

      // Update all selected documents
      const updatePromises = selectedDocuments.map(docId => 
        updateDoc(doc(db, selectedCollection, docId), updateData)
      );

      await Promise.all(updatePromises);
      
      // Reload documents
      await loadDocuments(selectedCollection);
      
      Logger.success(`Bulk updated ${selectedDocuments.length} documents`);
      clearSelection();
      setShowBulkModal(false);
      setBulkUpdateData('');
    } catch (err) {
      const errorMsg = `Bulk update failed: ${err instanceof Error ? err.message : 'Invalid JSON or update error'}`;
      setError(errorMsg);
      Logger.error(errorMsg, err);
    } finally {
      setLoading(false);
    }
  };

  const bulkDeleteDocuments = async () => {
    if (!selectedCollection || selectedDocuments.length === 0) return;
    
    const confirmed = confirm(`Are you sure you want to delete ${selectedDocuments.length} documents? This cannot be undone.`);
    if (!confirmed) return;

    try {
      setLoading(true);
      
      // Delete all selected documents
      const deletePromises = selectedDocuments.map(docId => 
        deleteDoc(doc(db, selectedCollection, docId))
      );

      await Promise.all(deletePromises);
      
      // Reload documents
      await loadDocuments(selectedCollection);
      
      Logger.success(`Deleted ${selectedDocuments.length} documents`);
      clearSelection();
    } catch (err) {
      const errorMsg = `Bulk delete failed: ${err instanceof Error ? err.message : 'Unknown error'}`;
      setError(errorMsg);
      Logger.error(errorMsg, err);
    } finally {
      setLoading(false);
    }
  };

  // Filter documents based on search
  const filteredDocuments = useMemo(() => {
    return documents.filter(doc => {
      if (!searchTerm) return true;
      const searchStr = searchTerm.toLowerCase();
      return doc.id.toLowerCase().includes(searchStr) || 
             JSON.stringify(doc.data).toLowerCase().includes(searchStr);
    });
  }, [documents, searchTerm]);

  const tabs = [
    { id: 'collections', label: 'Collections', icon: FolderOpen },
    { id: 'documents', label: 'Documents', icon: FileText },
    { id: 'query', label: 'Query Builder', icon: Code2 },
    { id: 'users', label: 'Users', icon: Users },
    { id: 'analytics', label: 'Analytics', icon: TrendingUp }
  ];

  return (
    <div className="h-full bg-white">
      {/* Header */}
      <div className="border-b border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100">
        <div className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl">
                <Database className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Database Management</h2>
                <p className="text-gray-600">Manage Firebase collections, documents, and users</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <button
                onClick={() => loadCollections()}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="px-6">
          <nav className="flex space-x-8">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 py-3 px-1 border-b-2 text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mx-6 mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center gap-2 text-red-700">
            <AlertTriangle className="w-4 h-4" />
            <span className="font-medium">{error}</span>
            <button onClick={() => setError(null)} className="ml-auto">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Tab Content */}
      <div className="flex-1 p-6">
        {activeTab === 'collections' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Collections Overview</h3>
              <div className="text-sm text-gray-600">
                {collections.length} collections found
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {collections.map(collection => (
                <div 
                  key={collection.id}
                  className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => {
                    setSelectedCollection(collection.id);
                    setActiveTab('documents');
                  }}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <FolderOpen className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900">{collection.name}</h4>
                        <p className="text-sm text-gray-600">{collection.documentCount} documents</p>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                  </div>
                  
                  <div className="space-y-2">
                    <div className="text-xs text-gray-500">Sample fields:</div>
                    <div className="flex flex-wrap gap-1">
                      {collection.sampleFields.map(field => (
                        <span key={field} className="px-2 py-1 bg-gray-100 rounded text-xs text-gray-700">
                          {field}
                        </span>
                      ))}
                    </div>
                  </div>
                  
                  {collection.lastModified && (
                    <div className="mt-4 text-xs text-gray-500 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      Last modified: {collection.lastModified.toLocaleDateString()}
                    </div>
                  )}
                </div>
              ))}
            </div>
            
            {collections.length === 0 && !loading && (
              <div className="text-center py-12">
                <Database className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No collections found</h3>
                <p className="text-gray-600">Check your Firebase permissions or create some data first.</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'documents' && (
          <div className="space-y-6">
            {/* Collection Selector */}
            <div className="flex items-center gap-4">
              <select
                value={selectedCollection || ''}
                onChange={(e) => setSelectedCollection(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Select a collection...</option>
                {collections.map(collection => (
                  <option key={collection.id} value={collection.id}>
                    {collection.name} ({collection.documentCount} docs)
                  </option>
                ))}
              </select>
              
              {selectedCollection && (
                <div className="flex items-center gap-2">
                  <Search className="w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search documents..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              )}
            </div>

            {selectedCollection && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Document List */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold text-gray-900">
                      Documents in {selectedCollection} ({filteredDocuments.length})
                    </h4>
                    {/* Bulk Operations Toolbar */}
                    <div className="flex items-center gap-2">
                      {selectedDocuments.length > 0 && (
                        <>
                          <span className="text-sm text-gray-600">
                            {selectedDocuments.length} selected
                          </span>
                          <button
                            onClick={() => exportDocuments('json')}
                            className="flex items-center gap-1 px-2 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50"
                          >
                            <FileDown className="w-3 h-3" />
                            JSON
                          </button>
                          <button
                            onClick={() => exportDocuments('csv')}
                            className="flex items-center gap-1 px-2 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50"
                          >
                            <FileDown className="w-3 h-3" />
                            CSV
                          </button>
                          <button
                            onClick={() => setShowBulkModal(true)}
                            className="flex items-center gap-1 px-2 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50"
                          >
                            <Edit3 className="w-3 h-3" />
                            Update
                          </button>
                          <button
                            onClick={bulkDeleteDocuments}
                            className="flex items-center gap-1 px-2 py-1 text-sm text-red-600 border border-red-200 rounded hover:bg-red-50"
                          >
                            <Trash2 className="w-3 h-3" />
                            Delete
                          </button>
                          <button
                            onClick={clearSelection}
                            className="p-1 text-gray-600 hover:bg-gray-100 rounded"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </>
                      )}
                      <button
                        onClick={selectAllDocuments}
                        className="flex items-center gap-1 px-2 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50"
                      >
                        <CheckCircle className="w-3 h-3" />
                        All
                      </button>
                    </div>
                  </div>
                  
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {filteredDocuments.map(document => (
                      <div
                        key={document.id}
                        className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                          selectedDocument?.id === document.id
                            ? 'border-blue-500 bg-blue-50'
                            : selectedDocuments.includes(document.id)
                            ? 'border-green-300 bg-green-50'
                            : 'border-gray-200 hover:bg-gray-50'
                        }`}
                        onClick={() => loadDocument(selectedCollection, document.id)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={selectedDocuments.includes(document.id)}
                              onChange={(e) => {
                                e.stopPropagation();
                                toggleDocumentSelection(document.id);
                              }}
                              className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                            />
                            <FileText className="w-4 h-4 text-gray-400" />
                            <span className="font-medium text-gray-900">{document.id}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteDocument(selectedCollection, document.id);
                              }}
                              className="p-1 text-red-600 hover:bg-red-100 rounded"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                            <MoreVertical className="w-4 h-4 text-gray-400" />
                          </div>
                        </div>
                        
                        {document.lastModified && (
                          <div className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {new Date(document.lastModified.seconds * 1000).toLocaleString()}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Document Editor */}
                <div className="space-y-4">
                  {selectedDocument && (
                    <>
                      <div className="flex items-center justify-between">
                        <h4 className="font-semibold text-gray-900">
                          Document: {selectedDocument.id}
                        </h4>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setShowRawJson(!showRawJson)}
                            className="flex items-center gap-1 px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50"
                          >
                            {showRawJson ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                            {showRawJson ? 'Pretty' : 'Raw'}
                          </button>
                          <button
                            onClick={() => copyToClipboard(documentContent)}
                            className="flex items-center gap-1 px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50"
                          >
                            {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                            {copied ? 'Copied' : 'Copy'}
                          </button>
                          {isEditing ? (
                            <div className="flex gap-2">
                              <button
                                onClick={saveDocument}
                                disabled={loading}
                                className="flex items-center gap-1 px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
                              >
                                <Save className="w-3 h-3" />
                                Save
                              </button>
                              <button
                                onClick={() => {
                                  setIsEditing(false);
                                  setDocumentContent(JSON.stringify(selectedDocument.data, null, 2));
                                }}
                                className="flex items-center gap-1 px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50"
                              >
                                <X className="w-3 h-3" />
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setIsEditing(true)}
                              className="flex items-center gap-1 px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50"
                            >
                              <Edit3 className="w-3 h-3" />
                              Edit
                            </button>
                          )}
                        </div>
                      </div>
                      
                      <textarea
                        value={documentContent}
                        onChange={(e) => setDocumentContent(e.target.value)}
                        readOnly={!isEditing}
                        className={`w-full h-96 p-4 border border-gray-300 rounded-lg font-mono text-sm ${
                          isEditing ? 'focus:ring-2 focus:ring-blue-500' : 'bg-gray-50'
                        }`}
                        style={{ fontFamily: 'Monaco, Consolas, monospace' }}
                      />
                    </>
                  )}
                  
                  {!selectedDocument && selectedCollection && (
                    <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-lg">
                      <FileText className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                      <p className="text-gray-600">Select a document to view and edit</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {!selectedCollection && (
              <div className="text-center py-12">
                <FolderOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Select a collection</h3>
                <p className="text-gray-600">Choose a collection from the dropdown to view its documents.</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'query' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Query Builder</h3>
              <button
                onClick={addQueryFilter}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <Plus className="w-4 h-4" />
                Add Filter
              </button>
            </div>

            {/* Collection Selector for Query */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Collection</label>
              <select
                value={selectedCollection || ''}
                onChange={(e) => setSelectedCollection(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Select a collection...</option>
                {collections.map(collection => (
                  <option key={collection.id} value={collection.id}>
                    {collection.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Query Filters */}
            <div className="space-y-4">
              <h4 className="font-medium text-gray-900">Filters</h4>
              {queryFilters.map((filter, index) => (
                <div key={index} className="flex items-center gap-4 p-4 border border-gray-200 rounded-lg">
                  <input
                    type="text"
                    placeholder="Field name"
                    value={filter.field}
                    onChange={(e) => updateQueryFilter(index, 'field', e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                  />
                  <select
                    value={filter.operator}
                    onChange={(e) => updateQueryFilter(index, 'operator', e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="==">=</option>
                    <option value="!=">!=</option>
                    <option value="<">&lt;</option>
                    <option value="<=">&lt;=</option>
                    <option value=">">&gt;</option>
                    <option value=">=">&gt;=</option>
                    <option value="array-contains">array-contains</option>
                    <option value="in">in</option>
                    <option value="not-in">not-in</option>
                  </select>
                  <input
                    type="text"
                    placeholder="Value"
                    value={filter.value}
                    onChange={(e) => updateQueryFilter(index, 'value', e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    onClick={() => removeQueryFilter(index)}
                    className="p-2 text-red-600 hover:bg-red-100 rounded"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>

            {/* Run Query Button */}
            {queryFilters.length > 0 && selectedCollection && (
              <button
                onClick={runQuery}
                disabled={queryLoading}
                className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
                {queryLoading ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Play className="w-4 h-4" />
                )}
                {queryLoading ? 'Running...' : 'Run Query'}
              </button>
            )}

            {/* Query Results */}
            {queryResults.length > 0 && (
              <div className="space-y-4">
                <h4 className="font-medium text-gray-900">
                  Query Results ({queryResults.length} documents)
                </h4>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {queryResults.map(result => (
                    <div
                      key={result.id}
                      className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
                      onClick={() => {
                        setSelectedDocument(result);
                        setDocumentContent(JSON.stringify(result.data, null, 2));
                        setActiveTab('documents');
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-gray-900">{result.id}</span>
                        <ChevronRight className="w-4 h-4 text-gray-400" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'users' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">User Management</h3>
              <button
                onClick={() => setShowCreateUser(true)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <UserPlus className="w-4 h-4" />
                Create User
              </button>
            </div>

            {/* Users List */}
            <div className="grid grid-cols-1 gap-4">
              {users.map(user => (
                <div
                  key={user.uid}
                  className="p-4 border border-gray-200 rounded-lg hover:shadow-sm transition-shadow"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                        {user.photoURL ? (
                          <img src={user.photoURL} alt="" className="w-10 h-10 rounded-full" />
                        ) : (
                          <span className="text-gray-600 font-medium">
                            {user.displayName?.charAt(0) || user.email.charAt(0).toUpperCase()}
                          </span>
                        )}
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">
                          {user.displayName || 'No display name'}
                        </div>
                        <div className="text-sm text-gray-600">{user.email}</div>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`px-2 py-1 rounded text-xs ${
                            user.emailVerified ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                          }`}>
                            {user.emailVerified ? 'Verified' : 'Unverified'}
                          </span>
                          <span className={`px-2 py-1 rounded text-xs ${
                            user.disabled ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                          }`}>
                            {user.disabled ? 'Disabled' : 'Active'}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => resetUserPassword(user.email)}
                        className="flex items-center gap-1 px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50"
                      >
                        <Mail className="w-3 h-3" />
                        Reset Password
                      </button>
                      {!user.disabled && (
                        <button
                          onClick={() => disableUser(user.uid)}
                          className="flex items-center gap-1 px-3 py-1 text-sm text-red-600 border border-red-200 rounded hover:bg-red-50"
                        >
                          <UserX className="w-3 h-3" />
                          Disable
                        </button>
                      )}
                    </div>
                  </div>
                  
                  <div className="mt-3 text-xs text-gray-500 flex items-center gap-4">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      Created: {new Date(user.creationTime).toLocaleDateString()}
                    </div>
                    {user.lastSignInTime && (
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        Last sign in: {new Date(user.lastSignInTime).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {users.length === 0 && !loading && (
              <div className="text-center py-12">
                <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No users found</h3>
                <p className="text-gray-600">Create your first user to get started.</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className="text-center py-12">
            <Activity className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Database Analytics</h3>
            <p className="text-gray-600 mb-4">Database usage statistics and performance metrics</p>
            <p className="text-sm text-gray-500">Coming soon - collection sizes, query performance, and usage patterns</p>
          </div>
        )}
      </div>

      {/* Create User Modal */}
      {showCreateUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Create New User</h3>
              <button
                onClick={() => setShowCreateUser(false)}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={newUserEmail}
                  onChange={(e) => setNewUserEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="user@example.com"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                <input
                  type="password"
                  value={newUserPassword}
                  onChange={(e) => setNewUserPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Min 6 characters"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Display Name</label>
                <input
                  type="text"
                  value={newUserDisplayName}
                  onChange={(e) => setNewUserDisplayName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="John Doe"
                />
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              <button
                onClick={createUser}
                disabled={loading || !newUserEmail || !newUserPassword}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
                Create User
              </button>
              <button
                onClick={() => setShowCreateUser(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Update Modal */}
      {showBulkModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Bulk Update Documents</h3>
              <button
                onClick={() => setShowBulkModal(false)}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-2">
                Updating {selectedDocuments.length} documents in {selectedCollection}
              </p>
              <p className="text-xs text-gray-500">
                Enter JSON object with fields to update. Example: {`{"status": "active", "priority": 1}`}
              </p>
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Update Data (JSON)</label>
              <textarea
                value={bulkUpdateData}
                onChange={(e) => setBulkUpdateData(e.target.value)}
                className="w-full h-32 p-3 border border-gray-300 rounded-lg font-mono text-sm focus:ring-2 focus:ring-blue-500"
                placeholder='{"field1": "value1", "field2": "value2"}'
              />
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={bulkUpdateDocuments}
                disabled={loading || !bulkUpdateData.trim()}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Update Documents
              </button>
              <button
                onClick={() => setShowBulkModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {loading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 flex items-center gap-3">
            <RefreshCw className="w-5 h-5 animate-spin text-blue-600" />
            <span>Loading...</span>
          </div>
        </div>
      )}
    </div>
  );
};