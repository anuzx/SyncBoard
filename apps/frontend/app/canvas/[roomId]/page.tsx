import {  RoomCanvas } from "@/components/RoomCanvas"

//this extracts the roomId from the params and renders the RoomCanvas component

export default async function CanvasPage({params}:{
  params: {
    roomId: string
  }
}) {
  const roomId = (await params).roomId
  
  return <RoomCanvas roomId={roomId}/>
  
}
