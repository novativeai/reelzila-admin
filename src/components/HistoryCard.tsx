"use client";

import { Card } from "@/components/ui/card";
import { AspectRatio } from "@/components/ui/aspect-ratio";

interface Generation {
  id: string;
  outputUrl: string;
  outputType: 'video' | 'image';
  prompt: string;
  createdAt: {
    toDate: () => Date;
  };
}

interface HistoryCardProps {
  item: Generation;
}

export const HistoryCard: React.FC<HistoryCardProps> = ({ item }) => {
  return (
    <div className="w-80 flex-shrink-0">
      <Card className="overflow-hidden rounded-2xl relative group">
        <AspectRatio ratio={1 / 1} className="bg-neutral-800">
          {item.outputType === 'video' ? (
            <video src={item.outputUrl} muted loop autoPlay className="w-full h-full object-cover" />
          ) : (
            <img src={item.outputUrl} alt={item.prompt || "Generated image"} className="w-full h-full object-cover" />
          )}
        </AspectRatio>
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
        <div className="absolute bottom-0 left-0 p-4 text-white">
          <p className="font-medium line-clamp-2">{item.prompt}</p>
          <p className="text-xs text-neutral-400 mt-1">
            {item.createdAt?.toDate().toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
          </p>
        </div>
      </Card>
    </div>
  );
};