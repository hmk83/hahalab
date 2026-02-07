import React, { useState, useEffect } from 'react';
import { ContentItem } from './types';
import { Admin } from './views/Admin';
import { INITIAL_CONTENTS } from './constants';

const AdminApp: React.FC = () => {
  const [contents, setContents] = useState<ContentItem[]>([]);

  // Initialize data
  useEffect(() => {
    const stored = localStorage.getItem('haha-lab-contents');
    if (stored) {
      setContents(JSON.parse(stored));
    } else {
      setContents(INITIAL_CONTENTS);
      // Initialize storage if empty
      localStorage.setItem('haha-lab-contents', JSON.stringify(INITIAL_CONTENTS));
    }
  }, []);

  // Save to local storage whenever contents change
  useEffect(() => {
    if (contents.length > 0) {
      localStorage.setItem('haha-lab-contents', JSON.stringify(contents));
    }
  }, [contents]);

  // CRUD Handlers
  const addContent = (item: ContentItem) => {
    setContents(prev => [item, ...prev]);
  };

  const updateContent = (updatedItem: ContentItem) => {
    setContents(prev => prev.map(item => item.id === updatedItem.id ? updatedItem : item));
  };

  const deleteContent = (id: string) => {
    if (window.confirm('정말로 삭제하시겠습니까?')) {
      setContents(prev => prev.filter(item => item.id !== id));
    }
  };

  const handleClose = () => {
    // Redirect to main site
    window.location.href = './index.html';
  };

  return (
    <div className="min-h-screen bg-gray-50">
       <header className="bg-gray-900 text-white h-[60px] px-8 flex items-center justify-between shadow-md">
         <div className="font-black text-lg tracking-wider">HAHA LAB ADMIN</div>
         <div className="text-sm text-gray-400">관리자 전용 페이지</div>
       </header>
       <main className="py-8">
        <Admin 
          contents={contents}
          onAddContent={addContent}
          onUpdateContent={updateContent}
          onDeleteContent={deleteContent}
          onClose={handleClose}
        />
       </main>
    </div>
  );
};

export default AdminApp;