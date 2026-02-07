import React, { useState, useMemo } from 'react';
import { Category, ContentItem } from '../types';
import { Search, PlayCircle, Filter, Hash, X, ChevronRight, Grid } from 'lucide-react';
import { OptimizedImage } from '../components/OptimizedImage';
import { Button } from '../components/Button';

interface CategoryDetailProps {
  category: Category;
  contents: ContentItem[];
  onContentSelect: (content: ContentItem) => void;
}

// Helper for Korean Initial Consonant (Chosung)
const getChosung = (str: string) => {
  const CHO = ['ㄱ', 'ㄲ', 'ㄴ', 'ㄷ', 'ㄸ', 'ㄹ', 'ㅁ', 'ㅂ', 'ㅃ', 'ㅅ', 'ㅆ', 'ㅇ', 'ㅈ', 'ㅉ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ'];
  const code = str.charCodeAt(0) - 44032;
  if (code > -1 && code < 11172) return CHO[Math.floor(code / 588)];
  return str.charAt(0).toUpperCase(); // Fallback for non-Korean
};

export const CategoryDetail: React.FC<CategoryDetailProps> = ({ category, contents, onContentSelect }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [isTagModalOpen, setIsTagModalOpen] = useState(false);

  // Derive unique tags from contents in this category
  const allTags = useMemo(() => {
    const tags = new Set<string>();
    contents.filter(c => c.categoryId === category.id).forEach(item => item.tags.forEach(tag => tags.add(tag)));
    return Array.from(tags).sort();
  }, [contents, category.id]);

  // Group tags by Chosung
  const groupedTags = useMemo(() => {
    const groups: Record<string, string[]> = {};
    allTags.forEach(tag => {
      const char = getChosung(tag);
      if (!groups[char]) groups[char] = [];
      groups[char].push(tag);
    });
    return groups;
  }, [allTags]);

  // Filter contents
  const { displayContents, isFiltered } = useMemo(() => {
    let filtered = contents.filter(item => {
      const matchesCategory = item.categoryId === category.id;
      const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            item.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesTag = selectedTag ? item.tags.includes(selectedTag) : true;
      
      return matchesCategory && matchesSearch && matchesTag;
    });

    const isFilteredState = searchQuery.length > 0 || selectedTag !== null;
    
    // If NOT filtered (default view), show only "Popular" (first 6 items)
    // If filtered, show all matching results
    const displayList = isFilteredState ? filtered : filtered.slice(0, 6);

    return { displayContents: displayList, isFiltered: isFilteredState };
  }, [contents, category.id, searchQuery, selectedTag]);

  return (
    <div className="min-h-screen pb-10 bg-white">
      {/* Header Banner */}
      <div className="bg-white px-6 pt-6 pb-4 border-b border-gray-100 sticky top-[60px] z-10 shadow-sm">
        <h2 className="text-2xl font-black text-kakao-brown mb-1 flex items-center gap-2">
          {category.title}
        </h2>
        <p className="text-sm text-gray-500 mb-4">{category.description}</p>

        {/* Search Bar */}
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input 
            type="text"
            placeholder="제목이나 태그로 검색..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-kakao-yellow focus:outline-none transition-all font-medium text-gray-700 placeholder-gray-400"
          />
        </div>
        
        {/* Hash Tag / More Button - Moved Here */}
        {!isFiltered && contents.length > 0 && (
          <button 
            onClick={() => setIsTagModalOpen(true)}
            className="w-full py-3 rounded-xl bg-gray-50 hover:bg-kakao-yellow/20 text-gray-500 hover:text-kakao-brown font-bold text-sm transition-all flex items-center justify-center gap-2 group border border-gray-100"
          >
            <Grid size={16} />
            해시태그 모아보기 & 전체 컨텐츠
            <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform"/>
          </button>
        )}

        {/* Active Tag Indicator */}
        {selectedTag && (
          <div className="mt-3 flex items-center gap-2 animate-fade-in-up">
            <span className="text-xs font-bold text-gray-400">선택된 태그:</span>
            <button 
              onClick={() => setSelectedTag(null)}
              className="bg-kakao-brown text-white px-3 py-1 rounded-full text-sm font-bold flex items-center gap-1 hover:bg-black transition-colors"
            >
              #{selectedTag} <X size={14}/>
            </button>
          </div>
        )}
      </div>

      {/* Content Grid */}
      <div className="p-4 md:p-6">
        <div className="flex items-center justify-between mb-4 px-1">
           <h3 className="font-bold text-lg text-gray-800 flex items-center gap-2">
             {isFiltered ? '검색 결과' : '인기 컨텐츠'}
             {!isFiltered && <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full">HOT</span>}
           </h3>
           {isFiltered && (
             <button onClick={() => {setSearchQuery(''); setSelectedTag(null);}} className="text-sm text-gray-400 underline">필터 초기화</button>
           )}
        </div>

        {displayContents.length === 0 ? (
          <div className="text-center py-20 text-gray-400 bg-gray-50 rounded-3xl border border-dashed border-gray-200">
            <div className="bg-white w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
              <Filter size={32} className="text-gray-300" />
            </div>
            <p className="font-bold">등록된 컨텐츠가 없습니다.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {displayContents.map(item => (
              <div 
                key={item.id} 
                onClick={() => onContentSelect(item)}
                className="group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 block border border-gray-100 cursor-pointer flex flex-col hover:-translate-y-1"
              >
                <div className="aspect-[4/3] bg-gray-100 overflow-hidden relative">
                  <OptimizedImage 
                    src={item.thumbnailUrl} 
                    alt={item.title}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                     <PlayCircle className="text-white opacity-0 group-hover:opacity-100 transform scale-75 group-hover:scale-100 transition-all drop-shadow-lg" size={48} fill="rgba(0,0,0,0.5)" />
                  </div>
                </div>
                <div className="p-4 flex-1 flex flex-col">
                  <h3 className="font-bold text-lg text-kakao-brown mb-2 line-clamp-1 group-hover:text-blue-600 transition-colors">
                    {item.title}
                  </h3>
                  <div className="flex flex-wrap gap-1.5 mt-auto">
                    {item.tags.slice(0, 3).map(tag => (
                      <span key={tag} className="text-[11px] bg-gray-100 text-gray-500 px-2 py-1 rounded-md font-medium">
                        #{tag}
                      </span>
                    ))}
                    {item.tags.length > 3 && <span className="text-[10px] text-gray-400 px-1 py-1">+</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* --- Full Screen Tag Modal --- */}
      {isTagModalOpen && (
        <div className="fixed inset-0 bg-white z-[100] flex flex-col animate-pop-in">
           {/* Modal Header */}
           <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-white sticky top-0 z-10">
              <h2 className="text-xl font-black text-gray-800 flex items-center gap-2">
                 <Hash className="text-kakao-brown" size={24}/>
                 해시태그 탐색
              </h2>
              <button 
                onClick={() => setIsTagModalOpen(false)}
                className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors"
              >
                 <X size={24} className="text-gray-600"/>
              </button>
           </div>

           {/* Modal Content */}
           <div className="flex-1 overflow-y-auto p-6 bg-gray-50 pb-20">
              <p className="text-gray-500 mb-8 text-center text-sm">
                 원하는 키워드를 선택하면 관련 컨텐츠를 모아볼 수 있어요.
              </p>
              
              <div className="max-w-3xl mx-auto space-y-8">
                 {Object.keys(groupedTags).sort().map(char => (
                    <div key={char} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
                       <div className="flex items-center gap-3 mb-4">
                          <div className="w-8 h-8 rounded-lg bg-kakao-yellow flex items-center justify-center font-black text-kakao-brown shadow-sm">
                             {char}
                          </div>
                          <div className="h-px flex-1 bg-gray-100"></div>
                       </div>
                       
                       <div className="flex flex-wrap gap-2">
                          {groupedTags[char].map(tag => (
                             <button
                               key={tag}
                               onClick={() => {
                                  setSelectedTag(tag);
                                  setIsTagModalOpen(false);
                                  setSearchQuery(''); // Clear search query when picking a tag
                                  window.scrollTo(0, 0);
                               }}
                               className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                                  selectedTag === tag 
                                  ? 'bg-kakao-brown text-white shadow-md' 
                                  : 'bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-200'
                               }`}
                             >
                               #{tag}
                             </button>
                          ))}
                       </div>
                    </div>
                 ))}
                 
                 {allTags.length === 0 && (
                    <div className="text-center text-gray-400 py-10">
                       등록된 태그가 없습니다.
                    </div>
                 )}
              </div>
           </div>
           
           {/* Modal Bottom Close Button */}
           <div className="p-4 border-t border-gray-100 bg-white">
              <Button fullWidth onClick={() => setIsTagModalOpen(false)}>
                 닫기
              </Button>
           </div>
        </div>
      )}
    </div>
  );
};