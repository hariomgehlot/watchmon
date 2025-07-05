'use client';

import { useState, useEffect } from 'react';
import { ArrowLeft, Users, Share2, Volume2, VolumeX } from 'lucide-react';
import { Button } from '@repo/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@repo/ui/card';
import { Badge } from '@repo/ui/badge';
import { useRouter } from 'next/navigation';
import { VideoPlayer } from '@repo/video-player';

interface RoomPageProps {
  params: {
    id: string;
  };
}

export default function RoomPage({ params }: RoomPageProps) {
  const [isConnected, setIsConnected] = useState(false);
  const [participants, setParticipants] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [roomData, setRoomData] = useState<{
    title: string;
    videoUrl: string;
    isHost: boolean;
  } | null>(null);
  const router = useRouter();

  useEffect(() => {
    // Simulate fetching room data
    const fetchRoomData = async () => {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // For demo purposes, we'll simulate different room data
      const mockRoomData = {
        title: 'Amazing Nature Documentary',
        videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
        isHost: false
      };
      
      setRoomData(mockRoomData);
      setIsConnected(true);
    };

    fetchRoomData();

    // Simulate participants joining/leaving
    const interval = setInterval(() => {
      setParticipants(prev => Math.max(1, prev + (Math.random() > 0.5 ? 1 : -1)));
    }, 10000);

    return () => clearInterval(interval);
  }, [params.id]);

  const handleLeaveRoom = () => {
    router.push('/');
  };

  const handleShareRoom = async () => {
    try {
      await navigator.clipboard.writeText(params.id);
      // In a real app, you'd show a toast notification
    } catch (err) {
      console.error('Failed to copy room ID:', err);
    }
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
  };

  if (!isConnected || !roomData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-purple-950/20 flex items-center justify-center">
        <Card className="glass-card border-purple-500/20">
          <CardContent className="p-8 text-center">
            <div className="animate-spin w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-purple-400">Connecting to room...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-purple-950/20">
      {/* Header */}
      <div className="border-b border-purple-500/20 bg-background/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                onClick={handleLeaveRoom}
                variant="ghost"
                className="text-purple-400 hover:text-purple-300 hover:bg-purple-500/10"
              >
                <ArrowLeft className="w-5 h-5 mr-2" />
                Leave Room
              </Button>
              <div>
                <h1 className="text-xl font-bold text-purple-400">Room {params.id}</h1>
                <p className="text-sm text-muted-foreground">{roomData.title}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-blue-400" />
                <Badge variant="secondary" className="bg-blue-500/20 text-blue-400 border-blue-500/30">
                  {participants} online
                </Badge>
              </div>
              
              <Button
                onClick={toggleMute}
                variant="ghost"
                size="icon"
                className="text-purple-400 hover:text-purple-300 hover:bg-purple-500/10"
              >
                {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
              </Button>
              
              <Button
                onClick={handleShareRoom}
                variant="ghost"
                size="icon"
                className="text-purple-400 hover:text-purple-300 hover:bg-purple-500/10"
              >
                <Share2 className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Video Player */}
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <VideoPlayer
            src={roomData.videoUrl}
            title={roomData.title}
            isHost={roomData.isHost}
            isMuted={isMuted}
          />
        </div>
      </div>
    </div>
  );
}