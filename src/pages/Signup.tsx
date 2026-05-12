import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import AuthLayout from "@/components/AuthLayout";
import { Divider, SocialButtons, fieldClass } from "@/components/AuthShared";
import { cn } from "@/lib/utils";
import { signup, ApiError } from "@/lib/api";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";

const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type Form = {
  name: string;
  email: string;
  password: string;
  confirm: string;
  phone: string;
};

const Signup = () => {
  const navigate = useNavigate();
  const { loginUser } = useAuth();

  const [form, setForm] = useState<Form>({
    name: "",
    email: "",
    password: "",
    confirm: "",
    phone: "",
  });
  const [show, setShow] = useState(false);
  const [touched, setTouched] = useState<Record<keyof Form, boolean>>({
    name: false,
    email: false,
    password: false,
    confirm: false,
    phone: false,
  });
  const [loading, setLoading] = useState(false);

  const [agree, setAgree] = useState({ tos: false, privacy: false, marketing: false });
  const allAgree = agree.tos && agree.privacy && agree.marketing;
  const setAllAgree = (v: boolean) =>
    setAgree({ tos: v, privacy: v, marketing: v });

  const errors = useMemo(() => {
    return {
      email: touched.email && form.email && !emailRe.test(form.email),
      password: touched.password && form.password && form.password.length < 8,
      confirm:
        touched.confirm && form.confirm && form.confirm !== form.password,
    };
  }, [form, touched]);

  const success = {
    email: form.email && emailRe.test(form.email),
    password: form.password && form.password.length >= 8,
    confirm: form.confirm && form.confirm === form.password,
  };

  const update = (k: keyof Form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));
  const blur = (k: keyof Form) => () => setTouched((t) => ({ ...t, [k]: true }));

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({ name: true, email: true, password: true, confirm: true, phone: true });

    if (!form.name || !success.email || !success.password || !success.confirm || !form.phone) return;
    if (!agree.tos || !agree.privacy) {
      toast.error("필수 약관에 동의해주세요");
      return;
    }

    setLoading(true);
    try {
      const res = await signup({
        name: form.name,
        email: form.email,
        password: form.password,
        phone: form.phone,
      });
      loginUser(res.access_token, res.user);
      toast.success("회원가입이 완료되었습니다!");
      navigate("/");
    } catch (err) {
      if (err instanceof ApiError) {
        toast.error(err.message);
      } else {
        toast.error("회원가입에 실패했습니다");
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
            회원가입
          </h1>
          <p className="text-sm text-muted-foreground">
            Stays와 함께 특별한 여행을 시작하세요
          </p>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <Field label="이름">
            <input
              type="text"
              value={form.name}
              onChange={update("name")}
              onBlur={blur("name")}
              className={fieldClass("idle")}
              style={{ borderRadius: "4px" }}
            />
          </Field>

          <Field
            label="이메일"
            error={errors.email ? "올바른 이메일 형식이 아닙니다" : undefined}
          >
            <input
              type="email"
              value={form.email}
              onChange={update("email")}
              onBlur={blur("email")}
              className={fieldClass(
                errors.email ? "error" : success.email ? "success" : "idle"
              )}
              style={{ borderRadius: "4px" }}
            />
          </Field>

          <Field
            label="비밀번호"
            error={errors.password ? "8자 이상 입력해주세요" : undefined}
          >
            <div className="relative">
              <input
                type={show ? "text" : "password"}
                value={form.password}
                onChange={update("password")}
                onBlur={blur("password")}
                className={fieldClass(
                  errors.password ? "error" : success.password ? "success" : "idle"
                )}
                style={{ borderRadius: "4px", paddingRight: "40px" }}
              />
              <button
                type="button"
                onClick={() => setShow((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              >
                {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </Field>

          <Field
            label="비밀번호 확인"
            error={errors.confirm ? "비밀번호가 일치하지 않습니다" : undefined}
          >
            <input
              type="password"
              value={form.confirm}
              onChange={update("confirm")}
              onBlur={blur("confirm")}
              className={fieldClass(
                errors.confirm ? "error" : success.confirm ? "success" : "idle"
              )}
              style={{ borderRadius: "4px" }}
            />
          </Field>

          <Field label="전화번호">
            <input
              type="tel"
              value={form.phone}
              onChange={update("phone")}
              onBlur={blur("phone")}
              placeholder="010-0000-0000"
              className={fieldClass("idle")}
              style={{ borderRadius: "4px" }}
            />
          </Field>

          <div className="space-y-2 pt-1">
            <Check
              checked={allAgree}
              onChange={setAllAgree}
              label="전체 동의"
              bold
            />
            <div className="space-y-1.5 border-t border-border pt-2">
              <Check
                checked={agree.tos}
                onChange={(v) => setAgree((a) => ({ ...a, tos: v }))}
                label="(필수) 이용약관에 동의합니다"
                action="보기"
              />
              <Check
                checked={agree.privacy}
                onChange={(v) => setAgree((a) => ({ ...a, privacy: v }))}
                label="(필수) 개인정보 처리방침에 동의합니다"
                action="보기"
              />
              <Check
                checked={agree.marketing}
                onChange={(v) => setAgree((a) => ({ ...a, marketing: v }))}
                label="(선택) 마케팅 정보 수신에 동의합니다"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-foreground py-2.5 text-sm font-medium text-background transition-opacity hover:opacity-90 disabled:opacity-50"
            style={{ borderRadius: "4px" }}
          >
            {loading ? "가입 중..." : "회원가입"}
          </button>
        </form>

        <Divider />
        <SocialButtons />

        <p className="text-center text-xs text-muted-foreground">
          이미 계정이 있으신가요?{" "}
          <Link to="/login" className="text-foreground underline-offset-2 hover:underline">
            로그인
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
};

const Field = ({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) => (
  <div className="space-y-1.5">
    <label className="text-xs text-foreground">{label}</label>
    {children}
    {error && <p className="text-xs text-destructive">{error}</p>}
  </div>
);

const Check = ({
  checked,
  onChange,
  label,
  action,
  bold,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  action?: string;
  bold?: boolean;
}) => (
  <label className="flex items-center justify-between gap-2">
    <span className="flex items-center gap-2">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="h-4 w-4 accent-foreground"
      />
      <span className={cn("text-xs", bold ? "font-medium text-foreground" : "text-muted-foreground")}>
        {label}
      </span>
    </span>
    {action && (
      <button type="button" className="text-xs text-muted-foreground underline-offset-2 hover:underline">
        {action}
      </button>
    )}
  </label>
);

export default Signup;
