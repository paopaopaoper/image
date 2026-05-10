/**
 * 支付模块——MVP 阶段不启用
 * 待营业执照和商户号就绪后接入
 */
export async function createPaymentOrder() {
  if (process.env.PAYMENTS_ENABLED !== "true") {
    throw new Error("支付功能暂未开放");
  }
  /* TODO: 接入微信支付/支付宝 */
  throw new Error("支付适配器待实现");
}
