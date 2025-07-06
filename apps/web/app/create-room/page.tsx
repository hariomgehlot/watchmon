'use client';
import { useState, useEffect, useRef, useContext } from 'react';
import { ArrowLeft, Upload } from 'lucide-react';
import { Button } from '@repo/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@repo/ui/card';
import { Input } from '@repo/ui/input';
import { Label } from '@repo/ui/label';
import { useRouter } from 'next/navigation';
import { VideoPlayer } from '../components/video-player/video-player';
import { UserIdProvider, UserIdContext } from '../user-id-provider';
import { useSocket } from '../socket-provider';

function CreateRoomImpl() {

  const [selectedVideo, setSelectedVideo] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState<string>('');
  const [roomId, setRoomId] = useState<string>('');
  const [isCreating, setIsCreating] = useState(false);
  const [step, setStep] = useState<'upload' | 'preview' | 'created'>('upload');
  const [joined, setJoined] = useState(false);
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);
  const [recorderStarted, setRecorderStarted] = useState(false);
  const [playbackUrl, setPlaybackUrl] = useState<string>('');
  const [isStarting, setIsStarting] = useState(false);
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const socket = useSocket();
  const userId = useContext(UserIdContext);
  const peerConnections = useRef<{ [viewerId: string]: RTCPeerConnection }>({});

  // Set playbackUrl when selectedVideo changes
  useEffect(() => {
    if (!selectedVideo) return;
    const url = URL.createObjectURL(selectedVideo);
    setPlaybackUrl(url);
    return () => {
      URL.revokeObjectURL(url);
    };
  }, [selectedVideo]);

  // Handle viewerJoined: create a new peer connection for each viewer
  useEffect(() => {
    if (!socket || !userId || !mediaStream) return;
    const onViewerJoined = async ({ viewerId }: { viewerId: string }) => {
      if (peerConnections.current[viewerId]) return; // Already connected
      const peer = new RTCPeerConnection();
      peerConnections.current[viewerId] = peer;
      // Add all tracks
      mediaStream.getTracks().forEach((track: MediaStreamTrack) => {
        console.log('[HOST] Adding track to peer', viewerId, track);
        peer.addTrack(track, mediaStream);
      });
      // Send ICE candidates
      peer.onicecandidate = (e) => {
        if (e.candidate) {
          console.log('[HOST] Sending ICE candidate to', viewerId, e.candidate);
          socket.emit('signal', { roomId, from: userId, to: viewerId, signal: { candidate: e.candidate } });
        }
      };
      // Create offer and send to viewer
      const offer = await peer.createOffer();
      console.log('[HOST] Created offer for', viewerId, offer);
      await peer.setLocalDescription(offer);
      console.log('[HOST] Set local description for', viewerId, peer.localDescription);
      socket.emit('signal', { roomId, from: userId, to: viewerId, signal: offer });
    };
    socket.on('viewerJoined', onViewerJoined);
    return () => {
      socket.off('viewerJoined', onViewerJoined);
    };
  }, [socket, userId, mediaStream, roomId]);

  // Handle targeted answers and ICE candidates from viewers
  useEffect(() => {
    if (!socket || !userId) return;
    const onSignal = ({ from, signal }: { from: string; signal: any }) => {
      const peer = peerConnections.current[from];
      if (!peer) return;
      if (signal.type === 'answer') {
        console.log('[HOST] Received answer from', from, signal);
        peer.setRemoteDescription(new RTCSessionDescription(signal)).then(() => {
          console.log('[HOST] Set remote description (answer) for', from, peer.remoteDescription);
        });
      } else if (signal.candidate) {
        console.log('[HOST] Received ICE candidate from', from, signal.candidate);
        peer.addIceCandidate(new RTCIceCandidate(signal.candidate)).then(() => {
          console.log('[HOST] Added ICE candidate from', from);
        });
      }
    };
    socket.on('signal', onSignal);
    return () => {
      socket.off('signal', onSignal);
    };
  }, [socket, userId]);

  // Listen for roomCreated event only after requesting room creation
  useEffect(() => {
    if (!socket) return;
    const onRoomCreated = ({ roomId }: { roomId: string }) => {
      setRoomId(roomId);
      socket.emit('joinRoom', { roomId, userId });
      setJoined(true);
      setIsCreating(false);
      setIsStarting(false);
      setStep('created');
    };
    socket.on('roomCreated', onRoomCreated);
    return () => {
      socket.off('roomCreated', onRoomCreated);
    };
  }, [socket, userId]);

  // Capture the video stream for WebRTC after room is created and video is ready
  useEffect(() => {
    if (
      step !== 'created' ||
      !joined ||
      !videoRef.current ||
      !selectedVideo ||
      mediaStream // Only capture once
    ) return;

    // Wait for video to be ready
    const handleReady = () => {
      const stream = (videoRef.current as any).captureStream();
      setMediaStream(stream);
    };

    if (videoRef.current.readyState >= 2) {
      handleReady();
    } else {
      videoRef.current.addEventListener('loadedmetadata', handleReady, { once: true });
      return () => {
        videoRef.current?.removeEventListener('loadedmetadata', handleReady);
      };
    }
  }, [step, joined, selectedVideo, mediaStream]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setSelectedVideo(f);
    setVideoUrl(URL.createObjectURL(f));
    setStep('preview');
  };

  const handleBack = () => {
    if (step === 'preview') {
      setStep('upload');
      setSelectedVideo(null);
      setVideoUrl('');
    } else {
      router.push('/');
    }
  };

  // Start room and streaming only after clicking Start Watching
  const handleStartWatching = () => {
    if (!userId || !socket || !selectedVideo) return;
    setIsCreating(true);
    setIsStarting(true);
    socket.emit('createRoom', { userId });
    // roomCreated event will handle the rest
  };

  const handleJoinCreatedRoom = () => {
    router.push(`/room/${roomId}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-purple-950/20 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 left-10 w-72 h-72 bg-purple-500/10 rounded-full blur-3xl animate-pulse-slow"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '1s' }}></div>
      </div>

      <div className="relative z-10 container mx-auto px-4 py-8">
        <div className="flex items-center gap-4 mb-8">
          <Button
            onClick={handleBack}
            variant="ghost"
            className="text-purple-400 hover:text-purple-300 hover:bg-purple-500/10"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back
          </Button>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            Create Room
          </h1>
        </div>

        {step === 'upload' && (
          <Card className="glass-card border-purple-500/20 max-w-2xl mx-auto">
            <CardHeader className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full mb-4 mx-auto">
                <Upload className="w-8 h-8 text-white" />
              </div>
              <CardTitle className="text-2xl font-bold text-purple-400">Upload Video</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <p className="text-center text-muted-foreground">
                Choose a video file to share with your friends
              </p>
              <div className="border-2 border-dashed border-purple-500/30 rounded-lg p-8 text-center hover:border-purple-500/50 transition-colors">
                <input
                  type="file"
                  accept="video/*"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="video-upload"
                />
                <Label
                  htmlFor="video-upload"
                  className="cursor-pointer flex flex-col items-center gap-4"
                >
                  <div className="w-16 h-16 bg-purple-500/20 rounded-full flex items-center justify-center">
                    <Upload className="w-8 h-8 text-purple-400" />
                  </div>
                  <div>
                    <p className="text-lg font-medium text-purple-400">Click to upload video</p>
                    <p className="text-sm text-muted-foreground">Support MP4, AVI, MOV files</p>
                  </div>
                </Label>
              </div>
            </CardContent>
          </Card>
        )}

        {step === 'preview' && selectedVideo && (
          <Card className="glass-card border-purple-500/20 max-w-2xl mx-auto">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl font-bold text-purple-400">Preview Video</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {playbackUrl ? (
                <VideoPlayer
                  fileUrl={playbackUrl}
                  title={selectedVideo.name}
                  isHost={true}
                  isMuted={false}
                  ref={videoRef}
                />
              ) : (
                <div className="w-full aspect-video bg-black flex items-center justify-center text-gray-400">
                  No video selected
                </div>
              )}
              <Button onClick={handleStartWatching} className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white" disabled={isCreating || isStarting}>
                {isCreating || isStarting ? 'Starting...' : 'Start Watching'}
              </Button>
            </CardContent>
          </Card>
        )}

        {step === 'created' && (
          <Card className="glass-card border-purple-500/20 max-w-2xl mx-auto">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl font-bold text-purple-400">Room Created</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <p className="text-center text-muted-foreground">
                Room ID: <span className="font-mono text-purple-400">{roomId}</span>
              </p>
              <Button onClick={handleJoinCreatedRoom} className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white">
                Go to Room
              </Button>
              <VideoPlayer fileUrl={playbackUrl} title="Your Stream" isHost isMuted={false} ref={videoRef} />
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

export default function CreateRoom(props: any) {
  return (
    <UserIdProvider>
      <CreateRoomImpl /* @next-codemod-error 'props' is used with spread syntax (...). Any asynchronous properties of 'props' must be awaited when accessed. */
      {...props} />
    </UserIdProvider>
  );
}