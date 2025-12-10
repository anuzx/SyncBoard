import { useEffect, useRef, useState } from "react";
import { IconBtn } from "./Icons";
import { Circle, Pencil, RectangleHorizontalIcon } from "lucide-react";
import { Game } from "@/draw/Game";


//this component renders the canvas and calls initDraw fxn
export type Tool = "circle" | "rect" | "pencil";

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
    <div
      style={{
        position: "fixed",
        top: 10,
        left: 710,
      }}
    >
      <div className="flex gap-2">
        <IconBtn
          active={selectedTool === "pencil"}
          icon={<Pencil />}
          onClick={() => {
            setSelectedTool("pencil");
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
      </div>
    </div>
  );
}
