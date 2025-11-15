import React, { useState, useEffect } from 'react';
import { documentsAPI } from '../../api';
import DocumentUpload from '../../components/admin/DocumentUpload';
import DocumentList from '../../components/admin/DocumentList';

const UploadDocumentsPage = () => {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      const response = await documentsAPI.getAll();

      if (response.success && response.data) {
        setDocuments(response.data);
      } else {
        throw new Error(response.message || 'Failed to fetch documents');
      }
    } catch (error) {
      console.error('Error fetching documents:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDocumentUploaded = (newDocument) => {
    setDocuments([newDocument, ...documents]);
  };

  const handleDocumentDeleted = (documentId) => {
    setDocuments(documents.filter(doc => doc.id !== documentId));
  };

  return (
    <div className="p-8 overflow-y-auto h-screen">
        <div className="max-w-6xl mx-auto">
          {/* Page Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Upload Documents</h1>
            <p className="mt-2 text-gray-600">Upload and manage your platform documents</p>
          </div>

          {/* Upload Section */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden mb-8">
            <div className="bg-gradient-to-r from-red-500 to-red-600 px-6 py-4">
              <h2 className="text-xl font-semibold text-white flex items-center">
                <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                Upload New Document
              </h2>
              <p className="mt-1 text-red-100 text-sm">
                Upload documents for secure viewing by users
              </p>
            </div>
            <div className="p-6">
              <DocumentUpload onDocumentUploaded={handleDocumentUploaded} />
            </div>
          </div>

          {/* Documents List Section */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="bg-gray-800 px-6 py-4">
              <h2 className="text-xl font-semibold text-white flex items-center">
                <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
                Document Library
              </h2>
              <p className="mt-1 text-gray-300 text-sm">
                Manage all uploaded documents and monitor access
              </p>
            </div>
            <div className="p-6">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="relative">
                    <div className="w-12 h-12 rounded-full border-4 border-red-200 border-t-red-600 animate-spin"></div>
                    <div className="mt-4 text-center">
                      <p className="text-gray-600 font-medium">Loading documents...</p>
                    </div>
                  </div>
                </div>
              ) : documents.length === 0 ? (
                <div className="text-center py-12">
                  <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No documents yet</h3>
                  <p className="text-gray-500 mb-6">Get started by uploading your first document above.</p>
                </div>
              ) : (
                <DocumentList
                  documents={documents}
                  onDocumentDeleted={handleDocumentDeleted}
                  isAdmin={true}
                />
              )}
            </div>
          </div>
        </div>
      </div>
  );
};

export default UploadDocumentsPage;
