'use client';

import { useState } from 'react';
import { ArrowLeft, Upload, Play, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useRouter } from 'next/navigation';
import { VideoPlayer } from '@/components/video-player';

export default function CreateRoom() {
  const [selectedVideo, setSelectedVideo] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState<string>('');
  const [roomId, setRoomId] = useState<string>('');
  const [isCreating, setIsCreating] = useState(false);
  const [step, setStep] = useState<'upload' | 'preview' | 'created'>('upload');
  const router = useRouter();

  const handleVideoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedVideo(file);
      const url = URL.createObjectURL(file);
      setVideoUrl(url);
      setStep('preview');
    }
  };

  const handleCreateRoom = async () => {
    setIsCreating(true);
    // Simulate room creation
    await new Promise(resolve => setTimeout(resolve, 2000));
    const generatedRoomId = Math.random().toString(36).substring(2, 8).toUpperCase();
    setRoomId(generatedRoomId);
    setStep('created');
    setIsCreating(false);
  };

  const handleJoinCreatedRoom = () => {
    router.push(`/room/${roomId}`);
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
                  onChange={handleVideoUpload}
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

              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-4">Supported formats: MP4, AVI, MOV, MKV</p>
                <p className="text-xs text-muted-foreground">Maximum file size: 500MB</p>
              </div>
            </CardContent>
          </Card>
        )}

        {step === 'preview' && selectedVideo && (
          <div className="max-w-4xl mx-auto space-y-6">
            <Card className="glass-card border-purple-500/20">
              <CardHeader>
                <CardTitle className="text-xl font-bold text-purple-400">Preview Video</CardTitle>
                <p className="text-muted-foreground">
                  {selectedVideo.name} • {(selectedVideo.size / 1024 / 1024).toFixed(1)} MB
                </p>
              </CardHeader>
              <CardContent>
                <VideoPlayer
                  src={videoUrl}
                  title={selectedVideo.name}
                  isHost={true}
                />
              </CardContent>
            </Card>

            <div className="flex gap-4 justify-center">
              <Button
                onClick={handleBack}
                variant="outline"
                className="border-gray-600 text-gray-300 hover:bg-gray-700"
              >
                Choose Different Video
              </Button>
              <Button
                onClick={handleCreateRoom}
                disabled={isCreating}
                className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white border-0 neon-glow"
              >
                {isCreating ? 'Creating Room...' : 'Create Room'}
                <Play className="ml-2 w-4 h-4" />
              </Button>
            </div>
          </div>
        )}

        {step === 'created' && (
          <Card className="glass-card border-green-500/20 max-w-2xl mx-auto">
            <CardHeader className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-green-500 to-blue-500 rounded-full mb-4 mx-auto">
                <Check className="w-8 h-8 text-white" />
              </div>
              <CardTitle className="text-2xl font-bold text-green-400">Room Created!</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <p className="text-center text-muted-foreground">
                Your room is ready! Share the room ID with your friends.
              </p>
              
              <div className="bg-background/50 p-4 rounded-lg border border-green-500/20">
                <Label className="text-sm font-medium text-green-400 mb-2 block">
                  Room ID
                </Label>
                <div className="flex items-center gap-2">
                  <Input
                    value={roomId}
                    readOnly
                    className="bg-transparent border-green-500/30 text-2xl font-mono text-center text-green-400"
                  />
                  <Button
                    onClick={() => navigator.clipboard.writeText(roomId)}
                    variant="outline"
                    className="border-green-500/30 text-green-400 hover:bg-green-500/10"
                  >
                    Copy
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  <strong>Video:</strong> {selectedVideo?.name}
                </p>
                <p className="text-sm text-muted-foreground">
                  <strong>Size:</strong> {selectedVideo && (selectedVideo.size / 1024 / 1024).toFixed(1)} MB
                </p>
              </div>

              <Button
                onClick={handleJoinCreatedRoom}
                className="w-full bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white border-0"
              >
                Join Room
                <Play className="ml-2 w-4 h-4" />
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}