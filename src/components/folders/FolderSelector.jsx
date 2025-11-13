import React, { useState, useEffect, useRef } from 'react';

const FolderSelectorItem = ({ folder, level = 0, onSelect, selectedId }) => {
  const isSelected = selectedId === folder.id;

  return (
    <>
      <div
        className={`px-3 py-2 cursor-pointer transition-colors ${
          isSelected ? 'bg-red-50 text-red-700' : 'hover:bg-gray-100'
        }`}
        style={{ paddingLeft: `${level * 20 + 12}px` }}
        onClick={() => onSelect(folder)}
      >
        <div className="flex items-center gap-2">
          <svg className="w-4 h-4 text-gray-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
            />
          </svg>
          <span className="text-sm truncate">{folder.name}</span>
        </div>
      </div>

      {/* Render children */}
      {folder.children &&
        folder.children.map((child) => (
          <FolderSelectorItem
            key={child.id}
            folder={child}
            level={level + 1}
            onSelect={onSelect}
            selectedId={selectedId}
          />
        ))}
    </>
  );
};

const FolderSelector = ({
  folders,
  value,
  onChange,
  placeholder = 'Select folder...',
  allowRoot = true,
  error
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef(null);

  // Find selected folder for display
  const findFolder = (folders, id) => {
    for (const folder of folders) {
      if (folder.id === id) return folder;
      if (folder.children) {
        const found = findFolder(folder.children, id);
        if (found) return found;
      }
    }
    return null;
  };

  const selectedFolder = value ? findFolder(folders, value) : null;

  // Get folder path for breadcrumb display
  const getFolderPath = (folders, id, path = []) => {
    for (const folder of folders) {
      if (folder.id === id) {
        return [...path, folder.name];
      }
      if (folder.children) {
        const result = getFolderPath(folder.children, id, [...path, folder.name]);
        if (result) return result;
      }
    }
    return null;
  };

  const folderPath = value ? getFolderPath(folders, value) : null;

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
        setSearchQuery('');
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleSelect = (folder) => {
    onChange(folder ? folder.id : null);
    setIsOpen(false);
    setSearchQuery('');
  };

  // Filter folders by search query
  const filterFolders = (folders, query) => {
    if (!query) return folders;

    const filtered = [];
    for (const folder of folders) {
      const matchesQuery = folder.name.toLowerCase().includes(query.toLowerCase());
      const filteredChildren = folder.children ? filterFolders(folder.children, query) : [];

      if (matchesQuery || filteredChildren.length > 0) {
        filtered.push({
          ...folder,
          children: filteredChildren
        });
      }
    }
    return filtered;
  };

  const filteredFolders = searchQuery ? filterFolders(folders, searchQuery) : folders;

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Selector Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between px-4 py-2.5 bg-white border rounded-lg text-left transition-colors ${
          error
            ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
            : 'border-gray-300 hover:border-gray-400 focus:ring-red-500 focus:border-red-500'
        }`}
      >
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {value ? (
            <>
              <svg className="w-5 h-5 text-gray-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
                />
              </svg>
              <span className="text-sm text-gray-900 truncate">
                {folderPath ? folderPath.join(' / ') : selectedFolder?.name}
              </span>
            </>
          ) : (
            <>
              <svg className="w-5 h-5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
                />
              </svg>
              <span className="text-sm text-gray-500">{placeholder}</span>
            </>
          )}
        </div>

        {/* Dropdown Icon */}
        <svg
          className={`w-5 h-5 text-gray-400 transition-transform flex-shrink-0 ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Error Message */}
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute z-50 mt-2 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-96 overflow-hidden flex flex-col">
          {/* Search Input */}
          <div className="p-2 border-b border-gray-200">
            <input
              type="text"
              placeholder="Search folders..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
              onClick={(e) => e.stopPropagation()}
            />
          </div>

          {/* Folder List */}
          <div className="overflow-y-auto flex-1">
            {/* Root / No Folder Option */}
            {allowRoot && (
              <div
                className={`px-3 py-2 cursor-pointer transition-colors ${
                  value === null ? 'bg-red-50 text-red-700' : 'hover:bg-gray-100'
                }`}
                onClick={() => handleSelect(null)}
              >
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                    />
                  </svg>
                  <span className="text-sm font-medium">No Folder (Root)</span>
                </div>
              </div>
            )}

            {/* Folders */}
            {filteredFolders.length > 0 ? (
              filteredFolders.map((folder) => (
                <FolderSelectorItem
                  key={folder.id}
                  folder={folder}
                  onSelect={handleSelect}
                  selectedId={value}
                  level={0}
                />
              ))
            ) : (
              <div className="px-3 py-8 text-center text-gray-500 text-sm">
                {searchQuery ? 'No folders found' : 'No folders available'}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default FolderSelector;
