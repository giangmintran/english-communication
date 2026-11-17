import React from 'react';
import { ExploreCollections } from '@/components/dashboard/ExploreCollections';

export default function CollectionsPage() {
  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="mb-6">
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-1">
          Collections
        </h1>
        <p className="text-slate-500 text-sm">
          Lựa chọn chủ đề bạn muốn luyện tập hôm nay. Mỗi chủ đề bao gồm từ vựng và mẫu câu phản xạ thông dụng nhất.
        </p>
      </div>

      <ExploreCollections />
    </div>
  );
}
