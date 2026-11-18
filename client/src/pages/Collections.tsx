import React from 'react';
import { ExploreCollections } from '@/components/dashboard/ExploreCollections';
import { useTranslation } from '@/context/LanguageContext';

export default function CollectionsPage() {
  const { t } = useTranslation();

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="mb-6">
        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-1">
          {t('collections.title')}
        </h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm">
          {t('collections.subtitle')}
        </p>
      </div>

      <ExploreCollections />
    </div>
  );
}
