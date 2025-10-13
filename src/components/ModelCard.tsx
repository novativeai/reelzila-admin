"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { HoverVideoPlayer } from "@/components/HoverVideoPlayer"; // Make sure this is imported

interface Model {
  id: string;
  displayName: string;
  description: string;
  tags: string[];
  cardVideo: string; // Expect the video source
  outputType: 'video' | 'image';
}

interface ModelCardProps {
  model: Model;
}

export const ModelCard: React.FC<ModelCardProps> = ({ model }) => {
  return (
    <Link href={`/generator?model=${model.id}`} className="group">
      <Card className="bg-[#1C1C1C] border-neutral-800 rounded-2xl p-4 transition-all h-full group-hover:ring-2 group-hover:ring-white/50 overflow-hidden">
        <div className="aspect-video rounded-lg overflow-hidden">
          {/* --- THE FIX: Replaced <img> with HoverVideoPlayer --- */}
          <HoverVideoPlayer src={model.cardVideo} />
        </div>
        <div className="p-4">
          <Badge variant="outline" className="border-neutral-500 text-neutral-300 capitalize">{model.outputType}</Badge>
          <h3 className="text-xl font-bold mt-4 text-white">{model.displayName}</h3>
          <p className="text-neutral-400 mt-2 text-sm line-clamp-2">{model.description}</p>
          <div className="flex gap-2 mt-4">
            {model.tags.map(tag => <Badge key={tag} className="bg-neutral-700 text-neutral-200 hover:bg-neutral-600">{tag}</Badge>)}
          </div>
        </div>
      </Card>
    </Link>
  );
};