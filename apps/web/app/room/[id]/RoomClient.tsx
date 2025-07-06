"use client";
import { useState, useEffect, useRef, useContext } from 'react';
import { ArrowLeft, Users, Share2, Volume2, VolumeX } from 'lucide-react';
import { Button } from '@repo/ui/button';
import { Card, CardContent } from '@repo/ui/card';
import { Badge } from '@repo/ui/badge';
import { useRouter } from 'next/navigation';
import { useSocket } from '@/app/socket-provider';
import { VideoPlayer } from '@/app/components/video-player/video-player';
import { UserIdContext, UserIdProvider } from '@/app/user-id-provider';

function RoomClientImpl({ roomId }: { roomId: string }) {
  const [isConnected, setIsConnected] = useState(false);
  const [participants, setParticipants] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [roomData, setRoomData] = useState<{
    title: string;
    isHost: boolean;
  } | null>(null);
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);
  const router = useRouter();
  const userId = useContext(UserIdContext);
  const peerRef = useRef<RTCPeerConnection | null>(null);
  const socket = useSocket();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [hostId, setHostId] = useState<string | null>(null);
  const hostIdRef = useRef<string | null>(null);
  const pendingCandidates = useRef<any[]>([]);
  const [isPlaying, setIsPlaying] = useState(true);
  const [notFound, setNotFound] = useState(false);

  // WebRTC: Handle incoming offer, ICE, and send answer
  useEffect(() => {
    if (!socket || !userId) return;
    // Join the room
    socket.emit('joinRoom', { roomId, userId });
    // Listen for hostId (first user in room)
    socket.on('userJoined', ({ userId: host }: { userId: string }) => {
      if (host !== userId) setHostId(host);
    });
    // Handle signaling
    const onSignal = async ({ from, signal }: { from: string; signal: any }) => {
      console.log('[VIEWER] Received signal from', from, signal);
      if (signal.type === 'offer') {
        // Always close and replace the peer connection on new offer
        if (peerRef.current) {
          peerRef.current.close();
          peerRef.current = null;
        }
        setHostId(from);
        hostIdRef.current = from;
        const peer = new RTCPeerConnection();
        peerRef.current = peer;
        // Handle remote stream
        peer.ontrack = (e) => {
          console.log('[VIEWER] Received remote track', e.streams[0]);
          setMediaStream(e.streams[0] || null);
        };
        // Send ICE candidates
        peer.onicecandidate = (e) => {
          if (e.candidate && hostIdRef.current) {
            console.log('[VIEWER] Sending ICE candidate to', hostIdRef.current, e.candidate);
            socket.emit('signal', { roomId, from: userId, to: hostIdRef.current, signal: { candidate: e.candidate } });
          }
        };
        await peer.setRemoteDescription(new RTCSessionDescription(signal));
        console.log('[VIEWER] Set remote description (offer)', peer.remoteDescription);
        const answer = await peer.createAnswer();
        console.log('[VIEWER] Created answer', answer);
        await peer.setLocalDescription(answer);
        console.log('[VIEWER] Set local description (answer)', peer.localDescription);
        socket.emit('signal', { roomId, from: userId, to: from, signal: answer });
        // Add any pending ICE candidates
        pendingCandidates.current.forEach(candidate => {
          peer.addIceCandidate(new RTCIceCandidate(candidate)).then(() => {
            console.log('[VIEWER] Added buffered ICE candidate');
          });
        });
        pendingCandidates.current = [];
      } else if (signal.candidate) {
        if (peerRef.current) {
          console.log('[VIEWER] Received ICE candidate from', from, signal.candidate);
          peerRef.current.addIceCandidate(new RTCIceCandidate(signal.candidate)).then(() => {
            console.log('[VIEWER] Added ICE candidate from', from);
          });
        } else {
          // Buffer ICE candidates until peer connection is ready
          pendingCandidates.current.push(signal.candidate);
        }
      }
    };
    socket.on('signal', onSignal);
    return () => {
      socket.off('signal', onSignal);
      socket.off('userJoined');
    };
  }, [socket, userId, roomId, hostId]);

  useEffect(() => {
    setIsConnected(true);
    setRoomData({ title: `Room ${roomId}`, isHost: false });
    const interval = setInterval(() => {
      setParticipants(prev => Math.max(1, prev + (Math.random() > 0.5 ? 1 : -1)));
    }, 10000);
    return () => {
      clearInterval(interval);
    };
  }, [roomId]);

  const handleLeaveRoom = () => {
    router.push('/');
  };

  const handleShareRoom = async () => {
    try {
      await navigator.clipboard.writeText(roomId);
    } catch (err) {
      console.error('Failed to copy room ID:', err);
    }
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
  };

  // Listen for playPause events from the server
  useEffect(() => {
    if (!socket) return;
    const onPlayPause = ({ action }: { action: 'play' | 'pause'; userId: string }) => {
      if (videoRef.current) {
        if (action === 'play') {
          videoRef.current.play();
          setIsPlaying(true);
        } else if (action === 'pause') {
          videoRef.current.pause();
          setIsPlaying(false);
        }
      }
    };
    socket.on('playPause', onPlayPause);
    return () => {
      socket.off('playPause', onPlayPause);
    };
  }, [socket]);

  // Emit playPause when user interacts
  const handlePlayPause = (action: 'play' | 'pause') => {
    if (socket && userId) {
      socket.emit('playPause', { roomId, action, userId });
    }
    setIsPlaying(action === 'play');
  };

  // Listen for seek events from the server
  useEffect(() => {
    if (!socket) return;
    const onSeek = ({ time }: { time: number; userId: string }) => {
      if (videoRef.current) {
        videoRef.current.currentTime = time;
      }
    };
    socket.on('seek', onSeek);
    return () => {
      socket.off('seek', onSeek);
    };
  }, [socket]);

  // Emit seek when user interacts
  const handleSeek = (time: number) => {
    if (socket && userId) {
      socket.emit('seek', { roomId, time, userId });
    }
    if (videoRef.current) {
      videoRef.current.currentTime = time;
    }
  };

  // Timeout to detect if no stream is received (room not found or not playing)
  useEffect(() => {
    if (mediaStream) return;
    const timeout = setTimeout(() => {
      if (!mediaStream) setNotFound(true);
    }, 3000);
    return () => clearTimeout(timeout);
  }, [mediaStream]);

  if (notFound) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-purple-950/20 flex items-center justify-center">
        <Card className="glass-card border-purple-500/20">
          <CardContent className="p-8 text-center space-y-6">
            <p className="text-purple-400 text-lg font-semibold">Nothing is playing in this room.</p>
            <Button onClick={() => router.push('/')} className="bg-gradient-to-r from-purple-500 to-pink-500 text-white w-full">Go back home</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

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
                <h1 className="text-xl font-bold text-purple-400">Room {roomId}</h1>
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
            ref={videoRef}
            mediaStream={mediaStream}
            title={roomData?.title || ''}
            isHost={roomData?.isHost}
            isMuted={isMuted}
            onPlay={() => handlePlayPause('play')}
            onPause={() => handlePlayPause('pause')}
            isPlaying={isPlaying}
            onSeek={handleSeek}
          />
        </div>
      </div>
    </div>
  );
}

export default function RoomClient(props: any) {
  return (
    <UserIdProvider>
      <RoomClientImpl {...props} />
    </UserIdProvider>
  );
} 