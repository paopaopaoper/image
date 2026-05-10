import { sendPhoneOtp } from "@/lib/auth/phone";
import { z } from "zod";

const schema = z.object({
  phone: z
    .string()
    .regex(/^1[3-9]\d{9}$/, "请输入正确的手机号"),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { phone } = schema.parse(body);

    const result = await sendPhoneOtp(phone);

    return Response.json(result);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return Response.json(
        { error: error.issues[0]?.message ?? "参数校验失败" },
        { status: 400 }
      );
    }
    const message =
      error instanceof Error ? error.message : "发送验证码失败";
    return Response.json({ error: message }, { status: 429 });
  }
}
