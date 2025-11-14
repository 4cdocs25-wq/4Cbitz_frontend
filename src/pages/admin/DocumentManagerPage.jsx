import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { foldersAPI, documentsAPI } from '../../api';
import FolderTree from '../../components/folders/FolderTree';
import FolderSelector from '../../components/folders/FolderSelector';

const DocumentManagerPage = () => {
  const navigate = useNavigate();
  const [folders, setFolders] = useState([]);
  const [selectedFolder, setSelectedFolder] = useState(null);
  const [folderPath, setFolderPath] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showRenameModal, setShowRenameModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [modalFolder, setModalFolder] = useState(null);
  const [modalInput, setModalInput] = useState('');
  const [modalError, setModalError] = useState('');

  // Context menu state
  const [contextMenu, setContextMenu] = useState(null);

  // Upload form state
  const [uploadData, setUploadData] = useState({
    title: '',
    description: '',
    file: null,
    folderId: null
  });

  // Memoized fetch functions to prevent infinite loops
  const fetchFolders = useCallback(async () => {
    try {
      const response = await foldersAPI.getTree();
      setFolders(response.data || []);
    } catch (error) {
      console.error('Error fetching folders:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchDocuments = useCallback(async () => {
    try {
      const response = await documentsAPI.getAll(selectedFolder);
      setDocuments(response.data || []);
    } catch (error) {
      console.error('Error fetching documents:', error);
    }
  }, [selectedFolder]);

  const fetchFolderPath = useCallback(async () => {
    if (!selectedFolder) return;
    try {
      const response = await foldersAPI.getPath(selectedFolder);
      setFolderPath(response.data || []);
    } catch (error) {
      console.error('Error fetching folder path:', error);
    }
  }, [selectedFolder]);

  // Fetch folders on mount
  useEffect(() => {
    fetchFolders();
  }, [fetchFolders]);

  // Fetch documents and folder path when selectedFolder changes
  useEffect(() => {
    fetchDocuments();
    if (selectedFolder) {
      fetchFolderPath();
    } else {
      setFolderPath([]);
    }
  }, [selectedFolder, fetchDocuments, fetchFolderPath]);

  // Folder Operations
  const handleCreateFolder = async () => {
    if (!modalInput.trim()) {
      setModalError('Folder name is required');
      return;
    }

    try {
      await foldersAPI.create(modalInput, modalFolder?.id || null);
      setShowCreateModal(false);
      setModalInput('');
      setModalError('');
      setModalFolder(null);
      fetchFolders();
    } catch (error) {
      setModalError(error.response?.data?.message || 'Failed to create folder');
    }
  };

  const handleRenameFolder = async () => {
    if (!modalInput.trim()) {
      setModalError('Folder name is required');
      return;
    }

    try {
      await foldersAPI.update(modalFolder.id, modalInput);
      setShowRenameModal(false);
      setModalInput('');
      setModalError('');
      setModalFolder(null);
      fetchFolders();
    } catch (error) {
      setModalError(error.response?.data?.message || 'Failed to rename folder');
    }
  };

  const handleDeleteFolder = async () => {
    try {
      await foldersAPI.delete(modalFolder.id);
      setShowDeleteModal(false);
      setModalFolder(null);
      if (selectedFolder === modalFolder.id) {
        setSelectedFolder(null);
      }
      fetchFolders();
    } catch (error) {
      setModalError(error.response?.data?.message || 'Failed to delete folder');
    }
  };

  // Context Menu
  const handleContextMenu = (e, folder) => {
    e.preventDefault();
    setContextMenu({
      x: e.pageX,
      y: e.pageY,
      folder
    });
  };

  const closeContextMenu = () => {
    setContextMenu(null);
  };

  useEffect(() => {
    const handleClick = () => closeContextMenu();
    if (contextMenu) {
      document.addEventListener('click', handleClick);
    }
    return () => document.removeEventListener('click', handleClick);
  }, [contextMenu]);

  // Upload Document
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.type !== 'application/pdf') {
        alert('Only PDF files are supported');
        return;
      }
      if (file.size > 500 * 1024 * 1024) {
        alert('File size must be less than 500MB');
        return;
      }
      setUploadData({ ...uploadData, file });
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();

    if (!uploadData.title || !uploadData.file) {
      alert('Title and file are required');
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append('title', uploadData.title);
    formData.append('description', uploadData.description);
    formData.append('file', uploadData.file);
    if (uploadData.folderId) {
      formData.append('folder_id', uploadData.folderId);
    }

    try {
      await documentsAPI.upload(formData);
      setUploadData({ title: '', description: '', file: null, folderId: selectedFolder });
      document.getElementById('file-input').value = '';
      fetchDocuments();
      alert('Document uploaded successfully!');
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to upload document');
    } finally {
      setUploading(false);
    }
  };

  // Delete Document
  const handleDeleteDocument = async (docId) => {
    if (!confirm('Are you sure you want to delete this document?')) return;

    try {
      await documentsAPI.delete(docId);
      fetchDocuments();
      alert('Document deleted successfully!');
    } catch (error) {
      alert('Failed to delete document');
    }
  };

  // View Document (Admin route - no restrictions)
  const handleViewDocument = (docId) => {
    navigate(`/admin/documents/view/${docId}`);
  };

  // Toggle Document Visibility
  const handleToggleVisibility = async (docId) => {
    try {
      await documentsAPI.toggleVisibility(docId);
      fetchDocuments();
    } catch (error) {
      alert('Failed to toggle visibility');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-12 h-12 rounded-full border-4 border-red-200 border-t-red-600 animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Left Panel - Folder Tree */}
      <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Folders</h2>
            <button
              onClick={() => {
                setModalFolder(null);
                setShowCreateModal(true);
              }}
              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              title="New Folder"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          <FolderTree
            folders={folders}
            selectedId={selectedFolder}
            onSelect={(folder) => setSelectedFolder(folder?.id || null)}
            onContextMenu={handleContextMenu}
            readOnly={false}
            showRoot={true}
          />
        </div>
      </div>

      {/* Right Panel - Documents */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-6xl mx-auto p-8">
          {/* Breadcrumb */}
          {folderPath.length > 0 && (
            <nav className="flex items-center space-x-2 text-sm text-gray-600 mb-6">
              <button
                onClick={() => setSelectedFolder(null)}
                className="hover:text-gray-900 transition-colors"
              >
                All Documents
              </button>
              {folderPath.map((folder, index) => (
                <React.Fragment key={folder.id}>
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                  <span className="font-medium text-gray-900">{folder.name}</span>
                </React.Fragment>
              ))}
            </nav>
          )}

          {/* Upload Form */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Upload Document</h3>
            <form onSubmit={handleUpload} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Document Title *
                </label>
                <input
                  type="text"
                  value={uploadData.title}
                  onChange={(e) => setUploadData({ ...uploadData, title: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  placeholder="Enter document title"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <textarea
                  value={uploadData.description}
                  onChange={(e) => setUploadData({ ...uploadData, description: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  placeholder="Add a description"
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Folder</label>
                <FolderSelector
                  folders={folders}
                  value={uploadData.folderId || selectedFolder}
                  onChange={(folderId) => setUploadData({ ...uploadData, folderId })}
                  placeholder="Select folder (optional)"
                  allowRoot={true}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">File (PDF only) *</label>
                <input
                  id="file-input"
                  type="file"
                  accept=".pdf"
                  onChange={handleFileChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  required
                />
                {uploadData.file && (
                  <p className="mt-2 text-sm text-gray-600">Selected: {uploadData.file.name}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={uploading}
                className="w-full bg-red-600 text-white py-3 rounded-lg font-medium hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                {uploading ? 'Uploading...' : 'Upload Document'}
              </button>
            </form>
          </div>

          {/* Documents List */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                Documents {selectedFolder ? 'in this folder' : ''}
              </h3>
              <p className="text-sm text-gray-600 mt-1">{documents.length} document(s)</p>
            </div>

            <div className="divide-y divide-gray-200">
              {documents.length > 0 ? (
                documents.map((doc) => (
                  <div key={doc.id} className="p-6 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="text-base font-medium text-gray-900">{doc.title}</h4>
                          {!doc.is_visible && (
                            <span className="px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-600 rounded-full">
                              Hidden
                            </span>
                          )}
                        </div>
                        {doc.description && (
                          <p className="text-sm text-gray-600 mb-2">{doc.description}</p>
                        )}
                        <p className="text-xs text-gray-500">
                          Uploaded {new Date(doc.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 ml-4">
                        {/* View Button */}
                        <button
                          onClick={() => handleViewDocument(doc.id)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="View Document"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                            />
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                            />
                          </svg>
                        </button>
                        {/* Visibility Toggle Button */}
                        <button
                          onClick={() => handleToggleVisibility(doc.id)}
                          className={`p-2 rounded-lg transition-colors ${
                            doc.is_visible
                              ? 'text-green-600 hover:bg-green-50'
                              : 'text-gray-400 hover:bg-gray-50'
                          }`}
                          title={doc.is_visible ? 'Visible to users (click to hide)' : 'Hidden from users (click to show)'}
                        >
                          {doc.is_visible ? (
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          ) : (
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                            </svg>
                          )}
                        </button>
                        {/* Delete Button */}
                        <button
                          onClick={() => handleDeleteDocument(doc.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                            />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-12 text-center text-gray-500">
                  <svg
                    className="w-16 h-16 mx-auto mb-4 text-gray-300"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                  <p className="text-sm font-medium">No documents yet</p>
                  <p className="text-xs mt-1">Upload your first document to get started</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Context Menu */}
      {contextMenu && (
        <div
          className="fixed bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50"
          style={{ top: contextMenu.y, left: contextMenu.x }}
        >
          <button
            onClick={() => {
              setModalFolder(contextMenu.folder);
              setShowCreateModal(true);
              closeContextMenu();
            }}
            className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New Subfolder
          </button>
          <button
            onClick={() => {
              setModalFolder(contextMenu.folder);
              setModalInput(contextMenu.folder.name);
              setShowRenameModal(true);
              closeContextMenu();
            }}
            className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
              />
            </svg>
            Rename
          </button>
          <button
            onClick={() => {
              setModalFolder(contextMenu.folder);
              setShowDeleteModal(true);
              closeContextMenu();
            }}
            className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
            Delete
          </button>
        </div>
      )}

      {/* Create Folder Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {modalFolder ? `Create Subfolder in "${modalFolder.name}"` : 'Create New Folder'}
            </h3>
            <input
              type="text"
              value={modalInput}
              onChange={(e) => {
                setModalInput(e.target.value);
                setModalError('');
              }}
              placeholder="Folder name"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent mb-2"
              autoFocus
            />
            {modalError && <p className="text-sm text-red-600 mb-4">{modalError}</p>}
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setModalInput('');
                  setModalError('');
                  setModalFolder(null);
                }}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateFolder}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rename Folder Modal */}
      {showRenameModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Rename Folder</h3>
            <input
              type="text"
              value={modalInput}
              onChange={(e) => {
                setModalInput(e.target.value);
                setModalError('');
              }}
              placeholder="Folder name"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent mb-2"
              autoFocus
            />
            {modalError && <p className="text-sm text-red-600 mb-4">{modalError}</p>}
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowRenameModal(false);
                  setModalInput('');
                  setModalError('');
                  setModalFolder(null);
                }}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleRenameFolder}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Rename
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Folder Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              Delete Folder
            </h3>
            <div className="mb-4">
              <p className="text-gray-700 mb-3">
                Are you sure you want to delete "<strong>{modalFolder?.name}</strong>"?
              </p>
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-sm text-red-800 font-medium mb-1">⚠️ Warning: This action cannot be undone</p>
                <p className="text-xs text-red-700">
                  This will permanently delete the folder and <strong>all subfolders and documents</strong> inside it.
                </p>
              </div>
            </div>
            {modalError && <p className="text-sm text-red-600 mb-4">{modalError}</p>}
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setModalError('');
                  setModalFolder(null);
                }}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteFolder}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
              >
                Delete Permanently
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DocumentManagerPage;
