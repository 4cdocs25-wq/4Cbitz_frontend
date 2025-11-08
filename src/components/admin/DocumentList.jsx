import React from 'react'
import { documentsAPI } from '../../api'

const DocumentList = ({ documents, onDocumentDeleted, isAdmin = false }) => {
  const handleDelete = async (document) => {
    if (!window.confirm('Are you sure you want to delete this document?')) return

    try {
      // Delete document through backend API (handles both storage and database)
      const response = await documentsAPI.delete(document.id)

      if (response.success) {
        onDocumentDeleted(document.id)
        alert('Document deleted successfully!')
      } else {
        throw new Error(response.message || 'Delete failed')
      }
    } catch (error) {
      console.error('Error deleting document:', error)
      alert('Error deleting document: ' + error.message)
    }
  }

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const handleViewDocument = (document) => {
    window.open(document.file_url, '_blank')
  }

  if (documents.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No documents found
      </div>
    )
  }

  return (
    <div className="bg-white shadow rounded-lg overflow-hidden">
      <ul className="divide-y divide-gray-200">
        {documents.map((document) => (
          <li key={document.id} className="p-4 hover:bg-gray-50">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <h4 className="text-lg font-medium text-gray-900">{document.title}</h4>
                {document.description && (
                  <p className="text-sm text-gray-600 mt-1">{document.description}</p>
                )}
                <div className="flex items-center mt-2 space-x-4 text-sm text-gray-500">
                  <span>{document.file_name}</span>
                  <span>{formatFileSize(document.file_size)}</span>
                  <span>{new Date(document.created_at).toLocaleDateString()}</span>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handleViewDocument(document)}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium"
                >
                  View
                </button>
                {isAdmin && (
                  <button
                    onClick={() => handleDelete(document)}
                    className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-md text-sm font-medium"
                  >
                    Delete
                  </button>
                )}
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}

export default DocumentList