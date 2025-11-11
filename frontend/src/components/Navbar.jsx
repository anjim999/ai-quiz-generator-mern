import { Link, useLocation } from "react-router-dom";
import deepklarityLogo from "../assets/images/deepklarity-logo.png";

export default function Navbar() {
  const { pathname } = useLocation();
  const active = (p) =>
    pathname.startsWith(p) ? "text-blue-600 font-semibold" : "text-gray-600";

  return (
    <nav className="flex items-center justify-between py-4 px-6 bg-white/60 backdrop-blur-md shadow-sm">

      <Link className={`hover:text-blue-600 transition ${active("/")}`} to="/">
        <div className="flex items-center gap-2">
          <img
            src={deepklarityLogo}
            alt="DeepKlarity Logo"
            className="w-9 h-9 object-contain drop-shadow-sm"
          />
          <span className="font-extrabold text-2xl bg-gradient-to-r from-blue-200 to-indigo-600 text-transparent bg-clip-text tracking-wide">
            DeepKlarity AI
          </span>
        </div>
      </Link>

      {/* Nav links */}
      <div className="flex items-center gap-8">
        <Link className={`hover:text-blue-600 transition ${active("/")}`} to="/">
          Home
        </Link>

        <Link
          className={`hover:text-blue-600 transition ${active("/dashboard")}`}
          to="/dashboard"
        >
          Dashboard
        </Link>

        {/* Profile */}
        <img
          src="https://cdn-icons-png.flaticon.com/512/3135/3135715.png"
          className="w-9 h-9 rounded-full cursor-pointer hover:scale-110 hover:shadow-md transition-all"
          alt="Profile"
        />
      </div>

    </nav>
  );
}
