"use client";

interface PaymentIconProps {
  type: "credit" | "paypal" | "apple" | "google" | "wechat" | "alipay";
}

export default function PaymentIcon({ type }: PaymentIconProps) {
  const styles = {
    credit: "bg-gradient-to-br from-blue-600 to-blue-800",
    paypal: "bg-gradient-to-br from-blue-500 to-blue-700",
    apple: "bg-gray-900",
    google: "bg-white border-2 border-gray-200",
    wechat: "bg-gradient-to-br from-green-500 to-green-700",
    alipay: "bg-gradient-to-br from-blue-400 to-blue-600",
  };

  const labels = {
    credit: "VISA",
    paypal: "PP",
    apple: "AP",
    google: "G",
    wechat: "W",
    alipay: "A",
  };

  const textColors = {
    credit: "text-white",
    paypal: "text-white",
    apple: "text-white",
    google: "text-gray-700",
    wechat: "text-white",
    alipay: "text-white",
  };

  return (
    <div className={`w-full h-full rounded-lg ${styles[type]} flex items-center justify-center`}>
      <span className={`text-lg font-bold ${textColors[type]}`}>
        {labels[type]}
      </span>
    </div>
  );
}
