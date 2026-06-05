import { useNavigation } from "react-router";

export function RouteProgress() {
  const navigation = useNavigation();
  const isNavigating = navigation.state !== "idle";

  return (
    <div
      className={`fixed left-0 right-0 top-0 z-50 h-1 overflow-hidden bg-transparent transition-opacity ${
        isNavigating ? "opacity-100" : "opacity-0"
      }`}
      aria-hidden="true"
    >
      <div className="h-full w-1/2 animate-pulse bg-brand-primary" />
    </div>
  );
}
