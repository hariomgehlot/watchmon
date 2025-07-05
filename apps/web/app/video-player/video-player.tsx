'use client';

import { useState, useRef, useEffect } from 'react';
import { Play, Pause, Volume2, VolumeX, SkipBack, SkipForward, Maximize, Settings } from 'lucide-react';
import { Button } from '@repo/ui/button';
import { Slider } from '@repo/ui/slider';
import { Card } from '@repo/ui/card';

interface VideoPlayerProps {
  src: string;
  title: string;
  isHost?: boolean;
  isMuted?: boolean;
}

export function VideoPlayer({ src, title, isHost = false, isMuted = false }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMutedLocal, setIsMutedLocal] = useState(isMuted);
  const [volume, setVolume] = useState(1);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showControls, setShowControls] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.muted = isMutedLocal;
    }
  }, [isMutedLocal, isMuted]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const updateTime = () => setCurrentTime(video.currentTime);
    const updateDuration = () => setDuration(video.duration);

    video.addEventListener('timeupdate', updateTime);
    video.addEventListener('loadedmetadata', updateDuration);

    return () => {
      video.removeEventListener('timeupdate', updateTime);
      video.removeEventListener('loadedmetadata', updateDuration);
    };
  }, []);

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const toggleMute = () => {
    setIsMutedLocal(!isMutedLocal);
  };

  const handleVolumeChange = (value: number[]) => {
    const newVolume = value[0];
    setVolume(newVolume);
    if (videoRef.current) {
      videoRef.current.volume = newVolume;
    }
  };

  const handleTimeChange = (value: number[]) => {
    const newTime = value[0];
    setCurrentTime(newTime);
    if (videoRef.current) {
      videoRef.current.currentTime = newTime;
    }
  };

  const skipBack = () => {
    if (videoRef.current) {
      videoRef.current.currentTime = Math.max(0, videoRef.current.currentTime - 10);
    }
  };

  const skipForward = () => {
    if (videoRef.current) {
      videoRef.current.currentTime = Math.min(duration, videoRef.current.currentTime + 10);
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    // Only handle clicks on the overlay itself, not on buttons
    if (e.target === e.currentTarget && isHost) {
      togglePlay();
    }
  };

  return (
    <Card className="glass-card border-purple-500/20 overflow-hidden">
      <div
        ref={containerRef}
        className="relative group"
        onMouseEnter={() => setShowControls(true)}
        onMouseLeave={() => setShowControls(false)}
      >
        <video
          ref={videoRef}
          className="w-full aspect-video bg-black"
          src={src}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
        />

        {/* Clickable Overlay */}
        <div 
          className="absolute inset-0 cursor-pointer"
          onClick={handleOverlayClick}
        />

        {/* Play/Pause Overlay with Skip Buttons - Only show when paused */}
        {!isPlaying && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/20 pointer-events-none">
            <div className="flex items-center gap-8 pointer-events-auto">
              {/* Skip Backward Button */}
              {isHost && (
                <Button
                  onClick={skipBack}
                  size="icon"
                  className="w-16 h-16 bg-white/10 hover:bg-white/20 border-2 border-white/30 rounded-full backdrop-blur-sm transition-all duration-300 hover:scale-110"
                >
                  <SkipBack className="w-6 h-6 text-white" />
                </Button>
              )}
              
              {/* Main Play Button with Animation */}
              <div 
                className="w-20 h-20 bg-white/10 hover:bg-white/20 border-2 border-white/30 rounded-full backdrop-blur-sm flex items-center justify-center cursor-pointer transition-all duration-300 hover:scale-110 group/play"
                onClick={isHost ? togglePlay : undefined}
              >
                <div className="relative w-8 h-8 flex items-center justify-center">
                  {/* Play Icon */}
                  <div className={`absolute inset-0 flex items-center justify-center transition-all duration-500 ease-in-out ${
                    !isPlaying ? 'opacity-100 scale-100 rotate-0' : 'opacity-0 scale-75 rotate-90'
                  }`}>
                    <Play className="w-8 h-8 text-white ml-1" />
                  </div>
                  
                  {/* Pause Icon */}
                  <div className={`absolute inset-0 flex items-center justify-center transition-all duration-500 ease-in-out ${
                    isPlaying ? 'opacity-100 scale-100 rotate-0' : 'opacity-0 scale-75 -rotate-90'
                  }`}>
                    <Pause className="w-8 h-8 text-white" />
                  </div>
                </div>
              </div>
              
              {/* Skip Forward Button */}
              {isHost && (
                <Button
                  onClick={skipForward}
                  size="icon"
                  className="w-16 h-16 bg-white/10 hover:bg-white/20 border-2 border-white/30 rounded-full backdrop-blur-sm transition-all duration-300 hover:scale-110"
                >
                  <SkipForward className="w-6 h-6 text-white" />
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Floating Play/Pause Button for Playing State - Only show on hover when playing */}
        {isPlaying && showControls && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div 
              className="w-16 h-16 bg-black/40 hover:bg-black/60 border-2 border-white/20 rounded-full backdrop-blur-sm flex items-center justify-center cursor-pointer transition-all duration-300 hover:scale-110 pointer-events-auto"
              onClick={isHost ? togglePlay : undefined}
            >
              <div className="relative w-6 h-6 flex items-center justify-center">
                {/* Play Icon */}
                <div className={`absolute inset-0 flex items-center justify-center transition-all duration-500 ease-in-out ${
                  !isPlaying ? 'opacity-100 scale-100 rotate-0' : 'opacity-0 scale-75 rotate-90'
                }`}>
                  <Play className="w-6 h-6 text-white ml-0.5" />
                </div>
                
                {/* Pause Icon */}
                <div className={`absolute inset-0 flex items-center justify-center transition-all duration-500 ease-in-out ${
                  isPlaying ? 'opacity-100 scale-100 rotate-0' : 'opacity-0 scale-75 -rotate-90'
                }`}>
                  <Pause className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Controls - Only show on hover */}
        <div className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent transition-opacity duration-300 pointer-events-none ${showControls ? 'opacity-100' : 'opacity-0'}`}>
          <div className="p-4 space-y-4 pointer-events-auto">
            {/* Progress Bar */}
            <div className="flex items-center gap-2 text-white text-sm">
              <span>{formatTime(currentTime)}</span>
              <Slider
                value={[currentTime]}
                max={duration}
                step={1}
                onValueChange={handleTimeChange}
                className="flex-1"
              />
              <span>{formatTime(duration)}</span>
            </div>

            {/* Control Buttons */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {/* Previous, Play/Pause, Next buttons grouped together */}
                <Button
                  onClick={skipBack}
                  size="icon"
                  variant="ghost"
                  className="text-white hover:bg-white/10 transition-all duration-200"
                  disabled={!isHost}
                >
                  <SkipBack className="w-5 h-5" />
                </Button>
                
                <Button
                  onClick={togglePlay}
                  size="icon"
                  variant="ghost"
                  className="text-white hover:bg-white/10 transition-all duration-200"
                  disabled={!isHost}
                >
                  <div className="relative w-5 h-5 flex items-center justify-center">
                    {/* Play Icon */}
                    <div className={`absolute inset-0 flex items-center justify-center transition-all duration-300 ease-in-out ${
                      !isPlaying ? 'opacity-100 scale-100' : 'opacity-0 scale-75'
                    }`}>
                      <Play className="w-5 h-5" />
                    </div>
                    
                    {/* Pause Icon */}
                    <div className={`absolute inset-0 flex items-center justify-center transition-all duration-300 ease-in-out ${
                      isPlaying ? 'opacity-100 scale-100' : 'opacity-0 scale-75'
                    }`}>
                      <Pause className="w-5 h-5" />
                    </div>
                  </div>
                </Button>
                
                <Button
                  onClick={skipForward}
                  size="icon"
                  variant="ghost"
                  className="text-white hover:bg-white/10 transition-all duration-200"
                  disabled={!isHost}
                >
                  <SkipForward className="w-5 h-5" />
                </Button>

                {/* Volume controls */}
                <div className="flex items-center gap-2 ml-4">
                  <Button
                    onClick={toggleMute}
                    size="icon"
                    variant="ghost"
                    className="text-white hover:bg-white/10"
                  >
                    {isMutedLocal ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                  </Button>
                  
                  <div className="w-20">
                    <Slider
                      value={[volume]}
                      max={1}
                      step={0.1}
                      onValueChange={handleVolumeChange}
                      className="w-full"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  size="icon"
                  variant="ghost"
                  className="text-white hover:bg-white/10"
                >
                  <Settings className="w-5 h-5" />
                </Button>
                
                <Button
                  onClick={toggleFullscreen}
                  size="icon"
                  variant="ghost"
                  className="text-white hover:bg-white/10"
                >
                  <Maximize className="w-5 h-5" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Host/Viewer Badge */}
        <div className="absolute top-4 right-4 pointer-events-none">
          <div className={`px-3 py-1 rounded-full text-xs font-medium ${
            isHost 
              ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30' 
              : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
          }`}>
            {isHost ? 'Host' : 'Viewer'}
          </div>
        </div>
      </div>
    </Card>
  );
}