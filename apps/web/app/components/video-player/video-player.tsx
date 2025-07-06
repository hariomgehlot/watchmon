'use client';

import { useState, useRef, useEffect, forwardRef } from 'react';
import { Play, Pause, Volume2, VolumeX, SkipBack, SkipForward, Maximize, Settings } from 'lucide-react';
import { Button } from '@repo/ui/button';
import { Slider } from '@repo/ui/slider';
import { Card } from '@repo/ui/card';

interface VideoPlayerProps {
  fileUrl?: string;
  mediaStream?: MediaStream | null;
  buffer?: ArrayBuffer[] | null;
  title: string;
  isHost?: boolean;
  isMuted?: boolean;
}

export const VideoPlayer = forwardRef<HTMLVideoElement, VideoPlayerProps>(
  ({ fileUrl, mediaStream, buffer, title, isHost = false, isMuted = false }, ref) => {
    
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
    const mediaSourceRef = useRef<MediaSource | null>(null);
    const sourceBufferRef = useRef<SourceBuffer | null>(null);
    const [isSourceOpen, setIsSourceOpen] = useState(false);
    const [lastBufferLength, setLastBufferLength] = useState(0);

    // Set video source based on fileUrl, mediaStream, or buffer
    useEffect(() => {
      if (videoRef.current) {
        if (fileUrl) {
          videoRef.current.src = fileUrl;
        } else if (mediaStream) {
          // @ts-ignore
          videoRef.current.srcObject = mediaStream;
        } else if (buffer && buffer.length > 0) {
          const videoBlob = new Blob(buffer, { type: 'video/webm' });
          videoRef.current.src = URL.createObjectURL(videoBlob);
        } else {
          videoRef.current.src = '';
        }
      }
    }, [fileUrl, mediaStream, buffer]);

    useEffect(() => {
      if (videoRef.current) {
        videoRef.current.muted = isMutedLocal;
      }
    }, [isMutedLocal, isMuted]);

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

    // Setup MediaSource for real-time buffer playback (viewer only)
    useEffect(() => {
      if (!buffer || isHost) return; // Only for viewers
      if (!videoRef.current) return;
      const mediaSource = new MediaSource();
      mediaSourceRef.current = mediaSource;
      videoRef.current.src = URL.createObjectURL(mediaSource);
      const handleSourceOpen = () => {
        if (!mediaSourceRef.current || sourceBufferRef.current) return;
        sourceBufferRef.current = mediaSourceRef.current.addSourceBuffer('video/webm; codecs=vp8');
        setIsSourceOpen(true);
      };
      mediaSource.addEventListener('sourceopen', handleSourceOpen);
      return () => {
        mediaSource.removeEventListener('sourceopen', handleSourceOpen);
      };
    }, [buffer, isHost]);

    // Append new chunks to SourceBuffer as they arrive (viewer only)
    useEffect(() => {
      if (!buffer || !isSourceOpen || isHost) return;
      if (!sourceBufferRef.current) return;
      // Only append new chunks
      for (let i = lastBufferLength; i < buffer.length; i++) {
        const chunk = buffer[i];
        if (chunk instanceof ArrayBuffer && !sourceBufferRef.current.updating) {
          sourceBufferRef.current.appendBuffer(chunk);
        } else {
          // Optionally, queue chunks if updating
        }
      }
      setLastBufferLength(buffer.length);
    }, [buffer, isSourceOpen, isHost, lastBufferLength]);

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
    };

    const skipBack = () => {
      if (videoRef.current) {
        videoRef.current.currentTime = Math.max(0, (videoRef.current.currentTime ?? 0) - 10);
      }
    };

    const skipForward = () => {
      if (videoRef.current) {
        videoRef.current.currentTime = Math.min(duration ?? 0, (videoRef.current.currentTime ?? 0) + 10);
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
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            autoPlay
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