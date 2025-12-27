import { LeftSection } from "./LeftSection";
import { RightSection } from "./RightSection";

export function TopBar() {
  return (
    <div className="h-12 border-b flex justify-between items-center px-3">
      <LeftSection />
      <RightSection />
    </div>
  );
}
