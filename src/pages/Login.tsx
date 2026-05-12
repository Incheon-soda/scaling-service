import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import AuthLayout from "@/components/AuthLayout";
import { Divider, SocialButtons, fieldClass } from "@/components/AuthShared";
import { login, ApiError } from "@/lib/api";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";

const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const Login = () => {
  const navigate = useNavigate();
  const { loginUser } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [touched, setTouched] = useState({ email: false, password: false });
  const [loading, setLoading] = useState(false);

  const emailError = touched.email && email && !emailRe.test(email);
  const passwordError = touched.password && password && password.length < 8;
  const emailOk = email && emailRe.test(email);
  const passwordOk = password && password.length >= 8;

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({ email: true, password: true });

    if (!emailOk || !passwordOk) return;

    setLoading(true);
    try {
      const res = await login({ email, password });
      loginUser(res.access_token, res.user);
      toast.success("로그인 성공!");
      navigate("/");
    } catch (err) {
      if (err instanceof ApiError) {
        toast.error(err.message);
      } else {
        toast.error("로그인에 실패했습니다");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      <div className="space-y-6">
        <div className="space-y-1.5">
          <h1 className="font-serif-display" style={{ fontSize: "28px" }}>
            로그인
          </h1>
          <p className="text-sm text-muted-foreground">계속하려면 로그인하세요</p>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs text-foreground">이메일</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onBlur={() => setTouched((t) => ({ ...t, email: true }))}
              placeholder="name@email.com"
              className={fieldClass(emailError ? "error" : emailOk ? "success" : "idle")}
              style={{ borderRadius: "4px" }}
            />
            {emailError && (
              <p className="text-xs text-destructive">올바른 이메일 형식이 아닙니다</p>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="text-xs text-foreground">비밀번호</label>
            <div className="relative">
              <input
                type={show ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onBlur={() => setTouched((t) => ({ ...t, password: true }))}
                placeholder="••••••••"
                className={fieldClass(passwordError ? "error" : passwordOk ? "success" : "idle")}
                style={{ borderRadius: "4px", paddingRight: "40px" }}
              />
              <button
                type="button"
                onClick={() => setShow((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                aria-label="비밀번호 보기"
              >
                {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {passwordError && (
              <p className="text-xs text-destructive">8자 이상 입력해주세요</p>
            )}
          </div>

          <div className="flex justify-end">
            <Link to="#" className="text-xs text-muted-foreground hover:text-foreground">
              비밀번호 찾기
            </Link>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-foreground py-2.5 text-sm font-medium text-background transition-opacity hover:opacity-90 disabled:opacity-50"
            style={{ borderRadius: "4px" }}
          >
            {loading ? "로그인 중..." : "로그인"}
          </button>
        </form>

        <Divider />
        <SocialButtons />

        <p className="text-center text-xs text-muted-foreground">
          계정이 없으신가요?{" "}
          <Link to="/signup" className="text-foreground underline-offset-2 hover:underline">
            회원가입
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
};

export default Login;
