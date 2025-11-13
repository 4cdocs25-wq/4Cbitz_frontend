import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { documentsAPI } from '../../api';
import { useAuth } from '../../contexts/AuthContext';

const AdminDocumentViewer = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [document, setDocument] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDocument = async () => {
      try {
        if (!user) {
          setError('Please log in to view documents.');
          setLoading(false);
          return;
        }

        const response = await documentsAPI.getById(id);

        if (!response.success || !response.data) {
          setError('Document not found or access denied.');
          setLoading(false);
          return;
        }

        const docData = response.data;

        if (!docData.file_url) {
          setError('Document file is not available.');
          setLoading(false);
          return;
        }

        setDocument(docData);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching document:', error);
        setError(`Failed to load document: ${error.message}`);
        setLoading(false);
      }
    };

    fetchDocument();
  }, [id, user]);

  const handleBack = () => {
    navigate('/admin/documents');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading document...</p>
        </div>
      </div>
    );
  }

  if (error || !document) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md">
          <svg
            className="w-16 h-16 text-red-400 mx-auto mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
            />
          </svg>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Document Not Found</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={handleBack}
            className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
          >
            Back to Document Manager
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center min-w-0 flex-1">
              <button
                onClick={handleBack}
                className="flex items-center text-gray-700 hover:text-gray-900 mr-6 transition-colors"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                <span className="font-medium">Back</span>
              </button>

              <div className="flex items-center min-w-0">
                <svg className="w-6 h-6 text-red-600 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                <h1 className="text-xl font-semibold text-gray-900 truncate">{document.title}</h1>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                Admin View
              </span>
              <span className="text-sm text-gray-500">No Restrictions</span>
            </div>
          </div>
        </div>
      </div>

      {/* PDF Viewer */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        {document.description && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-4">
            <h3 className="text-sm font-medium text-gray-700 mb-1">Description</h3>
            <p className="text-sm text-gray-600">{document.description}</p>
          </div>
        )}

        <div className="bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
          <iframe
            src={document.file_url}
            className="w-full"
            style={{ height: 'calc(100vh - 200px)', minHeight: '600px' }}
            title={document.title}
          />
        </div>

        <div className="mt-4 text-center text-sm text-gray-500">
          <p>Admin preview - Full access with no restrictions</p>
          <p className="text-xs mt-1">
            Uploaded on {new Date(document.created_at).toLocaleDateString()}
          </p>
        </div>
      </div>
    </div>
  );
};

export default AdminDocumentViewer;
