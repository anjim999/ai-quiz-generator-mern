import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import QuizMode from "./pages/QuizMode";
import Dashboard from "./pages/Dashboard";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import ResultPage from "./pages/ResultPage";
export default function App() {
  return (
    
    <Router>
      <Navbar/>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/exam" element={<QuizMode />} />
        <Route path="/result" element={<ResultPage />} />
      </Routes>
      {/* <Footer/> */}
    </Router>
  );
}
