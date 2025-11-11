export default function Footer() {
  return (
    <footer className="w-full bg-white border-t py-6 mt-16">
      <div className="max-w-6xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-gray-600">
        
        {/* Left */}
        <div className="text-center md:text-left">
          <p className="font-medium">AI Wiki Quiz Generator © {new Date().getFullYear()}</p>
          <p className="text-gray-500">Built as an assignment for DeepKlarity</p>
        </div>

        {/* Center */}
        <div className="flex items-center gap-6">
          <a
            href="https://github.com"
            className="hover:text-blue-600 transition"
            target="_blank"
          >
            GitHub
          </a>
          <a
            href="https://www.linkedin.com/in/veeranjaneyulu-mandagiri-a58b4826b"
            className="hover:text-blue-600 transition"
            target="_blank"
          >
            LinkedIn
          </a>
        </div>

        {/* Right */}
        <p className="text-gray-500 text-xs md:text-sm">
          Powered by FastAPI · React · Tailwind · LangChain
        </p>
      </div>
    </footer>
  );
}
