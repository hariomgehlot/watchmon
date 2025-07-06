'use client';

import { useState, useRef, useEffect, forwardRef } from 'react';
import { Play, Pause, Volume2, VolumeX, SkipBack, SkipForward, Maximize, Settings } from 'lucide-react';
import { Button } from '@repo/ui/button';
import { Slider } from '@repo/ui/slider';
import { Card } from '@repo/ui/card';

interface VideoPlayerProps {
  fileUrl?: string;
  mediaStream?: MediaStream | null;
  title: string;
  isHost?: boolean;
  isMuted?: boolean;
  onPlay?: () => void;
  onPause?: () => void;
  isPlaying?: boolean;
  onSeek?: (time: number) => void;
}

// Helper to detect mobile devices
function isMobileDevice() {
  return (
    typeof window !== 'undefined' &&
    /Mobi|Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
  );
}

export const VideoPlayer = forwardRef<HTMLVideoElement, VideoPlayerProps>(
  ({ fileUrl, mediaStream, title, isHost = false, isMuted = false, onPlay, onPause, isPlaying: isPlayingProp, onSeek }, ref) => {
    const innerVideoRef = useRef<HTMLVideoElement>(null);
    const videoRef = (ref as React.RefObject<HTMLVideoElement>) || innerVideoRef;
    const [isPlaying, setIsPlaying] = useState(false);
    const [isMutedLocal, setIsMutedLocal] = useState(isMuted);
    const [volume, setVolume] = useState(1);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [showControls, setShowControls] = useState(true);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    // Sync isPlaying state with prop if provided
    useEffect(() => {
      if (typeof isPlayingProp === 'boolean') {
        setIsPlaying(isPlayingProp);
      }
    }, [isPlayingProp]);

    // Set video source based on fileUrl or mediaStream
    useEffect(() => {
      if (videoRef.current) {
        if (fileUrl) {
          videoRef.current.src = fileUrl;
        } else if (mediaStream) {
          // @ts-ignore
          videoRef.current.srcObject = mediaStream;
        } else {
          videoRef.current.src = '';
        }
      }
    }, [fileUrl, mediaStream]);

    useEffect(() => {
      if (videoRef.current) {
        videoRef.current.muted = isMutedLocal;
      }
    }, [isMutedLocal, isMuted, isHost]);

    useEffect(() => {
      const video = videoRef.current;
      if (!video) return;
      const updateTime = () => {
        const t = Number(video.currentTime);
        setCurrentTime(Number.isFinite(t) ? t : 0);
      };
      const updateDuration = () => {
        const d = Number(video.duration);
        setDuration(Number.isFinite(d) ? d : 0);
      };
      video.addEventListener('timeupdate', updateTime);
      video.addEventListener('loadedmetadata', updateDuration);
      return () => {
        video.removeEventListener('timeupdate', updateTime);
        video.removeEventListener('loadedmetadata', updateDuration);
      };
    }, []);

    // Handle orientation lock/unlock on fullscreen change
    useEffect(() => {
      function handleFullscreenChange() {
        const isNowFullscreen = !!document.fullscreenElement;
        setIsFullscreen(isNowFullscreen);
        if (isNowFullscreen) {
          // Entering fullscreen
          if (isMobileDevice() && screen.orientation && typeof (screen.orientation as any).lock === 'function') {
            (screen.orientation as any).lock('landscape').catch(() => {});
          }
        } else {
          // Exiting fullscreen
          if (isMobileDevice() && screen.orientation && typeof (screen.orientation as any).unlock === 'function') {
            (screen.orientation as any).unlock();
          }
        }
      }
      document.addEventListener('fullscreenchange', handleFullscreenChange);
      return () => {
        document.removeEventListener('fullscreenchange', handleFullscreenChange);
      };
    }, []);

    const togglePlay = () => {
      if (videoRef.current) {
        if (isPlaying) {
          videoRef.current.pause();
          if (onPause) onPause();
        } else {
          videoRef.current.play();
          if (onPlay) onPlay();
        }
        setIsPlaying(!isPlaying);
      }
    };

    const toggleMute = () => {
      setIsMutedLocal(!isMutedLocal);
    };

    const handleVolumeChange = (value: number[]) => {
      const newVolume = value[0] ?? 1;
      setVolume(newVolume);
      if (videoRef.current) {
        videoRef.current.volume = newVolume;
      }
    };

    const handleTimeChange = (value: number[]) => {
      const newTime = value[0] ?? 0;
      setCurrentTime(newTime);
      if (videoRef.current) {
        videoRef.current.currentTime = newTime;
      }
      if (onSeek) onSeek(newTime);
    };

    const skipBack = () => {
      if (videoRef.current) {
        videoRef.current.currentTime = Math.max(0, (videoRef.current.currentTime ?? 0) - 10);
        if (onSeek) onSeek(videoRef.current.currentTime);
      }
    };

    const skipForward = () => {
      if (videoRef.current) {
        videoRef.current.currentTime = Math.min(duration ?? 0, (videoRef.current.currentTime ?? 0) + 10);
        if (onSeek) onSeek(videoRef.current.currentTime);
      }
    };

    const toggleFullscreen = () => {
      if (!document.fullscreenElement) {
        containerRef.current?.requestFullscreen();
        // Orientation lock will be handled by fullscreenchange event
      } else {
        document.exitFullscreen();
        // Orientation unlock will be handled by fullscreenchange event
      }
    };

    const formatTime = (time: number) => {
      const minutes = Math.floor(time / 60);
      const seconds = Math.floor(time % 60);
      return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    };

    const handleOverlayClick = (e: React.MouseEvent) => {
      // Only handle clicks on the overlay itself, not on buttons
      if (e.target === e.currentTarget) {
        togglePlay();
      }
    };

    return (
      <Card className="glass-card border-purple-500/20 overflow-hidden rounded-3xl">
        <div
          ref={containerRef}
          className="relative group"
          onMouseEnter={() => setShowControls(true)}
          onMouseLeave={() => setShowControls(false)}
        >
          <video
            ref={videoRef}
            className="w-full aspect-video bg-black"
            onPlay={() => {
              setIsPlaying(true);
              if (onPlay) onPlay();
            }}
            onPause={() => {
              setIsPlaying(false);
              if (onPause) onPause();
            }}
            autoPlay
            muted={isMutedLocal}
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
                <Button
                  onClick={skipBack}
                  size="icon"
                  className="w-16 h-16 bg-white/10 hover:bg-white/20 border-2 border-white/30 rounded-full backdrop-blur-sm transition-all duration-300 hover:scale-110"
                >
                  <SkipBack className="w-6 h-6 text-white" />
                </Button>
                {/* Main Play Button with Animation */}
                <div 
                  className="w-20 h-20 bg-white/10 hover:bg-white/20 border-2 border-white/30 rounded-full backdrop-blur-sm flex items-center justify-center cursor-pointer transition-all duration-300 hover:scale-110 group/play"
                  onClick={togglePlay}
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
                <Button
                  onClick={skipForward}
                  size="icon"
                  className="w-16 h-16 bg-white/10 hover:bg-white/20 border-2 border-white/30 rounded-full backdrop-blur-sm transition-all duration-300 hover:scale-110"
                >
                  <SkipForward className="w-6 h-6 text-white" />
                </Button>
              </div>
            </div>
          )}

          {/* Controls - Only show on hover */}
          {showControls && (
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent transition-opacity duration-300 pointer-events-none opacity-100">
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
                    <Button
                      onClick={skipBack}
                      size="icon"
                      variant="ghost"
                      className="text-white hover:bg-white/10 transition-all duration-200"
                    >
                      <SkipBack className="w-5 h-5" />
                    </Button>
                    <Button
                      onClick={togglePlay}
                      size="icon"
                      variant="ghost"
                      className="text-white hover:bg-white/10 transition-all duration-200"
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
          )}

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
);

VideoPlayer.displayName = "VideoPlayer";