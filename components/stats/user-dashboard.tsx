'use client';

import { useEffect, useState } from 'react';
import type { UserStats } from '@/lib/types';
import { storage } from '@/lib/storage';
import { StatsService } from '@/lib/stats';
import { TrendingUp, Flame, Award, Target } from 'lucide-react';

export function UserDashboard() {
  const [stats, setStats] = useState<UserStats | null>(null);
  const [level, setLevel] = useState('');
  const [streak, setStreak] = useState(0);

  useEffect(() => {
    // Get all episodes progress from storage
    const allProgress = storage.getAllEpisodeProgresses(); // Fixed method name from getAllEpisodesProgress to getAllEpisodeProgresses
    if (allProgress.length > 0) {
      const userStats = StatsService.calculateUserStats(allProgress);
      const userLevel = StatsService.getLevel(userStats.averageScore);
      const userStreak = StatsService.getStreak(allProgress);

      setStats(userStats);
      setLevel(userLevel);
      setStreak(userStreak);
    }
  }, []);

  if (!stats) {
    return (
      <div className='grid grid-cols-1 md:grid-cols-4 gap-4'>
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className='bg-white dark:bg-slate-800 rounded-lg p-4 border border-gray-100 dark:border-slate-700 shadow-sm h-32 animate-pulse'
          >
            <div className='h-8 w-8 bg-gray-200 dark:bg-gray-700 rounded-full mx-auto mb-3'></div>
            <div className='h-6 w-16 bg-gray-200 dark:bg-gray-700 rounded mx-auto mb-2'></div>
            <div className='h-3 w-20 bg-gray-200 dark:bg-gray-700 rounded mx-auto'></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
      {/* Level Badge */}
      <div className='bg-white dark:bg-slate-800 rounded-lg p-4 border border-gray-100 dark:border-slate-700 shadow-sm flex flex-col items-center justify-center text-center'>
        <div className='mb-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded-full text-blue-600 dark:text-blue-400'>
          <Award className='w-5 h-5' />
        </div>
        <div className='text-2xl font-bold text-gray-900 dark:text-white'>
          {level}
        </div>
        <div className='text-xs text-gray-500 uppercase tracking-wider font-medium mt-1'>
          Nivel
        </div>
        <div className='text-[10px] text-gray-400 mt-1'>
          Promedio: {stats.averageScore}%
        </div>
      </div>

      {/* Translations Count */}
      <div className='bg-white dark:bg-slate-800 rounded-lg p-4 border border-gray-100 dark:border-slate-700 shadow-sm flex flex-col items-center justify-center text-center'>
        <div className='mb-2 p-2 bg-green-50 dark:bg-green-900/20 rounded-full text-green-600 dark:text-green-400'>
          <TrendingUp className='w-5 h-5' />
        </div>
        <div className='text-2xl font-bold text-gray-900 dark:text-white'>
          {stats.totalTranslations}
        </div>
        <div className='text-xs text-gray-500 uppercase tracking-wider font-medium mt-1'>
          Traducciones
        </div>
      </div>

      {/* Episodes Completed */}
      <div className='bg-white dark:bg-slate-800 rounded-lg p-4 border border-gray-100 dark:border-slate-700 shadow-sm flex flex-col items-center justify-center text-center'>
        <div className='mb-2 p-2 bg-purple-50 dark:bg-purple-900/20 rounded-full text-purple-600 dark:text-purple-400'>
          <Target className='w-5 h-5' />
        </div>
        <div className='text-2xl font-bold text-gray-900 dark:text-white'>
          {stats.completedEpisodes}
        </div>
        <div className='text-xs text-gray-500 uppercase tracking-wider font-medium mt-1'>
          Episodios
        </div>
      </div>

      {/* Streak */}
      <div className='bg-white dark:bg-slate-800 rounded-lg p-4 border border-gray-100 dark:border-slate-700 shadow-sm flex flex-col items-center justify-center text-center'>
        <div className='mb-2 p-2 bg-orange-50 dark:bg-orange-900/20 rounded-full text-orange-600 dark:text-orange-400'>
          <Flame className='w-5 h-5' />
        </div>
        <div className='text-2xl font-bold text-gray-900 dark:text-white'>
          {streak}
        </div>
        <div className='text-xs text-gray-500 uppercase tracking-wider font-medium mt-1'>
          Racha (Días)
        </div>
      </div>
    </div>
  );
}
