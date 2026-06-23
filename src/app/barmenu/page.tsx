import BarMenuPage from "@/components/BarMenuPage";
import LocationGate from "@/components/LocationGate";

export default function BarMenu() {
  return (
    <LocationGate variant="bar">
      <BarMenuPage />
    </LocationGate>
  );
}
