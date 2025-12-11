import { useEffect, useRef, useState } from "react";
import { IconBtn } from "./Icons";
import {
  ArrowRight,
  Circle,
  Eraser,
  Pencil,
  RectangleHorizontalIcon,
} from "lucide-react";
import { Game } from "@/draw/Game";


export type Tool = "circle" | "rect" | "arrow" | "pencil" | "eraser";

export function Canvas({
  roomId,
  socket,
}: {
  roomId: string;
  socket: WebSocket;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [game, setGame] = useState<Game>(); //ref to the Game class which is doing all render logic
  const [selectedTool, setSelectedTool] = useState<Tool>("pencil");

  useEffect(() => {
    game?.setTool(selectedTool);
  }, [selectedTool, game]);

  useEffect(() => {
    if (canvasRef.current) {
      const g = new Game(canvasRef.current, roomId, socket);
      setGame(g);

      return () => {
        g.destroy();
      };
    }
  }, [canvasRef]); //this means whenever the canvasRef changes i want to do something
  return (
    <div
      style={{
        height: "100vh",
        overflow: "hidden",
      }}
    >
      <canvas
        ref={canvasRef}
        width={window.innerWidth}
        height={window.innerHeight}
      ></canvas>
      <TopBar selectedTool={selectedTool} setSelectedTool={setSelectedTool} />
    </div>
  );
}

function TopBar({
  selectedTool,
  setSelectedTool,
}: {
  selectedTool: Tool;
  setSelectedTool: (s: Tool) => void;
}) {
  return (
    <div>
      <div className="flex gap-2 justify-center fixed top-2.5 left-1/2 -translate-x-1/2">
        <IconBtn
          active={selectedTool === "pencil"}
          icon={<Pencil />}
          onClick={() => {
            setSelectedTool("pencil");
          }}
        />
        <IconBtn
          active={selectedTool === "arrow"}
          icon={<ArrowRight />}
          onClick={() => {
            setSelectedTool("arrow");
          }}
        />
        <IconBtn
          active={selectedTool === "rect"}
          icon={<RectangleHorizontalIcon />}
          onClick={() => {
            setSelectedTool("rect");
          }}
        />
        <IconBtn
          active={selectedTool === "circle"}
          icon={<Circle />}
          onClick={() => {
            setSelectedTool("circle");
          }}
        />
        <IconBtn
          active={selectedTool === "eraser"}
          icon={<Eraser />}
          onClick={() => {
            setSelectedTool("eraser");
          }}
        />
      </div>
    </div>
  );
}
