import { HTTP_BACKEND } from "@/config";
import axios from "axios";

export async function getExistingShapes(roomId: string) {
  const res = await axios.get(`${HTTP_BACKEND}/canvas/${roomId}`);
  const messages = res.data.messages; //array of messages which are shapes

  //in chat app we were sending textual data , here we are sending JSON data
  const shapes = messages.map((x: { message: string }) => {
    //converting from string to object
    const messageData = JSON.parse(x.message);
    return messageData.shape;
  });
  return shapes;
}
