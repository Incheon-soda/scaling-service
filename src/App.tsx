import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Layout from "./components/Layout";
import Index from "./pages/Index";
import Stays from "./pages/Stays";
import Regions from "./pages/Regions";
import Events from "./pages/Events";
import EventDetail from "./pages/EventDetail";
import StayDetail from "./pages/StayDetail";
import Booking from "./pages/Booking";
import BookingComplete from "./pages/BookingComplete";
import MyPage from "./pages/MyPage";
import Coupons from "./pages/Coupons";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import NotFound from "./pages/NotFound";
import AdminLayout from "./components/AdminLayout";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminEvents from "./pages/admin/AdminEvents";
import AdminCoupons from "./pages/admin/AdminCoupons";
import AdminStays from "./pages/admin/AdminStays";
import { AuthProvider } from "./hooks/use-auth";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<Index />} />
            <Route path="/stays" element={<Stays />} />
            <Route path="/regions" element={<Regions />} />
            <Route path="/events" element={<Events />} />
            <Route path="/events/:id" element={<EventDetail />} />
            <Route path="/stays/:id" element={<StayDetail />} />
            <Route path="/booking" element={<Booking />} />
            <Route path="/booking/complete" element={<BookingComplete />} />
            <Route path="/mypage" element={<MyPage />} />
            <Route path="/mypage/coupons" element={<Coupons />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
          </Route>
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminDashboard />} />
            <Route path="events" element={<AdminEvents />} />
            <Route path="coupons" element={<AdminCoupons />} />
            <Route path="stays" element={<AdminStays />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
