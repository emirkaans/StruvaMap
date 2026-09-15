package com.struva.map.di

import android.content.Context
import androidx.room.Room
import com.struva.map.local.AppDatabase
import com.struva.map.local.ResultDao
import com.struva.map.local.TestDao
import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.android.qualifiers.ApplicationContext
import dagger.hilt.components.SingletonComponent
import javax.inject.Singleton

@Module
@InstallIn(SingletonComponent::class)
object DatabaseModule {

    @Provides
    @Singleton
    fun provideAppDatabase(@ApplicationContext context: Context): AppDatabase =
        Room.databaseBuilder(context, AppDatabase::class.java, "struva.db").build()

    @Provides
    fun provideTestDao(db: AppDatabase): TestDao = db.testDao()

    @Provides
    fun provideResultDao(db: AppDatabase): ResultDao = db.resultDao()
}
