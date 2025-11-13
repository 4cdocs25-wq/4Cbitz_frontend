import React, { useState } from 'react';

const FolderTreeItem = ({ folder, selectedId, onSelect, onContextMenu, readOnly, level = 0 }) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const hasChildren = folder.children && folder.children.length > 0;
  const isSelected = selectedId === folder.id;

  const handleToggle = (e) => {
    e.stopPropagation();
    setIsExpanded(!isExpanded);
  };

  const handleSelect = () => {
    if (onSelect) {
      onSelect(folder);
    }
  };

  const handleRightClick = (e) => {
    if (!readOnly && onContextMenu) {
      e.preventDefault();
      onContextMenu(e, folder);
    }
  };

  return (
    <div className="select-none">
      <div
        className={`flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-colors ${
          isSelected
            ? 'bg-red-50 text-red-700 font-medium'
            : 'hover:bg-gray-100 text-gray-700'
        }`}
        style={{ paddingLeft: `${level * 20 + 12}px` }}
        onClick={handleSelect}
        onContextMenu={handleRightClick}
      >
        {/* Expand/Collapse Icon */}
        {hasChildren ? (
          <button
            onClick={handleToggle}
            className="flex items-center justify-center w-4 h-4 hover:bg-gray-200 rounded transition-colors"
          >
            <svg
              className={`w-3 h-3 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        ) : (
          <div className="w-4"></div>
        )}

        {/* Folder Icon */}
        <svg
          className={`w-5 h-5 flex-shrink-0 ${isSelected ? 'text-red-600' : 'text-gray-500'}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          {isExpanded && hasChildren ? (
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 19a2 2 0 01-2-2V7a2 2 0 012-2h4l2 2h4a2 2 0 012 2v1M5 19h14a2 2 0 002-2v-5a2 2 0 00-2-2H9a2 2 0 00-2 2v5a2 2 0 01-2 2z"
            />
          ) : (
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
            />
          )}
        </svg>

        {/* Folder Name */}
        <span className="flex-1 truncate text-sm">{folder.name}</span>

        {/* Document Count Badge (optional) */}
        {folder.documentCount !== undefined && folder.documentCount > 0 && (
          <span className="text-xs px-2 py-0.5 bg-gray-200 text-gray-600 rounded-full">
            {folder.documentCount}
          </span>
        )}
      </div>

      {/* Render children recursively */}
      {hasChildren && isExpanded && (
        <div className="mt-1">
          {folder.children.map((child) => (
            <FolderTreeItem
              key={child.id}
              folder={child}
              selectedId={selectedId}
              onSelect={onSelect}
              onContextMenu={onContextMenu}
              readOnly={readOnly}
              level={level + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
};

const FolderTree = ({ folders, selectedId, onSelect, onContextMenu, readOnly = false, showRoot = true }) => {
  if (!folders || folders.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <svg className="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1}
            d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
          />
        </svg>
        <p className="text-sm font-medium">No folders yet</p>
        {!readOnly && <p className="text-xs mt-1">Create your first folder to get started</p>}
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {/* Optional "All Documents" / Root option */}
      {showRoot && (
        <div
          className={`flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-colors ${
            selectedId === null
              ? 'bg-red-50 text-red-700 font-medium'
              : 'hover:bg-gray-100 text-gray-700'
          }`}
          onClick={() => onSelect && onSelect(null)}
        >
          <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
            />
          </svg>
          <span className="flex-1 text-sm">All Documents</span>
        </div>
      )}

      {/* Render folder tree */}
      {folders.map((folder) => (
        <FolderTreeItem
          key={folder.id}
          folder={folder}
          selectedId={selectedId}
          onSelect={onSelect}
          onContextMenu={onContextMenu}
          readOnly={readOnly}
          level={0}
        />
      ))}
    </div>
  );
};

export default FolderTree;
