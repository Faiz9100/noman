import { Link } from "react-router-dom";
import { Button } from "../components/common/Button";
import { ROUTES } from "../utils/constants";

export function NotFound() {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center px-4 text-center">
      <p className="led-digit text-7xl">404</p>
      <h1 className="mt-4 text-2xl font-semibold text-ivory">This page isn't in the squad</h1>
      <p className="mt-2 max-w-sm text-sm text-ivory/50">
        The page you're looking for was never registered for this auction.
      </p>
      <Link to={ROUTES.HOME} className="mt-8">
        <Button>Back to home</Button>
      </Link>
    </div>
  );
}
