import { verifyPhoneOtp } from "@/lib/auth/phone";
import { z } from "zod";

const schema = z.object({
  phone: z
    .string()
    .regex(/^1[3-9]\d{9}$/, "请输入正确的手机号"),
  code: z
    .string()
    .length(6, "验证码为 6 位数字")
    .regex(/^\d{6}$/, "验证码格式错误"),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { phone, code } = schema.parse(body);

    const { userId } = await verifyPhoneOtp(phone, code);

    return Response.json({ userId, success: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return Response.json(
        { error: error.issues[0]?.message ?? "参数校验失败" },
        { status: 400 }
      );
    }
    const message =
      error instanceof Error ? error.message : "验证失败";
    const status = message.includes("错误") ? 400 : 401;
    return Response.json({ error: message }, { status });
  }
}
