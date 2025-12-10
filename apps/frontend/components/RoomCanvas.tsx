"use client"

//this RoomCanvas component creates a socket connection to our ws server and until the conenction is made it renders "connecting to server" and after the connection is made it renders Canvas component

import { WS_URL } from "@/config";
import { useEffect, useState } from "react";
import { Canvas } from "./Canvas";


export function RoomCanvas({roomId}:{roomId:string}) {
    
    const [socket, setSocket] = useState<WebSocket |null>(null)
    

    //effect which runs whenever the component mounts and es server is on
    useEffect(() => {
        const ws = new WebSocket(
          `${WS_URL}?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI5NDk2M2MyYi01NTUzLTRmYjQtYmFkNC1mZmEzZDIwYjU3M2UiLCJpYXQiOjE3NjUzMjAwOTN9.zlTrtvFLNMSNwuPKZZet6FsubwC6EOc_TjY5qqyI3q0`
        );
        ws.onopen = () => {
          setSocket(ws)
          const data =JSON.stringify({
            //go to ws-backend and see what parameters are you taking in join_room
            type: "join_room",
            roomId //roomId that we got in input
          })
          ws.send(data)
        }
    },[])

    

    if (!socket) {
        return <div>
            Connecting to server ....
        </div>
    }

    return (
      <div>
        <Canvas roomId={roomId} socket={socket} />
        
       
      </div>
    );
}