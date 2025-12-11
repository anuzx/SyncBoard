import { Tool } from "@/components/Canvas";
import { getExistingShapes } from "./http";

type Shape =
  | {
      type: "rect";
      x: number;
      y: number;
      width: number;
      height: number;
    }
  | {
      type: "circle";
      centerX: number;
      centerY: number;
      radius: number;
    }
  | {
      type: "pencil";
      points: { x: number; y: number }[];
    }
  | {
      type: "arrow";
      startX: number;
      startY: number;
      endX: number;
      endY: number;
    };

export class Game {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private existingShapes: Shape[];
  private roomId: string;
  private clicked: boolean;
  private startX = 0;
  private startY = 0;
  private currentPath: { x: number; y: number }[] = [];
  private selectedTool: Tool = "circle";
  private eraserSize = 20; // Size of the eraser
  socket: WebSocket;

  constructor(canvas: HTMLCanvasElement, roomId: string, socket: WebSocket) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d")!;
    this.existingShapes = [];
    this.roomId = roomId;
    this.socket = socket;
    this.clicked = false;
    this.init();
    this.initHandlers();
    this.initMouseHandlers();
  }

  destroy() {
    this.canvas.removeEventListener("mousedown", this.mouseDownHandler);
    this.canvas.removeEventListener("mouseup", this.mouseUpHandler);
    this.canvas.removeEventListener("mousemove", this.mouseMoveHandler);
  }

  setTool(tool: "circle" | "pencil" | "rect" | "arrow" | "eraser") {
    this.selectedTool = tool;
  }

  async init() {
    this.existingShapes = await getExistingShapes(this.roomId);
    this.clearCanvas();
  }

  initHandlers() {
    this.socket.onmessage = (event) => {
      const message = JSON.parse(event.data);
      console.log("Received message:", message); // Debug log

      if (message.type == "chat") {
        const parsedShape = JSON.parse(message.message);
        this.existingShapes.push(parsedShape.shape);
        this.clearCanvas();
      } else if (message.type == "erase") {
        // Update shapes when someone else erases
        console.log("Erase message received, updating shapes");
        this.existingShapes = message.shapes;
        this.clearCanvas();
      }
    };
  }

  clearCanvas() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.fillStyle = "rgba(0,0,0)";
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    this.existingShapes.forEach((shape) => {
      this.ctx.strokeStyle = "rgba(255,255,255)";
      this.ctx.lineWidth = 2;

      if (shape.type === "rect") {
        this.ctx.strokeRect(shape.x, shape.y, shape.width, shape.height);
      } else if (shape.type === "circle") {
        this.ctx.beginPath();
        this.ctx.arc(
          shape.centerX,
          shape.centerY,
          Math.abs(shape.radius),
          0,
          Math.PI * 2
        );
        this.ctx.stroke();
        this.ctx.closePath();
      } else if (shape.type === "pencil") {
        if (shape.points && shape.points.length > 1) {
          this.ctx.beginPath();
          this.ctx.moveTo(shape.points[0].x, shape.points[0].y);
          for (let i = 1; i < shape.points.length; i++) {
            this.ctx.lineTo(shape.points[i].x, shape.points[i].y);
          }
          this.ctx.stroke();
          this.ctx.closePath();
        }
      } else if (shape.type === "arrow") {
        this.drawArrow(shape.startX, shape.startY, shape.endX, shape.endY);
      }
    });
  }

  drawArrow(fromX: number, fromY: number, toX: number, toY: number) {
    const headLength = 15; // Length of arrow head
    const angle = Math.atan2(toY - fromY, toX - fromX);

    // Draw the line
    this.ctx.beginPath();
    this.ctx.moveTo(fromX, fromY);
    this.ctx.lineTo(toX, toY);
    this.ctx.stroke();

    // Draw the arrow head
    this.ctx.beginPath();
    this.ctx.moveTo(toX, toY);
    this.ctx.lineTo(
      toX - headLength * Math.cos(angle - Math.PI / 6),
      toY - headLength * Math.sin(angle - Math.PI / 6)
    );
    this.ctx.moveTo(toX, toY);
    this.ctx.lineTo(
      toX - headLength * Math.cos(angle + Math.PI / 6),
      toY - headLength * Math.sin(angle + Math.PI / 6)
    );
    this.ctx.stroke();
    this.ctx.closePath();
  }

  mouseDownHandler = (e: MouseEvent) => {
    this.clicked = true;
    const rect = this.canvas.getBoundingClientRect();
    this.startX = e.clientX - rect.left;
    this.startY = e.clientY - rect.top;

    // For pencil tool, start a new path
    if (this.selectedTool === "pencil") {
      this.currentPath = [{ x: this.startX, y: this.startY }];
    }

    // For eraser tool, start erasing immediately
    if (this.selectedTool === "eraser") {
      this.eraseAtPoint(this.startX, this.startY);
    }
  };

  mouseUpHandler = (e: MouseEvent) => {
    if (!this.clicked) return;

    this.clicked = false;

    // Don't create shapes for eraser tool
    if (this.selectedTool === "eraser") {
      return;
    }

    const rect = this.canvas.getBoundingClientRect();
    const endX = e.clientX - rect.left;
    const endY = e.clientY - rect.top;
    const width = endX - this.startX;
    const height = endY - this.startY;

    const selectedTool = this.selectedTool;
    let shape: Shape | null = null;

    if (selectedTool === "rect") {
      shape = {
        type: "rect",
        x: this.startX,
        y: this.startY,
        height,
        width,
      };
    } else if (selectedTool === "circle") {
      const radius = Math.max(Math.abs(width), Math.abs(height)) / 2;
      shape = {
        type: "circle",
        radius: radius,
        centerX: this.startX + width / 2,
        centerY: this.startY + height / 2,
      };
    } else if (selectedTool === "pencil") {
      // Only save if we have at least 2 points
      if (this.currentPath.length > 1) {
        shape = {
          type: "pencil",
          points: [...this.currentPath],
        };
      }
      this.currentPath = []; // Clear the current path
    } else if (selectedTool === "arrow") {
      shape = {
        type: "arrow",
        startX: this.startX,
        startY: this.startY,
        endX: endX,
        endY: endY,
      };
    }

    if (!shape) {
      return;
    }

    this.existingShapes.push(shape);

    this.socket.send(
      JSON.stringify({
        type: "chat",
        message: JSON.stringify({
          shape,
        }),
        roomId: this.roomId,
      })
    );
  };

  mouseMoveHandler = (e: MouseEvent) => {
    if (this.clicked) {
      const rect = this.canvas.getBoundingClientRect();
      const currentX = e.clientX - rect.left;
      const currentY = e.clientY - rect.top;
      const width = currentX - this.startX;
      const height = currentY - this.startY;

      const selectedTool = this.selectedTool;

      if (selectedTool === "eraser") {
        // Erase at current position
        this.eraseAtPoint(currentX, currentY);
      } else if (selectedTool === "pencil") {
        // Add current point to the path
        this.currentPath.push({ x: currentX, y: currentY });

        // Redraw everything
        this.clearCanvas();
        this.ctx.strokeStyle = "rgba(255, 255, 255)";
        this.ctx.lineWidth = 2;

        // Draw the current path being created
        if (this.currentPath.length > 1) {
          this.ctx.beginPath();
          this.ctx.moveTo(this.currentPath[0].x, this.currentPath[0].y);
          for (let i = 1; i < this.currentPath.length; i++) {
            this.ctx.lineTo(this.currentPath[i].x, this.currentPath[i].y);
          }
          this.ctx.stroke();
          this.ctx.closePath();
        }
      } else {
        // For other tools, clear and redraw preview
        this.clearCanvas();
        this.ctx.strokeStyle = "rgba(255, 255, 255)";
        this.ctx.lineWidth = 2;

        if (selectedTool === "rect") {
          this.ctx.strokeRect(this.startX, this.startY, width, height);
        } else if (selectedTool === "circle") {
          const radius = Math.max(Math.abs(width), Math.abs(height)) / 2;
          const centerX = this.startX + width / 2;
          const centerY = this.startY + height / 2;
          this.ctx.beginPath();
          this.ctx.arc(centerX, centerY, Math.abs(radius), 0, Math.PI * 2);
          this.ctx.stroke();
          this.ctx.closePath();
        } else if (selectedTool === "arrow") {
          this.drawArrow(this.startX, this.startY, currentX, currentY);
        }
      }
    }
  };

  eraseAtPoint(x: number, y: number) {
    const eraserRadius = this.eraserSize / 2;
    let shapesRemoved = false;

    // Filter out shapes that intersect with the eraser
    const newShapes = this.existingShapes.filter((shape) => {
      if (shape.type === "rect") {
        // Check if eraser intersects with rectangle
        const intersects = !(
          x + eraserRadius < shape.x ||
          x - eraserRadius > shape.x + shape.width ||
          y + eraserRadius < shape.y ||
          y - eraserRadius > shape.y + shape.height
        );
        if (intersects) {
          shapesRemoved = true;
          return false;
        }
        return true;
      } else if (shape.type === "circle") {
        // Check if eraser intersects with circle
        const distance = Math.sqrt(
          Math.pow(x - shape.centerX, 2) + Math.pow(y - shape.centerY, 2)
        );
        if (distance < shape.radius + eraserRadius) {
          shapesRemoved = true;
          return false;
        }
        return true;
      } else if (shape.type === "pencil" && shape.points) {
        // Check if eraser intersects with any point in the pencil path
        for (const point of shape.points) {
          const distance = Math.sqrt(
            Math.pow(x - point.x, 2) + Math.pow(y - point.y, 2)
          );
          if (distance < eraserRadius) {
            shapesRemoved = true;
            return false;
          }
        }
        return true;
      } else if (shape.type === "arrow") {
        // Check if eraser intersects with arrow
        // Check endpoints
        const distToStart = Math.sqrt(
          Math.pow(x - shape.startX, 2) + Math.pow(y - shape.startY, 2)
        );
        const distToEnd = Math.sqrt(
          Math.pow(x - shape.endX, 2) + Math.pow(y - shape.endY, 2)
        );

        if (distToStart < eraserRadius || distToEnd < eraserRadius) {
          shapesRemoved = true;
          return false;
        }

        // Check if eraser intersects with the arrow line
        const lineLength = Math.sqrt(
          Math.pow(shape.endX - shape.startX, 2) +
            Math.pow(shape.endY - shape.startY, 2)
        );

        if (lineLength === 0) return true;

        // Calculate distance from point to line segment
        const t = Math.max(
          0,
          Math.min(
            1,
            ((x - shape.startX) * (shape.endX - shape.startX) +
              (y - shape.startY) * (shape.endY - shape.startY)) /
              (lineLength * lineLength)
          )
        );

        const projX = shape.startX + t * (shape.endX - shape.startX);
        const projY = shape.startY + t * (shape.endY - shape.startY);

        const distToLine = Math.sqrt(
          Math.pow(x - projX, 2) + Math.pow(y - projY, 2)
        );

        if (distToLine < eraserRadius) {
          shapesRemoved = true;
          return false;
        }

        return true;
      }
      return true;
    });

    if (shapesRemoved) {
      this.existingShapes = newShapes;

      // Broadcast the deletion to other users
      this.socket.send(
        JSON.stringify({
          type: "erase",
          shapes: this.existingShapes,
          roomId: this.roomId,
        })
      );

      this.clearCanvas();
    }
  }

  initMouseHandlers() {
    this.canvas.addEventListener("mousedown", this.mouseDownHandler);
    this.canvas.addEventListener("mouseup", this.mouseUpHandler);
    this.canvas.addEventListener("mousemove", this.mouseMoveHandler);
  }
}
