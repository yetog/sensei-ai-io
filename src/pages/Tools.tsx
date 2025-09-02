import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { QuoteGenerator } from '@/components/QuoteGenerator';
import { PodcastGenerator } from '@/components/PodcastGenerator';
import { FileText, Mic, BarChart3, Settings } from 'lucide-react';

export default function Tools() {
  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Sales Tools</h1>
        <p className="text-muted-foreground">AI-powered tools to supercharge your sales process</p>
      </div>

      <Tabs defaultValue="quotes" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="quotes" className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Quote Generator
          </TabsTrigger>
          <TabsTrigger value="podcasts" className="flex items-center gap-2">
            <Mic className="w-4 h-4" />
            Meeting Prep Podcasts
          </TabsTrigger>
        </TabsList>

        <TabsContent value="quotes" className="space-y-4">
          <QuoteGenerator />
        </TabsContent>

        <TabsContent value="podcasts" className="space-y-4">
          <PodcastGenerator />
        </TabsContent>
      </Tabs>
    </div>
  );
}