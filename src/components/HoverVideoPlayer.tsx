"use client";

import React, { useRef } from 'react';

interface HoverVideoPlayerProps {
  src: string;
  className?: string;
}

export const HoverVideoPlayer: React.FC<HoverVideoPlayerProps> = ({ src, className }) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  const handleMouseEnter = () => {
    videoRef.current?.play();
  };

  const handleMouseLeave = () => {
    videoRef.current?.pause();
    if (videoRef.current) {
        videoRef.current.currentTime = 0; // Rewind to start
    }
  };

  return (
    <div 
      onMouseEnter={handleMouseEnter} 
      onMouseLeave={handleMouseLeave}
      className="w-full h-full"
    >
      <video
        ref={videoRef}
        src={src}
        loop
        muted
        playsInline
        className={`w-full h-full object-cover pointer-events-none ${className}`}
      />
    </div>
  );
};