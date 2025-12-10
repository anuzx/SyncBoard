
import { ReactNode } from "react";

export function IconBtn({
  icon,
  onClick,
  active,
}: {
  icon: ReactNode;
  onClick: () => void;
  active: boolean;
}) {
  return (
    <div
      className={`pointer rounded-full border p-2 bg-black hover:bg-gray ${active? "text-blue-500":"text-white"}`}
      onClick={onClick}
    >
      {icon}
    </div>
  );
}
