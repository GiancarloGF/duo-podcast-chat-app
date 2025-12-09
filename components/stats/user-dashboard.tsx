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
    } else {
      // Set default values when no progress data exists
      setStats({
        totalTranslations: 0,
        totalSkipped: 0,
        completedEpisodes: 0,
        averageScore: 0,
      });
      setLevel('Principiante');
      setStreak(0);
    }
  }, []);

  if (!stats) {
    return (
      <div className='grid grid-cols-2 md:grid-cols-4 gap-3'>
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className='bg-white dark:bg-slate-800 rounded-lg p-3 border border-gray-100 dark:border-slate-700 shadow-sm h-20 animate-pulse'
          >
            <div className='h-5 w-5 bg-gray-200 dark:bg-gray-700 rounded-full mx-auto mb-2'></div>
            <div className='h-4 w-12 bg-gray-200 dark:bg-gray-700 rounded mx-auto mb-1'></div>
            <div className='h-2 w-16 bg-gray-200 dark:bg-gray-700 rounded mx-auto'></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className='grid grid-cols-2 md:grid-cols-4 gap-3'>
      {/* Level Badge */}
      <div className='bg-white dark:bg-slate-800 rounded-lg p-3 border border-gray-100 dark:border-slate-700 shadow-sm flex flex-col items-center justify-center text-center'>
        <div className='mb-1 p-1.5 bg-blue-50 dark:bg-blue-900/20 rounded-full text-blue-600 dark:text-blue-400'>
          <Award className='w-4 h-4' />
        </div>
        <div className='text-lg font-bold text-gray-900 dark:text-white'>
          {level}
        </div>
        <div className='text-[10px] text-gray-500 uppercase tracking-wider font-medium mt-0.5'>
          Nivel
        </div>
        <div className='text-[9px] text-gray-400 mt-0.5'>
          Promedio: {stats.averageScore}%
        </div>
      </div>

      {/* Translations Count */}
      <div className='bg-white dark:bg-slate-800 rounded-lg p-3 border border-gray-100 dark:border-slate-700 shadow-sm flex flex-col items-center justify-center text-center'>
        <div className='mb-1 p-1.5 bg-green-50 dark:bg-green-900/20 rounded-full text-green-600 dark:text-green-400'>
          <TrendingUp className='w-4 h-4' />
        </div>
        <div className='text-lg font-bold text-gray-900 dark:text-white'>
          {stats.totalTranslations}
        </div>
        <div className='text-[10px] text-gray-500 uppercase tracking-wider font-medium mt-0.5'>
          Traducciones
        </div>
      </div>

      {/* Episodes Completed */}
      <div className='bg-white dark:bg-slate-800 rounded-lg p-3 border border-gray-100 dark:border-slate-700 shadow-sm flex flex-col items-center justify-center text-center'>
        <div className='mb-1 p-1.5 bg-purple-50 dark:bg-purple-900/20 rounded-full text-purple-600 dark:text-purple-400'>
          <Target className='w-4 h-4' />
        </div>
        <div className='text-lg font-bold text-gray-900 dark:text-white'>
          {stats.completedEpisodes}
        </div>
        <div className='text-[10px] text-gray-500 uppercase tracking-wider font-medium mt-0.5'>
          Episodios
        </div>
      </div>

      {/* Streak */}
      <div className='bg-white dark:bg-slate-800 rounded-lg p-3 border border-gray-100 dark:border-slate-700 shadow-sm flex flex-col items-center justify-center text-center'>
        <div className='mb-1 p-1.5 bg-orange-50 dark:bg-orange-900/20 rounded-full text-orange-600 dark:text-orange-400'>
          <Flame className='w-4 h-4' />
        </div>
        <div className='text-lg font-bold text-gray-900 dark:text-white'>
          {streak}
        </div>
        <div className='text-[10px] text-gray-500 uppercase tracking-wider font-medium mt-0.5'>
          Racha (Días)
        </div>
      </div>
    </div>
  );
}
