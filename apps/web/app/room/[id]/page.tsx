import RoomClient from './RoomClient';

export default function RoomPage({ params }: { params: { id: string } }) {
  // You can fetch data here, but params is always sync
  // const data = await fetch(...);
  return <RoomClient roomId={params.id} />;
}