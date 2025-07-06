import RoomClient from './RoomClient';

export default async function RoomPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  return <RoomClient roomId={params.id} />;
}