import React, { useMemo } from 'react';
import { ContentItem } from '../types';
import { CATEGORIES } from '../constants';
import { X } from 'lucide-react';
import { Button } from '../components/Button';

interface PlayerProps {
  content: ContentItem;
  onClose: () => void;
}

export const Player: React.FC<PlayerProps> = ({ content, onClose }) => {
  // Find the category title based on the content's categoryId
  const categoryTitle = useMemo(() => {
    const category = CATEGORIES.find(c => c.id === content.categoryId);
    return category ? category.title : '학습 플레이어';
  }, [content.categoryId]);

  return (
    <div className="flex flex-col h-[calc(100vh-60px)] bg-gray-100">
      <div className="bg-white px-4 py-3 border-b border-gray-200 flex items-center justify-between shadow-sm z-10">
        <div className="flex flex-col">
            <h2 className="font-bold text-lg truncate text-kakao-brown leading-tight">{content.title}</h2>
            <span className="text-xs text-gray-500 mt-0.5 font-medium">{categoryTitle}</span>
        </div>
        <div className="flex gap-2 shrink-0">
          <Button 
            onClick={onClose} 
            className="px-4 py-2 text-sm h-10 bg-kakao-yellow text-kakao-brown hover:bg-[#ebd500] font-bold rounded-xl shadow-md border-0 transition-transform active:scale-95"
          >
            <X size={18} className="mr-1" strokeWidth={2.5} />
            닫기
          </Button>
        </div>
      </div>
      
      <div className="flex-1 w-full bg-white relative">
        <iframe 
          src={content.targetUrl} 
          title={content.title}
          className="w-full h-full border-0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
    </div>
  );
};