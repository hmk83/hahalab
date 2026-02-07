import React, { useState, useMemo, useEffect } from 'react';
import { CATEGORIES } from '../constants';
import { CategoryId, ContentItem } from '../types';
import { Button } from '../components/Button';
import { Plus, X, Image as ImageIcon, Edit2, Copy, Trash2, ArrowLeft, Save, LogOut, Database, Cloud, Search, AlertTriangle } from 'lucide-react';
import { DataService } from '../services/db';
import { OptimizedImage } from '../components/OptimizedImage';

interface AdminProps {
  contents: ContentItem[];
  onAddContent: (item: ContentItem) => void;
  onUpdateContent: (item: ContentItem) => void;
  onDeleteContent: (id: string) => void;
  onClose: () => void;
}

type AdminMode = 'list' | 'form' | 'settings';
type SortOrder = 'latest' | 'oldest' | 'nameAsc' | 'nameDesc';

export const Admin: React.FC<AdminProps> = ({ 
  contents, 
  onAddContent, 
  onUpdateContent, 
  onDeleteContent, 
  onClose 
}) => {
  // --- View State ---
  const [mode, setMode] = useState<AdminMode>('list');
  const [activeCategoryId, setActiveCategoryId] = useState<CategoryId>(CategoryId.THINKING);
  
  // --- Filter & Sort State ---
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOrder, setSortOrder] = useState<SortOrder>('latest');
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  
  // --- Form State ---
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<{
    categoryId: CategoryId;
    title: string;
    url: string;
    thumbnailUrl: string;
    tags: string[];
  }>({
    categoryId: CategoryId.THINKING,
    title: '',
    url: '',
    thumbnailUrl: '',
    tags: []
  });

  const [tagInput, setTagInput] = useState('');

  // --- DB Settings State ---
  const [dbConfig, setDbConfig] = useState({ url: '', key: '', enabled: false });

  useEffect(() => {
    const config = DataService.getDBConfig();
    if (config) setDbConfig(config);
  }, []);

  // --- List Logic ---
  const filteredContents = useMemo(() => {
    let result = contents.filter(c => c.categoryId === activeCategoryId);
    
    // Search
    if (searchTerm.trim()) {
       const term = searchTerm.toLowerCase();
       result = result.filter(c => c.title.toLowerCase().includes(term) || c.tags.some(t => t.toLowerCase().includes(term)));
    }

    // Sort
    result.sort((a, b) => {
       switch(sortOrder) {
          case 'nameAsc': return a.title.localeCompare(b.title);
          case 'nameDesc': return b.title.localeCompare(a.title);
          case 'oldest': return a.createdAt - b.createdAt;
          case 'latest': default: return b.createdAt - a.createdAt;
       }
    });

    return result;
  }, [contents, activeCategoryId, searchTerm, sortOrder]);

  // --- Handlers ---

  const handleStartCreate = () => {
    setEditingId(null);
    setFormData({
      categoryId: activeCategoryId, 
      title: '',
      url: '',
      thumbnailUrl: '',
      tags: []
    });
    setMode('form');
  };

  const handleStartEdit = (item: ContentItem) => {
    setEditingId(item.id);
    setFormData({
      categoryId: item.categoryId,
      title: item.title,
      url: item.targetUrl,
      thumbnailUrl: item.thumbnailUrl,
      tags: [...item.tags]
    });
    setMode('form');
  };

  const handleCopy = (item: ContentItem) => {
    setEditingId(null);
    setFormData({
      categoryId: item.categoryId,
      title: `${item.title} (복사본)`,
      url: item.targetUrl,
      thumbnailUrl: item.thumbnailUrl,
      tags: [...item.tags]
    });
    setMode('form');
  };

  const handleDeleteRequest = (id: string) => {
    setDeleteTargetId(id);
  };

  const confirmDelete = () => {
    if (deleteTargetId) {
      onDeleteContent(deleteTargetId);
      setDeleteTargetId(null);
    }
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData(prev => ({ ...prev, tags: [...prev.tags, tagInput.trim()] }));
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setFormData(prev => ({ ...prev, tags: prev.tags.filter(t => t !== tagToRemove) }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.url) return;

    if (editingId) {
      const updatedItem: ContentItem = {
        id: editingId,
        categoryId: formData.categoryId,
        title: formData.title,
        targetUrl: formData.url,
        thumbnailUrl: formData.thumbnailUrl || `https://picsum.photos/seed/${Date.now()}/400/300`,
        tags: formData.tags,
        createdAt: Date.now(),
      };
      onUpdateContent(updatedItem);
    } else {
      const newItem: ContentItem = {
        id: Date.now().toString(),
        categoryId: formData.categoryId,
        title: formData.title,
        targetUrl: formData.url,
        thumbnailUrl: formData.thumbnailUrl || `https://picsum.photos/seed/${Date.now()}/400/300`,
        tags: formData.tags,
        createdAt: Date.now(),
      };
      onAddContent(newItem);
    }
    
    setActiveCategoryId(formData.categoryId); 
    setMode('list');
  };

  const handleSaveDBConfig = () => {
    DataService.saveDBConfig(dbConfig);
    alert('DB 설정이 저장되었습니다. 새로고침 후 적용됩니다.');
  };

  const handlePullFromCloud = async () => {
    // Note: window.confirm might be blocked in some previews, but for critical data overwrite, it's safer.
    // If blocked, user can't pull. Assuming admin has access to console or non-iframe env for this advanced feature.
    // Or we could implement a custom modal for this too, but for now focusing on content delete.
    if(confirm('클라우드 데이터를 가져오면 현재 로컬 데이터가 덮어씌워집니다. 진행하시겠습니까?')) {
      await DataService.pullAllFromCloud();
    }
  };

  // --- Render List View ---
  if (mode === 'list') {
    return (
      <div className="max-w-6xl mx-auto p-4 md:p-8 relative">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
          <div>
            <h2 className="text-2xl font-black text-gray-800">컨텐츠 관리</h2>
            <p className="text-gray-500 text-sm mt-1">하하랩의 학습 컨텐츠를 등록/수정/삭제합니다.</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => setMode('settings')} variant="secondary" className="px-5 text-indigo-600 bg-indigo-50 hover:bg-indigo-100">
               <Database size={20} />
               DB 연결 설정
            </Button>
            <Button onClick={handleStartCreate} className="px-5">
              <Plus size={20} />
              컨텐츠 등록
            </Button>
            <Button variant="secondary" onClick={onClose}>
              <LogOut size={18} />
              나가기
            </Button>
          </div>
        </div>

        {/* Search & Sort Bar */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text" 
              placeholder="컨텐츠 제목 또는 태그 검색" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-kakao-yellow text-sm shadow-sm"
            />
          </div>
          <div className="flex gap-2 shrink-0">
             <select 
               value={sortOrder} 
               onChange={(e) => setSortOrder(e.target.value as SortOrder)}
               className="px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-bold text-gray-600 focus:outline-none focus:ring-2 focus:ring-kakao-yellow shadow-sm cursor-pointer"
             >
                <option value="latest">최신 등록순</option>
                <option value="oldest">오래된 순</option>
                <option value="nameAsc">이름순 (ㄱ-ㅎ)</option>
                <option value="nameDesc">이름순 (ㅎ-ㄱ)</option>
             </select>
          </div>
        </div>

        {/* Category Tabs */}
        <div className="flex overflow-x-auto gap-2 pb-4 mb-4 scrollbar-hide">
          {CATEGORIES.map(cat => (
            <button
              key={cat.id}
              onClick={() => setActiveCategoryId(cat.id)}
              className={`px-4 py-2 rounded-full whitespace-nowrap text-sm font-bold transition-all border ${
                activeCategoryId === cat.id
                  ? 'bg-kakao-brown text-white border-kakao-brown shadow-md'
                  : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'
              }`}
            >
              {cat.title}
            </button>
          ))}
        </div>

        {/* Table/List */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden min-h-[300px]">
          {filteredContents.length === 0 ? (
            <div className="p-10 text-center text-gray-400 flex flex-col items-center justify-center h-full">
              <Search size={40} className="mb-2 opacity-20"/>
              <p>조건에 맞는 컨텐츠가 없습니다.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {filteredContents.map(item => (
                <div key={item.id} className="p-4 flex flex-col sm:flex-row items-center gap-4 hover:bg-gray-50 transition-colors group">
                  {/* Thumbnail */}
                  <div className="w-full sm:w-24 h-16 bg-gray-100 rounded-lg overflow-hidden shrink-0 border border-gray-200">
                    <OptimizedImage src={item.thumbnailUrl} alt={item.title} className="w-full h-full" />
                  </div>
                  
                  {/* Info */}
                  <div className="flex-1 min-w-0 text-center sm:text-left">
                    <h3 className="font-bold text-gray-900 truncate group-hover:text-kakao-brown transition-colors">{item.title}</h3>
                    <p className="text-xs text-gray-500 truncate mt-1">{item.targetUrl}</p>
                    <div className="flex flex-wrap gap-1 justify-center sm:justify-start mt-2">
                      {item.tags.map((t, i) => (
                         <span key={i} className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">#{t}</span>
                      ))}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    <button 
                      onClick={() => handleCopy(item)}
                      className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="복사"
                    >
                      <Copy size={18} />
                    </button>
                    <button 
                      onClick={() => handleStartEdit(item)}
                      className="p-2 text-gray-400 hover:text-kakao-brown hover:bg-kakao-yellow/20 rounded-lg transition-colors"
                      title="수정"
                    >
                      <Edit2 size={18} />
                    </button>
                    <button 
                      onClick={() => handleDeleteRequest(item.id)}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="삭제"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Delete Confirmation Modal */}
        {deleteTargetId && (
          <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-2xl animate-pop-in">
               <div className="text-center mb-6">
                  <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-3">
                     <AlertTriangle size={24} />
                  </div>
                  <h3 className="text-lg font-bold text-gray-800">컨텐츠 삭제</h3>
                  <p className="text-sm text-gray-500 mt-1">정말로 이 컨텐츠를 삭제하시겠습니까?<br/>삭제된 데이터는 복구할 수 없습니다.</p>
               </div>
               <div className="flex gap-2">
                  <Button variant="secondary" fullWidth onClick={() => setDeleteTargetId(null)}>취소</Button>
                  <Button fullWidth onClick={confirmDelete} className="bg-red-500 hover:bg-red-600 text-white shadow-red-200 hover:shadow-red-300">삭제하기</Button>
               </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // --- Render DB Settings View ---
  if (mode === 'settings') {
     return (
        <div className="max-w-2xl mx-auto p-4 md:p-8">
           <div className="mb-6 flex items-center justify-between">
            <button 
              onClick={() => setMode('list')}
              className="flex items-center gap-2 text-gray-500 hover:text-kakao-brown font-bold transition-colors"
            >
              <ArrowLeft size={20} />
              설정 닫기
            </button>
            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              <Database size={24} className="text-indigo-600"/> DB 연결 설정
            </h2>
          </div>

          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 space-y-6">
             <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100">
                <h4 className="font-bold text-indigo-900 mb-1 flex items-center gap-2"><Cloud size={18}/> 실시간 데이터 동기화 (Supabase)</h4>
                <p className="text-sm text-indigo-700 leading-relaxed">
                   Supabase 프로젝트를 생성하고 URL과 Anon Key를 입력하면, 모든 데이터(일정, 아동정보, 컨텐츠)가 클라우드에 저장되어 <strong>어느 기기에서든 실시간으로 접근</strong>할 수 있습니다.
                   <br/>
                   <span className="text-xs opacity-70">* 테이블 'haha_data' (columns: key(text, pk), value(jsonb))가 생성되어 있어야 합니다.</span>
                </p>
             </div>

             <div className="space-y-4">
                <div className="flex items-center gap-2 mb-2">
                   <input type="checkbox" id="db-enabled" checked={dbConfig.enabled} onChange={e => setDbConfig({...dbConfig, enabled: e.target.checked})} className="w-5 h-5 accent-indigo-600"/>
                   <label htmlFor="db-enabled" className="font-bold text-gray-700 cursor-pointer select-none">클라우드 동기화 사용</label>
                </div>

                {dbConfig.enabled && (
                   <>
                      <div>
                         <label className="block text-sm font-bold text-gray-700 mb-1">Project URL</label>
                         <input type="text" value={dbConfig.url} onChange={e => setDbConfig({...dbConfig, url: e.target.value})} className="w-full p-3 border rounded-xl text-sm font-mono bg-gray-50 focus:bg-white transition-colors" placeholder="https://your-project.supabase.co" />
                      </div>
                      <div>
                         <label className="block text-sm font-bold text-gray-700 mb-1">API Key (anon/public)</label>
                         <input type="password" value={dbConfig.key} onChange={e => setDbConfig({...dbConfig, key: e.target.value})} className="w-full p-3 border rounded-xl text-sm font-mono bg-gray-50 focus:bg-white transition-colors" placeholder="your-anon-key" />
                      </div>
                   </>
                )}
             </div>
             
             <div className="pt-4 border-t border-gray-100 flex gap-3">
                <Button fullWidth onClick={handleSaveDBConfig}>설정 저장</Button>
                {dbConfig.enabled && (
                   <Button variant="secondary" onClick={handlePullFromCloud} title="DB 데이터를 로컬로 덮어쓰기">
                      클라우드 데이터 불러오기
                   </Button>
                )}
             </div>
          </div>
        </div>
     )
  }

  // --- Render Form View ---
  return (
    <div className="max-w-3xl mx-auto p-4 md:p-8">
       <div className="mb-6 flex items-center justify-between">
         <button 
           onClick={() => setMode('list')}
           className="flex items-center gap-2 text-gray-500 hover:text-kakao-brown font-bold transition-colors"
         >
           <ArrowLeft size={20} />
           목록으로 돌아가기
         </button>
         <h2 className="text-xl font-bold text-gray-800">
           {editingId ? '컨텐츠 수정' : '새 컨텐츠 등록'}
         </h2>
       </div>

      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 md:p-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* Category Select */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">카테고리</label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {CATEGORIES.map(cat => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setFormData({...formData, categoryId: cat.id})}
                  className={`p-2 rounded-lg text-sm transition-all border ${
                    formData.categoryId === cat.id 
                      ? 'bg-kakao-yellow border-kakao-yellow font-bold text-kakao-brown shadow-sm' 
                      : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'
                  }`}
                >
                  {cat.title}
                </button>
              ))}
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">제목</label>
            <input
              required
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({...formData, title: e.target.value})}
              className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-kakao-yellow focus:border-transparent outline-none"
              placeholder="컨텐츠 제목을 입력하세요"
            />
          </div>

          {/* URL */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">컨텐츠 URL (이동할 웹페이지)</label>
            <input
              required
              type="url"
              value={formData.url}
              onChange={(e) => setFormData({...formData, url: e.target.value})}
              className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-kakao-yellow focus:border-transparent outline-none font-mono text-sm"
              placeholder="https://..."
            />
          </div>

          {/* Thumbnail */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">썸네일 이미지 URL</label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <ImageIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  value={formData.thumbnailUrl}
                  onChange={(e) => setFormData({...formData, thumbnailUrl: e.target.value})}
                  className="w-full pl-10 pr-4 p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-kakao-yellow focus:border-transparent outline-none text-sm"
                  placeholder="이미지 주소를 입력 (비워두면 랜덤 생성)"
                />
              </div>
            </div>
            {formData.thumbnailUrl && (
               <div className="mt-2 w-32 h-20 rounded-lg overflow-hidden border border-gray-200 bg-gray-50">
                 <OptimizedImage src={formData.thumbnailUrl} alt="Preview" className="w-full h-full" />
               </div>
            )}
          </div>

          {/* Hashtags */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">해시태그</label>
            <div className="flex gap-2 mb-3">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                className="flex-1 p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-kakao-yellow focus:border-transparent outline-none"
                placeholder="태그 입력 후 Enter"
              />
              <Button type="button" onClick={handleAddTag} variant="secondary">
                <Plus size={20} />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2 min-h-[40px]">
              {formData.tags.map(tag => (
                <span key={tag} className="bg-gray-100 text-kakao-brown px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1 animate-pop-in">
                  #{tag}
                  <button type="button" onClick={() => removeTag(tag)} className="hover:text-red-500 ml-1">
                    <X size={14} />
                  </button>
                </span>
              ))}
            </div>
          </div>

          <div className="pt-6 border-t border-gray-100 flex justify-end gap-3">
            <Button type="button" variant="secondary" onClick={() => setMode('list')}>취소</Button>
            <Button type="submit" className="px-8">
              <Save size={20} />
              {editingId ? '수정 내용 저장' : '등록하기'}
            </Button>
          </div>

        </form>
      </div>
    </div>
  );
};