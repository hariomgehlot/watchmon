'use client';

import { useState } from 'react';
import { Play, Users, Plus, ArrowRight } from 'lucide-react';
import { Button } from '@repo/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@repo/ui/card';
import { Input } from '@repo/ui/input';
import { Label } from '@repo/ui/label';
import { useRouter } from 'next/navigation';
import { UserIdProvider } from './user-id-provider';

function HomeImpl() {
  const [roomId, setRoomId] = useState('');
  const router = useRouter();

  const handleCreateRoom = () => {
    router.push('/create-room');
  };

  const handleJoinRoom = () => {
    if (roomId.trim()) {
      router.push(`/room/${roomId}`);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-purple-950/20 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 left-10 w-72 h-72 bg-purple-500/10 rounded-full blur-3xl animate-pulse-slow"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-green-500/10 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '2s' }}></div>
      </div>

      <div className="relative z-10 container mx-auto px-4 py-8">
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full mb-6 animate-float">
            <Play className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl md:text-6xl font-bold mb-4 bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent animate-pulse">
            StreamSync
          </h1>
          <p className="text-xl text-muted-foreground max-w-md mx-auto">
            Watch videos together in perfect sync with your friends
          </p>
        </div>

        <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-8">
          {/* Create Room Card */}
          <Card className="glass-card border-purple-500/20 hover:border-purple-500/40 transition-all duration-300 group">
            <CardHeader className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full mb-4 mx-auto group-hover:scale-110 transition-transform duration-300">
                <Plus className="w-8 h-8 text-white" />
              </div>
              <CardTitle className="text-2xl font-bold text-purple-400">Create Room</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-center text-muted-foreground">
                Start a new room and invite friends to watch together
              </p>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                  Upload your own videos
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  Full control over playback
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  Share room ID with friends
                </li>
              </ul>
              <Button 
                onClick={handleCreateRoom}
                className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white border-0 neon-glow"
              >
                Create New Room
                <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </CardContent>
          </Card>

          {/* Join Room Card */}
          <Card className="glass-card border-blue-500/20 hover:border-blue-500/40 transition-all duration-300 group">
            <CardHeader className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-500 to-green-500 rounded-full mb-4 mx-auto group-hover:scale-110 transition-transform duration-300">
                <Users className="w-8 h-8 text-white" />
              </div>
              <CardTitle className="text-2xl font-bold text-blue-400">Join Room</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-center text-muted-foreground">
                Enter a room ID to join an existing room
              </p>
              <div className="space-y-2">
                <Label htmlFor="roomId" className="text-sm font-medium">
                  Room ID
                </Label>
                <Input
                  id="roomId"
                  placeholder="Enter room ID..."
                  value={roomId}
                  onChange={(e) => setRoomId(e.target.value)}
                  className="bg-background/50 border-gray-600 focus:border-blue-500 focus:ring-blue-500/20"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleJoinRoom();
                    }
                  }}
                />
              </div>
              <Button 
                onClick={handleJoinRoom}
                disabled={!roomId.trim()}
                className="w-full bg-gradient-to-r from-blue-500 to-green-500 hover:from-blue-600 hover:to-green-600 text-white border-0 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Join Room
                <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Feature highlights */}
        <div className="mt-16 text-center">
          <h2 className="text-2xl font-bold mb-8 text-purple-400">Why Choose StreamSync?</h2>
          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <div className="glass-card p-6 rounded-lg border-purple-500/10">
              <div className="w-12 h-12 bg-purple-500/20 rounded-full flex items-center justify-center mb-4 mx-auto">
                <Play className="w-6 h-6 text-purple-400" />
              </div>
              <h3 className="font-semibold mb-2 text-purple-400">Perfect Sync</h3>
              <p className="text-sm text-muted-foreground">Watch videos in perfect synchronization with your friends</p>
            </div>
            <div className="glass-card p-6 rounded-lg border-blue-500/10">
              <div className="w-12 h-12 bg-blue-500/20 rounded-full flex items-center justify-center mb-4 mx-auto">
                <Users className="w-6 h-6 text-blue-400" />
              </div>
              <h3 className="font-semibold mb-2 text-blue-400">Easy Sharing</h3>
              <p className="text-sm text-muted-foreground">Simple room IDs make it easy to invite friends</p>
            </div>
            <div className="glass-card p-6 rounded-lg border-green-500/10">
              <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center mb-4 mx-auto">
                <Plus className="w-6 h-6 text-green-400" />
              </div>
              <h3 className="font-semibold mb-2 text-green-400">Your Content</h3>
              <p className="text-sm text-muted-foreground">Upload and watch your own videos together</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Home(props: any) {
  return (
    <UserIdProvider>
      <HomeImpl {...props} />
    </UserIdProvider>
  );
}